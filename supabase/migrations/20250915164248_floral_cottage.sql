/*
  # Fitness Tracker Database Schema

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `exercises` - Exercise library
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `muscle_groups` (text[])
      - `instructions` (text)
      - `created_at` (timestamp)
    
    - `workouts` - User workout sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `date` (date)
      - `duration_minutes` (integer)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `workout_exercises` - Exercises within workouts
      - `id` (uuid, primary key)
      - `workout_id` (uuid, references workouts)
      - `exercise_id` (uuid, references exercises)
      - `sets` (integer)
      - `reps` (integer[])
      - `weight` (decimal[])
      - `rest_seconds` (integer)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `user_goals` - User fitness goals
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text)
      - `target_value` (decimal)
      - `current_value` (decimal)
      - `target_date` (date)
      - `achieved` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
</sql>

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  muscle_groups text[] DEFAULT '{}',
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  duration_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  sets integer DEFAULT 1,
  reps integer[] DEFAULT '{}',
  weight decimal[] DEFAULT '{}',
  rest_seconds integer DEFAULT 60,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  target_value decimal NOT NULL,
  current_value decimal DEFAULT 0,
  target_date date,
  achieved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Exercises policies (public read, admin write)
CREATE POLICY "Anyone can read exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Workouts policies
CREATE POLICY "Users can manage own workouts"
  ON workouts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Workout exercises policies
CREATE POLICY "Users can manage own workout exercises"
  ON workout_exercises FOR ALL
  TO authenticated
  USING (
    workout_id IN (
      SELECT id FROM workouts WHERE user_id = auth.uid()
    )
  );

-- User goals policies
CREATE POLICY "Users can manage own goals"
  ON user_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert some sample exercises
INSERT INTO exercises (name, category, muscle_groups, instructions) VALUES
  ('Push-ups', 'Bodyweight', ARRAY['chest', 'triceps', 'shoulders'], 'Start in plank position, lower body to ground, push back up'),
  ('Squats', 'Bodyweight', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Stand with feet shoulder-width apart, lower hips back and down, return to standing'),
  ('Pull-ups', 'Bodyweight', ARRAY['back', 'biceps'], 'Hang from bar, pull body up until chin clears bar, lower with control'),
  ('Bench Press', 'Weightlifting', ARRAY['chest', 'triceps', 'shoulders'], 'Lie on bench, lower bar to chest, press back up'),
  ('Deadlift', 'Weightlifting', ARRAY['back', 'hamstrings', 'glutes'], 'Stand with feet hip-width apart, hinge at hips, lift bar by extending hips and knees'),
  ('Plank', 'Core', ARRAY['core', 'shoulders'], 'Hold body in straight line from head to heels, engage core muscles'),
  ('Lunges', 'Bodyweight', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Step forward into lunge position, lower back knee toward ground, return to standing'),
  ('Burpees', 'Cardio', ARRAY['full_body'], 'Squat down, jump back to plank, do push-up, jump feet to hands, jump up with arms overhead');