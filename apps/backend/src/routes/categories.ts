import express from 'express';
import { google } from 'googleapis';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#45B7D1' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#96CEB4' },
  { id: 'bills', name: 'Bills & Utilities', icon: '📋', color: '#FECA57' },
  { id: 'healthcare', name: 'Healthcare', icon: '⚕️', color: '#FF9FF3' },
  { id: 'education', name: 'Education', icon: '📚', color: '#54A0FF' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#5F27CD' },
  { id: 'income', name: 'Income', icon: '💰', color: '#00D2D3' },
  { id: 'other', name: 'Other', icon: '📦', color: '#747D8C' }
];

// Get all categories for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessToken = (req as any).user.accessToken;
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Categories');
    
    // Read categories from the sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Categories!A:E', // ID, Name, Icon, Color, CreatedDate
    });
    
    const rows = result.data.values || [];
    const customCategories = rows.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      icon: row[2],
      color: row[3],
      createdDate: row[4],
      isCustom: true
    }));
    
    // Combine default categories with custom ones
    const allCategories = [
      ...DEFAULT_CATEGORIES.map(cat => ({ ...cat, isCustom: false })),
      ...customCategories
    ];
    
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new custom category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Categories');
    
    const categoryId = `custom_${Date.now()}`;
    const newCategory = {
      id: categoryId,
      name,
      icon,
      color,
      createdDate: new Date().toISOString(),
      isCustom: true
    };
    
    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Categories!A:E',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          categoryId,
          name,
          icon,
          color,
          new Date().toISOString()
        ]]
      }
    });
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update custom category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    
    // Don't allow editing default categories
    if (!id.startsWith('custom_')) {
      return res.status(400).json({ error: 'Cannot edit default categories' });
    }
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Categories');
    
    // Find and update the category
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Categories!A:E',
    });
    
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Update category
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Categories!B${rowIndex + 1}:D${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[name, icon, color]]
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete custom category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting default categories
    if (!id.startsWith('custom_')) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }
    
    const accessToken = (req as any).user.accessToken;
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const spreadsheetId = await getOrCreateSpreadsheet(sheets, 'MMMS_Categories');
    
    // Find the category
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Categories!A:E',
    });
    
    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
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
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
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
            title: 'Categories',
            gridProperties: { rowCount: 1000, columnCount: 5 }
          }
        }]
      }
    });
    
    const spreadsheetId = newSheet.data.spreadsheetId!;
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Categories!A1:E1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['ID', 'Name', 'Icon', 'Color', 'CreatedDate']]
      }
    });
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error with spreadsheet:', error);
    throw error;
  }
}

export { router as categoriesRouter };