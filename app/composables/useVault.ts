// ที่เก็บข้อมูลแบบเข้ารหัสใน IndexedDB แยกตามผู้ใช้
// 'vault:<ผู้ใช้>' = ข้อมูลที่เข้ารหัสแล้ว, 'vaultKey' = กุญแจ (CryptoKey ที่ดึงค่าออกมาดูไม่ได้) ใช้ร่วมกันในเครื่อง
import { del, get, getMany, set } from 'idb-keyval'
import { newKey, open, seal, type Sealed } from '#shared/utils/vault'

const KEY = 'vaultKey'
// คีย์ข้อมูลแบบไม่เข้ารหัสจากเวอร์ชันก่อน (ย้ายเข้า vault ของผู้ใช้คนแรกแล้วลบทิ้ง)
const LEGACY = ['accounts', 'transactions', 'settings', 'tombstones', 'sync', 'carries'] as const

let key: CryptoKey | null = null
let user: string | null = null

const vaultOf = (u: string) => `vault:${u}`

async function deviceKey(): Promise<CryptoKey> {
  key ??= (await get<CryptoKey>(KEY)) ?? null
  if (!key) {
    key = await newKey()
    await set(KEY, key)
  }
  return key
}

export function useVault() {
  return {
    /** เปิดข้อมูลของผู้ใช้ ยังไม่เคยมีจะคืน null */
    async load<T>(u: string): Promise<T | null> {
      user = u
      const k = await deviceKey()
      const sealed = await get<Sealed>(vaultOf(u))
      return sealed ? open<T>(k, sealed) : null
    },

    async save(value: unknown) {
      if (!key || !user) throw new Error('vault ยังไม่ได้เปิด')
      await set(vaultOf(user), await seal(key, value))
    },

    /** ข้อมูลเก่าที่ยังไม่เข้ารหัส (ถ้ามี) */
    async readLegacy(): Promise<Record<(typeof LEGACY)[number], unknown> | null> {
      const values = await getMany([...LEGACY])
      if (values.every((v) => v === undefined)) return null
      return Object.fromEntries(LEGACY.map((k, i) => [k, values[i]])) as Record<(typeof LEGACY)[number], unknown>
    },
    async clearLegacy() {
      await Promise.all(LEGACY.map((k) => del(k)))
    },

    /** ลบข้อมูลของผู้ใช้ที่เปิดอยู่ออกจากเครื่อง (กุญแจเก็บไว้ ผู้ใช้อื่นยังใช้) */
    async remove() {
      if (user) await del(vaultOf(user))
    },
  }
}
