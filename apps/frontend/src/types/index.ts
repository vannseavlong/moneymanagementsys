// Core types for the entire application
export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

export interface Money {
  amount: number
  currency: 'USD' | 'KHR'
}

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  budgetLimit?: Money
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: Money
  category: Category
  type: 'income' | 'expense'
  recurring?: RecurringConfig
  tags?: string[]
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: string
  endDate?: string
  dayOfMonth?: number // for monthly
  dayOfWeek?: number // for weekly
}

export interface BudgetGoal {
  id: string
  name: string
  category: Category
  limit: Money
  period: 'daily' | 'weekly' | 'monthly'
  startDate: string
  endDate: string
  alertThreshold?: number // percentage (e.g., 80 for 80%)
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: Money
  currentAmount: Money
  targetDate?: string
  description?: string
}

export interface Alert {
  id: string
  type: 'budget_exceeded' | 'savings_milestone' | 'recurring_due' | 'weekly_summary'
  message: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  acknowledged: boolean
}

export interface MonthlyReport {
  month: string
  year: number
  totalIncome: Money
  totalExpenses: Money
  remaining: Money
  categoryBreakdown: Array<{
    category: Category
    amount: Money
    percentage: number
  }>
  comparisonToPreviousMonth?: {
    incomeChange: number
    expenseChange: number
    topIncreaseCategory?: string
    topDecreaseCategory?: string
  }
}

export interface UserSettings {
  preferredCurrency: 'USD' | 'KHR'
  telegramChatId?: string
  alertPreferences: {
    budgetAlerts: boolean
    weeklyReports: boolean
    savingsUpdates: boolean
    recurringReminders: boolean
  }
  exchangeRate?: {
    usdToKhr: number
    lastUpdated: string
    useAutoUpdate: boolean
  }
}