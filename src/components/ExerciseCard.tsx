import { useState } from 'react'
import { IconReps, IconSets } from './Icons'
import { LOAD_META, coaching, loadLabel, localDateKey, parseLoad, repRange } from '../progression'
import type { Draft, Exercise, WorkoutLog } from '../types'

type Props = {
  exercise: Exercise
  logs: WorkoutLog[]
  step: number
  total: number
  draft?: Draft
  onDraft: (draft: Draft) => void
  onSave: (load: string, reps: number[]) => Promise<void>
  onPrevious: () => void
  onNext: () => void
}

export function ExerciseCard({ exercise, logs, step, total, draft, onDraft, onSave, onPrevious, onNext }: Props) {
  const todayKey = localDateKey(new Date().toISOString())
  const todayLog = [...logs].reverse().find((log) => localDateKey(log.logged_at) === todayKey)
  const last = [...logs].reverse().find((log) => log.id !== todayLog?.id)
  const meta = LOAD_META[exercise.load_type]
  const advice = coaching(exercise, logs.filter((log) => log.id !== todayLog?.id))
  const hasDraft = draft != null && draft.reps.length === exercise.sets
  const [load, setLoad] = useState(hasDraft ? draft.load : (todayLog?.load ?? last?.load ?? ''))
  const [reps, setReps] = useState(() =>
    hasDraft
      ? [...draft.reps]
      : Array.from({ length: exercise.sets }, (_, index) => (todayLog ? String(todayLog.reps[index] ?? '') : '')),
  )
  const [saving, setSaving] = useState(false)
  const [savedNote, setSavedNote] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const remember = (nextLoad: string, nextReps: string[]) => {
    setSavedNote(false)
    onDraft({ load: nextLoad, reps: nextReps })
  }

  const save = async () => {
    const trimmed = load.trim()
    const firstEmpty = reps.findIndex((rep) => rep === '')
    const filledCount = firstEmpty === -1 ? reps.length : firstEmpty
    const hasGap = firstEmpty !== -1 && reps.slice(firstEmpty + 1).some((rep) => rep !== '')

    if (!trimmed) {
      setMessage('Indicá la carga.')
      return
    }
    if (meta.numeric && parseLoad(trimmed) == null) {
      setMessage('La carga va en números. Por ejemplo, 40.')
      return
    }
    if (filledCount === 0) {
      setMessage('Indicá las repeticiones de al menos una serie.')
      return
    }
    if (hasGap) {
      setMessage(`La serie ${firstEmpty + 1} está vacía. Llénala, o borra las que van después, para guardar.`)
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      await onSave(
        trimmed,
        reps.slice(0, filledCount).map((rep) => Number.parseInt(rep, 10)),
      )
      setSavedNote(true)
      onDraft({ load: trimmed, reps })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="card">
      <p className="step">
        Ejercicio {step + 1} de {total}
      </p>
      <h2>{exercise.name}</h2>
      <div className="prescription">
        <p>
          <span className="mark">
            <IconSets />
          </span>
          <span>Series</span>
          <strong>{exercise.sets}</strong>
        </p>
        <p>
          <span className="mark">
            <IconReps />
          </span>
          <span>Repeticiones</span>
          <strong>{repRange(exercise)}</strong>
        </p>
      </div>
      {logs.some((log) => log.id !== todayLog?.id) || logs.length === 0 ? (
        <p className={`advice ${advice.tone}`}>{advice.text}</p>
      ) : null}

      <label className="field">
        <span>{loadLabel(exercise.load_type)}</span>
        <input
          value={load}
          inputMode={meta.numeric ? 'decimal' : 'text'}
          placeholder={meta.numeric ? 'Ejemplo: 40' : meta.placeholder}
          onChange={(event) => {
            setLoad(event.target.value)
            remember(event.target.value, reps)
          }}
        />
      </label>
      <p className="same-weight">La misma carga para todas las series.</p>

      <div className="sets">
        {reps.map((rep, index) => (
          <label className="field rep-line" key={index}>
            <span>Serie {index + 1}</span>
            <input
              value={rep}
              inputMode="numeric"
              maxLength={2}
              placeholder="Repeticiones"
              aria-label={`Serie ${index + 1}`}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
                const next = reps.map((value, repIndex) => (repIndex === index ? digits : value))
                setReps(next)
                remember(load, next)
              }}
            />
          </label>
        ))}
      </div>

      <button className="save" type="button" disabled={saving} onClick={() => void save()}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      {savedNote ? <p className="saved-note">Guardado. Podés corregir cualquier serie.</p> : null}
      {message ? <p className="form-error">{message}</p> : null}

      <div className="nav">
        <button type="button" className="ghost" onClick={onPrevious} disabled={step === 0}>
          Anterior
        </button>
        <button type="button" className="ghost" onClick={onNext} disabled={step === total - 1}>
          Siguiente
        </button>
      </div>
    </article>
  )
}
