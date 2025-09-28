import React, { useState, useEffect } from 'react';
import type { SavingsGoal } from '../types';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => Promise<void>;
  editGoal?: SavingsGoal;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editGoal
}) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currency: 'USD' as 'USD' | 'KHR',
    targetDate: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setFormData({
        name: editGoal.name,
        targetAmount: editGoal.targetAmount.amount.toString(),
        currency: editGoal.targetAmount.currency,
        targetDate: editGoal.targetDate || '',
        description: editGoal.description || ''
      });
    } else {
      setFormData({
        name: '',
        targetAmount: '',
        currency: 'USD',
        targetDate: '',
        description: ''
      });
    }
  }, [editGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name,
        targetAmount: {
          amount: parseFloat(formData.targetAmount),
          currency: formData.currency
        },
        targetDate: formData.targetDate || undefined,
        description: formData.description || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving savings goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {editGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
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
            <label className="block text-sm font-medium mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="What are you saving for?"
              rows={3}
            />
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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