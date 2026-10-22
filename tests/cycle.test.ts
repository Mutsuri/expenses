import { describe, expect, it } from 'vitest'
import { cycleOf, cycleTodayISO, paydayOf, shiftCycle } from '../shared/utils/cycle'
import { DEFAULT_HOLIDAYS } from '../shared/utils/holidays'

const s = { paydayDay: 25, holidays: DEFAULT_HOLIDAYS }
const noHolidays = { paydayDay: 25, holidays: [] }

describe('paydayOf', () => {
  it('keeps the 25th on a weekday', () => {
    expect(paydayOf(2026, 11, s)).toBe('2026-11-25') // พุธ
  })

  it('moves Sunday back to Friday', () => {
    expect(paydayOf(2026, 10, noHolidays)).toBe('2026-10-23')
  })

  it('moves Saturday back to Friday', () => {
    expect(paydayOf(2026, 4, noHolidays)).toBe('2026-04-24')
  })

  it('skips a holiday on the Friday too', () => {
    // 25 ต.ค. 69 = อาทิตย์, 23 ต.ค. = วันปิยมหาราช → พฤหัส 22
    expect(paydayOf(2026, 10, s)).toBe('2026-10-22')
  })

  it('clamps to the last day of short months', () => {
    expect(paydayOf(2026, 2, { paydayDay: 31, holidays: [] })).toBe('2026-02-27') // 28 = เสาร์
  })
})

describe('cycleOf', () => {
  it('starts on payday and ends the day before the next one', () => {
    expect(cycleOf('2026-10-22', s)).toEqual({ key: '2026-10', start: '2026-10-22', end: '2026-11-24' })
  })

  it('puts the day before payday in the previous cycle', () => {
    expect(cycleOf('2026-10-21', s).key).toBe('2026-09')
  })

  it('wraps across the year', () => {
    expect(cycleOf('2027-01-10', s).key).toBe('2026-12')
    expect(shiftCycle('2026-12', 1, s).key).toBe('2027-01')
    expect(shiftCycle('2027-01', -1, s).key).toBe('2026-12')
  })
})

describe('cycleTodayISO', () => {
  // เวลาท้องถิ่นของเครื่อง
  const at = (h: number, m = 0) => new Date(2026, 9, 22, h, m)

  it('switches to the new cycle at 3am on payday', () => {
    expect(cycleOf(cycleTodayISO(at(2, 59)), s).key).toBe('2026-09')
    expect(cycleOf(cycleTodayISO(at(3, 0)), s).key).toBe('2026-10')
  })
})
