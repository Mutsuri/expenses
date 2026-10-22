import { addDays, cycleOf, shiftCycle, todayISO, toISO, type Cycle, type CycleSettings } from '#shared/utils/cycle'
import { balanceOf, inCycle, summarize, type Account, type CycleSummary, type Transaction } from '#shared/utils/stats'

export interface CycleRow {
  cycle: Cycle
  opening: number
  summary: CycleSummary
}

/** ทุกรอบตั้งแต่รอบแรกที่มีข้อมูลจนถึงรอบปัจจุบัน ใหม่สุดก่อน */
export function accountHistory(account: Account, all: Transaction[], s: CycleSettings): CycleRow[] {
  const txs = all.filter((t) => t.accountId === account.id)
  const current = cycleOf(todayISO(), s)
  const firstDate = txs.reduce((min, t) => (t.date < min ? t.date : min), toISO(new Date(account.createdAt)))
  const first = cycleOf(firstDate, s)

  const rows: CycleRow[] = []
  for (let c = current; c.key >= first.key && rows.length < 120; c = shiftCycle(c.key, -1, s)) {
    rows.push(cycleRow(account, txs, c))
  }
  return rows
}

export function cycleRow(account: Account, txs: Transaction[], c: Cycle): CycleRow {
  const own = txs.filter((t) => t.accountId === account.id)
  return {
    cycle: c,
    opening: balanceOf(account, own, addDays(c.start, -1)),
    summary: summarize(inCycle(own, c), balanceOf(account, own, c.end)),
  }
}
