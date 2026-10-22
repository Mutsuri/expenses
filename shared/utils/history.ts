// สรุปแต่ละรอบของบัญชี เงินคงเหลือยกไปรอบถัดไปอัตโนมัติ
// คงเหลือ = ยกมาจากรอบก่อน + ยอดเริ่มต้นบัญชี (เฉพาะรอบแรก) + รายรับ − รายจ่าย

import { cycleOf, shiftCycle, toISO, type Cycle, type CycleSettings } from './cycle'
import { inCycle, summarize, type Account, type CycleSummary, type Transaction } from './stats'

export interface CycleRow {
  cycle: Cycle
  /** คงเหลือของรอบก่อน */
  carriedIn: number
  /** ยอดเริ่มต้นบัญชี (มีเฉพาะรอบแรก) */
  starting: number
  summary: CycleSummary
}

/** ทุกรอบตั้งแต่รอบแรกของบัญชีจนถึงรอบที่ today อยู่ ใหม่สุดก่อน */
export function accountCycles(account: Account, all: Transaction[], s: CycleSettings, today: string): CycleRow[] {
  const txs = all.filter((t) => t.accountId === account.id)
  const current = cycleOf(today, s)
  const firstDate = txs.reduce((min, t) => (t.date < min ? t.date : min), toISO(new Date(account.createdAt)))
  let c = cycleOf(firstDate < today ? firstDate : today, s)

  const rows: CycleRow[] = []
  let carriedIn = 0
  for (let i = 0; c.key <= current.key && i < 240; i++, c = shiftCycle(c.key, 1, s)) {
    const starting = i === 0 ? account.openingBalance : 0
    const base = summarize(inCycle(txs, c), 0)
    const closing = carriedIn + starting + base.net
    rows.push({ cycle: c, carriedIn, starting, summary: { ...base, closing } })
    carriedIn = closing
  }
  return rows.reverse()
}
