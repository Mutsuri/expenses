<script setup lang="ts">
import type { CycleRow } from '#shared/utils/history'
import { formatMoney } from '#shared/utils/format'

// credit: บัตรเครดิต รายรับคือ CashBack รายจ่ายคือยอดที่ใช้ไป
defineProps<{ row: CycleRow; credit?: boolean }>()
</script>

<template>
  <div class="card grid grid-cols-2 gap-2.5">
    <div class="rounded-[14px] bg-income-soft px-3 py-2.5">
      <div class="text-[13px] text-muted">{{ credit ? 'CashBack' : 'รายรับ' }}</div>
      <div class="text-xl font-bold tabular-nums text-income">{{ formatMoney(row.summary.income) }}</div>
    </div>
    <div class="rounded-[14px] bg-expense-soft px-3 py-2.5">
      <div class="text-[13px] text-muted">{{ credit ? 'ใช้ไป' : 'รายจ่าย' }}</div>
      <div class="text-xl font-bold tabular-nums text-expense">{{ formatMoney(row.summary.expense) }}</div>
    </div>
    <!-- ชำระบัตรเครดิตไม่อยู่ในรายรับ/รายจ่าย แยกไว้บรรทัดล่าง -->
    <div v-if="row.summary.cardPay" class="col-span-2 flex justify-between px-1 text-sm">
      <span class="text-muted">💳 {{ credit ? 'ชำระบัตรแล้ว' : 'จ่ายบัตรเครดิต' }}</span>
      <b class="tabular-nums">{{ formatMoney(Math.abs(row.summary.cardPay)) }}</b>
    </div>
  </div>
</template>
