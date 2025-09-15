import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Target, Plus, Check, Trash2, Edit, TrendingUp } from 'lucide-react';

interface Goal {
  id: string;
  type: string;
  target_value: number;
  current_value: number;
  target_date: string | null;
  achieved: boolean;
  created_at: string;
}

export function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    target_value: 0,
    current_value: 0,
    target_date: '',
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('user_goals')
          .update({
            type: formData.type,
            target_value: formData.target_value,
            current_value: formData.current_value,
            target_date: formData.target_date || null,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_goals')
          .insert({
            user_id: user!.id,
            type: formData.type,
            target_value: formData.target_value,
            current_value: formData.current_value,
            target_date: formData.target_date || null,
          });

        if (error) throw error;
      }

      setShowForm(false);
      setEditingGoal(null);
      setFormData({ type: '', target_value: 0, current_value: 0, target_date: '' });
      loadGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const toggleAchieved = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ achieved: !goal.achieved })
        .eq('id', goal.id);

      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const startEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      target_value: goal.target_value,
      current_value: goal.current_value,
      target_date: goal.target_date || '',
    });
    setShowForm(true);
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Goal
        </button>
      </div>

      {/* Goal Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a goal type</option>
                  <option value="Weight Loss">Weight Loss (lbs)</option>
                  <option value="Weight Gain">Weight Gain (lbs)</option>
                  <option value="Workout Count">Workout Count</option>
                  <option value="Running Distance">Running Distance (miles)</option>
                  <option value="Push-ups">Push-ups</option>
                  <option value="Bench Press">Bench Press (lbs)</option>
                  <option value="Squat">Squat (lbs)</option>
                  <option value="Deadlift">Deadlift (lbs)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Value
                </label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                  required
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value
                </label>
                <input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })}
                  required
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                  setFormData({ type: '', target_value: 0, current_value: 0, target_date: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No goals set yet</h3>
          <p className="text-gray-600 mb-6">Set your first fitness goal to start tracking your progress.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Set Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className={`bg-white rounded-lg shadow-sm border p-6 ${
              goal.achieved ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{goal.type}</h3>
                    {goal.achieved && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Achieved
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Progress: {goal.current_value} / {goal.target_value}</span>
                      <span>{Math.round(getProgress(goal))}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.achieved ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${getProgress(goal)}%` }}
                      />
                    </div>

                    {goal.target_date && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Target className="h-4 w-4 mr-1" />
                        Target: {formatDate(goal.target_date)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleAchieved(goal)}
                    className={`p-2 rounded-lg transition-colors ${
                      goal.achieved 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => startEdit(goal)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}