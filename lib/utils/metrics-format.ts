/**
 * Formato de métricas para la UI.
 *
 * Regla de oro: si el backend no tiene el dato, se muestra un guion. Nunca un
 * número de relleno: un valor inventado que parece real es peor que un hueco,
 * porque nadie lo cuestiona.
 */

export const NO_DATA = '—'

/** Milisegundos a texto legible. null -> guion. */
export function formatResponseTime(ms: number | null | undefined): string {
  if (ms == null) return NO_DATA
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`.replace('.', ',')
}

/** Tasa 0..1 a porcentaje. null -> guion. */
export function formatRate(rate: number | null | undefined): string {
  if (rate == null) return NO_DATA
  return `${Math.round(rate * 100)}%`
}

/** Entero simple. null/undefined -> guion (no 0: "cero" y "sin dato" no son lo mismo). */
export function formatCount(value: number | null | undefined): string {
  if (value == null) return NO_DATA
  return String(value)
}

export interface TrendDisplay {
  /** Etiqueta ya formateada, con signo y coma decimal. */
  label: string
  /** true si el cambio es favorable para el negocio. */
  positive: boolean
}

/**
 * Convierte la variación porcentual en algo mostrable.
 *
 * `lowerIsBetter` marca las métricas donde bajar es bueno (tiempo de respuesta,
 * derivaciones a humano, cancelaciones). Devuelve null si no hay comparación
 * posible, y en ese caso no debe pintarse ninguna tendencia.
 */
export function formatTrend(
  pct: number | null | undefined,
  options: { lowerIsBetter?: boolean } = {}
): TrendDisplay | null {
  if (pct == null || !Number.isFinite(pct)) return null

  const rounded = Math.round(pct * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  const label = `${sign}${Math.abs(rounded).toFixed(1).replace('.', ',')}%`

  const positive = rounded === 0 ? true : options.lowerIsBetter ? rounded < 0 : rounded > 0

  return { label, positive }
}
