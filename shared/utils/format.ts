// เงินเก็บเป็นสตางค์ (จำนวนเต็ม) กันทศนิยมเพี้ยน
import { fromISO } from './cycle'

const money = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyShort = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 })

export function formatMoney(satang: number, opts: { sign?: boolean; short?: boolean } = {}): string {
  const fmt = opts.short ? moneyShort : money
  const text = fmt.format(Math.abs(satang) / 100)
  if (satang < 0) return `-${text}`
  return opts.sign && satang > 0 ? `+${text}` : text
}

const moneyCompact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
/** ป้ายสั้นบนกราฟ: 2255000 สตางค์ → '22.6K' */
export const formatMoneyCompact = (satang: number) => moneyCompact.format(satang / 100)

/** '1,234.50' → 123450 สตางค์ หรือ null ถ้าไม่ใช่ตัวเลข */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/[,\s฿]/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null
  return Math.round(Number(clean) * 100)
}

const dayFmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const dayYearFmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' })
const weekdayFmt = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('th-TH', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const monthLongFmt = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatDay = (iso: string) => dayFmt.format(fromISO(iso))
export const formatDayYear = (iso: string) => dayYearFmt.format(fromISO(iso))
export const formatWeekday = (iso: string) => weekdayFmt.format(fromISO(iso))
const weekdayYearFmt = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
/** 'วันพุธที่ 25 พฤศจิกายน 2569' */
export const formatWeekdayYear = (iso: string) => weekdayYearFmt.format(fromISO(iso))
/** '2026-10' → 'ต.ค. 69' */
export const formatCycleShort = (key: string) => monthFmt.format(fromISO(`${key}-01`))
/** '2026-10' → 'ตุลาคม 2569' */
export const formatCycleLong = (key: string) => monthLongFmt.format(fromISO(`${key}-01`))
