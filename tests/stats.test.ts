import { describe, expect, it } from 'vitest'
import { parseMoney, formatMoney } from '../shared/utils/format'
import { balanceOf, groupByDay, groupCategoryOf, inOverview, overview, summarize, type Account, type Transaction } from '../shared/utils/stats'

const acc: Account = { id: 'a', bankId: 'kbank', name: 'หลัก', last4: '', openingBalance: 100_00, createdAt: 0, updatedAt: 0 }
const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(), accountId: 'a', type: 'expense', amount: 0, category: 'food', date: '2026-10-22', note: '', createdAt: 0, updatedAt: 0, ...p,
})

describe('money', () => {
  it('parses baht text into satang', () => {
    expect(parseMoney('1,234.5')).toBe(123450)
    expect(parseMoney('0.1')).toBe(10)
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('1.234')).toBeNull()
  })

  it('formats satang', () => {
    expect(formatMoney(123450)).toBe('1,234.50')
    expect(formatMoney(-500, { short: true })).toBe('-5')
    expect(formatMoney(100, { sign: true })).toBe('+1.00')
  })
})

describe('stats', () => {
  const txs = [
    tx({ type: 'income', amount: 30000_00, category: 'salary', date: '2026-10-22' }),
    tx({ amount: 120_00, date: '2026-10-23' }),
    tx({ amount: 80_00, date: '2026-10-23', category: 'travel' }),
    tx({ amount: 50_00, accountId: 'b' }),
  ]

  it('computes balance from the opening amount, only for this account', () => {
    expect(balanceOf(acc, txs)).toBe(100_00 + 30000_00 - 200_00)
    expect(balanceOf(acc, txs, '2026-10-22')).toBe(100_00 + 30000_00)
  })

  it('summarizes income, expense and categories', () => {
    const s = summarize(txs.slice(0, 3), 0)
    expect(s.income).toBe(30000_00)
    expect(s.expense).toBe(200_00)
    expect(s.net).toBe(29800_00)
    expect(s.byCategory.map((c) => c.category)).toEqual(['salary', 'food', 'travel'])
  })

  it('groups by day, newest first', () => {
    const g = groupByDay(txs.slice(0, 3), 'a')
    expect(g.map((d) => d.date)).toEqual(['2026-10-23', '2026-10-22'])
    expect(g[0]!.net).toBe(-200_00)
  })
})

describe('transfers', () => {
  const b: Account = { ...acc, id: 'b', openingBalance: 0 }
  const txs = [
    tx({ type: 'income', amount: 30000_00, category: 'salary' }),
    tx({ type: 'transfer', amount: 5000_00, category: 'transfer', toAccountId: 'b' }),
    tx({ accountId: 'b', amount: 300_00 }),
  ]

  it('moves money between accounts without changing the total', () => {
    expect(balanceOf(acc, txs)).toBe(100_00 + 30000_00 - 5000_00)
    expect(balanceOf(b, txs)).toBe(5000_00 - 300_00)
  })

  it('counts money received as income and money sent as expense', () => {
    const fromA = summarize(txs, 0, 'a')
    expect(fromA.income).toBe(30000_00)
    expect(fromA.expense).toBe(5000_00)
    expect(fromA.byCategory.map((c) => c.category)).toEqual(['salary', 'transfer-out'])
    const toB = summarize(txs, 0, 'b')
    expect(toB.income).toBe(5000_00)
    expect(toB.expense).toBe(300_00)
    expect(toB.byCategory.map((c) => c.category)).toEqual(['transfer-in', 'food'])
  })

  it('files money from the salary account under salary', () => {
    const toB = summarize(txs, 0, 'b', new Set(['a']))
    expect(toB.income).toBe(5000_00)
    expect(toB.byCategory.map((c) => c.category)).toEqual(['salary', 'food'])
  })

  it('shows the daily net from each side', () => {
    expect(groupByDay(txs, 'a')[0]!.net).toBe(25000_00)
    expect(groupByDay(txs, 'b')[0]!.net).toBe(4700_00)
  })
})

describe('overview', () => {
  const salary: Account = { ...acc, id: 's', salary: true, openingBalance: 0 }
  const spend: Account = { ...acc, id: 'p', openingBalance: 0 }
  const cycle = { key: '2026-10', start: '2026-10-23', end: '2026-11-24' }
  const txs = [
    tx({ id: '1', accountId: 's', type: 'income', category: 'salary', amount: 30_000_00, date: '2026-10-23' }),
    tx({ id: '2', accountId: 's', toAccountId: 'p', type: 'transfer', category: 'transfer', amount: 10_000_00, date: '2026-10-23' }),
    tx({ id: '3', accountId: 'p', type: 'expense', category: 'food', amount: 500_00, date: '2026-10-24' }),
    tx({ id: '4', accountId: 's', type: 'expense', category: 'electricity', amount: 1_000_00, date: '2026-10-25' }),
    // รอบก่อน ไม่นับรับ-จ่าย แต่นับในยอดคงเหลือ
    tx({ id: '5', accountId: 'p', type: 'income', category: 'side', amount: 200_00, date: '2026-10-01' }),
  ]
  const { rows, total } = overview([salary, spend], txs, cycle, new Set(['s']))

  it('แต่ละบัญชีนับเงินโอนด้วย', () => {
    expect(rows[0]!.summary).toMatchObject({ income: 30_000_00, expense: 11_000_00, closing: 19_000_00 })
    expect(rows[1]!.summary).toMatchObject({ income: 10_000_00, expense: 500_00, closing: 9_700_00 })
  })

  it('ยอดรวมไม่นับโอนระหว่างบัญชี แต่ยอดคงเหลือรวมทุกบัญชี', () => {
    expect(total).toMatchObject({ income: 30_000_00, expense: 1_500_00, closing: 28_700_00 })
    expect(total.byCategory.map((c) => c.category)).toEqual(['salary', 'electricity', 'food'])
  })
})

describe('overview ไม่รวมบัญชีเงินเดือน', () => {
  const salary: Account = { ...acc, id: 's', salary: true, openingBalance: 0 }
  const spend: Account = { ...acc, id: 'p', openingBalance: 0 }
  const save: Account = { ...acc, id: 'v', openingBalance: 0 }
  const cycle = { key: '2026-10', start: '2026-10-23', end: '2026-11-24' }
  const txs = [
    tx({ id: '1', accountId: 's', type: 'income', category: 'salary', amount: 30_000_00, date: '2026-10-23' }),
    tx({ id: '2', accountId: 's', toAccountId: 'p', type: 'transfer', category: 'transfer', amount: 10_000_00, date: '2026-10-23' }),
    tx({ id: '3', accountId: 'p', toAccountId: 'v', type: 'transfer', category: 'transfer', amount: 2_000_00, date: '2026-10-24' }),
    tx({ id: '4', accountId: 'p', type: 'expense', category: 'food', amount: 500_00, date: '2026-10-24' }),
    tx({ id: '5', accountId: 'v', toAccountId: 's', type: 'transfer', category: 'transfer', amount: 100_00, date: '2026-10-25' }),
    tx({ id: '6', accountId: 's', type: 'expense', category: 'electricity', amount: 1_000_00, date: '2026-10-25' }),
  ]
  const { rows, total } = overview([spend, save], txs, cycle, new Set(['s']))

  it('โอนจากบัญชีเงินเดือนนับเป็นรายรับ โอนกันเองในกลุ่มไม่นับ รายการของบัญชีเงินเดือนไม่นับ', () => {
    expect(rows.map((r) => r.account.id)).toEqual(['p', 'v'])
    expect(total).toMatchObject({ income: 10_000_00, expense: 600_00, closing: 9_400_00 })
    expect(total.byCategory.map((c) => `${c.type}:${c.category}`)).toEqual(['income:salary', 'expense:food', 'expense:transfer-out'])
  })
})

describe('inOverview', () => {
  it('ไม่นับบัญชีรับเงินเดือนและเงินสด', () => {
    expect(inOverview({ ...acc, salary: true })).toBe(false)
    expect(inOverview({ ...acc, bankId: 'cash' })).toBe(false)
    expect(inOverview(acc)).toBe(true)
  })
})

describe('groupCategoryOf', () => {
  const ids = new Set(['p', 'v'])
  const salaryIds = new Set(['s'])
  it('หมวดของรายการเมื่อมองทั้งกลุ่ม', () => {
    expect(groupCategoryOf(tx({ accountId: 'p', type: 'expense', category: 'food' }), ids, salaryIds)).toEqual({ type: 'expense', category: 'food' })
    expect(groupCategoryOf(tx({ accountId: 's', type: 'expense', category: 'food' }), ids, salaryIds)).toBeNull()
    expect(groupCategoryOf(tx({ accountId: 's', toAccountId: 'p', type: 'transfer' }), ids, salaryIds)).toEqual({ type: 'income', category: 'salary' })
    expect(groupCategoryOf(tx({ accountId: 'p', toAccountId: 'v', type: 'transfer' }), ids, salaryIds)).toBeNull()
    expect(groupCategoryOf(tx({ accountId: 'p', toAccountId: 'c', type: 'transfer' }), ids, salaryIds)).toEqual({ type: 'expense', category: 'transfer-out' })
  })
})

describe('บัตรเครดิตในภาพรวม', () => {
  it('ไม่นับบัตรเครดิต', () => {
    expect(inOverview({ ...acc, bankId: 'credit' })).toBe(false)
  })
})
