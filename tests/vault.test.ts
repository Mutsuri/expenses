import { describe, expect, it } from 'vitest'
import { newKey, open, seal } from '../shared/utils/vault'

describe('vault', () => {
  const data = { accounts: [{ name: 'กสิกรไทย', openingBalance: 350000 }], secret: 'my-sheet-secret' }

  it('opens what it sealed with the same key', async () => {
    const key = await newKey()
    expect(await open(key, await seal(key, data))).toEqual(data)
  })

  it('rejects another key', async () => {
    const sealed = await seal(await newKey(), data)
    await expect(open(await newKey(), sealed)).rejects.toThrow()
  })

  it('stores nothing readable', async () => {
    const sealed = await seal(await newKey(), data)
    const raw = JSON.stringify(sealed) + atob(sealed.data)
    expect(raw).not.toContain('my-sheet-secret')
    expect(raw).not.toContain('350000')
  })

  it('uses a fresh IV every time', async () => {
    const key = await newKey()
    const a = await seal(key, data)
    const b = await seal(key, data)
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it('keeps the key itself out of reach', async () => {
    const key = await newKey()
    expect(key.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
  })
})
