import type { 
  Transaction, 
  Category, 
  BudgetGoal, 
  SavingsGoal, 
  MonthlyReport, 
  UserSettings,
  Money,
  Alert 
} from '@/types'

interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

export class DataService {
  private baseUrl = 'http://localhost:3001/api'
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || localStorage.getItem('accessToken')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Transaction Management
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    })
  }

  async getTransactions(month?: string): Promise<Transaction[]> {
    const params = month ? `?month=${month}` : ''
    return this.request<Transaction[]>(`/transactions${params}`)
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    })
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.request<void>(`/transactions/${id}`, {
      method: 'DELETE',
    })
  }

  // Category Management
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories')
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    })
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Budget Goals
  async getBudgetGoals(): Promise<BudgetGoal[]> {
    return this.request<BudgetGoal[]>('/budget-goals')
  }

  async createBudgetGoal(goal: Omit<BudgetGoal, 'id'>): Promise<BudgetGoal> {
    return this.request<BudgetGoal>('/budget-goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    })
  }

  async updateBudgetGoal(id: string, goal: Partial<BudgetGoal>): Promise<BudgetGoal> {
    return this.request<BudgetGoal>(`/budget-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    })
  }

  // Savings Goals
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return this.request<SavingsGoal[]>('/savings-goals')
  }

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    return this.request<SavingsGoal>('/savings-goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    })
  }

  async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/savings-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Reports and Analytics
  async getMonthlyReport(month: string): Promise<MonthlyReport> {
    return this.request<MonthlyReport>(`/reports/monthly?month=${month}`)
  }

  async getCategoryBreakdown(month?: string): Promise<Array<{ category: Category; amount: Money; percentage: number }>> {
    const params = month ? `?month=${month}` : ''
    return this.request<Array<{ category: Category; amount: Money; percentage: number }>>(`/reports/categories${params}`)
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return this.request<Alert[]>('/alerts')
  }

  async acknowledgeAlert(id: string): Promise<void> {
    return this.request<void>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
    })
  }

  // Settings
  async getUserSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/settings')
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.request<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  // Exchange Rates
  async updateExchangeRate(): Promise<{ usdToKhr: number; lastUpdated: string }> {
    return this.request<{ usdToKhr: number; lastUpdated: string }>('/currency/update-rate', {
      method: 'POST',
    })
  }

  // Export Functions
  async exportToGoogleSheets(month?: string): Promise<{ spreadsheetUrl: string }> {
    const params = month ? `?month=${month}` : ''
    return this.request<{ spreadsheetUrl: string }>(`/export/sheets${params}`, {
      method: 'POST',
    })
  }

  async generateChartImage(type: 'pie' | 'bar', data: ChartData): Promise<{ imageUrl: string }> {
    return this.request<{ imageUrl: string }>('/charts/generate', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    })
  }

  // Telegram Integration
  async sendTelegramReport(type: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    return this.request<void>('/telegram/send-report', {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
  }
}

// Singleton instance
let dataServiceInstance: DataService | null = null

export const getDataService = (accessToken?: string): DataService => {
  if (!dataServiceInstance || accessToken) {
    dataServiceInstance = new DataService(accessToken)
  }
  return dataServiceInstance
}