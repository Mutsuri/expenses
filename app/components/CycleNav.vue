<script setup lang="ts">
import { cycleOf, shiftCycle, cycleTodayISO, type Cycle } from '#shared/utils/cycle'
import { formatCycleLong, formatDay, formatDayYear } from '#shared/utils/format'

const model = defineModel<string>({ required: true })
const { state } = useStore()

const cycle = computed<Cycle>(() => shiftCycle(model.value, 0, state.settings))
const current = computed(() => cycleOf(cycleTodayISO(), state.settings).key)
const isCurrent = computed(() => model.value === current.value)

function move(by: number) {
  model.value = shiftCycle(model.value, by, state.settings).key
}
</script>

<template>
  <div class="nav card">
    <button class="arrow" aria-label="รอบก่อนหน้า" @click="move(-1)">‹</button>
    <div class="mid">
      <div class="title">
        รอบ{{ formatCycleLong(cycle.key) }}
        <span v-if="isCurrent" class="now">รอบนี้</span>
      </div>
      <div class="range muted">{{ formatDay(cycle.start) }} – {{ formatDayYear(cycle.end) }}</div>
    </div>
    <button class="arrow" aria-label="รอบถัดไป" :disabled="model >= current" @click="move(1)">›</button>
  </div>
</template>

<style scoped>
.nav { display: flex; align-items: center; padding: 10px; }
.mid { flex: 1; text-align: center; }
.title { font-weight: 600; }
.range { font-size: 13px; }
/* เว้นด้านบนให้วรรณยุกต์ไทย (ไม้โทบน "นี้") ไม่ชนขอบ */
.now { display: inline-block; font-size: 11px; font-weight: 600; line-height: 1; background: var(--accent); color: var(--accent-ink); border-radius: 99px; padding: 8px 9px 4px; margin-left: 4px; vertical-align: 0; }
.arrow { width: 40px; height: 40px; border: 0; border-radius: 12px; background: var(--card-2); font-size: 24px; line-height: 1; padding-bottom: 3px; }
.arrow:disabled { opacity: 0.3; }
</style>
