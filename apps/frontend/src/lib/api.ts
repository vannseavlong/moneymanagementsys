const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const api = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Auth
    googleAuthUrl: `${API_BASE_URL}/api/auth/google/url`,
    googleCallback: `${API_BASE_URL}/api/auth/google/callback`,
    refreshToken: `${API_BASE_URL}/api/auth/refresh`,
    
    // Budget
    createSpreadsheet: `${API_BASE_URL}/api/budget/spreadsheet/create`,
    saveBudgetEntry: `${API_BASE_URL}/api/budget/entry`,
    getBudgetEntries: (spreadsheetId: string) => `${API_BASE_URL}/api/budget/entries/${spreadsheetId}`,
    deleteBudgetEntry: (spreadsheetId: string, rowIndex: string) => `${API_BASE_URL}/api/budget/entry/${spreadsheetId}/${rowIndex}`,
    
    // Currency
    exchangeRates: `${API_BASE_URL}/api/currency/rates`,
    convertCurrency: `${API_BASE_URL}/api/currency/convert`,
    supportedCurrencies: `${API_BASE_URL}/api/currency/supported`,
    
    // Telegram
    sendMessage: `${API_BASE_URL}/api/telegram/send`,
    sendBudgetSummary: `${API_BASE_URL}/api/telegram/send-budget-summary`,
  }
}

export default api