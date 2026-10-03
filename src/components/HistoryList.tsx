import { useState } from 'react'
import {
  LOAD_META,
  compareLogs,
  formatDay,
  groupByLocalDay,
  loadLabel,
  localDateKey,
  parseLoad,
} from '../progression'
import type { Exercise, WorkoutLog } from '../types'

type Props = {
  exercises: Exercise[]
  logs: WorkoutLog[]
  onUpdate: (id: string, load: string, reps: number[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function HistoryList({ exercises, logs, onUpdate, onDelete }: Props) {
  const todayKey = localDateKey(new Date().toISOString())
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const days = groupByLocalDay(logs)

  if (days.length === 0) {
    return (
      <p className="status-line">
        Aún no hay registros.
      </p>
    )
  }

  return (
    <div className="day-list">
      {days.map(([key, entries]) => {
        const ordered = [...entries].sort((a, b) => {
          const left = byId.get(a.exercise_id)?.sort_order ?? 0
          const right = byId.get(b.exercise_id)?.sort_order ?? 0
          return left - right
        })
        return (
          <section key={key} className="day-sheet">
            <h2>{dayTitle(key, entries[0].logged_at, todayKey)}</h2>
            <table className="log-table">
              <thead>
                <tr>
                  <th>Ejercicio</th>
                  <th>Peso</th>
                  <th>Series</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((entry) => {
                  const exercise = byId.get(entry.exercise_id)
                  if (!exercise) return null
                  const sameExercise = logs.filter((log) => log.exercise_id === entry.exercise_id)
                  const index = sameExercise.findIndex((log) => log.id === entry.id)
                  const change = compareLogs(sameExercise[index - 1], entry, exercise)
                  return (
                    <HistoryEntry
                      key={entry.id}
                      exercise={exercise}
                      log={entry}
                      note={change && change.tone === 'up' ? change.label : null}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  )
                })}
              </tbody>
            </table>
          </section>
        )
      })}
    </div>
  )
}

function dayTitle(key: string, iso: string, todayKey: string) {
  if (key === todayKey) return 'Hoy'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === localDateKey(yesterday.toISOString())) return 'Ayer'
  const label = formatDay(iso)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function HistoryEntry({
  exercise,
  log,
  note,
  onUpdate,
  onDelete,
}: {
  exercise: Exercise
  log: WorkoutLog
  note: string | null
  onUpdate: (id: string, load: string, reps: number[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const meta = LOAD_META[exercise.load_type]
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [load, setLoad] = useState(log.load)
  const [reps, setReps] = useState(log.reps.map(String))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (editing) {
    return (
      <tr className="log-edit">
        <td colSpan={3}>
        <p className="log-name">{exercise.name}</p>
        <label className="field">
          <span>{loadLabel(exercise.load_type)}</span>
          <input
            value={load}
            inputMode={meta.numeric ? 'decimal' : 'text'}
            onChange={(event) => setLoad(event.target.value)}
          />
        </label>
        {reps.map((rep, index) => (
          <label className="field rep-line" key={index}>
            <span>Serie {index + 1}</span>
            <input
              value={rep}
              inputMode="numeric"
              maxLength={2}
              aria-label={`Serie ${index + 1}`}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
                setReps(reps.map((value, repIndex) => (repIndex === index ? digits : value)))
              }}
            />
          </label>
        ))}
        <button
          className="save"
          type="button"
          disabled={busy}
          onClick={() => {
            const trimmed = load.trim()
            if (!trimmed || reps.some((rep) => rep === '')) {
              setMessage('Falta el peso o alguna serie.')
              return
            }
            if (meta.numeric && parseLoad(trimmed) == null) {
              setMessage('Escribe el peso en números. Por ejemplo, 40.')
              return
            }
            setBusy(true)
            setMessage(null)
            void onUpdate(log.id, trimmed, reps.map((rep) => Number.parseInt(rep, 10)))
              .then(() => setEditing(false))
              .catch((error: unknown) => {
                setMessage(error instanceof Error ? error.message : 'No se pudo guardar')
              })
              .finally(() => setBusy(false))
          }}
        >
          Guardar corrección
        </button>
        {message ? <p className="form-error">{message}</p> : null}
        <button type="button" className="text-button" onClick={() => setEditing(false)}>
          Volver
        </button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>
        <span className="log-name">{exercise.name}</span>
        <span className="log-meta">Día {exercise.day}</span>
        {note ? <span className="note">{note}</span> : null}
      {confirming ? (
        <div className="quiet-actions log-actions">
          <button
            type="button"
            className="danger-text"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void onDelete(log.id).catch((error: unknown) => {
                setBusy(false)
                setMessage(error instanceof Error ? error.message : 'No se pudo quitar')
              })
            }}
          >
            Sí, quitarla
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            No
          </button>
        </div>
      ) : (
        <div className="quiet-actions log-actions">
          <button type="button" onClick={() => setEditing(true)}>
            Corregir
          </button>
          <button type="button" className="danger-text" onClick={() => setConfirming(true)}>
            Quitar
          </button>
        </div>
      )}
      {message ? <p className="form-error">{message}</p> : null}
      </td>
      <td className="num">{LOAD_META[exercise.load_type].short(log.load)}</td>
      <td className="num">{log.reps.join(' · ')}</td>
    </tr>
  )
}
