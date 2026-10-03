export type Day = 'A' | 'B'
export type LoadType = 'lb' | 'lbcu' | 'variante' | 'banda' | 'dips'

export type Exercise = {
  id: string
  day: Day
  code: string
  name: string
  sets: number
  rep_min: number
  rep_max: number
  load_type: LoadType
  sort_order: number
}

export type WorkoutLog = {
  id: string
  user_id: string
  exercise_id: string
  load: string
  reps: number[]
  logged_at: string
}

export type Draft = {
  load: string
  reps: string[]
}
