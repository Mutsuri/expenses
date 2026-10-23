<script setup lang="ts">
import type { CycleRow } from '#shared/utils/history'
import { formatMoney } from '#shared/utils/format'

defineProps<{ row: CycleRow }>()
</script>

<template>
  <div class="card grid grid-cols-2 gap-2.5">
    <div class="rounded-[14px] bg-income-soft px-3 py-2.5">
      <div class="text-[13px] text-muted">รายรับ</div>
      <div class="text-xl font-bold tabular-nums text-income">{{ formatMoney(row.summary.income) }}</div>
    </div>
    <div class="rounded-[14px] bg-expense-soft px-3 py-2.5">
      <div class="text-[13px] text-muted">รายจ่าย</div>
      <div class="text-xl font-bold tabular-nums text-expense">{{ formatMoney(row.summary.expense) }}</div>
    </div>
  </div>
</template>
