// sync กับ Google Sheet ผ่าน Apps Script
// ลิงก์และรหัสลับเก็บในเครื่องนี้เท่านั้น แบบเข้ารหัสไปพร้อมข้อมูล (ไม่อยู่ในโค้ดบน GitHub)
import { buildRequest, type SyncResponse } from '#shared/utils/sync'

interface SyncState {
  url: string
  secret: string
  lastSyncAt: number | null
  status: 'off' | 'idle' | 'syncing' | 'error'
  error: string
  /** มีข้อมูลที่แก้ในเครื่องแต่ยังไม่ได้ส่งขึ้นชีต */
  pending: boolean
  /** เวลาที่ sync การแก้ไข (หรือที่กดเอง) เสร็จล่าสุด ใช้แสดงข้อความแจ้ง */
  doneAt: number
}

const sync = reactive<SyncState>({ url: '', secret: '', lastSyncAt: null, status: 'off', error: '', pending: false, doneAt: 0 })

let started = false
let timer: ReturnType<typeof setTimeout> | undefined
let running: Promise<void> | null = null
let again = false
let manual = false

const configured = () => Boolean(sync.url && sync.secret)

function saveConfig() {
  useStore().setSyncConfig({ url: sync.url, secret: sync.secret, lastSyncAt: sync.lastSyncAt })
}

async function run() {
  const store = useStore()
  const { state } = store
  const tombstones = state.tombstones.map((t) => ({ ...t }))
  const body = buildRequest(
    sync.secret,
    useAuth().username.value!,
    state.accounts.map((a) => ({ ...a })),
    state.transactions.map((t) => ({ ...t })),
    { ...state.settings, holidays: [...state.settings.holidays] },
    tombstones,
  )
  const carried = sync.pending || manual
  sync.pending = false
  manual = false
  sync.status = 'syncing'
  try {
    // text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight ซึ่ง Apps Script ไม่รองรับ
    const res = await fetch(sync.url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
    const data = (await res.json()) as SyncResponse
    if (!data.ok) throw new Error(data.error)
    store.applyRemote(data, tombstones)
    sync.lastSyncAt = Date.now()
    sync.status = 'idle'
    sync.error = ''
    if (carried) sync.doneAt = Date.now()
    saveConfig()
  } catch (err) {
    if (carried) sync.pending = true
    sync.status = 'error'
    sync.error = !navigator.onLine ? 'ไม่มีอินเทอร์เน็ต' : err instanceof Error ? err.message : String(err)
  }
}

/** sync ทันที ถ้ากำลัง sync อยู่จะต่อคิวอีกรอบ */
async function syncNow() {
  if (!configured()) return
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await run()
    } while (again)
  })()
  try {
    await running
  } finally {
    running = null
  }
}

function scheduleSync() {
  if (configured()) sync.pending = true
  clearTimeout(timer)
  timer = setTimeout(syncNow, 1500)
}

async function start() {
  if (started) return
  started = true
  const store = useStore()
  // ลิงก์และรหัสลับอยู่ในข้อมูลที่เข้ารหัส อ่านได้หลังเปิดข้อมูลในเครื่องเสร็จ
  await store.whenReady()
  Object.assign(sync, store.state.syncConfig)
  sync.status = configured() ? 'idle' : 'off'
  setLocalChangeListener(scheduleSync)
  window.addEventListener('online', () => syncNow())
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && syncNow())
  syncNow()
}

export function useSync() {
  if (import.meta.client) start()

  return {
    sync: readonly(sync),
    syncNow,
    /** กดเองจากปุ่ม: แจ้งเมื่อเสร็จแม้ไม่มีอะไรเปลี่ยน */
    syncByUser() {
      manual = true
      return syncNow()
    },
    async configure(url: string, secret: string) {
      sync.url = url.trim()
      sync.secret = secret.trim()
      sync.status = configured() ? 'idle' : 'off'
      sync.error = ''
      saveConfig()
      manual = true
      await syncNow()
    },
    disconnect() {
      sync.url = ''
      sync.secret = ''
      sync.lastSyncAt = null
      sync.status = 'off'
      sync.error = ''
      sync.pending = false
      saveConfig()
    },
  }
}
