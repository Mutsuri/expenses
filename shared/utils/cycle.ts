// รอบเดือนนับจากวันเงินเดือนออก
// วันเงินเดือนออก = วันที่ตั้งไว้ (เช่น 25) ถ้าตรงเสาร์-อาทิตย์หรือวันหยุด ให้เลื่อนไปวันทำการก่อนหน้า
// วันที่ทั้งหมดใช้รูปแบบ 'YYYY-MM-DD'

export interface CycleSettings {
  paydayDay: number
  holidays: string[]
}

export interface Cycle {
  /** 'YYYY-MM' ตามเดือนที่เงินเดือนออก */
  key: string
  /** วันเงินเดือนออก = วันแรกของรอบ */
  start: string
  /** วันก่อนเงินเดือนรอบถัดไปออก = วันสุดท้ายของรอบ */
  end: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!))
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
}

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** เงินเดือนเข้าบัญชีประมาณตี 3 ของวันเงินเดือนออก */
export const PAYDAY_HOUR = 3

/** วันที่ใช้เลือกรอบปัจจุบัน: ก่อนตี 3 ยังนับเป็นวันก่อน รอบใหม่จึงเริ่มตอนตี 3 */
export function cycleTodayISO(now = new Date()): string {
  return todayISO(new Date(now.getTime() - PAYDAY_HOUR * 3_600_000))
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((fromISO(toIso).getTime() - fromISO(fromIso).getTime()) / 86_400_000)
}

export function isWorkday(iso: string, holidays: ReadonlySet<string>): boolean {
  const dow = fromISO(iso).getUTCDay()
  return dow !== 0 && dow !== 6 && !holidays.has(iso)
}

/** วันเงินเดือนออกจริงของเดือนนั้น (month: 1-12) */
export function paydayOf(year: number, month: number, s: CycleSettings): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const holidays = new Set(s.holidays)
  let iso = `${year}-${pad(month)}-${pad(Math.min(s.paydayDay, lastDay))}`
  while (!isWorkday(iso, holidays)) iso = addDays(iso, -1)
  return iso
}

function shiftMonth(year: number, month: number, by: number): [number, number] {
  const idx = year * 12 + (month - 1) + by
  return [Math.floor(idx / 12), (idx % 12) + 1]
}

export function cycleByKey(key: string, s: CycleSettings): Cycle {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const [ny, nm] = shiftMonth(y, m, 1)
  return { key, start: paydayOf(y, m, s), end: addDays(paydayOf(ny, nm, s), -1) }
}

/** รอบที่วันนี้อยู่ */
export function cycleOf(iso: string, s: CycleSettings): Cycle {
  const [y, m] = iso.split('-').map(Number) as [number, number]
  const [cy, cm] = iso >= paydayOf(y, m, s) ? [y, m] : shiftMonth(y, m, -1)
  return cycleByKey(`${cy}-${pad(cm)}`, s)
}

export function shiftCycle(key: string, by: number, s: CycleSettings): Cycle {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const [ny, nm] = shiftMonth(y, m, by)
  return cycleByKey(`${ny}-${pad(nm)}`, s)
}
