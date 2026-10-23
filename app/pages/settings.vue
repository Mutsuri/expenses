<script setup lang="ts">
import { cycleOf, fromISO, paydayOf, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatCycleLong, formatDayYear, formatWeekday } from '#shared/utils/format'

const store = useStore()
const { state } = store
const newHoliday = ref('')

const upcoming = computed(() => {
  const now = cycleOf(todayISO(), state.settings)
  return Array.from({ length: 6 }, (_, i) => {
    const c = shiftCycle(now.key, i, state.settings)
    const [y, m] = c.key.split('-').map(Number) as [number, number]
    const nominal = `${c.key}-${String(Math.min(state.settings.paydayDay, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0')}`
    return { key: c.key, payday: paydayOf(y, m, state.settings), moved: paydayOf(y, m, state.settings) !== nominal }
  })
})

const byYear = computed(() => {
  const groups = new Map<string, string[]>()
  for (const h of state.settings.holidays) {
    const y = h.slice(0, 4)
    groups.set(y, [...(groups.get(y) ?? []), h])
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
})

const buddhistYear = (y: string) => Number(y) + 543
const dayLabel = (iso: string) => {
  const wd = new Intl.DateTimeFormat('th-TH', { weekday: 'short', timeZone: 'UTC' }).format(fromISO(iso))
  return `${wd} ${formatDayYear(iso)}`
}

function add() {
  if (!newHoliday.value) return
  store.addHoliday(newHoliday.value)
  newHoliday.value = ''
}

const { sync, syncByUser, configure, disconnect } = useSync()
const sheetUrl = ref('')
const sheetSecret = ref('')
// ค่าที่บันทึกไว้โหลดจาก IndexedDB ทีหลัง เติมให้เมื่อช่องยังว่าง
watch(() => [sync.url, sync.secret] as const, ([url, secret]) => {
  if (!sheetUrl.value) sheetUrl.value = url
  if (!sheetSecret.value) sheetSecret.value = secret
}, { immediate: true })
const syncedAgo = computed(() =>
  sync.lastSyncAt ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(sync.lastSyncAt) : 'ยังไม่เคย',
)

// สีจุดสถานะ sync
const statusDot = computed(
  () => ({ off: 'bg-muted', idle: 'bg-income', syncing: 'bg-accent', error: 'bg-expense' })[sync.status],
)

const urlError = computed(() =>
  sheetUrl.value && !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(sheetUrl.value.trim())
    ? 'ต้องเป็นลิงก์เว็บแอปที่ลงท้ายด้วย /exec (ไม่ใช่ลิงก์หน้าแก้โค้ด)'
    : '',
)

function connect() {
  if (urlError.value) return
  configure(sheetUrl.value, sheetSecret.value)
}

const auth = useAuth()

function logout() {
  auth.logout()
}

function unlink() {
  disconnect()
  sheetUrl.value = ''
  sheetSecret.value = ''
}
</script>

<template>
  <main class="page">
    <TopBar title="ตั้งค่า" back="/" />

    <div class="section-title"><span>Google Sheet</span></div>
    <div class="card">
      <div class="mb-3.5 flex items-baseline gap-2 text-sm" :class="{ 'text-expense': sync.status === 'error' }">
        <span class="size-2 flex-none -translate-y-px rounded-full" :class="statusDot" />
        <span v-if="sync.status === 'off'">ยังไม่ได้เชื่อมต่อ ข้อมูลอยู่ในเครื่องนี้อย่างเดียว</span>
        <span v-else-if="sync.status === 'syncing'">กำลัง sync…</span>
        <span v-else-if="sync.status === 'error'">sync ไม่สำเร็จ: {{ sync.error }}</span>
        <span v-else>เชื่อมต่อแล้ว · sync ล่าสุด {{ syncedAgo }}</span>
      </div>
      <form @submit.prevent="connect">
        <label class="field">
          <span>ลิงก์เว็บแอปของ Apps Script</span>
          <input v-model="sheetUrl" class="input" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec">
          <small v-if="urlError" class="mx-1 mt-1.5 block text-[13px] text-expense">{{ urlError }}</small>
        </label>
        <label class="field">
          <span>รหัสลับ (ตรงกับ SECRET ใน Apps Script)</span>
          <input v-model="sheetSecret" class="input" type="password" autocomplete="off">
        </label>
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-primary" type="submit" :disabled="!sheetUrl || !sheetSecret">บันทึกและ sync</button>
          <button v-if="sync.status !== 'off'" class="btn" type="button" :disabled="sync.status === 'syncing'" @click="syncByUser()">sync ตอนนี้</button>
        </div>
      </form>
      <ConfirmButton
        v-if="sync.status !== 'off'"
        class="mt-3 -ml-2 rounded-lg px-2 py-1 text-[13px] text-muted underline"
        label="เลิกเชื่อมต่อ"
        confirm-label="แตะอีกครั้งเพื่อเลิกเชื่อมต่อ (ข้อมูลไม่หาย)"
        @confirm="unlink"
      />
    </div>

    <div class="section-title"><span>รอบเดือน</span></div>
    <div class="card">
      <label class="field">
        <span>เงินเดือนออกทุกวันที่</span>
        <select class="input" :value="state.settings.paydayDay" @change="store.setPaydayDay(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <p class="text-[13px] text-muted">ถ้าตรงเสาร์ อาทิตย์ หรือวันหยุดด้านล่าง จะเลื่อนไปวันทำการก่อนหน้า รอบเดือนเริ่มวันเงินเดือนออก และจบวันก่อนเงินเดือนรอบถัดไป</p>
    </div>

    <div class="section-title"><span>เงินเดือนออก 6 รอบถัดไป</span></div>
    <div class="card divide-y divide-line px-4 py-1">
      <div v-for="u in upcoming" :key="u.key" class="flex justify-between gap-2 py-2.5 text-[15px]">
        <span>{{ formatCycleLong(u.key) }}</span>
        <span :class="{ 'font-semibold text-accent': u.moved }">{{ formatWeekday(u.payday) }}<template v-if="u.moved"> (เลื่อน)</template></span>
      </div>
    </div>

    <div class="section-title"><span>วันหยุดธนาคาร</span></div>
    <div class="card">
      <form class="mb-2.5 flex gap-2" @submit.prevent="add">
        <input v-model="newHoliday" type="date" class="input">
        <button class="btn btn-primary" type="submit">เพิ่ม</button>
      </form>
      <p class="text-[13px] text-muted">ใส่วันหยุดปี 2569 และวันหยุดวันที่ตายตัวของปี 2570 ไว้ให้แล้ว วันหยุดทางจันทรคติและวันชดเชยของปี 2570 ต้องเพิ่มเองเมื่อ ธปท. ประกาศ</p>
      <div v-for="[year, days] in byYear" :key="year">
        <div class="mt-3.5 mb-1.5 font-semibold">พ.ศ. {{ buddhistYear(year) }}</div>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="d in days" :key="d" class="inline-flex items-center gap-0.5 rounded-full bg-card-2 py-[3px] pr-1 pl-2.5 text-[13px]">
            {{ dayLabel(d) }}
            <button type="button" class="px-1.5 text-base leading-none text-muted" aria-label="ลบ" @click="store.removeHoliday(d)">×</button>
          </span>
        </div>
      </div>
    </div>

    <div class="section-title"><span>บัญชีผู้ใช้</span></div>
    <div class="card flex items-center justify-between gap-3">
      <span>เข้าสู่ระบบเป็น <b>{{ auth.displayName.value }}</b></span>
      <button class="btn btn-danger" type="button" @click="logout">ออกจากระบบ</button>
    </div>
  </main>
</template>
