// ข้อมูลทั้งหมดเก็บใน IndexedDB ของเครื่อง แล้ว sync กับ Google Sheet ผ่าน useSync
import { get, set } from 'idb-keyval'
import { DEFAULT_HOLIDAYS } from '#shared/utils/holidays'
import { involves, type Account, type Transaction } from '#shared/utils/stats'
import { mergeRemote, mergeSettings, type Settings, type SyncResponse, type Tombstone } from '#shared/utils/sync'

interface State {
  ready: boolean
  accounts: Account[]
  transactions: Transaction[]
  settings: Settings
  /** รายการที่ลบในเครื่องแต่ยังไม่ได้แจ้งชีต */
  tombstones: Tombstone[]
}

const state = reactive<State>({
  ready: false,
  accounts: [],
  transactions: [],
  // updatedAt = 0 ให้ค่าจากชีตชนะตอน sync ครั้งแรก
  settings: { paydayDay: 25, holidays: [...DEFAULT_HOLIDAYS], updatedAt: 0 },
  tombstones: [],
})

let loading: Promise<void> | null = null
let onLocalChange = () => {}

/** useSync ลงทะเบียนไว้ เพื่อ sync หลังข้อมูลในเครื่องเปลี่ยน */
export function setLocalChangeListener(fn: () => void) {
  onLocalChange = fn
}

const plain = <T extends object>(list: T[]) => toRaw(list).map((x) => ({ ...toRaw(x) }))

function load() {
  loading ??= (async () => {
    const [accounts, transactions, settings, tombstones] = await Promise.all([
      get<Account[]>('accounts'),
      get<Transaction[]>('transactions'),
      get<Settings>('settings'),
      get<Tombstone[]>('tombstones'),
    ])
    // ข้อมูลรุ่นแรกยังไม่มี updatedAt
    if (accounts) state.accounts = accounts.map((a) => ({ ...a, updatedAt: a.updatedAt ?? a.createdAt }))
    if (transactions) state.transactions = transactions.map((t) => ({ ...t, updatedAt: t.updatedAt ?? t.createdAt }))
    if (settings) state.settings = { ...settings, updatedAt: settings.updatedAt ?? 0 }
    if (tombstones) state.tombstones = tombstones
    state.ready = true
    // บันทึกทุกครั้งที่ข้อมูลเปลี่ยน
    watch(() => state.accounts, (v) => set('accounts', plain(v)), { deep: true })
    watch(() => state.transactions, (v) => set('transactions', plain(v)), { deep: true })
    watch(() => state.settings, (v) => set('settings', { ...toRaw(v), holidays: [...v.holidays] }), { deep: true })
    watch(() => state.tombstones, (v) => set('tombstones', plain(v)), { deep: true })
  })()
  return loading
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
  if (import.meta.client) load()

  return {
    state: readonly(state),
    whenReady: () => load(),

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
