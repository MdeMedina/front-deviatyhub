import {
  NO_DATA,
  formatCount,
  formatRate,
  formatResponseTime,
  formatTrend,
} from '@/lib/utils/metrics-format'

describe('Metrics formatting — nunca inventa datos', () => {
  it('successfully shows a dash instead of a plausible-looking number when there is no data', () => {
    expect(formatResponseTime(null)).toBe(NO_DATA)
    expect(formatResponseTime(undefined)).toBe(NO_DATA)
    expect(formatRate(null)).toBe(NO_DATA)
    expect(formatCount(undefined)).toBe(NO_DATA)
  })

  it('successfully distinguishes a real zero from missing data', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatRate(0)).toBe('0%')
  })

  it('successfully formats response times with the Spanish decimal comma', () => {
    expect(formatResponseTime(850)).toBe('850ms')
    expect(formatResponseTime(8500)).toBe('8,5s')
    expect(formatResponseTime(1200)).toBe('1,2s')
  })

  it('successfully converts a 0..1 rate into a percentage', () => {
    expect(formatRate(0.78)).toBe('78%')
    expect(formatRate(1)).toBe('100%')
  })

  it('successfully returns no trend when there is nothing to compare against', () => {
    expect(formatTrend(null)).toBeNull()
    expect(formatTrend(undefined)).toBeNull()
  })

  it('successfully signs trends and marks growth as positive by default', () => {
    expect(formatTrend(12.35)).toEqual({ label: '+12,4%', positive: true })
    expect(formatTrend(-4.8)).toEqual({ label: '−4,8%', positive: false })
  })

  it('successfully inverts the polarity for metrics where dropping is good', () => {
    // Bajar el tiempo de respuesta o las derivaciones a humano es una mejora.
    expect(formatTrend(-14.2, { lowerIsBetter: true })).toEqual({ label: '−14,2%', positive: true })
    expect(formatTrend(10.2, { lowerIsBetter: true })).toEqual({ label: '+10,2%', positive: false })
  })
})
