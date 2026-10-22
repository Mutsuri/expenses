<script setup lang="ts">
import { formatCycleShort, formatMoney } from '#shared/utils/format'
import type { CycleRow } from '~/utils/history'

const props = defineProps<{ rows: CycleRow[]; selected: string }>()
const emit = defineEmits<{ select: [key: string] }>()

// เก่าสุดอยู่ซ้าย สูงสุด 12 รอบ
const data = computed(() => props.rows.slice(0, 12).reverse())
const max = computed(() => Math.max(1, ...data.value.flatMap((r) => [r.summary.income, r.summary.expense])))

const W = 340
const H = 150
const slot = computed(() => W / Math.max(data.value.length, 6))
const barW = computed(() => Math.min(14, slot.value * 0.3))
const h = (v: number) => (v / max.value) * (H - 8)
</script>

<template>
  <div class="card">
    <div class="legend">
      <span><i class="dot in" />รายรับ</span>
      <span><i class="dot out" />รายจ่าย</span>
      <span class="muted max num">สูงสุด {{ formatMoney(max, { short: true }) }}</span>
    </div>
    <svg :viewBox="`0 0 ${W} ${H + 24}`" class="chart" role="img" aria-label="กราฟรายรับรายจ่ายแต่ละรอบ">
      <line :x1="0" :x2="W" :y1="H" :y2="H" class="base" />
      <g v-for="(r, i) in data" :key="r.cycle.key" class="col" @click="emit('select', r.cycle.key)">
        <rect :x="i * slot" y="0" :width="slot" :height="H + 24" class="hit" :class="{ on: r.cycle.key === selected }" rx="8" />
        <rect :x="i * slot + slot / 2 - barW - 1" :y="H - h(r.summary.income)" :width="barW" :height="h(r.summary.income)" rx="3" class="bar-in" />
        <rect :x="i * slot + slot / 2 + 1" :y="H - h(r.summary.expense)" :width="barW" :height="h(r.summary.expense)" rx="3" class="bar-out" />
        <text :x="i * slot + slot / 2" :y="H + 17" text-anchor="middle" class="lbl">{{ formatCycleShort(r.cycle.key).split(' ')[0] }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.legend { display: flex; gap: 14px; font-size: 13px; margin-bottom: 6px; align-items: center; }
.max { margin-left: auto; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
.dot.in { background: var(--income); }
.dot.out { background: var(--expense); }
.chart { width: 100%; height: auto; display: block; }
.base { stroke: var(--line); }
.hit { fill: transparent; cursor: pointer; }
.hit.on { fill: var(--card-2); }
.bar-in { fill: var(--income); }
.bar-out { fill: var(--expense); }
.lbl { font-size: 11px; fill: var(--muted); }
</style>
