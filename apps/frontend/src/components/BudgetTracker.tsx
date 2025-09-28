import React, { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Send, Calculator, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const budgetSchema = z.object({
  totalIncome: z.number().positive('Income must be positive'),
  currency: z.enum(['USD', 'KHR']),
  month: z.string().min(1, 'Month is required'),
  telegramChatId: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.enum(['USD', 'KHR']),
    category: z.string().optional()
  })).min(1, 'At least one item is required')
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface BudgetTrackerProps {
  onLogout: () => void
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ onLogout }) => {
  const { user, accessToken } = useAuth()
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState({ USD_TO_KHR: 4100, KHR_TO_USD: 1/4100 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      totalIncome: 0,
      currency: 'USD',
      month: new Date().toISOString().slice(0, 7),
      items: [{ name: '', amount: 0, currency: 'USD', category: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedValues = watch()

  // Load exchange rates
  useEffect(() => {
    fetch('http://localhost:3001/api/currency/rates')
      .then(res => res.json())
      .then(data => setExchangeRates(data.rates))
      .catch(console.error)
  }, [])

  // Load or create spreadsheet
  const createSpreadsheet = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/budget/spreadsheet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          spreadsheetName: `MMMS Budget - ${user?.name || 'User'}`
        })
      })
      
      const { spreadsheetId: newSpreadsheetId } = await response.json()
      setSpreadsheetId(newSpreadsheetId)
      localStorage.setItem('spreadsheetId', newSpreadsheetId)
    } catch (error) {
      console.error('Failed to create spreadsheet:', error)
    }
  }, [accessToken, user?.name])

  useEffect(() => {
    const storedSpreadsheetId = localStorage.getItem('spreadsheetId')
    if (storedSpreadsheetId) {
      setSpreadsheetId(storedSpreadsheetId)
    } else if (accessToken) {
      createSpreadsheet()
    }
  }, [accessToken, createSpreadsheet])

  // Calculate totals and remaining money
  const calculateTotals = () => {
    const totalSpending = watchedValues.items.reduce((sum, item) => {
      if (!item.amount) return sum
      
      // Convert to base currency for calculation
      const amount = item.currency === watchedValues.currency 
        ? item.amount 
        : item.currency === 'USD' && watchedValues.currency === 'KHR'
          ? item.amount * exchangeRates.USD_TO_KHR
          : item.currency === 'KHR' && watchedValues.currency === 'USD'
            ? item.amount * exchangeRates.KHR_TO_USD
            : item.amount
      
      return sum + amount
    }, 0)
    
    const remaining = (watchedValues.totalIncome || 0) - totalSpending
    
    return { totalSpending, remaining }
  }

  const { totalSpending, remaining } = calculateTotals()

  const onSubmit = async (data: BudgetFormData) => {
    if (!spreadsheetId || !accessToken) return

    setIsSubmitting(true)
    try {
      // Save to spreadsheet
      await fetch('http://localhost:3001/api/budget/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          spreadsheetId,
          budgetData: {
            ...data,
            date: new Date().toISOString().split('T')[0]
          }
        })
      })

      // Send to Telegram if chat ID provided
      if (data.telegramChatId) {
        await fetch('http://localhost:3001/api/telegram/send-budget-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            budgetData: data,
            chatId: data.telegramChatId
          })
        })
      }

      alert('Budget saved successfully!')
    } catch (error) {
      console.error('Failed to save budget:', error)
      alert('Failed to save budget. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addItem = () => {
    append({ name: '', amount: 0, currency: 'USD', category: '' })
  }

  const getCurrencySymbol = (currency: string) => {
    return currency === 'USD' ? '$' : '៛'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MMMS Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCurrencySymbol(watchedValues.currency)}{watchedValues.totalIncome?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {getCurrencySymbol(watchedValues.currency)}{totalSpending.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {getCurrencySymbol(watchedValues.currency)}{remaining.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget Entry</CardTitle>
            <CardDescription>
              Track your income and expenses with multi-currency support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Income</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('totalIncome', { valueAsNumber: true })}
                    placeholder="Enter total income"
                  />
                  {errors.totalIncome && (
                    <p className="text-sm text-red-600 mt-1">{errors.totalIncome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    {...register('currency')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Month</label>
                  <Input
                    type="month"
                    {...register('month')}
                  />
                  {errors.month && (
                    <p className="text-sm text-red-600 mt-1">{errors.month.message}</p>
                  )}
                </div>
              </div>

              {/* Telegram Chat ID */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Telegram Chat ID (Optional)
                </label>
                <Input
                  {...register('telegramChatId')}
                  placeholder="Enter your Telegram Chat ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your chat ID by messaging @userinfobot on Telegram
                </p>
              </div>

              {/* Spending Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Spending Items</h3>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium mb-2">Item Name</label>
                        <Input
                          {...register(`items.${index}.name`)}
                          placeholder="e.g., Groceries"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.amount`, { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select
                          {...register(`items.${index}.currency`)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="USD">USD</option>
                          <option value="KHR">KHR</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <Input
                          {...register(`items.${index}.category`)}
                          placeholder="e.g., Food"
                        />
                      </div>

                      <div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Budget'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BudgetTracker