<script setup lang="ts">
import type { CycleRow } from '#shared/utils/history'
import { shiftCycle } from '#shared/utils/cycle'
import { formatCycleShort, formatMoney } from '#shared/utils/format'

const props = defineProps<{ row: CycleRow }>()
const { state } = useStore()
const prevLabel = computed(() => formatCycleShort(shiftCycle(props.row.cycle.key, -1, state.settings).key))
// เงินเข้าทั้งหมดของรอบ: ยกมา + ยอดเริ่มต้นบัญชี (รอบแรก) + รายรับ
const totalIn = computed(() => props.row.carriedIn + props.row.starting + props.row.summary.income)
</script>

<template>
  <div class="card">
    <div class="mb-2.5 grid grid-cols-2 gap-2.5">
      <div class="rounded-[14px] bg-income-soft px-3 py-2.5">
        <div class="text-[13px] text-muted">รายรับ</div>
        <div class="text-xl font-bold tabular-nums text-income">{{ formatMoney(row.summary.income) }}</div>
      </div>
      <div class="rounded-[14px] bg-expense-soft px-3 py-2.5">
        <div class="text-[13px] text-muted">รายจ่าย</div>
        <div class="text-xl font-bold tabular-nums text-expense">{{ formatMoney(row.summary.expense) }}</div>
      </div>
    </div>
    <!-- รายรับทั้งหมด − รายจ่ายทั้งหมด = คงเหลือ -->
    <div class="divide-y divide-line text-[15px] [&>div]:flex [&>div]:justify-between [&>div]:px-1 [&>div]:py-1.5">
      <div v-if="row.carriedIn">
        <span>ยกมาจากรอบ {{ prevLabel }}</span>
        <span class="tabular-nums">{{ formatMoney(row.carriedIn) }}</span>
      </div>
      <div>
        <span>รายรับทั้งหมด</span>
        <span class="tabular-nums text-income">{{ formatMoney(totalIn) }}</span>
      </div>
      <div>
        <span>รายจ่ายทั้งหมด</span>
        <span class="tabular-nums text-expense">{{ formatMoney(row.summary.expense) }}</span>
      </div>
      <div class="text-base">
        <span>คงเหลือ</span>
        <b class="tabular-nums">{{ formatMoney(row.summary.closing) }}</b>
      </div>
    </div>
  </div>
</template>
