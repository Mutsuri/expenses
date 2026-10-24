<script setup lang="ts">
import { cycleOf, shiftCycle, todayISO, type Cycle } from '#shared/utils/cycle'
import { formatCycleLong, formatDay, formatDayYear } from '#shared/utils/format'

const model = defineModel<string>({ required: true })
const { cycleSettings } = useStore()

const cycle = computed<Cycle>(() => shiftCycle(model.value, 0, cycleSettings.value))
const current = computed(() => cycleOf(todayISO(), cycleSettings.value).key)
const isCurrent = computed(() => model.value === current.value)

function move(by: number) {
  model.value = shiftCycle(model.value, by, cycleSettings.value).key
}
</script>

<template>
  <div class="card flex items-center p-2.5">
    <button class="size-10 rounded-xl bg-card-2 pb-[3px] text-2xl leading-none" aria-label="รอบก่อนหน้า" @click="move(-1)">‹</button>
    <div class="flex-1 text-center">
      <div class="font-semibold">
        รอบ{{ formatCycleLong(cycle.key) }}
        <!-- เว้นด้านบนให้วรรณยุกต์ไทย (ไม้โทบน "นี้") ไม่ชนขอบ -->
        <span
          v-if="isCurrent"
          class="ml-1 inline-block rounded-full bg-accent px-[9px] pt-2 pb-1 align-baseline text-[11px] leading-none font-semibold text-accent-ink"
        >
          รอบนี้
        </span>
      </div>
      <div class="text-[13px] text-muted">{{ formatDay(cycle.start) }} – {{ formatDayYear(cycle.end) }}</div>
    </div>
    <button
      class="size-10 rounded-xl bg-card-2 pb-[3px] text-2xl leading-none disabled:opacity-30"
      aria-label="รอบถัดไป"
      :disabled="model >= current"
      @click="move(1)"
    >
      ›
    </button>
  </div>
</template>
