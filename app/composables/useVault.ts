// ที่เก็บข้อมูลแบบเข้ารหัสใน IndexedDB
// 'vault' = ข้อมูลที่เข้ารหัสแล้ว, 'vaultKey' = กุญแจ (CryptoKey ที่ดึงค่าออกมาดูไม่ได้)
import { del, get, getMany, set } from 'idb-keyval'
import { newKey, open, seal, type Sealed } from '#shared/utils/vault'

const VAULT = 'vault'
const KEY = 'vaultKey'
// คีย์ข้อมูลแบบไม่เข้ารหัสจากเวอร์ชันก่อน (ย้ายเข้า vault แล้วลบทิ้ง)
const LEGACY = ['accounts', 'transactions', 'settings', 'tombstones', 'sync', 'carries'] as const

let key: CryptoKey | null = null

export function useVault() {
  return {
    /** เปิดข้อมูลในเครื่อง ครั้งแรกจะสร้างกุญแจใหม่และคืน null */
    async load<T>(): Promise<T | null> {
      const [k, sealed] = await getMany<[CryptoKey | undefined, Sealed | undefined]>([KEY, VAULT])
      if (k && sealed) {
        key = k
        return open<T>(k, sealed)
      }
      key = await newKey()
      await set(KEY, key)
      return null
    },

    async save(value: unknown) {
      if (!key) throw new Error('vault ยังไม่ได้เปิด')
      await set(VAULT, await seal(key, value))
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
  }
}
