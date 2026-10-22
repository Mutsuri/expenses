import { describe, expect, it } from 'vitest'
import { parseMoney, formatMoney } from '../shared/utils/format'
import { balanceOf, groupByDay, summarize, type Account, type Transaction } from '../shared/utils/stats'

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
