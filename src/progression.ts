import type { Exercise, LoadType, WorkoutLog } from './types'

export const LOAD_META: Record<
  LoadType,
  { placeholder: string; unit: string; numeric: boolean; short: (value: string) => string }
> = {
  lb: { placeholder: 'Peso', unit: 'lb', numeric: true, short: (value) => `${value} lb` },
  lbcu: {
    placeholder: 'Peso',
    unit: 'lb c/u · reps por pierna',
    numeric: true,
    short: (value) => `${value} lb c/u`,
  },
  variante: { placeholder: 'Ejemplo: rodillas', unit: 'Variante', numeric: false, short: (value) => value },
  banda: {
    placeholder: 'Ejemplo: roja',
    unit: 'Banda (color o tensión)',
    numeric: false,
    short: (value) => `Banda ${value}`,
  },
  dips: {
    placeholder: 'Ejemplo: peso del cuerpo',
    unit: 'Asistencia, BW o peso adicional',
    numeric: false,
    short: (value) => value,
  },
}

export function parseLoad(value: string) {
  const number = Number.parseFloat(value.replace(',', '.'))
  return Number.isNaN(number) ? null : number
}

export function repRange(exercise: Exercise) {
  return exercise.rep_min === exercise.rep_max
    ? String(exercise.rep_min)
    : `${exercise.rep_min}–${exercise.rep_max}`
}

export function formatReps(reps: number[]) {
  if (reps.length <= 1) return reps.join('')
  return `${reps.slice(0, -1).join(', ')} y ${reps[reps.length - 1]}`
}

export function describeLoad(type: LoadType, value: string) {
  if (type === 'lb') return `${value} libras`
  if (type === 'lbcu') return `${value} libras de cada lado`
  if (type === 'banda') return `Banda ${value}`
  return value
}

export function loadLabel(type: LoadType) {
  if (type === 'lb') return 'Peso en libras'
  if (type === 'lbcu') return 'Libras de cada lado'
  if (type === 'banda') return 'Color o tensión de la banda'
  if (type === 'dips') return 'Peso del cuerpo, ayuda o libras extra'
  return 'Cómo lo hiciste'
}

export function localDateKey(iso: string) {
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

export function compareLogs(previous: WorkoutLog | undefined, current: WorkoutLog, exercise: Exercise) {
  if (!previous) return null
  const meta = LOAD_META[exercise.load_type]

  if (meta.numeric) {
    const before = parseLoad(previous.load)
    const after = parseLoad(current.load)
    if (before != null && after != null && after > before) return { tone: 'up' as const, label: 'Aumentó la carga' }
    if (before != null && after != null && after < before) return { tone: 'eq' as const, label: 'Disminuyó la carga' }
  } else if (previous.load.trim().toLowerCase() !== current.load.trim().toLowerCase()) {
    return { tone: 'up' as const, label: 'Cambió la ejecución' }
  }

  const better =
    previous.reps.length === current.reps.length
      ? sum(current.reps) > sum(previous.reps)
      : sum(current.reps) / current.reps.length > sum(previous.reps) / previous.reps.length

  if (better) return { tone: 'up' as const, label: 'Más repeticiones' }
  return { tone: 'eq' as const, label: 'Misma marca' }
}

export function coaching(exercise: Exercise, logs: WorkoutLog[]) {
  const meta = LOAD_META[exercise.load_type]
  const range =
    exercise.rep_min === exercise.rep_max
      ? `${exercise.rep_min}`
      : `${exercise.rep_min} a ${exercise.rep_max}`

  if (logs.length === 0) {
    return {
      tone: 'idle' as const,
      text: `Elegí una carga para ${range} repeticiones, manteniendo la técnica.`,
    }
  }

  const last = logs[logs.length - 1]
  const done = `${describeLoad(exercise.load_type, last.load)}, ${formatReps(last.reps)} repeticiones`
  const toppedOut = last.reps.every((rep) => rep >= exercise.rep_max)

  if (toppedOut) {
    const next = meta.numeric
      ? 'Aumentá un poco la carga. Es normal bajar algunas repeticiones.'
      : 'Probá una variante un poco más exigente.'
    return { tone: 'up' as const, text: `Sesión anterior: ${done}. ${next}` }
  }

  return {
    tone: 'hold' as const,
    text: `Sesión anterior: ${done}. Mantené la carga y buscá más repeticiones.`,
  }
}

export function groupByLocalDay(logs: WorkoutLog[]) {
  const groups = new Map<string, WorkoutLog[]>()
  for (const log of logs) {
    const key = localDateKey(log.logged_at)
    const list = groups.get(key)
    if (list) list.push(log)
    else groups.set(key, [log])
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1))
}
