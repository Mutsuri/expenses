<script setup lang="ts">
// เลือกวันที่ด้วยปฏิทินภาษาไทย (พ.ศ.) แทน <input type="date">
import { fromISO, todayISO, toISO } from '#shared/utils/cycle'
import { formatWeekdayYear } from '#shared/utils/format'

const model = defineModel<string>({ required: true })
const today = todayISO()

const open = ref(false)
// เดือนที่ปฏิทินแสดงอยู่ 'YYYY-MM'
const month = ref(model.value.slice(0, 7))
watch(open, (o) => o && (month.value = model.value.slice(0, 7)))

const monthFmt = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const title = computed(() => monthFmt.format(fromISO(`${month.value}-01`)))
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

// ช่องวันของเดือน เริ่มวันอาทิตย์ ช่องว่างก่อนวันที่ 1 เป็น null
const cells = computed(() => {
  const first = fromISO(`${month.value}-01`)
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return [
    ...Array.from({ length: first.getUTCDay() }, () => null),
    ...Array.from({ length: days }, (_, i) => `${month.value}-${String(i + 1).padStart(2, '0')}`),
  ]
})

function shift(by: number) {
  const d = fromISO(`${month.value}-01`)
  d.setUTCMonth(d.getUTCMonth() + by)
  month.value = toISO(d).slice(0, 7)
}
function pick(iso: string) {
  model.value = iso
  open.value = false
}
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-card-2 px-3.5 py-2.5 text-left"
      :class="open ? 'border-accent' : 'border-transparent'"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="truncate">📅 {{ formatWeekdayYear(model) }}</span>
      <span class="text-muted transition-transform" :class="{ 'rotate-90': open }" aria-hidden="true">›</span>
    </button>

    <div v-if="open" class="mt-2 rounded-xl bg-card-2 p-3">
      <div class="mb-2 flex items-center justify-between">
        <button type="button" class="size-8 rounded-lg text-xl leading-none hover:bg-card" aria-label="เดือนก่อน" @click="shift(-1)">‹</button>
        <b class="text-[15px]">{{ title }}</b>
        <button type="button" class="size-8 rounded-lg text-xl leading-none hover:bg-card" aria-label="เดือนถัดไป" @click="shift(1)">›</button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-sm">
        <span v-for="w in WEEKDAYS" :key="w" class="py-1 text-xs text-muted">{{ w }}</span>
        <template v-for="(iso, i) in cells" :key="iso ?? `blank-${i}`">
          <span v-if="!iso" />
          <button
            v-else
            type="button"
            class="aspect-square rounded-lg tabular-nums transition-colors"
            :class="
              iso === model
                ? 'bg-accent font-semibold text-accent-ink'
                : iso === today
                  ? 'font-semibold text-accent ring-1 ring-accent ring-inset hover:bg-card'
                  : 'hover:bg-card'
            "
            @click="pick(iso)"
          >
            {{ Number(iso.slice(8)) }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
