// sync กับ Google Sheet: ส่งข้อมูลทั้งหมดในเครื่อง + รายการที่ลบไป แล้วรับข้อมูลรวมกลับมา
// ใครแก้ทีหลัง (updatedAt มากกว่า) ชนะ

import type { CycleSettings } from './cycle'
import type { Account, Transaction } from './stats'

export type Deletable<T> = T & { deleted?: boolean }

export interface Settings extends CycleSettings {
  updatedAt: number
}

export interface Tombstone {
  kind: 'account' | 'transaction'
  id: string
  updatedAt: number
}

export interface SyncRequest {
  secret: string
  /** ชื่อผู้ใช้ ชีตแยกแถวตามผู้ใช้ */
  user: string
  accounts: Deletable<Account>[]
  transactions: Deletable<Transaction>[]
  settings: Settings
}

export type SyncResponse =
  | { ok: true; accounts: Deletable<Account>[]; transactions: Deletable<Transaction>[]; settings: Settings | null }
  | { ok: false; error: string }

export function buildRequest(
  secret: string,
  user: string,
  accounts: Account[],
  transactions: Transaction[],
  settings: Settings,
  tombstones: Tombstone[],
): SyncRequest {
  const dead = (kind: Tombstone['kind']) =>
    tombstones.filter((t) => t.kind === kind).map((t) => ({ id: t.id, updatedAt: t.updatedAt, deleted: true }))
  return {
    secret,
    user,
    accounts: [...accounts, ...(dead('account') as Deletable<Account>[])],
    transactions: [...transactions, ...(dead('transaction') as Deletable<Transaction>[])],
    settings,
  }
}

/** รวมข้อมูลจากชีตเข้ากับข้อมูลในเครื่อง รายการในเครื่องที่ชีตยังไม่มีจะคงไว้ */
export function mergeRemote<T extends { id: string; updatedAt: number }>(local: T[], remote: Deletable<T>[]): T[] {
  const byId = new Map(local.map((r) => [r.id, r]))
  for (const r of remote) {
    const mine = byId.get(r.id)
    if (mine && mine.updatedAt >= r.updatedAt) continue
    if (r.deleted) byId.delete(r.id)
    else {
      const { deleted: _, ...rest } = r
      byId.set(r.id, rest as unknown as T)
    }
  }
  return [...byId.values()]
}

export function mergeSettings(local: Settings, remote: Settings | null): Settings {
  return remote && remote.updatedAt > local.updatedAt ? remote : local
}
