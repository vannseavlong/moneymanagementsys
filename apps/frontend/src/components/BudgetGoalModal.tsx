import React, { useState, useEffect } from 'react';
import type { BudgetGoal, Category } from '../types';

interface BudgetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<BudgetGoal, 'id' | 'startDate' | 'endDate'>) => Promise<void>;
  categories: Category[];
  editGoal?: BudgetGoal;
}

export const BudgetGoalModal: React.FC<BudgetGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editGoal
}) => {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    limitAmount: '',
    currency: 'USD' as 'USD' | 'KHR',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly',
    alertThreshold: '80'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setFormData({
        name: editGoal.name,
        categoryId: editGoal.category.id,
        limitAmount: editGoal.limit.amount.toString(),
        currency: editGoal.limit.currency,
        period: editGoal.period,
        alertThreshold: editGoal.alertThreshold?.toString() || '80'
      });
    } else {
      setFormData({
        name: '',
        categoryId: '',
        limitAmount: '',
        currency: 'USD',
        period: 'monthly',
        alertThreshold: '80'
      });
    }
  }, [editGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.limitAmount || !formData.name) return;

    setIsSubmitting(true);
    try {
      const category = categories.find(c => c.id === formData.categoryId);
      if (!category) return;

      await onSave({
        name: formData.name,
        category,
        limit: {
          amount: parseFloat(formData.limitAmount),
          currency: formData.currency
        },
        period: formData.period,
        alertThreshold: parseInt(formData.alertThreshold)
      });
      onClose();
    } catch (error) {
      console.error('Error saving budget goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {editGoal ? 'Edit Budget Goal' : 'Add Budget Goal'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Monthly Food Budget"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget Limit</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.limitAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, limitAmount: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as 'USD' | 'KHR' }))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alert Threshold (%)</label>
            <input
              type="number"
              value={formData.alertThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="80"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when you reach this percentage of your limit</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};