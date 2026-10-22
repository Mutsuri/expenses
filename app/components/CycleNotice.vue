<script setup lang="ts">
// แจ้งเมื่อเริ่มรอบใหม่ และเงินคงเหลือรอบก่อนถูกยกมาให้แล้ว
// ขึ้นครั้งเดียวต่อรอบ จำไว้ในเครื่องว่าเห็นรอบไหนแล้ว
import { bankById } from '#shared/utils/banks'
import { cycleOf, shiftCycle, cycleTodayISO } from '#shared/utils/cycle'
import { formatCycleLong, formatCycleShort, formatMoney } from '#shared/utils/format'
import { accountCycles } from '#shared/utils/history'

const KEY = 'expenses.seenCycle'
const { state } = useStore()
const today = cycleTodayISO()
const current = computed(() => cycleOf(today, state.settings))

function readSeen(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
function markSeen() {
  try {
    localStorage.setItem(KEY, current.value.key)
  } catch {}
  seen.value = current.value.key
}

const seen = ref(readSeen())
// เปิดแอปครั้งแรก: ถือว่าเห็นรอบนี้แล้ว ไม่ต้องแจ้ง
if (!seen.value) markSeen()

const carried = computed(() =>
  state.accounts
    .map((a) => {
      const row = accountCycles(a, state.transactions, state.settings, today).find((r) => r.cycle.key === current.value.key)
      return { id: a.id, name: a.name || bankById(a.bankId).name, amount: row?.carriedIn ?? 0 }
    })
    .filter((r) => r.amount !== 0),
)
const total = computed(() => carried.value.reduce((s, r) => s + r.amount, 0))
const show = computed(() => seen.value !== null && seen.value < current.value.key)
const prevLabel = computed(() => formatCycleShort(shiftCycle(current.value.key, -1, state.settings).key))
</script>

<template>
  <section v-if="show" class="notice card" role="status">
    <div class="top">
      <b>🎉 เริ่มรอบ{{ formatCycleLong(current.key) }} แล้ว</b>
      <button class="close" type="button" aria-label="ปิด" @click="markSeen">×</button>
    </div>
    <p v-if="carried.length">
      ยกเงินคงเหลือจากรอบ {{ prevLabel }} มาให้แล้ว รวม <b class="num">฿{{ formatMoney(total) }}</b>
    </p>
    <p v-else>รอบ {{ prevLabel }} ไม่มีเงินคงเหลือให้ยกมา</p>
    <ul v-if="carried.length > 1">
      <li v-for="r in carried" :key="r.id">
        <span>{{ r.name }}</span>
        <span class="num">{{ formatMoney(r.amount) }}</span>
      </li>
    </ul>
    <button class="btn btn-block ok" type="button" @click="markSeen">รับทราบ</button>
  </section>
</template>

<style scoped>
.notice { margin-bottom: 14px; border: 2px solid var(--accent); }
.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.close { border: 0; background: none; font-size: 22px; line-height: 1; color: var(--muted); padding: 0 4px; }
p { margin: 6px 0 0; font-size: 15px; }
ul { list-style: none; padding: 0; margin: 8px 0 0; font-size: 14px; }
li { display: flex; justify-content: space-between; padding: 4px 0; color: var(--muted); }
.ok { margin-top: 12px; }
</style>
