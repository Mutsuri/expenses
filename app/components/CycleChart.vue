<script setup lang="ts">
import { formatCycleShort } from '#shared/utils/format'
import type { CycleRow } from '#shared/utils/history'

const props = defineProps<{ rows: CycleRow[]; selected: string }>()
const emit = defineEmits<{ select: [key: string] }>()

// เก่าสุดอยู่ซ้าย สูงสุด 12 รอบ
const data = computed(() => props.rows.slice(0, 12).reverse())
const max = computed(() => Math.max(1, ...data.value.flatMap((r) => [r.summary.income, r.summary.expense])))

const W = 340
const H = 150
const TOP = 8
const slot = computed(() => W / Math.max(data.value.length, 6))
const barW = computed(() => Math.min(14, slot.value * 0.3))
const h = (v: number) => (v / max.value) * (H - TOP)
</script>

<template>
  <div class="card">
    <div class="mb-1.5 flex items-center gap-3.5 text-[13px]">
      <span><i class="mr-[5px] inline-block size-2.5 rounded-[3px] bg-income align-[-1px]" />รายรับ</span>
      <span><i class="mr-[5px] inline-block size-2.5 rounded-[3px] bg-expense align-[-1px]" />รายจ่าย</span>
    </div>
    <svg :viewBox="`0 0 ${W} ${H + 24}`" class="block h-auto w-full" role="img" aria-label="กราฟรายรับรายจ่ายแต่ละรอบ">
      <line :x1="0" :x2="W" :y1="H" :y2="H" class="stroke-line" />
      <!-- กดได้ทั้งช่อง (แท่ง + ชื่อเดือน) ไม่มีพื้นหลัง -->
      <g v-for="(r, i) in data" :key="r.cycle.key" class="cursor-pointer" @click="emit('select', r.cycle.key)">
        <rect :x="i * slot" y="0" :width="slot" :height="H + 24" class="fill-transparent" />
        <rect
          :x="i * slot + slot / 2 - barW - 1"
          :y="H - h(r.summary.income)"
          :width="barW"
          :height="h(r.summary.income)"
          rx="3"
          class="pointer-events-none fill-income"
        />
        <rect
          :x="i * slot + slot / 2 + 1"
          :y="H - h(r.summary.expense)"
          :width="barW"
          :height="h(r.summary.expense)"
          rx="3"
          class="pointer-events-none fill-expense"
        />
        <text
          :x="i * slot + slot / 2"
          :y="H + 17"
          text-anchor="middle"
          class="pointer-events-none text-[11px] select-none"
          :class="r.cycle.key === selected ? 'fill-ink font-semibold' : 'fill-muted'"
        >
          {{ formatCycleShort(r.cycle.key).split(' ')[0] }}
        </text>
      </g>
    </svg>
  </div>
</template>
