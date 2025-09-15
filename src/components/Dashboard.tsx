import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Activity, Target, TrendingUp, Calendar, Clock, Zap } from 'lucide-react';

interface DashboardStats {
  totalWorkouts: number;
  totalMinutes: number;
  activeGoals: number;
  weeklyWorkouts: number;
}

interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  duration_minutes: number;
  exercise_count: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkouts: 0,
    totalMinutes: 0,
    activeGoals: 0,
    weeklyWorkouts: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get workout stats
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id);

      if (workoutsError) throw workoutsError;

      // Get goals
      const { data: goals, error: goalsError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user!.id)
        .eq('achieved', false);

      if (goalsError) throw goalsError;

      // Calculate stats
      const totalWorkouts = workouts?.length || 0;
      const totalMinutes = workouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const activeGoals = goals?.length || 0;

      // Weekly workouts (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyWorkouts = workouts?.filter(w => 
        new Date(w.date) >= weekAgo
      ).length || 0;

      setStats({
        totalWorkouts,
        totalMinutes,
        activeGoals,
        weeklyWorkouts,
      });

      // Get recent workouts with exercise counts
      const { data: recentWorkoutsData, error: recentError } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          date,
          duration_minutes,
          workout_exercises(id)
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const formattedRecent = recentWorkoutsData?.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.date,
        duration_minutes: workout.duration_minutes,
        exercise_count: workout.workout_exercises?.length || 0,
      })) || [];

      setRecentWorkouts(formattedRecent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back! Here's your fitness overview.
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Minutes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMinutes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeGoals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyWorkouts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Workouts</h2>
        </div>
        <div className="p-6">
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No workouts yet. Start your fitness journey!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{workout.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(workout.date)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {workout.duration_minutes}min
                        </span>
                        <span>{workout.exercise_count} exercises</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}