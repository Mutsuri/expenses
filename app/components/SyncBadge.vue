<script setup lang="ts">
// ปุ่มเมฆ Google Sheet: จุดมุมขวาล่างบอกสถานะ sync (แบบเดียวกับแอป Wishbook)
const { sync, syncByUser } = useSync()

const label = computed(() => {
  if (sync.status === 'off') return 'ยังไม่ได้เชื่อมต่อ'
  if (sync.status === 'syncing') return 'กำลัง sync'
  if (sync.status === 'error') return `sync ไม่สำเร็จ${sync.error ? `: ${sync.error}` : ''}`
  return sync.pending ? 'รอ sync' : 'sync แล้ว'
})
const dot = computed(() => {
  if (sync.status === 'off') return 'bg-muted/50'
  if (sync.status === 'syncing') return 'bg-accent animate-pulse motion-reduce:animate-none'
  if (sync.status === 'error') return 'bg-expense'
  return sync.pending ? 'bg-accent' : 'bg-income'
})

const router = useRouter()
// ยังไม่เชื่อมต่อหรือ sync ไม่สำเร็จ: ไปหน้าตั้งค่า ไม่งั้นกด sync ทันที
function tap() {
  if (sync.status === 'off' || sync.status === 'error') router.push('/settings')
  else if (sync.status !== 'syncing') syncByUser()
}
</script>

<template>
  <button
    class="relative grid size-10 place-items-center rounded-full bg-card text-muted shadow-card active:scale-90"
    type="button"
    :aria-label="`Google Sheet: ${label}`"
    :title="`Google Sheet: ${label}`"
    @click="tap"
  >
    <svg viewBox="0 0 24 24" class="size-[22px] fill-none stroke-current stroke-[1.7]" aria-hidden="true">
      <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.5 9.6 4.5 4.5 0 0 0 7 18.5z" stroke-linejoin="round" />
    </svg>
    <span class="absolute right-1.5 bottom-2 size-2.5 rounded-full ring-2 ring-card" :class="dot" aria-hidden="true" />
  </button>
</template>
