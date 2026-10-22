import { describe, expect, it } from 'vitest'
import { accountCycles } from '../shared/utils/history'
import { balanceOf, type Account, type Transaction } from '../shared/utils/stats'

const s = { paydayDay: 25, holidays: [] }
// สร้างบัญชีวันที่ 2026-09-25 (UTC)
const acc: Account = { id: 'a', bankId: 'kbank', name: '', last4: '', openingBalance: 1000_00, createdAt: Date.UTC(2026, 8, 25), updatedAt: 0 }
let n = 0
const tx = (date: string, type: 'income' | 'expense', baht: number, accountId = 'a'): Transaction => ({
  id: String(n++), accountId, type, amount: baht * 100, category: 'x', date, note: '', createdAt: n, updatedAt: n,
})
const txs = [
  tx('2026-09-25', 'income', 30000),
  tx('2026-10-01', 'expense', 20000),
  tx('2026-10-23', 'income', 30000), // รอบ ต.ค. เริ่ม 23 (25 = อาทิตย์)
  tx('2026-10-30', 'expense', 5000),
  tx('2026-10-30', 'income', 999, 'b'),
]

describe('accountCycles', () => {
  const [oct, sep] = accountCycles(acc, txs, s, '2026-11-01')

  it('counts the opening balance in the first cycle only', () => {
    expect(sep!.cycle.key).toBe('2026-09')
    expect(sep!.starting).toBe(1000_00)
    expect(sep!.carriedIn).toBe(0)
    expect(sep!.summary.closing).toBe(11000_00)
    expect(oct!.starting).toBe(0)
  })

  it('carries the closing into the next cycle automatically', () => {
    expect(oct!.carriedIn).toBe(11000_00)
    expect(oct!.summary.closing).toBe((11000 + 25000) * 100)
    // รายรับของรอบไม่รวมเงินที่ยกมา
    expect(oct!.summary.income).toBe(30000_00)
  })

  it('ends at the real account balance', () => {
    expect(oct!.summary.closing).toBe(balanceOf(acc, txs))
  })
})
