// ข้อมูลทั้งหมดเก็บใน IndexedDB ของเครื่อง (ภายหลังจะ sync กับ Google Sheet)
import { get, set } from 'idb-keyval'
import { DEFAULT_HOLIDAYS } from '#shared/utils/holidays'
import type { CycleSettings } from '#shared/utils/cycle'
import type { Account, Transaction } from '#shared/utils/stats'

interface State {
  ready: boolean
  accounts: Account[]
  transactions: Transaction[]
  settings: CycleSettings
}

const state = reactive<State>({
  ready: false,
  accounts: [],
  transactions: [],
  settings: { paydayDay: 25, holidays: [...DEFAULT_HOLIDAYS] },
})

let loading: Promise<void> | null = null

function load() {
  loading ??= (async () => {
    const [accounts, transactions, settings] = await Promise.all([
      get<Account[]>('accounts'),
      get<Transaction[]>('transactions'),
      get<CycleSettings>('settings'),
    ])
    if (accounts) state.accounts = accounts
    if (transactions) state.transactions = transactions
    if (settings) state.settings = settings
    state.ready = true
    // บันทึกทุกครั้งที่ข้อมูลเปลี่ยน
    watch(() => state.accounts, (v) => set('accounts', toRaw(v).map((a) => ({ ...a }))), { deep: true })
    watch(() => state.transactions, (v) => set('transactions', toRaw(v).map((t) => ({ ...t }))), { deep: true })
    watch(() => state.settings, (v) => set('settings', { paydayDay: v.paydayDay, holidays: [...v.holidays] }), { deep: true })
  })()
  return loading
}

const newId = () => crypto.randomUUID()

export function useStore() {
  if (import.meta.client) load()

  return {
    state: readonly(state),

    addAccount(a: Omit<Account, 'id' | 'createdAt'>): string {
      const id = newId()
      state.accounts.push({ ...a, id, createdAt: Date.now() })
      return id
    },
    updateAccount(id: string, patch: Partial<Omit<Account, 'id'>>) {
      const a = state.accounts.find((x) => x.id === id)
      if (a) Object.assign(a, patch)
    },
    removeAccount(id: string) {
      state.accounts = state.accounts.filter((a) => a.id !== id)
      state.transactions = state.transactions.filter((t) => t.accountId !== id)
    },

    addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): string {
      const id = newId()
      state.transactions.push({ ...t, id, createdAt: Date.now() })
      return id
    },
    updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>) {
      const t = state.transactions.find((x) => x.id === id)
      if (t) Object.assign(t, patch)
    },
    removeTransaction(id: string) {
      state.transactions = state.transactions.filter((t) => t.id !== id)
    },

    setPaydayDay(day: number) {
      state.settings.paydayDay = day
    },
    addHoliday(iso: string) {
      if (!state.settings.holidays.includes(iso)) state.settings.holidays = [...state.settings.holidays, iso].sort()
    },
    removeHoliday(iso: string) {
      state.settings.holidays = state.settings.holidays.filter((h) => h !== iso)
    },
  }
}
