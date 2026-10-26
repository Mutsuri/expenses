import { TRANSFER_IN, TRANSFER_OUT, type TxType } from './categories'
import type { Cycle } from './cycle'

export interface Account {
  id: string
  bankId: string
  name: string
  /** เลขบัญชี 4 ตัวท้าย (ไม่บังคับ) */
  last4: string
  /** ยอดเงินตอนเริ่มใช้แอป (สตางค์) */
  openingBalance: number
  /** บัญชีรับเงินเดือน (มีได้บัญชีเดียว) */
  salary?: boolean
  createdAt: number
  /** เวลาแก้ไขล่าสุด ใช้ตัดสินตอน sync */
  updatedAt: number
}

/** โอนระหว่างบัญชีของตัวเอง ไม่นับเป็นรายรับหรือรายจ่าย */
export type TxKind = TxType | 'transfer'

export interface Transaction {
  id: string
  /** บัญชีของรายการ (ถ้าเป็นการโอน คือบัญชีต้นทาง) */
  accountId: string
  /** บัญชีปลายทาง เฉพาะการโอน */
  toAccountId?: string
  type: TxKind
  /** สตางค์ เป็นบวกเสมอ */
  amount: number
  category: string
  date: string
  note: string
  createdAt: number
  updatedAt: number
}

export interface CycleSummary {
  /** รวมเงินที่รับโอนมาจากบัญชีอื่น */
  income: number
  /** รวมเงินที่โอนออกไปบัญชีอื่น */
  expense: number
  /** รายรับ − รายจ่าย */
  net: number
  /** ยอดคงเหลือ ณ วันสุดท้ายของรอบ */
  closing: number
  byCategory: { type: TxType; category: string; amount: number }[]
}

/** รายการนี้เกี่ยวกับบัญชีนี้ไหม (รวมเป็นปลายทางการโอน) */
export const involves = (t: Transaction, accountId: string) => t.accountId === accountId || t.toAccountId === accountId

/** เงินเข้า (+) หรือออก (−) ของบัญชีนี้จากรายการนี้ */
export function signedFor(t: Transaction, accountId: string): number {
  if (t.type === 'transfer') {
    if (t.accountId === accountId) return -t.amount
    if (t.toAccountId === accountId) return t.amount
    return 0
  }
  if (t.accountId !== accountId) return 0
  return t.type === 'income' ? t.amount : -t.amount
}

export function balanceOf(account: Account, txs: Transaction[], upTo?: string): number {
  let total = account.openingBalance
  for (const t of txs) {
    if (!upTo || t.date <= upTo) total += signedFor(t, account.id)
  }
  return total
}

export function inCycle(txs: Transaction[], c: Cycle): Transaction[] {
  return txs.filter((t) => t.date >= c.start && t.date <= c.end)
}

/**
 * สรุปรายการ ถ้าใส่ accountId จะคิดการโอนจากมุมของบัญชีนั้น:
 * รับโอนเข้า = รายรับ (หมวด TRANSFER_IN หรือ 'salary' ถ้าโอนมาจากบัญชีรับเงินเดือน),
 * โอนออก = รายจ่าย (หมวด TRANSFER_OUT)
 */
export function summarize(
  txs: Transaction[],
  closing: number,
  accountId?: string,
  salaryIds: ReadonlySet<string> = new Set(),
): CycleSummary {
  let income = 0
  let expense = 0
  const cats = new Map<string, { type: TxType; category: string; amount: number }>()
  const addCat = (type: TxType, category: string, amount: number) => {
    const key = `${type}:${category}`
    const row = cats.get(key) ?? { type, category, amount: 0 }
    row.amount += amount
    cats.set(key, row)
  }
  for (const t of txs) {
    if (t.type === 'transfer') {
      if (!accountId) continue
      if (t.accountId === accountId) {
        expense += t.amount
        addCat('expense', TRANSFER_OUT, t.amount)
      } else if (t.toAccountId === accountId) {
        income += t.amount
        addCat('income', salaryIds.has(t.accountId) ? 'salary' : TRANSFER_IN, t.amount)
      }
      continue
    }
    if (accountId && t.accountId !== accountId) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
    addCat(t.type, t.category, t.amount)
  }
  const byCategory = [...cats.values()].sort((a, b) => b.amount - a.amount)
  return { income, expense, net: income - expense, closing, byCategory }
}

/** จัดกลุ่มรายการตามวัน ใหม่สุดก่อน ยอดสุทธิคิดจากมุมของบัญชี accountId */
export function groupByDay(txs: Transaction[], accountId: string): { date: string; items: Transaction[]; net: number }[] {
  const sorted = [...txs].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
  const groups: { date: string; items: Transaction[]; net: number }[] = []
  for (const t of sorted) {
    let g = groups[groups.length - 1]
    if (!g || g.date !== t.date) groups.push((g = { date: t.date, items: [], net: 0 }))
    g.items.push(t)
    g.net += signedFor(t, accountId)
  }
  return groups
}

export interface AccountOverview {
  account: Account
  /** รับ/จ่ายของบัญชีนี้ในรอบ (รวมเงินโอนเข้า-ออก) */
  summary: CycleSummary
}

/**
 * ภาพรวมทุกบัญชีในรอบเดียวกัน
 * แต่ละบัญชีนับเงินโอนเข้า-ออกด้วย ส่วนยอดรวมไม่นับการโอนระหว่างบัญชีของตัวเอง (ไม่ให้นับซ้ำ)
 */
export function overview(
  accounts: Account[],
  txs: Transaction[],
  c: Cycle,
  salaryIds: ReadonlySet<string> = new Set(),
): { rows: AccountOverview[]; total: CycleSummary } {
  const cycleTxs = inCycle(txs, c)
  const rows = accounts.map((account) => {
    const mine = txs.filter((t) => involves(t, account.id))
    return { account, summary: summarize(inCycle(mine, c), balanceOf(account, mine, c.end), account.id, salaryIds) }
  })
  const totalClosing = rows.reduce((s, r) => s + r.summary.closing, 0)
  return { rows, total: summarize(cycleTxs, totalClosing) }
}
