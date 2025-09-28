import express from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all budget goals for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessToken = (req as any).user.accessToken;
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Budget_Goals');
    
    // Read budget goals from the sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'BudgetGoals!A:G', // ID, Category, Target, Spent, Currency, Period, CreatedDate
    });
    
    const rows = result.data.values || [];
    const budgetGoals = rows.slice(1).map((row, index) => ({
      id: row[0] || `budget_${Date.now()}_${index}`,
      category: {
        id: row[1] || 'other',
        name: getCategoryName(row[1] || 'other'),
        icon: getCategoryIcon(row[1] || 'other'),
        color: getCategoryColor(row[1] || 'other')
      },
      target: {
        amount: parseFloat(row[2]) || 0,
        currency: row[4] || 'USD'
      },
      spent: {
        amount: parseFloat(row[3]) || 0,
        currency: row[4] || 'USD'
      },
      period: row[5] || 'monthly',
      createdDate: row[6] || new Date().toISOString()
    }));
    
    res.json(budgetGoals);
  } catch (error) {
    console.error('Error fetching budget goals:', error);
    res.status(500).json({ error: 'Failed to fetch budget goals' });
  }
});

// Create new budget goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, target, period = 'monthly' } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Budget_Goals');
    
    const budgetGoalId = `budget_${Date.now()}`;
    const newBudgetGoal = {
      id: budgetGoalId,
      category,
      target,
      spent: { amount: 0, currency: target.currency },
      period,
      createdDate: new Date().toISOString()
    };
    
    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'BudgetGoals!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          budgetGoalId,
          category.id,
          target.amount,
          0, // spent amount
          target.currency,
          period,
          new Date().toISOString()
        ]]
      }
    });
    
    res.status(201).json(newBudgetGoal);
  } catch (error) {
    console.error('Error creating budget goal:', error);
    res.status(500).json({ error: 'Failed to create budget goal' });
  }
});

// Update budget goal spent amount
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { spent } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Budget_Goals');
    
    // Find and update the budget goal
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'BudgetGoals!A:G',
    });
    
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Budget goal not found' });
    }
    
    // Update spent amount
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `BudgetGoals!D${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[spent.amount]]
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating budget goal:', error);
    res.status(500).json({ error: 'Failed to update budget goal' });
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
            title: 'BudgetGoals',
            gridProperties: { rowCount: 1000, columnCount: 7 }
          }
        }]
      }
    });
    
    const spreadsheetId = newSheet.data.spreadsheetId!;
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'BudgetGoals!A1:G1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['ID', 'Category', 'Target', 'Spent', 'Currency', 'Period', 'CreatedDate']]
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

export { router as budgetGoalsRouter };