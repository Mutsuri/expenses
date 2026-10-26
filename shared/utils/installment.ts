// ผ่อนผ่านบัตรเครดิต: แบ่งยอดเป็นงวด ๆ ละรอบ แต่ละงวดเป็นรายการรายจ่ายธรรมดา
// งวดของแผนเดียวกันใช้ id รูปแบบ '<แผน>~<งวด>of<จำนวนงวด>' จึงไม่ต้องเพิ่มคอลัมน์ในชีต
import { cycleOf, shiftCycle, type CycleSettings } from './cycle'
import type { Transaction } from './stats'

export interface Installment {
  planId: string
  /** งวดที่ (เริ่มที่ 1) */
  no: number
  /** จำนวนงวดทั้งหมด */
  of: number
}

const ID = /^(.+)~(\d+)of(\d+)$/

export function installmentOf(id: string): Installment | null {
  const m = ID.exec(id)
  return m ? { planId: m[1]!, no: Number(m[2]), of: Number(m[3]) } : null
}

export const installmentLabel = (i: Installment) => `ผ่อน ${i.no}/${i.of}`

/**
 * แบ่งรายจ่ายเป็นงวดเท่า ๆ กัน งวดแรกวันที่ซื้อ งวดต่อไปวันแรกของรอบถัด ๆ ไป (รอบละงวด)
 * เศษสตางค์ที่หารไม่ลงตัวไปอยู่งวดแรก
 */
export function planInstallments(
  base: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  months: number,
  planId: string,
  settings: CycleSettings,
): Omit<Transaction, 'createdAt' | 'updatedAt'>[] {
  const each = Math.floor(base.amount / months)
  const first = cycleOf(base.date, settings).key
  const label = (no: number) => installmentLabel({ planId, no, of: months })
  return Array.from({ length: months }, (_, i) => ({
    ...base,
    id: `${planId}~${i + 1}of${months}`,
    amount: i === 0 ? base.amount - each * (months - 1) : each,
    date: i === 0 ? base.date : shiftCycle(first, i, settings).start,
    note: base.note ? `${base.note} (${label(i + 1)})` : label(i + 1),
  }))
}

export interface ActivePlan {
  planId: string
  /** โน้ตตอนซื้อ (ไม่มีวงเล็บงวด) */
  name: string
  category: string
  of: number
  /** งวดที่ถึงกำหนดแล้ว (วันที่ไม่เกินวันนี้) */
  paid: number
  /** ยอดงวดที่ยังไม่ถึง */
  remaining: number
}

/** แผนผ่อนของบัญชีนี้ที่ยังมีงวดเหลือ เรียงตามงวดที่เหลือน้อยก่อน */
export function activePlans(txs: Transaction[], accountId: string, today: string): ActivePlan[] {
  const plans = new Map<string, ActivePlan>()
  for (const t of txs) {
    const i = t.accountId === accountId ? installmentOf(t.id) : null
    if (!i) continue
    const p = plans.get(i.planId) ?? { planId: i.planId, name: '', category: t.category, of: i.of, paid: 0, remaining: 0 }
    if (i.no === 1) p.name = t.note.replace(/\s*\(ผ่อน \d+\/\d+\)$/, '').replace(/^ผ่อน \d+\/\d+$/, '')
    if (t.date <= today) p.paid++
    else p.remaining += t.amount
    plans.set(i.planId, p)
  }
  return [...plans.values()].filter((p) => p.remaining > 0).sort((a, b) => a.of - a.paid - (b.of - b.paid))
}
