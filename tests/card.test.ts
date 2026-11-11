import { describe, expect, it } from 'vitest'
import { cardBill, lastStatement } from '../shared/utils/card'
import type { Account, Transaction } from '../shared/utils/stats'

const card: Account = { id: 'c', bankId: 'credit', name: '', last4: '', openingBalance: 0, createdAt: 0, updatedAt: 0 }
const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(), accountId: 'c', type: 'expense', amount: 0, category: 'food', date: '2026-11-01', note: '', createdAt: 0, updatedAt: 0, ...p,
})
const pay = (amount: number, date: string) => tx({ accountId: 'p', toAccountId: 'c', type: 'transfer', category: 'card-pay', amount, date })

describe('card statement', () => {
  it('closes on the 25th, which belongs to the closing period', () => {
    expect(lastStatement('2026-11-12')).toBe('2026-10-25')
    expect(lastStatement('2026-11-25')).toBe('2026-10-25')
    expect(lastStatement('2026-11-26')).toBe('2026-11-25')
    expect(lastStatement('2027-01-10')).toBe('2026-12-25')
  })

  it('spending before the statement becomes the bill, due on the 15th', () => {
    const txs = [tx({ amount: 3_000_00, date: '2026-11-25' }), tx({ amount: 500_00, date: '2026-11-28' })]
    const b = cardBill(card, txs, '2026-11-30')
    expect(b).toMatchObject({ statement: '2026-11-25', dueDate: '2026-12-15', due: 3_000_00, current: 500_00 })
    expect(b).toMatchObject({ periodStart: '2026-11-26', periodEnd: '2026-12-25', nextDueDate: '2027-01-15' })
  })

  it('paying the bill resets it to 0', () => {
    const txs = [tx({ amount: 3_000_00, date: '2026-11-20' }), tx({ amount: 500_00, date: '2026-11-28' }), pay(3_000_00, '2026-12-01')]
    expect(cardBill(card, txs, '2026-12-02')).toMatchObject({ due: 0, billed: true, current: 500_00 })
  })

  it('paying early clears the current period', () => {
    const txs = [tx({ amount: 3_000_00, date: '2026-11-03' }), tx({ type: 'income', category: 'cashback', amount: 150_00, date: '2026-11-04' })]
    expect(cardBill(card, txs, '2026-11-12').current).toBe(2_850_00)
    expect(cardBill(card, [...txs, pay(2_850_00, '2026-11-12')], '2026-11-12')).toMatchObject({ due: 0, billed: false, current: 0 })
  })
})
