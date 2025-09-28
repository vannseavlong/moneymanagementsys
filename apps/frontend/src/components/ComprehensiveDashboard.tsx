import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-simple'
import { Button } from '@/components/ui/button'
import { TransactionForm } from './TransactionForm'
import { BudgetGoalTracker } from './BudgetGoalTracker'
import { SavingsGoalTracker } from './SavingsGoalTracker'
import { ExpenseCategories } from './ExpenseCategories'
import { BudgetGoalModal } from './BudgetGoalModal'
import { SavingsGoalModal } from './SavingsGoalModal'
import { CategoryModal } from './CategoryModal'
import { BarChart3, PieChart, TrendingUp, Wallet, Target, PiggyBank, Plus, LogOut } from 'lucide-react'
import { CurrencyConverter, DateUtils, CategoryManager } from '@/utils'
import { DataService } from '@/services/DataService'
import { useAuth } from '@/hooks/useAuth'
import type { Transaction, BudgetGoal, SavingsGoal, Money, Category } from '@/types'

export const FinancialDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { accessToken, user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [categories] = useState<Category[]>(CategoryManager.DEFAULT_CATEGORIES)
  const [isLoading, setIsLoading] = useState(false)
  
  // Modal states
  const [budgetGoalModal, setBudgetGoalModal] = useState<{
    isOpen: boolean
    editGoal?: BudgetGoal
  }>({ isOpen: false })
  
  const [savingsGoalModal, setSavingsGoalModal] = useState<{
    isOpen: boolean
    editGoal?: SavingsGoal
  }>({ isOpen: false })
  
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean
    editCategory?: Category
  }>({ isOpen: false })
  
  // Initialize DataService with useMemo to prevent re-creation
  const dataService = useMemo(() => new DataService(accessToken || undefined), [accessToken])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // In development, allow loading data even without accessToken
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'
      
      if (!accessToken && !isDevelopment) {
        console.log('No access token available and not in development mode')
        setIsLoading(false)
        return
      }
      
      console.log('Loading data with access token:', accessToken ? 'Present' : 'Development mode - bypassing auth')
      
      try {
        setIsLoading(true)
        const [transactionData, budgetData, savingsData] = await Promise.all([
          dataService.getTransactions(),
          dataService.getBudgetGoals(),
          dataService.getSavingsGoals()
        ])
        
        setTransactions(transactionData)
        setBudgetGoals(budgetData)
        setSavingsGoals(savingsData)
        console.log('Data loaded successfully')
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [dataService, accessToken])

  // Calculate overview metrics
  const currentMonth = DateUtils.getCurrentMonth()
  const currentMonthTransactions = transactions.filter(t => 
    DateUtils.isInCurrentMonth(t.date)
  )

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce<Money>((sum, t) => CurrencyConverter.add(sum, t.amount, 'USD'), { amount: 0, currency: 'USD' })

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce<Money>((sum, t) => CurrencyConverter.add(sum, t.amount, 'USD'), { amount: 0, currency: 'USD' })

  const netIncome: Money = {
    amount: monthlyIncome.amount - monthlyExpenses.amount,
    currency: 'USD'
  }

  // Calculate category spending for budget goals
  const categorySpending = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, Money>>((acc, t) => {
      const categoryId = t.category.id
      if (!acc[categoryId]) {
        acc[categoryId] = { amount: 0, currency: 'USD' }
      }
      acc[categoryId] = CurrencyConverter.add(acc[categoryId], t.amount, 'USD')
      return acc
    }, {})

  // Mock savings data (in real app, this would come from API)
  const currentSavings = savingsGoals.reduce<Record<string, Money>>((acc, goal) => {
    // Mock 60-80% completion for demo
    const mockProgress = 0.6 + Math.random() * 0.2
    acc[goal.id] = {
      amount: goal.targetAmount.amount * mockProgress,
      currency: goal.targetAmount.currency
    }
    return acc
  }, {})

  // Event handlers
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      setIsLoading(true)
      const newTransaction = await dataService.createTransaction(transaction)
      setTransactions(prev => [newTransaction, ...prev])
    } catch (error) {
      console.error('Failed to add transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBudgetGoal = () => {
    setBudgetGoalModal({ isOpen: true })
  }

  const handleEditBudgetGoal = (goalId: string) => {
    const goal = budgetGoals.find(g => g.id === goalId)
    if (goal) {
      setBudgetGoalModal({ isOpen: true, editGoal: goal })
    }
  }

  const handleAddSavingsGoal = () => {
    setSavingsGoalModal({ isOpen: true })
  }

  const handleEditSavingsGoal = (goalId: string) => {
    const goal = savingsGoals.find(g => g.id === goalId)
    if (goal) {
      setSavingsGoalModal({ isOpen: true, editGoal: goal })
    }
  }

  const handleSaveBudgetGoal = async (goalData: Omit<BudgetGoal, 'id' | 'startDate' | 'endDate'>) => {
    try {
      if (budgetGoalModal.editGoal) {
        // Edit existing goal
        const updatedGoal = await dataService.updateBudgetGoal(budgetGoalModal.editGoal.id, goalData)
        setBudgetGoals(prev => prev.map(g => g.id === budgetGoalModal.editGoal?.id ? updatedGoal : g))
      } else {
        // Create new goal
        const newGoal = await dataService.createBudgetGoal({
          ...goalData,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        setBudgetGoals(prev => [...prev, newGoal])
      }
      setBudgetGoalModal({ isOpen: false })
    } catch (error) {
      console.error('Error saving budget goal:', error)
      throw error
    }
  }

  const handleSaveSavingsGoal = async (goalData: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    try {
      if (savingsGoalModal.editGoal) {
        // Edit existing goal
        const updatedGoal = await dataService.updateSavingsGoal(savingsGoalModal.editGoal.id, {
          ...goalData,
          currentAmount: savingsGoalModal.editGoal.currentAmount
        })
        setSavingsGoals(prev => prev.map(g => g.id === savingsGoalModal.editGoal?.id ? updatedGoal : g))
      } else {
        // Create new goal
        const newGoal = await dataService.createSavingsGoal({
          ...goalData,
          currentAmount: { amount: 0, currency: goalData.targetAmount.currency }
        })
        setSavingsGoals(prev => [...prev, newGoal])
      }
      setSavingsGoalModal({ isOpen: false })
    } catch (error) {
      console.error('Error saving savings goal:', error)
      throw error
    }
  }

  const handleAddContribution = (goalId: string) => {
    console.log('Add contribution to goal:', goalId)
  }

  const handleAddCategory = () => {
    setCategoryModal({ isOpen: true })
  }

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setCategoryModal({ isOpen: true, editCategory: category })
    }
  }

  const handleSaveCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      if (categoryModal.editCategory) {
        // Edit existing category
        await dataService.updateCategory(categoryModal.editCategory.id, categoryData)
      } else {
        // Create new category
        await dataService.createCategory(categoryData)
      }
      setCategoryModal({ isOpen: false })
    } catch (error) {
      console.error('Error saving category:', error)
      throw error
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        dataService.deleteCategory(categoryId)
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Debug Info */}
      {!accessToken && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <p className="text-blue-800">
              🔧 Development Mode: Running without authentication bypass.
              {user ? `User: ${user.email}` : 'No user data'}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Track your expenses, budget goals, and savings progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab('transactions')}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
          {onLogout && (
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-2xl font-bold">{CurrencyConverter.format(monthlyIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold">{CurrencyConverter.format(monthlyExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PieChart className={`h-5 w-5 ${netIncome.amount >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${netIncome.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {CurrencyConverter.format(netIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Plus className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChart className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="budget">
            <Target className="h-4 w-4 mr-2" />
            Budget Goals
          </TabsTrigger>
          <TabsTrigger value="savings">
            <PiggyBank className="h-4 w-4 mr-2" />
            Savings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
                <CardDescription>
                  Your financial overview for {DateUtils.getMonthName(currentMonth)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-xl font-bold">{currentMonthTransactions.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Categories</p>
                      <p className="text-xl font-bold">
                        {Object.keys(categorySpending).length}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Quick Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Budget Goals:</span>
                        <span>{budgetGoals.length} active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings Goals:</span>
                        <span>{savingsGoals.length} active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Daily Spending:</span>
                        <span>
                          {CurrencyConverter.format({
                            amount: monthlyExpenses.amount / new Date().getDate(),
                            currency: 'USD'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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

        <TabsContent value="categories">
          <ExpenseCategories
            transactions={transactions}
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            dateRange={{
              start: `${currentMonth}-01`,
              end: new Date().toISOString().split('T')[0]
            }}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetGoalTracker
            goals={budgetGoals}
            totalSpent={categorySpending}
            onAddGoal={handleAddBudgetGoal}
            onEditGoal={handleEditBudgetGoal}
            onDeleteGoal={(goalId) => console.log('Delete goal:', goalId)}
          />
        </TabsContent>

        <TabsContent value="savings">
          <SavingsGoalTracker
            goals={savingsGoals}
            currentSavings={currentSavings}
            onAddGoal={handleAddSavingsGoal}
            onEditGoal={handleEditSavingsGoal}
            onAddContribution={handleAddContribution}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BudgetGoalModal
        isOpen={budgetGoalModal.isOpen}
        onClose={() => setBudgetGoalModal({ isOpen: false })}
        onSave={handleSaveBudgetGoal}
        categories={categories}
        editGoal={budgetGoalModal.editGoal}
      />

      <SavingsGoalModal
        isOpen={savingsGoalModal.isOpen}
        onClose={() => setSavingsGoalModal({ isOpen: false })}
        onSave={handleSaveSavingsGoal}
        editGoal={savingsGoalModal.editGoal}
      />

      <CategoryModal
        isOpen={categoryModal.isOpen}
        onClose={() => setCategoryModal({ isOpen: false })}
        onSave={handleSaveCategory}
        editCategory={categoryModal.editCategory}
      />
    </div>
  )
}