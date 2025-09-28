import express from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { month } = req.query;
    
    // Get user's access token from request (set by authenticateToken middleware)
    const accessToken = (req as any).user.accessToken;
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Get or create spreadsheet
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Transactions');
    
    // Read transactions from the sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transactions!A:H', // Assuming columns: ID, Date, Description, Amount, Currency, Category, Type, Tags
    });
    
    const rows = result.data.values || [];
    const headers = rows[0] || ['ID', 'Date', 'Description', 'Amount', 'Currency', 'Category', 'Type', 'Tags'];
    const transactions = rows.slice(1).map((row, index) => ({
      id: row[0] || `trans_${Date.now()}_${index}`,
      date: row[1] || new Date().toISOString().split('T')[0],
      description: row[2] || '',
      amount: {
        amount: parseFloat(row[3]) || 0,
        currency: row[4] || 'USD'
      },
      category: {
        id: row[5] || 'other',
        name: getCategoryName(row[5] || 'other'),
        icon: getCategoryIcon(row[5] || 'other'),
        color: getCategoryColor(row[5] || 'other')
      },
      type: row[6] || 'expense',
      tags: row[7] ? row[7].split(',') : []
    }));
    
    // Filter by month if specified
    const filteredTransactions = month 
      ? transactions.filter(t => t.date.startsWith(month))
      : transactions;
    
    res.json(filteredTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create new transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, description, amount, category, type, tags = [] } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Transactions');
    
    // Create new transaction
    const transactionId = `trans_${Date.now()}`;
    const newTransaction = {
      id: transactionId,
      date,
      description,
      amount,
      category,
      type,
      tags
    };
    
    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transactions!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          transactionId,
          date,
          description,
          amount.amount,
          amount.currency,
          category.id,
          type,
          tags.join(',')
        ]]
      }
    });
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Helper functions
async function getOrCreateSpreadsheet(sheets: any, title: string): Promise<string> {
  try {
    // Try to find existing spreadsheet
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
            title: 'Transactions',
            gridProperties: { rowCount: 1000, columnCount: 8 }
          }
        }]
      }
    });
    
    const spreadsheetId = newSheet.data.spreadsheetId!;
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Transactions!A1:H1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['ID', 'Date', 'Description', 'Amount', 'Currency', 'Category', 'Type', 'Tags']]
      }
    });
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error with spreadsheet:', error);
    throw error;
  }
}

function getCategoryName(categoryId: string): string {
  const categories: Record<string, string> = {
    food: 'Food & Dining',
    transport: 'Transportation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    bills: 'Bills & Utilities',
    healthcare: 'Healthcare',
    education: 'Education',
    travel: 'Travel',
    income: 'Income',
    other: 'Other'
  };
  return categories[categoryId] || 'Other';
}

function getCategoryIcon(categoryId: string): string {
  const icons: Record<string, string> = {
    food: '🍽️',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📋',
    healthcare: '⚕️',
    education: '📚',
    travel: '✈️',
    income: '💰',
    other: '📦'
  };
  return icons[categoryId] || '📦';
}

function getCategoryColor(categoryId: string): string {
  const colors: Record<string, string> = {
    food: '#FF6B6B',
    transport: '#4ECDC4',
    entertainment: '#45B7D1',
    shopping: '#96CEB4',
    bills: '#FECA57',
    healthcare: '#FF9FF3',
    education: '#54A0FF',
    travel: '#5F27CD',
    income: '#00D2D3',
    other: '#747D8C'
  };
  return colors[categoryId] || '#747D8C';
}

export { router as transactionRouter };