import React, { useState, useEffect } from 'react';
import type { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'>) => Promise<void>;
  editCategory?: Category;
}

const CATEGORY_ICONS = [
  '🍽️', '🚗', '🎬', '🛍️', '📋', '⚕️', '📚', '✈️', '💰', '📦',
  '🏠', '💡', '📱', '🎮', '🏋️', '☕', '🎵', '🧘', '💄', '🧹',
  '🔧', '🌳', '🎁', '💳', '📈', '🏦', '🍕', '🚌', '⛽', '🎯'
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#747D8C',
  '#FF3838', '#2DD4BF', '#3B82F6', '#10B981', '#F59E0B',
  '#EC4899', '#6366F1', '#8B5CF6', '#06B6D4', '#6B7280'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editCategory
}) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    color: '#747D8C'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editCategory) {
      setFormData({
        name: editCategory.name,
        icon: editCategory.icon || '📦',
        color: editCategory.color || '#747D8C'
      });
    } else {
      setFormData({
        name: '',
        icon: '📦',
        color: '#747D8C'
      });
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color
      });
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {editCategory ? 'Edit Category' : 'Add Category'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Groceries, Gas, Entertainment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="grid grid-cols-6 gap-2 p-3 border border-gray-300 rounded-md max-h-32 overflow-y-auto">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`p-2 text-xl rounded hover:bg-gray-100 ${
                    formData.icon === icon ? 'bg-blue-100 border-blue-500 border-2' : 'border border-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="grid grid-cols-5 gap-2 p-3 border border-gray-300 rounded-md">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </span>
              <span className="font-medium">{formData.name || 'Category Name'}</span>
            </div>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
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