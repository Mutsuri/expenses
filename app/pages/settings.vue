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
</script>

<template>
  <main class="page">
    <TopBar title="ตั้งค่า" back="/" />

    <div class="section-title"><span>รอบเดือน</span></div>
    <div class="card">
      <label class="field">
        <span>เงินเดือนออกทุกวันที่</span>
        <select class="input" :value="state.settings.paydayDay" @change="store.setPaydayDay(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>
      <p class="muted note">ถ้าตรงเสาร์ อาทิตย์ หรือวันหยุดด้านล่าง จะเลื่อนไปวันทำการก่อนหน้า รอบเดือนเริ่มวันเงินเดือนออก และจบวันก่อนเงินเดือนรอบถัดไป</p>
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
  </main>
</template>

<style scoped>
.note { font-size: 13px; margin: 0; }
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
