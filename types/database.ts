export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Goal =
  | 'prise_masse'
  | 'perte_poids'
  | 'force'
  | 'endurance'
  | 'maintien'

export type Level = 'debutant' | 'intermediaire' | 'avance'

export type MuscleGroup =
  | 'pectoraux'
  | 'dos'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'ischio_jambiers'
  | 'fessiers'
  | 'mollets'
  | 'abdominaux'
  | 'cardio'
  | 'full_body'

export type WorkoutStatus = 'draft' | 'in_progress' | 'completed'

// ─── Table row shapes ─────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  first_name: string | null
  weight_kg: number | null
  height_cm: number | null
  age: number | null
  goal: Goal | null
  level: Level | null
  target_weight_kg: number | null
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  date: string
  duration_minutes: number | null
  notes: string | null
  status: WorkoutStatus
  total_volume_kg: number | null
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  description: string | null
  is_custom: boolean
  user_id: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  order_index: number
  notes: string | null
  created_at: string
}

export interface Set {
  id: string
  workout_exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  is_pr: boolean
  completed: boolean
  created_at: string
}

export interface BodyWeight {
  id: string
  user_id: string
  weight_kg: number
  recorded_at: string
  notes: string | null
  created_at: string
}

export interface ProgressPhoto {
  id: string
  user_id: string
  url: string
  storage_path: string
  taken_at: string
  notes: string | null
  created_at: string
}

// ─── Composed types ───────────────────────────────────────────────────────────

export type WorkoutExerciseWithDetails = WorkoutExercise & {
  exercise: Exercise
  sets: Set[]
}

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExerciseWithDetails[]
}

export type PersonalRecord = {
  exercise_id: string
  exercise_name: string
  muscle_group: MuscleGroup
  max_weight_kg: number
  achieved_at: string
  workout_id: string
}

export type WeeklyVolume = {
  week_start: string
  total_volume_kg: number
  workout_count: number
}

export type ExerciseProgress = {
  exercise_id: string
  exercise_name: string
  entries: { date: string; max_weight_kg: number; total_volume_kg: number }[]
}

// ─── Supabase Database schema ─────────────────────────────────────────────────
// Format identique aux types auto-générés par Supabase CLI.
// Relationships requis par GenericTable (@supabase/postgrest-js).

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
        Relationships: never[]
      }
      workouts: {
        Row: Workout
        Insert: Omit<Workout, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Workout, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
        Relationships: never[]
      }
      exercises: {
        Row: Exercise
        Insert: Omit<Exercise, 'id' | 'created_at'>
        Update: Partial<Omit<Exercise, 'id' | 'created_at'>>
        Relationships: never[]
      }
      workout_exercises: {
        Row: WorkoutExercise
        Insert: Omit<WorkoutExercise, 'id' | 'created_at'>
        Update: Partial<Omit<WorkoutExercise, 'id' | 'workout_id' | 'created_at'>>
        Relationships: never[]
      }
      sets: {
        Row: Set
        Insert: Omit<Set, 'id' | 'created_at'>
        Update: Partial<Omit<Set, 'id' | 'workout_exercise_id' | 'created_at'>>
        Relationships: never[]
      }
      body_weights: {
        Row: BodyWeight
        Insert: Omit<BodyWeight, 'id' | 'created_at'>
        Update: Partial<Omit<BodyWeight, 'id' | 'user_id' | 'created_at'>>
        Relationships: never[]
      }
      progress_photos: {
        Row: ProgressPhoto
        Insert: Omit<ProgressPhoto, 'id' | 'created_at'>
        Update: Partial<Omit<ProgressPhoto, 'id' | 'user_id' | 'created_at'>>
        Relationships: never[]
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      goal: Goal
      level: Level
      muscle_group: MuscleGroup
      workout_status: WorkoutStatus
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}
