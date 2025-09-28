import { Router } from 'express';
import { google } from 'googleapis';
import { z } from 'zod';

const router = Router();

// Validation schemas
const budgetEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  month: z.string(),
  totalIncome: z.number(),
  currency: z.enum(['USD', 'KHR']),
  items: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    currency: z.enum(['USD', 'KHR']),
    category: z.string().optional()
  })),
  telegramChatId: z.string().optional()
});

const getAuthenticatedSheets = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth });
};

// Create or get budget spreadsheet
router.post('/spreadsheet/create', async (req, res) => {
  try {
    const { accessToken, spreadsheetName } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create new spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: spreadsheetName || 'MMMS Budget Tracker'
        },
        sheets: [{
          properties: {
            title: 'Budget Entries',
            gridProperties: {
              rowCount: 1000,
              columnCount: 10
            }
          }
        }]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId!;

    // Set up headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Budget Entries!A1:J1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Date', 'Month', 'Total Income', 'Currency', 'Item Name', 
          'Item Amount', 'Item Currency', 'Category', 'Remaining', 'Telegram Chat ID'
        ]]
      }
    });

    // Make spreadsheet readable by anyone with the link
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    res.json({
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    });
  } catch (error) {
    console.error('Spreadsheet creation error:', error);
    res.status(500).json({ error: 'Failed to create spreadsheet' });
  }
});

// Save budget entry
router.post('/entry', async (req, res) => {
  try {
    const { accessToken, spreadsheetId } = req.body;
    const budgetData = budgetEntrySchema.parse(req.body.budgetData);
    
    if (!accessToken || !spreadsheetId) {
      return res.status(400).json({ error: 'Access token and spreadsheet ID required' });
    }

    const sheets = getAuthenticatedSheets(accessToken);
    
    // Calculate total spending and remaining money
    const totalSpending = budgetData.items.reduce((sum, item) => {
      // Convert to same currency for calculation
      const amount = item.currency === budgetData.currency 
        ? item.amount 
        : item.currency === 'USD' && budgetData.currency === 'KHR'
          ? item.amount * 4100 // Approximate USD to KHR rate
          : item.currency === 'KHR' && budgetData.currency === 'USD'
            ? item.amount / 4100 // Approximate KHR to USD rate
            : item.amount;
      return sum + amount;
    }, 0);

    const remaining = budgetData.totalIncome - totalSpending;

    // Prepare rows for each item
    const rows = budgetData.items.map(item => [
      budgetData.date,
      budgetData.month,
      budgetData.totalIncome,
      budgetData.currency,
      item.name,
      item.amount,
      item.currency,
      item.category || '',
      remaining,
      budgetData.telegramChatId || ''
    ]);

    // Append data to spreadsheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Budget Entries!A:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    });

    res.json({ 
      success: true,
      totalSpending,
      remaining,
      entriesAdded: rows.length
    });
  } catch (error) {
    console.error('Budget entry error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to save budget entry' });
  }
});

// Get budget entries
router.get('/entries/:spreadsheetId', async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const sheets = getAuthenticatedSheets(accessToken as string);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Budget Entries!A:J'
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      return res.json({ entries: [] });
    }

    // Convert to structured data (skip header row)
    const entries = values.slice(1).map((row, index) => ({
      id: index.toString(),
      date: row[0] || '',
      month: row[1] || '',
      totalIncome: parseFloat(row[2]) || 0,
      currency: row[3] || 'USD',
      itemName: row[4] || '',
      itemAmount: parseFloat(row[5]) || 0,
      itemCurrency: row[6] || 'USD',
      category: row[7] || '',
      remaining: parseFloat(row[8]) || 0,
      telegramChatId: row[9] || ''
    }));

    res.json({ entries });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: 'Failed to fetch budget entries' });
  }
});

// Delete budget entry
router.delete('/entry/:spreadsheetId/:rowIndex', async (req, res) => {
  try {
    const { spreadsheetId, rowIndex } = req.params;
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const sheets = getAuthenticatedSheets(accessToken);
    
    // Delete row (add 2 to rowIndex because sheets are 1-indexed and we have header)
    const deleteRowIndex = parseInt(rowIndex) + 2;
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: deleteRowIndex - 1,
              endIndex: deleteRowIndex
            }
          }
        }]
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Failed to delete budget entry' });
  }
});

export { router as budgetRouter };