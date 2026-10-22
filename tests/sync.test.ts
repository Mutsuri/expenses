import { describe, expect, it } from 'vitest'
import { buildRequest, mergeRemote, mergeSettings } from '../shared/utils/sync'

type Row = { id: string; updatedAt: number; v: string }
const row = (id: string, updatedAt: number, v = id): Row => ({ id, updatedAt, v })

describe('mergeRemote', () => {
  it('takes newer remote rows and keeps newer local ones', () => {
    const local = [row('a', 5, 'local'), row('b', 1, 'local')]
    const remote = [row('a', 3, 'remote'), row('b', 4, 'remote')]
    const merged = mergeRemote(local, remote)
    expect(merged.find((r) => r.id === 'a')!.v).toBe('local')
    expect(merged.find((r) => r.id === 'b')!.v).toBe('remote')
  })

  it('adds rows from other devices and keeps unsent local rows', () => {
    const merged = mergeRemote([row('mine', 1)], [row('other', 1)])
    expect(merged.map((r) => r.id).sort()).toEqual(['mine', 'other'])
  })

  it('removes rows deleted elsewhere unless edited here afterwards', () => {
    const local = [row('a', 1), row('b', 9)]
    const remote = [{ ...row('a', 2), deleted: true }, { ...row('b', 2), deleted: true }]
    expect(mergeRemote(local, remote).map((r) => r.id)).toEqual(['b'])
  })

  it('does not keep the deleted flag on merged rows', () => {
    const [r] = mergeRemote<Row>([], [{ ...row('a', 1), deleted: false }])
    expect(r).not.toHaveProperty('deleted')
  })
})

describe('sync request', () => {
  it('sends deletions as tombstones next to live rows', () => {
    const req = buildRequest('s', [], [], { paydayDay: 25, holidays: [], updatedAt: 0 }, [
      { kind: 'transaction', id: 't1', updatedAt: 7 },
    ])
    expect(req.transactions).toEqual([{ id: 't1', updatedAt: 7, deleted: true }])
    expect(req.accounts).toEqual([])
  })

  it('keeps the newest settings', () => {
    const a = { paydayDay: 25, holidays: [], updatedAt: 1 }
    const b = { paydayDay: 28, holidays: [], updatedAt: 2 }
    expect(mergeSettings(a, b).paydayDay).toBe(28)
    expect(mergeSettings(b, a).paydayDay).toBe(28)
    expect(mergeSettings(a, null)).toBe(a)
  })
})
