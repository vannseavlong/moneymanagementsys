import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, AlertTriangle, CheckCircle, Plus, Edit } from 'lucide-react'
import { CurrencyConverter, DateUtils } from '@/utils'
import type { BudgetGoal, Money } from '@/types'

interface BudgetGoalTrackerProps {
  goals: BudgetGoal[]
  onAddGoal: () => void
  onEditGoal: (goalId: string) => void
  onDeleteGoal: (goalId: string) => void
  totalSpent?: Record<string, Money> // category.id -> spent amount
}

export const BudgetGoalTracker: React.FC<BudgetGoalTrackerProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
//   onDeleteGoal,
  totalSpent = {}
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'exceeded' | 'achieved'>('all')

  const getGoalStatus = (goal: BudgetGoal) => {
    const spent = totalSpent[goal.category.id] || { amount: 0, currency: 'USD' }
    const spentInGoalCurrency = CurrencyConverter.convert(spent, goal.limit.currency)
    const progressPercentage = (spentInGoalCurrency.amount / goal.limit.amount) * 100

    if (progressPercentage >= 100) {
      return progressPercentage > 100 ? 'exceeded' : 'achieved'
    }
    return 'active'
  }

  const getProgressPercentage = (goal: BudgetGoal) => {
    const spent = totalSpent[goal.category.id] || { amount: 0, currency: 'USD' }
    const spentInGoalCurrency = CurrencyConverter.convert(spent, goal.limit.currency)
    return Math.min((spentInGoalCurrency.amount / goal.limit.amount) * 100, 100)
  }

  const getRemainingAmount = (goal: BudgetGoal): Money => {
    const spent = totalSpent[goal.category.id] || { amount: 0, currency: 'USD' }
    const spentInGoalCurrency = CurrencyConverter.convert(spent, goal.limit.currency)
    const remaining = goal.limit.amount - spentInGoalCurrency.amount
    
    return {
      amount: Math.max(remaining, 0),
      currency: goal.limit.currency
    }
  }

  const getDaysRemaining = (goal: BudgetGoal) => {
    return DateUtils.getDaysUntil(goal.endDate)
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true
    return getGoalStatus(goal) === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'achieved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Target className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'exceeded':
        return <Badge variant="destructive">Over Budget</Badge>
      case 'achieved':
        return <Badge variant="default" className="bg-green-500">Goal Met</Badge>
      default:
        return <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Budget Goals
              </CardTitle>
              <CardDescription>
                Track your spending against budget targets
              </CardDescription>
            </div>
            <Button onClick={onAddGoal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'active', 'exceeded', 'achieved'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No budget goals found</p>
              <p className="text-sm">Set spending targets to track your progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGoals.map((goal) => {
                const status = getGoalStatus(goal)
                const progress = getProgressPercentage(goal)
                const remaining = getRemainingAmount(goal)
                const daysLeft = getDaysRemaining(goal)
                const spent = totalSpent[goal.category.id] || { amount: 0, currency: 'USD' }
                const spentInGoalCurrency = CurrencyConverter.convert(spent, goal.limit.currency)

                return (
                  <Card key={goal.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <div>
                            <h4 className="font-semibold">{goal.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {goal.category.name} • {DateUtils.formatDateRange(goal.startDate, goal.endDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(status, progress)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditGoal(goal.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <Progress 
                          value={progress} 
                          className={`h-2 ${status === 'exceeded' ? 'progress-destructive' : ''}`}
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Spent: {CurrencyConverter.format(spentInGoalCurrency)}
                          </span>
                          <span className="font-medium">
                            Target: {CurrencyConverter.format(goal.limit)}
                          </span>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Remaining</p>
                          <p className="font-semibold text-green-600">
                            {CurrencyConverter.format(remaining)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Time Left</p>
                          <p className="font-semibold">
                            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                          </p>
                        </div>
                      </div>

                      {/* Alert for over-budget or near expiry */}
                      {status === 'exceeded' && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <p className="text-sm text-red-700">
                              Over budget by {CurrencyConverter.format({
                                amount: spentInGoalCurrency.amount - goal.limit.amount,
                                currency: goal.limit.currency
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {daysLeft <= 3 && daysLeft > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <p className="text-sm text-yellow-700">
                              Goal expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="text-2xl font-bold">
                    {goals.filter(g => getGoalStatus(g) === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Goals Met</p>
                  <p className="text-2xl font-bold">
                    {goals.filter(g => getGoalStatus(g) === 'achieved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Over Budget</p>
                  <p className="text-2xl font-bold">
                    {goals.filter(g => getGoalStatus(g) === 'exceeded').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}