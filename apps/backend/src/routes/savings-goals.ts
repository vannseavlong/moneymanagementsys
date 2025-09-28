import express from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all savings goals for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessToken = (req as any).user.accessToken;
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Savings_Goals');
    
    // Read savings goals from the sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'SavingsGoals!A:H', // ID, Name, Target, Current, Currency, Deadline, CreatedDate, Description
    });
    
    const rows = result.data.values || [];
    const savingsGoals = rows.slice(1).map((row, index) => ({
      id: row[0] || `savings_${Date.now()}_${index}`,
      name: row[1] || 'Savings Goal',
      target: {
        amount: parseFloat(row[2]) || 0,
        currency: row[4] || 'USD'
      },
      current: {
        amount: parseFloat(row[3]) || 0,
        currency: row[4] || 'USD'
      },
      deadline: row[5] || '',
      createdDate: row[6] || new Date().toISOString(),
      description: row[7] || ''
    }));
    
    res.json(savingsGoals);
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    res.status(500).json({ error: 'Failed to fetch savings goals' });
  }
});

// Create new savings goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, target, deadline, description = '' } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Savings_Goals');
    
    const savingsGoalId = `savings_${Date.now()}`;
    const newSavingsGoal = {
      id: savingsGoalId,
      name,
      target,
      current: { amount: 0, currency: target.currency },
      deadline,
      createdDate: new Date().toISOString(),
      description
    };
    
    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'SavingsGoals!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          savingsGoalId,
          name,
          target.amount,
          0, // current amount
          target.currency,
          deadline,
          new Date().toISOString(),
          description
        ]]
      }
    });
    
    res.status(201).json(newSavingsGoal);
  } catch (error) {
    console.error('Error creating savings goal:', error);
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});

// Update savings goal progress
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { current } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Savings_Goals');
    
    // Find and update the savings goal
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'SavingsGoals!A:H',
    });
    
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    
    // Update current amount
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `SavingsGoals!D${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[current.amount]]
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    res.status(500).json({ error: 'Failed to update savings goal' });
  }
});

// Delete savings goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Savings_Goals');
    
    // Find the savings goal
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'SavingsGoals!A:H',
    });
    
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    
    // Delete row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

// Helper functions
async function getOrCreateSpreadsheet(sheets: any, title: string): Promise<string> {
  try {
    const drive = google.drive({ version: 'v3', auth: sheets.auth });
    const fileList = await drive.files.list({
      q: `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      spaces: 'drive'
    });
    
    if (fileList.data.files && fileList.data.files.length > 0) {
      return fileList.data.files[0].id!;
    }
    
    // Create new spreadsheet
    const newSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{
          properties: {
            title: 'SavingsGoals',
            gridProperties: { rowCount: 1000, columnCount: 8 }
          }
        }]
      }
    });
    
    const spreadsheetId = newSheet.data.spreadsheetId!;
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'SavingsGoals!A1:H1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['ID', 'Name', 'Target', 'Current', 'Currency', 'Deadline', 'CreatedDate', 'Description']]
      }
    });
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error with spreadsheet:', error);
    throw error;
  }
}

export { router as savingsGoalsRouter };