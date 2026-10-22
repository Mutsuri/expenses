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
    <div v-for="r in rows" :key="r.category" class="row">
      <span class="icon">{{ r.cat.icon }}</span>
      <div class="body">
        <div class="top">
          <span>{{ r.cat.name }}</span>
          <span class="num"><span class="muted pct">{{ r.pct.toFixed(0) }}%</span> {{ formatMoney(r.amount) }}</span>
        </div>
        <div class="track"><div class="fill" :class="type" :style="{ width: `${r.pct}%` }" /></div>
      </div>
    </div>
  </div>
  <div v-else class="card muted empty">ยังไม่มี{{ type === 'expense' ? 'รายจ่าย' : 'รายรับ' }}ในรอบนี้</div>
</template>

<style scoped>
.row { display: flex; gap: 12px; align-items: center; padding: 6px 0; }
.icon { font-size: 22px; width: 32px; text-align: center; }
.body { flex: 1; }
.top { display: flex; justify-content: space-between; font-size: 15px; }
.pct { font-size: 13px; margin-right: 6px; }
.track { height: 6px; border-radius: 3px; background: var(--card-2); margin-top: 4px; overflow: hidden; }
.fill { height: 100%; border-radius: 3px; }
.fill.expense { background: var(--expense); }
.fill.income { background: var(--income); }
.empty { text-align: center; font-size: 14px; }
</style>
