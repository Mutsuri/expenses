<script setup lang="ts">
import { cycleOf, fromISO, paydayOf, shiftCycle, cycleTodayISO } from '#shared/utils/cycle'
import { formatCycleLong, formatDayYear, formatWeekday } from '#shared/utils/format'

const store = useStore()
const { state } = store
const newHoliday = ref('')

const upcoming = computed(() => {
  const now = cycleOf(cycleTodayISO(), state.settings)
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
const router = useRouter()

function logout() {
  auth.logout()
  router.replace('/login')
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
      <div class="status" :class="sync.status">
        <span class="dot" />
        <span v-if="sync.status === 'off'">ยังไม่ได้เชื่อมต่อ ข้อมูลอยู่ในเครื่องนี้อย่างเดียว</span>
        <span v-else-if="sync.status === 'syncing'">กำลัง sync…</span>
        <span v-else-if="sync.status === 'error'">sync ไม่สำเร็จ: {{ sync.error }}</span>
        <span v-else>เชื่อมต่อแล้ว · sync ล่าสุด {{ syncedAgo }}</span>
      </div>
      <form @submit.prevent="connect">
        <label class="field">
          <span>ลิงก์เว็บแอปของ Apps Script</span>
          <input v-model="sheetUrl" class="input" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec">
          <small v-if="urlError" class="url-error">{{ urlError }}</small>
        </label>
        <label class="field">
          <span>รหัสลับ (ตรงกับ SECRET ใน Apps Script)</span>
          <input v-model="sheetSecret" class="input" type="password" autocomplete="off">
        </label>
        <div class="actions">
          <button class="btn btn-primary" type="submit" :disabled="!sheetUrl || !sheetSecret">บันทึกและ sync</button>
          <button v-if="sync.status !== 'off'" class="btn" type="button" :disabled="sync.status === 'syncing'" @click="syncByUser()">sync ตอนนี้</button>
        </div>
      </form>
      <ConfirmButton v-if="sync.status !== 'off'" class="unlink muted" label="เลิกเชื่อมต่อ" confirm-label="แตะอีกครั้งเพื่อเลิกเชื่อมต่อ (ข้อมูลไม่หาย)" @confirm="unlink" />
    </div>

    <div class="section-title"><span>รอบเดือน</span></div>
    <div class="card">
      <label class="field">
        <span>เงินเดือนออกทุกวันที่</span>
        <select class="input" :value="state.settings.paydayDay" @change="store.setPaydayDay(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <p class="muted note">ถ้าตรงเสาร์ อาทิตย์ หรือวันหยุดด้านล่าง จะเลื่อนไปวันทำการก่อนหน้า รอบใหม่เริ่มตอนตี 3 ของวันเงินเดือนออก (เวลาที่เงินเข้า) และจบก่อนเงินเดือนรอบถัดไป</p>
    </div>

    <div class="section-title"><span>เงินเดือนออก 6 รอบถัดไป</span></div>
    <div class="card list">
      <div v-for="u in upcoming" :key="u.key" class="row">
        <span>{{ formatCycleLong(u.key) }}</span>
        <span :class="{ moved: u.moved }">{{ formatWeekday(u.payday) }}<template v-if="u.moved"> (เลื่อน)</template></span>
      </div>
    </div>

    <div class="section-title"><span>วันหยุดธนาคาร</span></div>
    <div class="card">
      <form class="add" @submit.prevent="add">
        <input v-model="newHoliday" type="date" class="input">
        <button class="btn btn-primary" type="submit">เพิ่ม</button>
      </form>
      <p class="muted note">ใส่วันหยุดปี 2569 และวันหยุดวันที่ตายตัวของปี 2570 ไว้ให้แล้ว วันหยุดทางจันทรคติและวันชดเชยของปี 2570 ต้องเพิ่มเองเมื่อ ธปท. ประกาศ</p>
      <div v-for="[year, days] in byYear" :key="year">
        <div class="year">พ.ศ. {{ buddhistYear(year) }}</div>
        <div class="chips">
          <span v-for="d in days" :key="d" class="chip">
            {{ dayLabel(d) }}
            <button type="button" aria-label="ลบ" @click="store.removeHoliday(d)">×</button>
          </span>
        </div>
      </div>
    </div>

    <div class="section-title"><span>บัญชีผู้ใช้</span></div>
    <div class="card user">
      <span>เข้าสู่ระบบเป็น <b>{{ auth.displayName.value }}</b></span>
      <button class="btn btn-danger" type="button" @click="logout">ออกจากระบบ</button>
    </div>
  </main>
</template>

<style scoped>
.note { font-size: 13px; margin: 0; }
.status { display: flex; gap: 8px; align-items: baseline; font-size: 14px; margin-bottom: 14px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); flex: none; transform: translateY(-1px); }
.status.idle .dot { background: var(--income); }
.status.syncing .dot { background: var(--accent); }
.status.error { color: var(--expense); }
.status.error .dot { background: var(--expense); }
.user { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.url-error { display: block; color: var(--expense); font-size: 13px; margin: 6px 4px 0; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.actions .btn:disabled { opacity: 0.5; }
.unlink { border: 0; background: none; font-size: 13px; margin-top: 12px; padding: 4px 8px; margin-left: -8px; border-radius: 8px; text-decoration: underline; }
.list { padding: 4px 16px; }
.row { display: flex; justify-content: space-between; gap: 8px; padding: 10px 0; font-size: 15px; }
.row + .row { border-top: 1px solid var(--line); }
.moved { color: var(--accent); font-weight: 600; }
.add { display: flex; gap: 8px; margin-bottom: 10px; }
.year { font-weight: 600; margin: 14px 0 6px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 2px; background: var(--card-2); border-radius: 99px; padding: 3px 4px 3px 10px; font-size: 13px; }
.chip button { border: 0; background: none; color: var(--muted); font-size: 16px; line-height: 1; padding: 0 6px; }
</style>
