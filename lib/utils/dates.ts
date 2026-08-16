import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns'

/**
 * Calculates the start and end date string (YYYY-MM-DD) for a given view and reference date.
 */
export const getDateRange = (view: 'day' | 'week' | 'month', date: Date) => {
  let from: Date
  let to: Date

  if (view === 'day') {
    from = startOfDay(date)
    to = endOfDay(date)
  } else if (view === 'week') {
    from = startOfWeek(date, { weekStartsOn: 1 }) // Monday start
    to = endOfWeek(date, { weekStartsOn: 1 })
  } else {
    from = startOfMonth(date)
    to = endOfMonth(date)
  }

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

/**
 * Format helper for headers
 */
export const getRangeLabel = (view: 'day' | 'week' | 'month', date: Date): string => {
  if (view === 'day') {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy")
  } else if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'd')} - ${format(end, "d 'de' MMMM 'de' yyyy")}`
    }
    return `${format(start, "d 'de' MMMM")} - ${format(end, "d 'de' MMMM 'de' yyyy")}`
  } else {
    return format(date, "MMMM 'de' yyyy")
  }
}
