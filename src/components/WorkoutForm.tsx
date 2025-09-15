import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Plus, Minus, Save, X, Search } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
}

interface WorkoutExercise {
  id?: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number[];
  weight: number[];
  rest_seconds: number;
  notes: string;
}

interface WorkoutFormProps {
  workout?: any;
  onSave: () => void;
  onCancel: () => void;
}

export function WorkoutForm({ workout, onSave, onCancel }: WorkoutFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(workout?.name || '');
  const [date, setDate] = useState(workout?.date || new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState(workout?.duration_minutes || 0);
  const [notes, setNotes] = useState(workout?.notes || '');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
    if (workout) {
      loadWorkoutExercises();
    }
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadWorkoutExercises = async () => {
    if (!workout) return;

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercises(name)
        `)
        .eq('workout_id', workout.id);

      if (error) throw error;

      const formattedExercises = data?.map(we => ({
        id: we.id,
        exercise_id: we.exercise_id,
        exercise_name: we.exercises?.name || '',
        sets: we.sets,
        reps: we.reps || [],
        weight: we.weight || [],
        rest_seconds: we.rest_seconds,
        notes: we.notes || '',
      })) || [];

      setWorkoutExercises(formattedExercises);
    } catch (error) {
      console.error('Error loading workout exercises:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps: [10, 10, 10],
      weight: [0, 0, 0],
      rest_seconds: 60,
      notes: '',
    };

    setWorkoutExercises([...workoutExercises, newWorkoutExercise]);
    setShowExerciseSelector(false);
    setSearchTerm('');
  };

  const updateWorkoutExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...workoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutExercises(updated);
  };

  const updateSetData = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const updated = [...workoutExercises];
    const exercise = updated[exerciseIndex];
    
    if (field === 'reps') {
      const newReps = [...exercise.reps];
      newReps[setIndex] = value;
      exercise.reps = newReps;
    } else {
      const newWeight = [...exercise.weight];
      newWeight[setIndex] = value;
      exercise.weight = newWeight;
    }
    
    setWorkoutExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    const exercise = updated[exerciseIndex];
    
    exercise.sets += 1;
    exercise.reps.push(exercise.reps[exercise.reps.length - 1] || 10);
    exercise.weight.push(exercise.weight[exercise.weight.length - 1] || 0);
    
    setWorkoutExercises(updated);
  };

  const removeSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    const exercise = updated[exerciseIndex];
    
    if (exercise.sets > 1) {
      exercise.sets -= 1;
      exercise.reps.pop();
      exercise.weight.pop();
      setWorkoutExercises(updated);
    }
  };

  const removeExercise = (index: number) => {
    const updated = workoutExercises.filter((_, i) => i !== index);
    setWorkoutExercises(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workout name');
      return;
    }

    setLoading(true);

    try {
      let workoutId = workout?.id;

      if (workout) {
        // Update existing workout
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            name,
            date,
            duration_minutes: durationMinutes,
            notes,
          })
          .eq('id', workout.id);

        if (updateError) throw updateError;

        // Delete existing workout exercises
        const { error: deleteError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', workout.id);

        if (deleteError) throw deleteError;
      } else {
        // Create new workout
        const { data: newWorkout, error: createError } = await supabase
          .from('workouts')
          .insert({
            user_id: user!.id,
            name,
            date,
            duration_minutes: durationMinutes,
            notes,
          })
          .select()
          .single();

        if (createError) throw createError;
        workoutId = newWorkout.id;
      }

      // Insert workout exercises
      if (workoutExercises.length > 0) {
        const exerciseInserts = workoutExercises.map(we => ({
          workout_id: workoutId,
          exercise_id: we.exercise_id,
          sets: we.sets,
          reps: we.reps,
          weight: we.weight,
          rest_seconds: we.rest_seconds,
          notes: we.notes,
        }));

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exerciseInserts);

        if (exerciseError) throw exerciseError;
      }

      onSave();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {workout ? 'Edit Workout' : 'New Workout'}
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      {/* Workout Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workout Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter workout name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any notes about your workout..."
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
          <button
            onClick={() => setShowExerciseSelector(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </button>
        </div>

        {workoutExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No exercises added yet. Click "Add Exercise" to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {workoutExercises.map((workoutExercise, exerciseIndex) => (
              <div key={`${workoutExercise.exercise_id}-${exerciseIndex}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{workoutExercise.exercise_name}</h3>
                  <button
                    onClick={() => removeExercise(exerciseIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: workoutExercise.sets }).map((_, setIndex) => (
                    <div key={setIndex} className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-12">Set {setIndex + 1}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={workoutExercise.reps[setIndex] || ''}
                          onChange={(e) => updateSetData(exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          placeholder="Reps"
                        />
                        <span className="text-sm text-gray-500">reps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={workoutExercise.weight[setIndex] || ''}
                          onChange={(e) => updateSetData(exerciseIndex, setIndex, 'weight', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          placeholder="Weight"
                          step="0.5"
                        />
                        <span className="text-sm text-gray-500">lbs</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="flex items-center px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Set
                    </button>
                    <button
                      onClick={() => removeSet(exerciseIndex)}
                      className="flex items-center px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove Set
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={workoutExercise.rest_seconds}
                      onChange={(e) => updateWorkoutExercise(exerciseIndex, 'rest_seconds', Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm text-gray-500">sec rest</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Exercise</h3>
                <button
                  onClick={() => setShowExerciseSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search exercises..."
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-96 p-6">
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-medium text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-500">
                      {exercise.category} • {exercise.muscle_groups.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}