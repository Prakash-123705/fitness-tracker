import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Plus, Calendar, Clock, Trash2, Edit, Dumbbell } from 'lucide-react';
import { WorkoutForm } from './WorkoutForm';

interface Workout {
  id: string;
  name: string;
  date: string;
  duration_minutes: number;
  notes: string | null;
  exercise_count: number;
}

export function Workouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          date,
          duration_minutes,
          notes,
          workout_exercises(id)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedWorkouts = data?.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.date,
        duration_minutes: workout.duration_minutes,
        notes: workout.notes,
        exercise_count: workout.workout_exercises?.length || 0,
      })) || [];

      setWorkouts(formattedWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      
      await loadWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleWorkoutSaved = () => {
    setShowForm(false);
    setEditingWorkout(null);
    loadWorkouts();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  if (showForm) {
    return (
      <WorkoutForm
        workout={editingWorkout}
        onSave={handleWorkoutSaved}
        onCancel={() => {
          setShowForm(false);
          setEditingWorkout(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Workout
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No workouts yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your fitness journey by creating your first workout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Workout
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {workouts.map((workout) => (
            <div key={workout.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{workout.name}</h3>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(workout.date)}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {workout.duration_minutes} minutes
                    </span>
                    <span className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-2" />
                      {workout.exercise_count} exercises
                    </span>
                  </div>
                  {workout.notes && (
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {workout.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingWorkout(workout);
                      setShowForm(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(workout.id)}
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