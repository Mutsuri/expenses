// รอบบิลบัตรเครดิต: สรุปยอดทุกวันที่ 25 (รวมรายการวันที่ 25) ชำระได้ตั้งแต่วันที่ 26 ถึงวันที่ 15 ของเดือนถัดไป
// เงินที่ชำระหักบิลที่สรุปแล้วก่อน ส่วนที่เกินหักยอดรอบปัจจุบัน (จ่ายครบ = ยอดเป็น 0)

import { CARD_FUND, CARD_PAY } from './categories'
import { addDays } from './cycle'
import { cardDebt, isCardPay, type Account, type Transaction } from './stats'

export const STATEMENT_DAY = 25
export const DUE_DAY = 15

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)

/** วันสรุปยอดล่าสุดที่ปิดไปแล้ว (วันที่ 25 เองยังเป็นรอบที่กำลังใช้) */
export function lastStatement(today: string): string {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number]
  return iso(y, d > STATEMENT_DAY ? m - 1 : m - 2, STATEMENT_DAY)
}

/** หมวดของรายการชำระบัตรใหม่ วันที่ date: จ่ายบิลที่สรุปแล้วถ้ายังค้าง ไม่งั้นนับเป็นจ่ายล่วงหน้าของรอบที่กำลังใช้ */
export function cardPayCategory(card: Account, txs: Transaction[], date: string): string {
  const b = cardBill(card, txs, date)
  return `${CARD_PAY}@${b.due > 0 ? b.statement : b.periodEnd}`
}

/** หมวดของเงินที่โอนมาเพื่อจ่ายบัตร: บิลเดียวกับที่การชำระวันนั้นจะไปจ่าย (ทุกบัตรใช้วันสรุปยอดเดียวกัน) */
export function cardFundCategory(cards: Account[], txs: Transaction[], date: string): string {
  const bills = cards.map((c) => cardBill(c, txs, date))
  const statement = bills.some((b) => b.due > 0) ? lastStatement(date) : (bills[0]?.periodEnd ?? lastStatement(date))
  return `${CARD_FUND}@${statement}`
}

export interface CardBill {
  /** บิลที่สรุปแล้ว: วันสรุปยอด, วันครบกำหนด, ยอดที่ยังต้องชำระ */
  statement: string
  dueDate: string
  due: number
  /** บิลนี้มียอดให้ชำระไหม (ใช้บอกว่า "ชำระครบแล้ว") */
  billed: boolean
  /** รอบที่กำลังใช้ (ยังไม่สรุป): ช่วงวันที่ และยอดที่ยังไม่ได้ชำระ */
  periodStart: string
  periodEnd: string
  nextDueDate: string
  current: number
}

export function cardBill(card: Account, txs: Transaction[], today: string): CardBill {
  const statement = lastStatement(today)
  const [y, m] = statement.split('-').map(Number) as [number, number]
  const mine = txs.filter((t) => t.accountId === card.id || t.toAccountId === card.id)
  const atStatement = cardDebt(card, mine, statement)
  const paidSince = mine.filter((t) => isCardPay(t) && t.toAccountId === card.id && t.date > statement && t.date <= today).reduce((s, t) => s + t.amount, 0)
  const due = Math.max(0, atStatement - paidSince)
  const now = cardDebt(card, mine, today)
  return {
    statement,
    dueDate: iso(y, m, DUE_DAY),
    due,
    billed: atStatement > 0,
    periodStart: addDays(statement, 1),
    periodEnd: iso(y, m, STATEMENT_DAY),
    nextDueDate: iso(y, m + 1, DUE_DAY),
    current: Math.max(0, now - due),
  }
}
