import type { TxType } from './categories'
import type { Cycle } from './cycle'

export interface Account {
  id: string
  bankId: string
  name: string
  /** เลขบัญชี 4 ตัวท้าย (ไม่บังคับ) */
  last4: string
  /** ยอดเงินตอนเริ่มใช้แอป (สตางค์) */
  openingBalance: number
  createdAt: number
}

export interface Transaction {
  id: string
  accountId: string
  type: TxType
  /** สตางค์ เป็นบวกเสมอ */
  amount: number
  category: string
  date: string
  note: string
  createdAt: number
}

export interface CycleSummary {
  income: number
  expense: number
  net: number
  /** ยอดคงเหลือ ณ วันสุดท้ายของรอบ */
  closing: number
  byCategory: { type: TxType; category: string; amount: number }[]
}

const signed = (t: Transaction) => (t.type === 'income' ? t.amount : -t.amount)

export function balanceOf(account: Account, txs: Transaction[], upTo?: string): number {
  let total = account.openingBalance
  for (const t of txs) {
    if (t.accountId === account.id && (!upTo || t.date <= upTo)) total += signed(t)
  }
  return total
}

export function inCycle(txs: Transaction[], c: Cycle): Transaction[] {
  return txs.filter((t) => t.date >= c.start && t.date <= c.end)
}

export function summarize(txs: Transaction[], closing: number): CycleSummary {
  let income = 0
  let expense = 0
  const cats = new Map<string, { type: TxType; category: string; amount: number }>()
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
    const key = `${t.type}:${t.category}`
    const row = cats.get(key) ?? { type: t.type, category: t.category, amount: 0 }
    row.amount += t.amount
    cats.set(key, row)
  }
  const byCategory = [...cats.values()].sort((a, b) => b.amount - a.amount)
  return { income, expense, net: income - expense, closing, byCategory }
}

/** จัดกลุ่มรายการตามวัน ใหม่สุดก่อน */
export function groupByDay(txs: Transaction[]): { date: string; items: Transaction[]; net: number }[] {
  const sorted = [...txs].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
  const groups: { date: string; items: Transaction[]; net: number }[] = []
  for (const t of sorted) {
    let g = groups[groups.length - 1]
    if (!g || g.date !== t.date) groups.push((g = { date: t.date, items: [], net: 0 }))
    g.items.push(t)
    g.net += signed(t)
  }
  return groups
}
