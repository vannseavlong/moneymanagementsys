import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-simple'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionForm } from './TransactionForm'
import { BudgetGoalTracker } from './BudgetGoalTracker'
import { SavingsGoalTracker } from './SavingsGoalTracker'
import { ExpenseCategories } from './ExpenseCategories'
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PiggyBank,
  Filter
} from 'lucide-react'
import { CurrencyConverter, DateUtils } from '@/utils'
import { DataService } from '@/services/DataService'
import type { Transaction, BudgetGoal, SavingsGoal, Money, Category } from '@/types'

export const FinancialDashboard: React.FC = () => {
  // Initialize DataService
  const dataService = useMemo(() => new DataService(), [])
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [isLoading, setIsLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [transactionData, budgetData, savingsData] = await Promise.all([
          dataService.getTransactions(),
          dataService.getBudgetGoals(),
          dataService.getSavingsGoals()
        ])
        
        setTransactions(transactionData)
        setBudgetGoals(budgetData)
        setSavingsGoals(savingsData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [dataService])

  // Transaction handlers
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    setIsLoading(true)
    try {
      const newTransaction = await dataService.createTransaction(transaction)
      setTransactions(prev => [newTransaction, ...prev])
    } catch (error) {
      console.error('Failed to add transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Budget goal handlers
  const handleAddBudgetGoal = () => {
    // TODO: Open budget goal form modal
    console.log('Add budget goal')
  }

  const handleEditBudgetGoal = (goalId: string) => {
    // TODO: Open budget goal edit modal
    console.log('Edit budget goal:', goalId)
  }

  // Savings goal handlers
  const handleAddSavingsGoal = () => {
    // TODO: Open savings goal form modal
    console.log('Add savings goal')
  }

  const handleEditSavingsGoal = (goalId: string) => {
    // TODO: Open savings goal edit modal
    console.log('Edit savings goal:', goalId)
  }

  const handleAddContribution = (goalId: string) => {
    // TODO: Open contribution form modal
    console.log('Add contribution to goal:', goalId)
  }

  // Category handlers
  const handleAddCategory = (category: Omit<Category, 'id'>) => {
    // TODO: Implement category creation
    console.log('Add category:', category)
  }

  const handleEditCategory = (categoryId: string) => {
    // TODO: Open category edit modal
    console.log('Edit category:', categoryId)
  }

  const handleDeleteCategory = (categoryId: string) => {
    // TODO: Implement category deletion
    console.log('Delete category:', categoryId)
  }

  // Get filtered transactions based on selected period
  const getFilteredTransactions = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    switch (selectedPeriod) {
      case 'thisMonth':
        return transactions.filter(t => {
          const date = new Date(t.date)
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        })
      case 'lastMonth': {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return transactions.filter(t => {
          const date = new Date(t.date)
          return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
        })
      }
      case 'last3Months': {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        return transactions.filter(t => new Date(t.date) >= threeMonthsAgo)
      }
      case 'thisYear':
        return transactions.filter(t => new Date(t.date).getFullYear() === currentYear)
      default:
        return transactions
    }
  }

  const filteredTransactions = getFilteredTransactions()

  // Calculate overview statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce<Money>((sum, t) => CurrencyConverter.add(sum, t.amount, 'USD'), { amount: 0, currency: 'USD' })

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce<Money>((sum, t) => CurrencyConverter.add(sum, t.amount, 'USD'), { amount: 0, currency: 'USD' })

  const netIncome = CurrencyConverter.subtract(totalIncome, totalExpenses, 'USD')

  // Calculate category spending for budget goals
  const categorySpending = budgetGoals.reduce((acc, goal) => {
    const spent = filteredTransactions
      .filter(t => t.category.id === goal.category.id && t.type === 'expense')
      .reduce<Money>((sum, t) => CurrencyConverter.add(sum, t.amount, 'USD'), { amount: 0, currency: 'USD' })
    acc[goal.category.id] = spent
    return acc
  }, {} as Record<string, Money>)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your money with multi-currency support
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {CurrencyConverter.format(totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {CurrencyConverter.format(totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${
                  netIncome.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {CurrencyConverter.format(netIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Add Transaction */}
            <TransactionForm
              onSubmit={handleAddTransaction}
              isLoading={isLoading}
              submitLabel="Quick Add"
            />

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span>{transaction.category.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {DateUtils.formatDate(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {CurrencyConverter.format(transaction.amount)}
                      </p>
                    </div>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No transactions found for the selected period
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-muted-foreground">Active Budget Goals</p>
                <p className="text-2xl font-bold">{budgetGoals.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <PiggyBank className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">Savings Goals</p>
                <p className="text-2xl font-bold">{savingsGoals.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-lg font-bold">{DateUtils.getMonthName(DateUtils.getCurrentMonth())}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionForm
            onSubmit={handleAddTransaction}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetGoalTracker
            goals={budgetGoals}
            totalSpent={categorySpending}
            onAddGoal={handleAddBudgetGoal}
            onEditGoal={handleEditBudgetGoal}
            onDeleteGoal={(id) => console.log('Delete budget goal:', id)}
          />
        </TabsContent>

        <TabsContent value="savings">
          <SavingsGoalTracker
            goals={savingsGoals}
            onAddGoal={handleAddSavingsGoal}
            onEditGoal={handleEditSavingsGoal}
            onAddContribution={handleAddContribution}
          />
        </TabsContent>

        <TabsContent value="categories">
          <ExpenseCategories
            transactions={filteredTransactions}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}