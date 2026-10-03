import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../progression'
import type { Exercise, WorkoutLog } from '../types'

const EXERCISE_COLUMNS = 'id, day, code, name, sets, rep_min, rep_max, load_type, sort_order'
const LOG_COLUMNS = 'id, user_id, exercise_id, load, reps, logged_at'

export function useWorkout(userId: string) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const logsRef = useRef<WorkoutLog[]>([])

  const load = useCallback(async () => {
    const [exerciseResult, logResult] = await Promise.all([
      supabase.from('exercises').select(EXERCISE_COLUMNS).order('sort_order'),
      supabase.from('workout_logs').select(LOG_COLUMNS).eq('user_id', userId).order('logged_at'),
    ])

    if (exerciseResult.error || logResult.error) {
      setError(exerciseResult.error?.message ?? logResult.error?.message ?? 'No se pudo cargar el registro')
      setStatus('error')
      return
    }

    const nextLogs = (logResult.data ?? []) as WorkoutLog[]
    logsRef.current = nextLogs
    setExercises((exerciseResult.data ?? []) as Exercise[])
    setLogs(nextLogs)
    setError(null)
    setStatus('ready')
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  async function saveLog(exerciseId: string, loadValue: string, reps: number[]) {
    const { data, error: insertError } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, exercise_id: exerciseId, load: loadValue, reps })
      .select(LOG_COLUMNS)
      .single()

    if (insertError) throw new Error(insertError.message)
    const created = data as WorkoutLog
    const next = [...logsRef.current, created]
    logsRef.current = next
    setLogs(next)
  }

  async function saveProgress(exerciseId: string, loadValue: string, reps: number[]) {
    const todayKey = localDateKey(new Date().toISOString())
    const existing = [...logsRef.current]
      .reverse()
      .find((log) => log.exercise_id === exerciseId && localDateKey(log.logged_at) === todayKey)

    if (existing) {
      await updateLog(existing.id, loadValue, reps)
      return
    }

    await saveLog(exerciseId, loadValue, reps)
  }

  async function updateLog(id: string, loadValue: string, reps: number[]) {
    const { data, error: updateError } = await supabase
      .from('workout_logs')
      .update({ load: loadValue, reps })
      .eq('id', id)
      .select(LOG_COLUMNS)
      .single()

    if (updateError) throw new Error(updateError.message)
    const updated = data as WorkoutLog
    const next = logsRef.current.map((log) => (log.id === id ? updated : log))
    logsRef.current = next
    setLogs(next)
  }

  async function deleteLog(id: string) {
    const { error: deleteError } = await supabase.from('workout_logs').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    const next = logsRef.current.filter((log) => log.id !== id)
    logsRef.current = next
    setLogs(next)
  }

  return { exercises, logs, status, error, reload: load, saveLog, saveProgress, updateLog, deleteLog }
}
