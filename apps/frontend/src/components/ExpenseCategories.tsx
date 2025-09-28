import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Trash2, Grid, List, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { CurrencyConverter, CategoryManager } from '@/utils'
import type { Category, Money, Transaction } from '@/types'

interface ExpenseCategoriesProps {
  transactions: Transaction[]
  categories?: Category[]
  onAddCategory?: (category: Omit<Category, 'id'>) => void
  onEditCategory?: (categoryId: string) => void
  onDeleteCategory?: (categoryId: string) => void
  dateRange?: { start: string; end: string }
}

export const ExpenseCategories: React.FC<ExpenseCategoriesProps> = ({
  transactions,
  categories = CategoryManager.DEFAULT_CATEGORIES,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  dateRange
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'transactions'>('amount')

  // Filter transactions by date range if provided
  const filteredTransactions = dateRange 
    ? transactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end)
    : transactions

  // Calculate category spending
  const getCategoryStats = (category: Category) => {
    const categoryTransactions = filteredTransactions.filter(
      t => t.category.id === category.id && t.type === 'expense'
    )
    
    const totalSpent = categoryTransactions.reduce<Money>((sum, t) => {
      return CurrencyConverter.add(sum, t.amount, 'USD')
    }, { amount: 0, currency: 'USD' })

    const transactionCount = categoryTransactions.length
    const avgTransaction: Money = transactionCount > 0 
      ? { amount: totalSpent.amount / transactionCount, currency: 'USD' }
      : { amount: 0, currency: 'USD' }

    // Compare with previous period (if applicable)
    const prevPeriodTransactions = dateRange 
      ? transactions.filter(t => {
          const periodLength = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()
          const prevStart = new Date(new Date(dateRange.start).getTime() - periodLength).toISOString().split('T')[0]
          const prevEnd = new Date(new Date(dateRange.end).getTime() - periodLength).toISOString().split('T')[0]
          return t.date >= prevStart && t.date <= prevEnd && t.category.id === category.id && t.type === 'expense'
        })
      : []

    const prevTotalSpent = prevPeriodTransactions.reduce<Money>((sum, t) => {
      return CurrencyConverter.add(sum, t.amount, 'USD')
    }, { amount: 0, currency: 'USD' })

    const changePercentage = prevTotalSpent.amount > 0 
      ? ((totalSpent.amount - prevTotalSpent.amount) / prevTotalSpent.amount) * 100
      : totalSpent.amount > 0 ? 100 : 0

    return {
      totalSpent,
      transactionCount,
      avgTransaction,
      changePercentage,
      trend: changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'stable'
    }
  }

  // Filter and sort categories
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const statsA = getCategoryStats(a)
    const statsB = getCategoryStats(b)

    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'amount':
        return statsB.totalSpent.amount - statsA.totalSpent.amount
      case 'transactions':
        return statsB.transactionCount - statsA.transactionCount
      default:
        return 0
    }
  })

  const totalSpending = sortedCategories.reduce<Money>((sum, category) => {
    const stats = getCategoryStats(category)
    return CurrencyConverter.add(sum, stats.totalSpent, 'USD')
  }, { amount: 0, currency: 'USD' })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                Expense Categories
              </CardTitle>
              <CardDescription>
                Track spending across different categories
                {dateRange && ` (${dateRange.start} to ${dateRange.end})`}
              </CardDescription>
            </div>
            {onAddCategory && (
              <Button onClick={() => onAddCategory({ name: '', icon: '📦', color: '#747D8C' })} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: 'name' | 'amount' | 'transactions') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="transactions">Sort by Count</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Total Overview */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">{CurrencyConverter.format(totalSpending)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Active Categories</p>
                <p className="text-2xl font-bold">{sortedCategories.filter(c => getCategoryStats(c).transactionCount > 0).length}</p>
              </div>
            </div>
          </div>

          {/* Categories Display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCategories.map((category) => {
                const stats = getCategoryStats(category)
                const percentage = totalSpending.amount > 0 ? (stats.totalSpent.amount / totalSpending.amount) * 100 : 0

                return (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{category.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {(onEditCategory || onDeleteCategory) && (
                          <div className="flex gap-1">
                            {onEditCategory && (
                              <Button variant="ghost" size="sm" onClick={() => onEditCategory(category.id)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                            {onDeleteCategory && (
                              <Button variant="ghost" size="sm" onClick={() => onDeleteCategory(category.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">
                            {CurrencyConverter.format(stats.totalSpent)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>

                        {stats.transactionCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Avg: {CurrencyConverter.format(stats.avgTransaction)}
                          </div>
                        )}

                        {dateRange && stats.changePercentage !== 0 && (
                          <div className={`flex items-center gap-1 text-xs ${
                            stats.trend === 'up' ? 'text-red-500' : stats.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                          }`}>
                            {stats.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(stats.changePercentage).toFixed(1)}% vs prev period
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCategories.map((category) => {
                const stats = getCategoryStats(category)
                const percentage = totalSpending.amount > 0 ? (stats.totalSpent.amount / totalSpending.amount) * 100 : 0

                return (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''} 
                              {stats.transactionCount > 0 && ` • Avg: ${CurrencyConverter.format(stats.avgTransaction)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {dateRange && stats.changePercentage !== 0 && (
                            <div className={`flex items-center gap-1 text-sm ${
                              stats.trend === 'up' ? 'text-red-500' : stats.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {stats.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {Math.abs(stats.changePercentage).toFixed(1)}%
                            </div>
                          )}

                          <div className="text-right">
                            <p className="font-bold">{CurrencyConverter.format(stats.totalSpent)}</p>
                            <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>

                          {(onEditCategory || onDeleteCategory) && (
                            <div className="flex gap-1">
                              {onEditCategory && (
                                <Button variant="ghost" size="sm" onClick={() => onEditCategory(category.id)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              {onDeleteCategory && (
                                <Button variant="ghost" size="sm" onClick={() => onDeleteCategory(category.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {sortedCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}