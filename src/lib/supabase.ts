import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          muscle_groups: string[]
          instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          muscle_groups?: string[]
          instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          muscle_groups?: string[]
          instructions?: string | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          duration_minutes: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date?: string
          duration_minutes?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          duration_minutes?: number
          notes?: string | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number[]
          weight: number[]
          rest_seconds: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          sets?: number
          reps?: number[]
          weight?: number[]
          rest_seconds?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          sets?: number
          reps?: number[]
          weight?: number[]
          rest_seconds?: number
          notes?: string | null
          created_at?: string
        }
      }
      user_goals: {
        Row: {
          id: string
          user_id: string
          type: string
          target_value: number
          current_value: number
          target_date: string | null
          achieved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          target_value: number
          current_value?: number
          target_date?: string | null
          achieved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          target_value?: number
          current_value?: number
          target_date?: string | null
          achieved?: boolean
          created_at?: string
        }
      }
    }
  }
}