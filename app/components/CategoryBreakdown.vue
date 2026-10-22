<script setup lang="ts">
import { categoryById, type TxType } from '#shared/utils/categories'
import { formatMoney } from '#shared/utils/format'
import type { CycleSummary } from '#shared/utils/stats'

const props = defineProps<{ summary: CycleSummary; type: TxType }>()

const rows = computed(() => {
  const list = props.summary.byCategory.filter((c) => c.type === props.type)
  const total = list.reduce((s, c) => s + c.amount, 0)
  return list.map((c) => ({ ...c, cat: categoryById(c.type, c.category), pct: total ? (c.amount / total) * 100 : 0 }))
})
</script>

<template>
  <div v-if="rows.length" class="card">
    <div v-for="r in rows" :key="r.category" class="flex items-center gap-3 py-1.5">
      <span class="w-8 text-center text-[22px]">{{ r.cat.icon }}</span>
      <div class="flex-1">
        <div class="flex justify-between text-[15px]">
          <span>{{ r.cat.name }}</span>
          <span class="tabular-nums"><span class="mr-1.5 text-[13px] text-muted">{{ r.pct.toFixed(0) }}%</span> {{ formatMoney(r.amount) }}</span>
        </div>
        <div class="mt-1 h-1.5 overflow-hidden rounded-[3px] bg-card-2">
          <div class="h-full rounded-[3px]" :class="type === 'income' ? 'bg-income' : 'bg-expense'" :style="{ width: `${r.pct}%` }" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="card text-center text-sm text-muted">ยังไม่มี{{ type === 'expense' ? 'รายจ่าย' : 'รายรับ' }}ในรอบนี้</div>
</template>
