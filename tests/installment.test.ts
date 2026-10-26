import { describe, expect, it } from 'vitest'
import { CALENDAR_MONTH } from '../shared/utils/cycle'
import { DEFAULT_HOLIDAYS } from '../shared/utils/holidays'
import { activePlans, installmentOf, planInstallments } from '../shared/utils/installment'

const payday = { paydayDay: 25, holidays: DEFAULT_HOLIDAYS }
const base = { accountId: 'c', type: 'expense' as const, category: 'online-shop', amount: 10_000_00, date: '2026-10-26', note: 'มือถือ' }

describe('planInstallments', () => {
  const plan = planInstallments(base, 3, 'p1', payday)

  it('แบ่งเท่า ๆ กัน เศษไปงวดแรก ยอดรวมเท่าเดิม', () => {
    expect(plan.map((t) => t.amount)).toEqual([3_333_34, 3_333_33, 3_333_33])
    expect(plan.reduce((s, t) => s + t.amount, 0)).toBe(base.amount)
  })

  it('งวดแรกวันที่ซื้อ งวดต่อไปวันเงินเดือนออกของรอบถัดไป รอบละงวด', () => {
    // 25 พ.ย. 69 = พุธ, 25 ธ.ค. 69 = ศุกร์
    expect(plan.map((t) => t.date)).toEqual(['2026-10-26', '2026-11-25', '2026-12-25'])
  })

  it('ซื้อปลายรอบก็ไม่ตกรอบเดียวกันสองงวด', () => {
    // 23 ต.ค. อยู่รอบ ต.ค. (22 ต.ค.–24 พ.ย.) งวดสองต้องเป็นรอบ พ.ย.
    expect(planInstallments({ ...base, date: '2026-10-23' }, 2, 'p2', payday).map((t) => t.date)).toEqual(['2026-10-23', '2026-11-25'])
  })

  it('เดือนปฏิทินสำหรับผู้ใช้ที่ไม่มีเงินเดือน', () => {
    expect(planInstallments(base, 2, 'p3', CALENDAR_MONTH).map((t) => t.date)).toEqual(['2026-10-26', '2026-11-01'])
  })

  it('id และโน้ตบอกงวด', () => {
    expect(plan[1]).toMatchObject({ id: 'p1~2of3', note: 'มือถือ (ผ่อน 2/3)' })
    expect(installmentOf(plan[1]!.id)).toEqual({ planId: 'p1', no: 2, of: 3 })
    expect(installmentOf('9331e64d-aaaa')).toBeNull()
  })
})

describe('activePlans', () => {
  const plan = planInstallments(base, 3, 'p1', payday).map((t) => ({ ...t, createdAt: 0, updatedAt: 0 }))
  const noNote = planInstallments({ ...base, note: '' }, 2, 'p2', payday).map((t) => ({ ...t, createdAt: 0, updatedAt: 0 }))

  it('นับงวดที่ถึงแล้วและยอดที่เหลือ', () => {
    expect(activePlans([...plan, ...noNote], 'c', '2026-11-30')).toEqual([
      { planId: 'p2', name: '', category: 'online-shop', of: 2, paid: 2, remaining: 0 },
      { planId: 'p1', name: 'มือถือ', category: 'online-shop', of: 3, paid: 2, remaining: 3_333_33 },
    ].filter((p) => p.remaining > 0))
  })

  it('ผ่อนครบแล้วไม่แสดง', () => {
    expect(activePlans(plan, 'c', '2026-12-31')).toEqual([])
  })
})
