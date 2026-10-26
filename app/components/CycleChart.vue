<script setup lang="ts">
import { formatCycleLong, formatCycleShort, formatMoney, formatMoneyCompact } from '#shared/utils/format'
import type { CycleRow } from '#shared/utils/history'

const props = defineProps<{ rows: CycleRow[]; selected: string }>()
const emit = defineEmits<{ select: [key: string] }>()

// เก่าสุดอยู่ซ้าย สูงสุด 12 รอบ
const data = computed(() => props.rows.slice(0, 12).reverse())
const max = computed(() => Math.max(1, ...data.value.flatMap((r) => [r.summary.income, r.summary.expense])))

const W = 340
const H = 150
// เว้นด้านบนให้ตัวเลขบนหัวแท่ง
const TOP = 18
const slot = computed(() => W / Math.max(data.value.length, 6))
const barW = computed(() => Math.min(20, slot.value * 0.34))
const h = (v: number) => (v / max.value) * (H - TOP)

// ชี้เมาส์ดูรอบอื่นได้ ไม่ชี้ = รอบที่เลือก
const hovered = ref<string | null>(null)
const active = computed(
  () => data.value.find((r) => r.cycle.key === (hovered.value ?? props.selected)) ?? data.value[data.value.length - 1],
)

/** แท่งปลายมน 4px ฐานตรง */
function bar(x: number, v: number) {
  if (v <= 0) return ''
  const top = H - h(v)
  const w = barW.value
  const r = Math.min(4, h(v), w / 2)
  return `M${x},${H}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${H}Z`
}
</script>

<template>
  <div class="card">
    <div class="mb-1.5 flex items-center gap-3.5 text-[13px]">
      <span><i class="mr-[5px] inline-block size-2.5 rounded-[3px] bg-income align-[-1px]" />รายรับ</span>
      <span><i class="mr-[5px] inline-block size-2.5 rounded-[3px] bg-expense align-[-1px]" />รายจ่าย</span>
    </div>
    <svg :viewBox="`0 0 ${W} ${H + 24}`" class="block h-auto w-full" role="img" aria-label="กราฟรายรับรายจ่ายแต่ละรอบ" @mouseleave="hovered = null">
      <line :x1="0" :x2="W" :y1="H" :y2="H" class="stroke-line" />
      <!-- กด/ชี้ได้ทั้งช่อง (แท่ง + ชื่อเดือน) รอบที่ดูอยู่เข้ม รอบอื่นจางลง -->
      <g
        v-for="(r, i) in data"
        :key="r.cycle.key"
        class="cursor-pointer"
        @click="emit('select', r.cycle.key)"
        @mouseenter="hovered = r.cycle.key"
      >
        <rect :x="i * slot" y="0" :width="slot" :height="H + 24" class="fill-transparent" />
        <g class="pointer-events-none transition-opacity" :opacity="r === active ? 1 : 0.4">
          <path :d="bar(i * slot + slot / 2 - barW - 1, r.summary.income)" class="fill-income" />
          <path :d="bar(i * slot + slot / 2 + 1, r.summary.expense)" class="fill-expense" />
        </g>
        <!-- ตัวเลขบนหัวแท่งเฉพาะรอบที่ดูอยู่ -->
        <template v-if="r === active">
          <text
            v-if="r.summary.income"
            :x="i * slot + slot / 2 - barW / 2 - 1"
            :y="H - h(r.summary.income) - 5"
            text-anchor="middle"
            class="pointer-events-none fill-ink text-[10px] font-semibold select-none"
          >
            {{ formatMoneyCompact(r.summary.income) }}
          </text>
          <text
            v-if="r.summary.expense"
            :x="i * slot + slot / 2 + barW / 2 + 1"
            :y="H - h(r.summary.expense) - 5"
            text-anchor="middle"
            class="pointer-events-none fill-ink text-[10px] font-semibold select-none"
          >
            {{ formatMoneyCompact(r.summary.expense) }}
          </text>
        </template>
        <text
          :x="i * slot + slot / 2"
          :y="H + 17"
          text-anchor="middle"
          class="pointer-events-none text-[11px] select-none"
          :class="r === active ? 'fill-ink font-semibold' : 'fill-muted'"
        >
          {{ formatCycleShort(r.cycle.key).split(' ')[0] }}
        </text>
      </g>
    </svg>

    <!-- รายละเอียดของรอบที่ดูอยู่ -->
    <div v-if="active" class="mt-3 border-t border-line pt-3">
      <b class="mb-2 block">รอบ{{ formatCycleLong(active.cycle.key) }}</b>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm min-[420px]:grid-cols-4">
        <div>
          <dt class="text-xs text-muted">รายรับ</dt>
          <dd class="font-semibold tabular-nums text-income">{{ formatMoney(active.summary.income) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">รายจ่าย</dt>
          <dd class="font-semibold tabular-nums text-expense">{{ formatMoney(active.summary.expense) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">สุทธิ</dt>
          <dd class="font-semibold tabular-nums">{{ formatMoney(active.summary.net, { sign: true }) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">คงเหลือสิ้นรอบ</dt>
          <dd class="font-semibold tabular-nums">{{ formatMoney(active.summary.closing) }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
