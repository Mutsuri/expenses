// เข้ารหัสข้อมูลที่เก็บในเครื่องด้วย AES-GCM 256 บิต
// กุญแจสร้างแบบดึงออกมาดูไม่ได้ (extractable: false) เปิด F12 ดู IndexedDB จะเห็นแต่ข้อมูลที่อ่านไม่ออก

export interface Sealed {
  v: 2
  /** base64 */
  iv: string
  data: string
}

const enc = new TextEncoder()
const dec = new TextDecoder()

export function toB64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

export function newKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function seal(key: CryptoKey, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)))
  return { v: 2, iv: toB64(iv), data: toB64(new Uint8Array(data)) }
}

/** โยน error ถ้ากุญแจไม่ตรงหรือข้อมูลถูกแก้ */
export async function open<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv) }, key, fromB64(sealed.data))
  return JSON.parse(dec.decode(data)) as T
}
