<script setup lang="ts">
// แจ้งเมื่อเริ่มรอบใหม่ และเงินคงเหลือรอบก่อนถูกยกมาให้แล้ว
// ขึ้นครั้งเดียวต่อรอบ จำไว้ในเครื่องว่าเห็นรอบไหนแล้ว
import { bankById } from '#shared/utils/banks'
import { cycleOf, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatCycleLong, formatCycleShort, formatMoney } from '#shared/utils/format'
import { accountCycles } from '#shared/utils/history'

const KEY = 'expenses.seenCycle'
const { state, cycleSettings } = useStore()
const today = todayISO()
const current = computed(() => cycleOf(today, cycleSettings.value))

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
      const row = accountCycles(a, state.transactions, cycleSettings.value, today).find((r) => r.cycle.key === current.value.key)
      return { id: a.id, name: a.name || bankById(a.bankId).name, amount: row?.carriedIn ?? 0 }
    })
    .filter((r) => r.amount !== 0),
)
const total = computed(() => carried.value.reduce((s, r) => s + r.amount, 0))
const show = computed(() => seen.value !== null && seen.value < current.value.key)
const prevLabel = computed(() => formatCycleShort(shiftCycle(current.value.key, -1, cycleSettings.value).key))
</script>

<template>
  <section v-if="show" class="card mb-3.5 border-2 border-accent" role="status">
    <div class="flex items-center justify-between gap-2">
      <b>🎉 เริ่มรอบ{{ formatCycleLong(current.key) }} แล้ว</b>
      <button class="px-1 text-[22px] leading-none text-muted" type="button" aria-label="ปิด" @click="markSeen">×</button>
    </div>
    <p v-if="carried.length" class="mt-1.5 text-[15px]">
      ยกเงินคงเหลือจากรอบ {{ prevLabel }} มาให้แล้ว รวม <b class="tabular-nums">฿{{ formatMoney(total) }}</b>
    </p>
    <p v-else class="mt-1.5 text-[15px]">รอบ {{ prevLabel }} ไม่มีเงินคงเหลือให้ยกมา</p>
    <ul v-if="carried.length > 1" class="mt-2 text-sm">
      <li v-for="r in carried" :key="r.id" class="flex justify-between py-1 text-muted">
        <span>{{ r.name }}</span>
        <span class="tabular-nums">{{ formatMoney(r.amount) }}</span>
      </li>
    </ul>
    <button class="btn btn-block mt-3" type="button" @click="markSeen">รับทราบ</button>
  </section>
</template>
