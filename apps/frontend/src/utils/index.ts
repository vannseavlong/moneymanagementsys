import type { Money } from '@/types'

/**
 * Currency conversion utilities
 */
export class CurrencyConverter {
  private static defaultRate = 4100 // USD to KHR default rate

  static convert(from: Money, toCurrency: 'USD' | 'KHR', exchangeRate?: number): Money {
    if (from.currency === toCurrency) {
      return from
    }

    const rate = exchangeRate || this.defaultRate

    if (from.currency === 'USD' && toCurrency === 'KHR') {
      return {
        amount: from.amount * rate,
        currency: 'KHR'
      }
    }

    if (from.currency === 'KHR' && toCurrency === 'USD') {
      return {
        amount: from.amount / rate,
        currency: 'USD'
      }
    }

    return from
  }

  static format(money: Money, locale: string = 'en-US'): string {
    const symbol = money.currency === 'USD' ? '$' : '៛'
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: money.currency === 'USD' ? 2 : 0,
      maximumFractionDigits: money.currency === 'USD' ? 2 : 0,
    }).format(money.amount)
    
    return money.currency === 'USD' ? `${symbol}${formatted}` : `${formatted}${symbol}`
  }

  static add(a: Money, b: Money, targetCurrency?: 'USD' | 'KHR'): Money {
    const currency = targetCurrency || a.currency
    const convertedA = this.convert(a, currency)
    const convertedB = this.convert(b, currency)
    
    return {
      amount: convertedA.amount + convertedB.amount,
      currency
    }
  }

  static subtract(a: Money, b: Money, targetCurrency?: 'USD' | 'KHR'): Money {
    const currency = targetCurrency || a.currency
    const convertedA = this.convert(a, currency)
    const convertedB = this.convert(b, currency)
    
    return {
      amount: convertedA.amount - convertedB.amount,
      currency
    }
  }
}

/**
 * Date utilities
 */
export class DateUtils {
  static getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7) // YYYY-MM
  }

  static getMonthName(monthString: string): string {
    const date = new Date(`${monthString}-01`)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  static isInCurrentMonth(dateString: string): boolean {
    const date = new Date(dateString)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }

  static getWeekStart(date: Date = new Date()): Date {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    return new Date(start.setDate(diff))
  }

  static formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', 
      format === 'short' 
        ? { month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    )
  }

  static getDaysUntil(date: string): number {
    const target = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  static formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }
}

/**
 * Category utilities and predefined categories
 */
export class CategoryManager {
  static readonly DEFAULT_CATEGORIES = [
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
  ]

  static getCategoryById(id: string) {
    return this.DEFAULT_CATEGORIES.find(cat => cat.id === id) || this.DEFAULT_CATEGORIES[9]
  }

  static getCategoryColor(categoryId: string): string {
    return this.getCategoryById(categoryId).color
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidCurrency(currency: string): currency is 'USD' | 'KHR' {
    return currency === 'USD' || currency === 'KHR'
  }

  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0 && isFinite(amount)
  }

  static sanitizeDescription(description: string): string {
    return description.trim().substring(0, 100)
  }
}

/**
 * Analytics utilities
 */
export class AnalyticsUtils {
  static calculateCategoryPercentages(transactions: Array<{ category: { id: string }, amount: Money }>, totalAmount: Money): Array<{ categoryId: string, percentage: number, amount: Money }> {
    const categoryTotals = new Map<string, number>()
    
    transactions.forEach(transaction => {
      const converted = CurrencyConverter.convert(transaction.amount, totalAmount.currency)
      const existing = categoryTotals.get(transaction.category.id) || 0
      categoryTotals.set(transaction.category.id, existing + converted.amount)
    })

    return Array.from(categoryTotals.entries()).map(([categoryId, amount]) => ({
      categoryId,
      amount: { amount, currency: totalAmount.currency },
      percentage: (amount / totalAmount.amount) * 100
    }))
  }

  static generateSpendingInsights(currentMonth: Array<{ category: { id: string }, amount: Money }>, previousMonth: Array<{ category: { id: string }, amount: Money }>): string[] {
    const insights: string[] = []
    
    // Add basic insights logic here
    if (currentMonth.length > previousMonth.length) {
      insights.push("You've made more transactions this month compared to last month.")
    }
    
    return insights
  }
}