import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-simple'
import { PiggyBank, Target, Calendar, TrendingUp, Plus, Edit2, CheckCircle2, Clock } from 'lucide-react'
import { CurrencyConverter, DateUtils } from '@/utils'
import type { SavingsGoal, Money } from '@/types'

interface SavingsGoalTrackerProps {
  goals: SavingsGoal[]
  currentSavings?: Record<string, Money> // goalId -> current saved amount
  onAddGoal: () => void
  onEditGoal: (goalId: string) => void
  onAddContribution: (goalId: string) => void
}

export const SavingsGoalTracker: React.FC<SavingsGoalTrackerProps> = ({
  goals,
  currentSavings = {},
  onAddGoal,
  onEditGoal,
  onAddContribution
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')

  const getGoalProgress = (goal: SavingsGoal) => {
    const saved = currentSavings[goal.id] || { amount: 0, currency: goal.targetAmount.currency }
    const savedInTargetCurrency = CurrencyConverter.convert(saved, goal.targetAmount.currency)
    const percentage = (savedInTargetCurrency.amount / goal.targetAmount.amount) * 100
    return {
      saved: savedInTargetCurrency,
      percentage: Math.min(percentage, 100),
      remaining: {
        amount: Math.max(goal.targetAmount.amount - savedInTargetCurrency.amount, 0),
        currency: goal.targetAmount.currency
      },
      isCompleted: percentage >= 100
    }
  }

  const getTimeToTarget = (goal: SavingsGoal) => {
    if (!goal.targetDate) return null
    
    const daysRemaining = DateUtils.getDaysUntil(goal.targetDate)
    const progress = getGoalProgress(goal)
    
    if (progress.isCompleted) return null
    if (daysRemaining <= 0) return 'overdue'
    
    // Calculate required daily savings
    const dailyRequired = progress.remaining.amount / daysRemaining
    
    return {
      daysRemaining,
      dailyRequired: {
        amount: dailyRequired,
        currency: goal.targetAmount.currency
      }
    }
  }

  const filteredGoals = goals.filter(goal => {
    const progress = getGoalProgress(goal)
    switch (activeTab) {
      case 'active':
        return !progress.isCompleted
      case 'completed':
        return progress.isCompleted
      default:
        return true
    }
  })

  const totalTargetAmount = goals.reduce<Money>((sum, goal) => {
    return CurrencyConverter.add(sum, goal.targetAmount, 'USD')
  }, { amount: 0, currency: 'USD' })

  const totalSavedAmount = goals.reduce<Money>((sum, goal) => {
    const progress = getGoalProgress(goal)
    return CurrencyConverter.add(sum, progress.saved, 'USD')
  }, { amount: 0, currency: 'USD' })

  const overallProgress = totalTargetAmount.amount > 0 
    ? (totalSavedAmount.amount / totalTargetAmount.amount) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold">{CurrencyConverter.format(totalSavedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">{CurrencyConverter.format(totalTargetAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Savings Goals
              </CardTitle>
              <CardDescription>
                Track your progress towards financial goals
              </CardDescription>
            </div>
            <Button onClick={onAddGoal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'all' | 'active' | 'completed')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Goals ({goals.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({goals.filter(g => !getGoalProgress(g).isCompleted).length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({goals.filter(g => getGoalProgress(g).isCompleted).length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No savings goals found</p>
                  <p className="text-sm">Set financial targets to start saving</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGoals.map((goal) => {
                    const progress = getGoalProgress(goal)
                    const timeInfo = getTimeToTarget(goal)

                    return (
                      <Card key={goal.id} className={`border-l-4 ${
                        progress.isCompleted 
                          ? 'border-l-green-500' 
                          : timeInfo === 'overdue' 
                            ? 'border-l-red-500' 
                            : 'border-l-blue-500'
                      }`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-lg">{goal.name}</h4>
                                {progress.isCompleted && (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                                {timeInfo === 'overdue' && (
                                  <Badge variant="destructive">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              {goal.description && (
                                <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Target: {CurrencyConverter.format(goal.targetAmount)}</span>
                                {goal.targetDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {DateUtils.formatDate(goal.targetDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => onAddContribution(goal.id)}>
                                Add Money
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => onEditGoal(goal.id)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2 mb-4">
                            <Progress 
                              value={progress.percentage} 
                              className={`h-3 ${progress.isCompleted ? 'bg-green-100' : ''}`}
                            />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                Saved: {CurrencyConverter.format(progress.saved)}
                              </span>
                              <span className="font-medium">
                                {progress.percentage.toFixed(1)}% complete
                              </span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground">Remaining</p>
                              <p className="font-semibold text-orange-600">
                                {CurrencyConverter.format(progress.remaining)}
                              </p>
                            </div>
                            {timeInfo && timeInfo !== 'overdue' && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Daily target ({timeInfo.daysRemaining} days left)
                                </p>
                                <p className="font-semibold">
                                  {CurrencyConverter.format(timeInfo.dailyRequired)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Completion celebration */}
                          {progress.isCompleted && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-semibold text-green-800">Congratulations!</p>
                                  <p className="text-sm text-green-700">
                                    You've reached your savings goal of {CurrencyConverter.format(goal.targetAmount)}!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Overdue warning */}
                          {timeInfo === 'overdue' && !progress.isCompleted && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-red-600" />
                                <div>
                                  <p className="font-semibold text-red-800">Goal Overdue</p>
                                  <p className="text-sm text-red-700">
                                    Target date has passed. You still need {CurrencyConverter.format(progress.remaining)} to reach your goal.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}