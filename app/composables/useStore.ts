// ข้อมูลทั้งหมดเก็บในเครื่องแบบเข้ารหัส (useVault) แล้ว sync กับ Google Sheet ผ่าน useSync
import { CALENDAR_MONTH } from '#shared/utils/cycle'
import { DEFAULT_HOLIDAYS } from '#shared/utils/holidays'
import { DEFAULT_OWNER, usesSalary } from '#shared/utils/users'
import { involves, type Account, type Transaction } from '#shared/utils/stats'
import { mergeRemote, mergeSettings, type Settings, type SyncResponse, type Tombstone } from '#shared/utils/sync'

export interface SyncConfig {
  url: string
  secret: string
  lastSyncAt: number | null
}

/** ข้อมูลทั้งก้อนที่เข้ารหัสเก็บใน vault */
export interface StoredData {
  accounts?: Account[]
  transactions?: Transaction[]
  settings?: Settings
  tombstones?: Tombstone[]
  sync?: SyncConfig
}

interface State {
  ready: boolean
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  /** รายการที่ลบในเครื่องแต่ยังไม่ได้แจ้งชีต */
  tombstones: Tombstone[]
  /** ลิงก์และรหัสลับของชีต (เข้ารหัสไปพร้อมข้อมูล) */
  syncConfig: SyncConfig
}

const state = reactive<State>({
  ready: false,
  accounts: [],
  transactions: [],
  // updatedAt = 0 ให้ค่าจากชีตชนะตอน sync ครั้งแรก
  settings: { paydayDay: 25, holidays: [...DEFAULT_HOLIDAYS], updatedAt: 0 },
  tombstones: [],
  syncConfig: { url: '', secret: '', lastSyncAt: null },
})

const user = ref<string | null>(null)
const hasSalary = computed(() => !user.value || usesSalary(user.value))
// ผู้ใช้ที่ไม่มีเงินเดือนนับรอบตามเดือนปฏิทิน
const cycleSettings = computed(() => (hasSalary.value ? state.settings : CALENDAR_MONTH))

let onLocalChange = () => {}
let opening: Promise<void> | null = null
let markReady: () => void
const ready = new Promise<void>((r) => (markReady = r))

/** useSync ลงทะเบียนไว้ เพื่อ sync หลังข้อมูลในเครื่องเปลี่ยน */
export function setLocalChangeListener(fn: () => void) {
  onLocalChange = fn
}

const plain = <T extends object>(list: T[]) => toRaw(list).map((x) => ({ ...toRaw(x) }))

function snapshot(): StoredData {
  return {
    accounts: plain(state.accounts),
    transactions: plain(state.transactions),
    settings: { ...toRaw(state.settings), holidays: [...state.settings.holidays] },
    tombstones: plain(state.tombstones),
    sync: { ...toRaw(state.syncConfig) },
  }
}

// บันทึกลง vault หลังข้อมูลเปลี่ยน (รวบหลายการแก้เป็นครั้งเดียว)
let saveTimer: ReturnType<typeof setTimeout> | undefined
// ลบข้อมูลในเครื่องแล้ว ห้ามบันทึกกลับ (ระหว่างรอรีโหลดหน้า)
let wiped = false
function persist() {
  clearTimeout(saveTimer)
  if (wiped) return
  saveTimer = setTimeout(() => useVault().save(snapshot()), 300)
}

/** ใส่ข้อมูลที่ถอดรหัสแล้วเข้า state แล้วเริ่มบันทึกอัตโนมัติ */
function hydrate(data: StoredData) {
  // ข้อมูลรุ่นแรกยังไม่มี updatedAt
  if (data.accounts) state.accounts = data.accounts.map((a) => ({ ...a, updatedAt: a.updatedAt ?? a.createdAt }))
  if (data.transactions) state.transactions = data.transactions.map((t) => ({ ...t, updatedAt: t.updatedAt ?? t.createdAt }))
  if (data.settings) state.settings = { ...data.settings, updatedAt: data.settings.updatedAt ?? 0 }
  if (data.tombstones) state.tombstones = data.tombstones
  if (data.sync) state.syncConfig = { ...data.sync }
  state.ready = true
  watch(() => [state.accounts, state.transactions, state.settings, state.tombstones, state.syncConfig], persist, { deep: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !wiped) {
      clearTimeout(saveTimer)
      useVault().save(snapshot())
    }
  })
}

/**
 * เปิดข้อมูลของผู้ใช้ที่ login (เปิดได้ครั้งเดียวต่อการโหลดหน้า เปลี่ยนผู้ใช้ต้องรีโหลด)
 * ผู้ใช้คนแรกเปิดครั้งแรก: ย้ายข้อมูลเก่าที่ยังไม่เข้ารหัสเข้ามาแล้วลบตัวเดิม
 */
function open(name: string) {
  opening ??= (async () => {
    user.value = name
    const vault = useVault()
    let data = await vault.load<StoredData>(name)
    if (!data) {
      const old = name === DEFAULT_OWNER ? await vault.readLegacy() : null
      data = old
        ? {
            accounts: old.accounts as StoredData['accounts'],
            transactions: old.transactions as StoredData['transactions'],
            settings: old.settings as StoredData['settings'],
            tombstones: old.tombstones as StoredData['tombstones'],
            sync: old.sync as SyncConfig | undefined,
          }
        : {}
      await vault.save(data)
      if (old) await vault.clearLegacy()
    }
    hydrate(data)
    markReady()
  })()
  return opening
}

const newId = () => crypto.randomUUID()

function bury(kind: Tombstone['kind'], ids: string[]) {
  const now = Date.now()
  state.tombstones = [...state.tombstones.filter((t) => !ids.includes(t.id)), ...ids.map((id) => ({ kind, id, updatedAt: now }))]
}

/** บัญชีรับเงินเดือนมีได้บัญชีเดียว */
function clearSalary(exceptId: string, now: number) {
  for (const a of state.accounts) {
    if (a.salary && a.id !== exceptId) Object.assign(a, { salary: false, updatedAt: now })
  }
}

function touchSettings() {
  state.settings.updatedAt = Date.now()
  onLocalChange()
}

export function useStore() {
  return {
    state: readonly(state),
    open,
    /** รอจนเปิดข้อมูลของผู้ใช้เสร็จ (หลัง login) */
    whenReady: () => ready,
    /** ผู้ใช้คนนี้มีเงินเดือน (บัญชีรับเงินเดือน วันเงินเดือนออก) */
    hasSalary,
    /** ใช้กับฟังก์ชันรอบเดือนทั้งหมดแทน state.settings */
    cycleSettings,

    setSyncConfig(patch: Partial<SyncConfig>) {
      Object.assign(state.syncConfig, patch)
    },
    /** ลบข้อมูลของผู้ใช้คนนี้ออกจากเครื่อง (ต้องรีโหลดหน้าต่อ) */
    async wipe() {
      wiped = true
      clearTimeout(saveTimer)
      await useVault().remove()
    },

    addAccount(a: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): string {
      const id = newId()
      const now = Date.now()
      if (a.salary) clearSalary(id, now)
      state.accounts.push({ ...a, id, createdAt: now, updatedAt: now })
      onLocalChange()
      return id
    },
    updateAccount(id: string, patch: Partial<Omit<Account, 'id'>>) {
      const a = state.accounts.find((x) => x.id === id)
      if (!a) return
      const now = Date.now()
      if (patch.salary) clearSalary(id, now)
      Object.assign(a, patch, { updatedAt: now })
      onLocalChange()
    },
    removeAccount(id: string) {
      const txIds = state.transactions.filter((t) => involves(t, id)).map((t) => t.id)
      state.accounts = state.accounts.filter((a) => a.id !== id)
      state.transactions = state.transactions.filter((t) => !involves(t, id))
      bury('account', [id])
      bury('transaction', txIds)
      onLocalChange()
    },


    addTransaction(t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): string {
      const id = newId()
      const now = Date.now()
      state.transactions.push({ ...t, id, createdAt: now, updatedAt: now })
      onLocalChange()
      return id
    },
    updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>) {
      const t = state.transactions.find((x) => x.id === id)
      if (!t) return
      Object.assign(t, patch, { updatedAt: Date.now() })
      onLocalChange()
    },
    removeTransaction(id: string) {
      state.transactions = state.transactions.filter((t) => t.id !== id)
      bury('transaction', [id])
      onLocalChange()
    },

    setPaydayDay(day: number) {
      state.settings.paydayDay = day
      touchSettings()
    },
    addHoliday(iso: string) {
      if (state.settings.holidays.includes(iso)) return
      state.settings.holidays = [...state.settings.holidays, iso].sort()
      touchSettings()
    },
    removeHoliday(iso: string) {
      state.settings.holidays = state.settings.holidays.filter((h) => h !== iso)
      touchSettings()
    },

    /** รับผล sync จากชีต ไม่นับเป็นการแก้ในเครื่อง */
    applyRemote(res: Extract<SyncResponse, { ok: true }>, sentTombstones: Tombstone[]) {
      state.accounts = mergeRemote(state.accounts, res.accounts)
      state.transactions = mergeRemote(state.transactions, res.transactions)
      state.settings = mergeSettings(state.settings, res.settings)
      const sent = new Set(sentTombstones.map((t) => `${t.id}@${t.updatedAt}`))
      state.tombstones = state.tombstones.filter((t) => !sent.has(`${t.id}@${t.updatedAt}`))
    },
  }
}
