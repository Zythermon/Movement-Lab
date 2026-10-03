import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { brand } from '../brand'
import { ExerciseCard } from './ExerciseCard'
import { HistoryList } from './HistoryList'
import { IconCheck, IconHistory, IconToday } from './Icons'
import { StudioLinks } from './StudioLinks'
import { useWorkout } from '../hooks/useWorkout'
import { supabase } from '../lib/supabase'
import { localDateKey } from '../progression'
import type { Day, Draft, Exercise, WorkoutLog } from '../types'

type Props = {
  session: Session
}

function readDrafts(userId: string) {
  try {
    const raw = localStorage.getItem(`movement-drafts:${userId}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Draft>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function readDay(userId: string): Day {
  return localStorage.getItem(`movement-day:${userId}`) === 'B' ? 'B' : 'A'
}

function displayName(session: Session) {
  const metadata = session.user.user_metadata as { full_name?: string; name?: string }
  const full = metadata.full_name ?? metadata.name ?? session.user.email ?? ''
  return full.split(' ')[0]
}

function todayLogFor(logs: WorkoutLog[], todayKey: string) {
  return [...logs].reverse().find((log) => localDateKey(log.logged_at) === todayKey)
}

function firstOpen(exercises: Exercise[], logsByExercise: Map<string, WorkoutLog[]>, todayKey: string) {
  const index = exercises.findIndex((exercise) => {
    const setsDone = todayLogFor(logsByExercise.get(exercise.id) ?? [], todayKey)?.reps.length ?? 0
    return setsDone < exercise.sets
  })
  return index === -1 ? 0 : index
}

export function Tracker({ session }: Props) {
  const userId = session.user.id
  const { exercises, logs, status, error, reload, saveProgress, updateLog, deleteLog } = useWorkout(userId)
  const [day, setDay] = useState<Day>(() => readDay(userId))
  const [view, setView] = useState<'today' | 'history'>('today')
  const [step, setStep] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => readDrafts(userId))
  const placed = useRef(false)

  const todayKey = localDateKey(new Date().toISOString())
  const dayExercises = exercises.filter((exercise) => exercise.day === day)
  const logsByExercise = useMemo(() => {
    const grouped = new Map<string, WorkoutLog[]>()
    for (const log of logs) {
      const list = grouped.get(log.exercise_id)
      if (list) list.push(log)
      else grouped.set(log.exercise_id, [log])
    }
    return grouped
  }, [logs])

  useEffect(() => {
    if (status !== 'ready' || placed.current) return
    placed.current = true
    setStep(firstOpen(dayExercises, logsByExercise, todayKey))
  }, [status, dayExercises, logsByExercise, todayKey])

  const current = dayExercises[Math.min(step, Math.max(dayExercises.length - 1, 0))]
  const doneToday = dayExercises.filter((exercise) => {
    const setsDone = todayLogFor(logsByExercise.get(exercise.id) ?? [], todayKey)?.reps.length ?? 0
    return setsDone >= exercise.sets
  }).length
  const name = displayName(session)

  const chooseDay = (next: Day) => {
    const list = exercises.filter((exercise) => exercise.day === next)
    setDay(next)
    setStep(firstOpen(list, logsByExercise, todayKey))
    localStorage.setItem(`movement-day:${userId}`, next)
  }

  const rememberDraft = (exerciseId: string, draft: Draft) => {
    setDrafts((currentDrafts) => {
      const next = { ...currentDrafts, [exerciseId]: draft }
      localStorage.setItem(`movement-drafts:${userId}`, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <img className="wordmark header" src="/logo.png" alt={brand.name} />
          <h1>{name ? `Hola, ${name}` : 'Entrenamiento'}</h1>
        </div>
        <button type="button" className="text-button" onClick={() => void supabase.auth.signOut()}>
          Salir
        </button>
      </header>

      <div className="switch" role="tablist">
        <button type="button" aria-selected={view === 'today'} onClick={() => setView('today')}>
          <IconToday /> Hoy
        </button>
        <button type="button" aria-selected={view === 'history'} onClick={() => setView('history')}>
          <IconHistory /> Historial
        </button>
      </div>

      {status === 'loading' ? <p className="status-line">Cargando…</p> : null}
      {status === 'error' ? (
        <div className="banner">
          <p>No se pudo cargar el registro. {error}</p>
          <button type="button" onClick={() => void reload()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {status === 'ready' && view === 'today' ? (
        <>
          <div className="days" role="tablist">
            <button type="button" aria-selected={day === 'A'} onClick={() => chooseDay('A')}>
              Día A
            </button>
            <button type="button" aria-selected={day === 'B'} onClick={() => chooseDay('B')}>
              Día B
            </button>
          </div>
          <p className="progress">
            {doneToday === dayExercises.length && dayExercises.length > 0
              ? 'Día completo.'
              : `${doneToday} de ${dayExercises.length} ejercicios`}
          </p>

          {current ? (
            <ExerciseCard
              key={current.id}
              exercise={current}
              logs={logsByExercise.get(current.id) ?? []}
              step={step}
              total={dayExercises.length}
              draft={drafts[current.id]}
              onDraft={(draft) => rememberDraft(current.id, draft)}
              onSave={(load, reps) => saveProgress(current.id, load, reps)}
              onPrevious={() => setStep((value) => Math.max(0, value - 1))}
              onNext={() => setStep((value) => Math.min(dayExercises.length - 1, value + 1))}
            />
          ) : null}

          <ol className="checklist">
            {dayExercises.map((exercise, index) => {
              const setsDone = todayLogFor(logsByExercise.get(exercise.id) ?? [], todayKey)?.reps.length ?? 0
              const finished = setsDone >= exercise.sets
              return (
                <li key={exercise.id}>
                  <button
                    type="button"
                    aria-current={index === step ? 'step' : undefined}
                    aria-label={finished ? `Listo, ${exercise.name}` : undefined}
                    onClick={() => setStep(index)}
                  >
                    <span className={finished ? 'mark done' : 'mark'}>
                      {finished ? <IconCheck /> : setsDone > 0 ? `${setsDone}/${exercise.sets}` : index + 1}
                    </span>
                    {exercise.name}
                  </button>
                </li>
              )
            })}
          </ol>
        </>
      ) : null}

      {status === 'ready' && view === 'history' ? (
        <HistoryList exercises={exercises} logs={logs} onUpdate={updateLog} onDelete={deleteLog} />
      ) : null}

      <StudioLinks />
    </div>
  )
}
