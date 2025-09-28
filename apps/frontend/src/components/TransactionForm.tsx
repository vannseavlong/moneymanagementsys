import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryManager, CurrencyConverter } from '@/utils'
import type { Transaction, Money } from '@/types'

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'KHR']),
  categoryId: z.string().min(1, 'Category is required'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Date is required'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void
  defaultValues?: Partial<TransactionFormData>
  submitLabel?: string
  isLoading?: boolean
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  defaultValues,
  submitLabel = 'Add Transaction',
  isLoading = false
}) => {
  const [equivalentAmount, setEquivalentAmount] = useState<Money | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      ...defaultValues
    }
  })

  const watchedAmount = watch('amount')
  const watchedCurrency = watch('currency')

  // Calculate equivalent amount in other currency
  React.useEffect(() => {
    if (watchedAmount && watchedCurrency) {
      const currentMoney: Money = { amount: watchedAmount, currency: watchedCurrency }
      const targetCurrency = watchedCurrency === 'USD' ? 'KHR' : 'USD'
      const equivalent = CurrencyConverter.convert(currentMoney, targetCurrency)
      setEquivalentAmount(equivalent)
    }
  }, [watchedAmount, watchedCurrency])

  const handleFormSubmit = (data: TransactionFormData) => {
    const category = CategoryManager.getCategoryById(data.categoryId)
    
    const transaction: Omit<Transaction, 'id'> = {
      date: data.date,
      description: data.description,
      amount: {
        amount: data.amount,
        currency: data.currency
      },
      category,
      type: data.type,
      tags: []
    }

    onSubmit(transaction)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {submitLabel}
        </CardTitle>
        <CardDescription>
          Track your income and expenses with multi-currency support
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Transaction Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={watch('type') === 'expense' ? 'default' : 'outline'}
              onClick={() => setValue('type', 'expense')}
              className="w-full"
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={watch('type') === 'income' ? 'default' : 'outline'}
              onClick={() => setValue('type', 'income')}
              className="w-full"
            >
              Income
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              placeholder="e.g., Coffee, Salary, Groceries"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <Select
                value={watch('currency')}
                onValueChange={(value: 'USD' | 'KHR') => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="KHR">KHR (៛)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency Conversion Display */}
          {equivalentAmount && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Equivalent: <span className="font-medium">
                  {CurrencyConverter.format(equivalentAmount)}
                </span>
              </p>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={watch('categoryId')}
              onValueChange={(value: string) => setValue('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CategoryManager.DEFAULT_CATEGORIES
                  .filter(cat => watch('type') === 'income' ? cat.id === 'income' : cat.id !== 'income')
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {submitLabel}
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}