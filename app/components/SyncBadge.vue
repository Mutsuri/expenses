<script setup lang="ts">
const { sync, syncByUser } = useSync()

const view = computed(() => {
  if (sync.status === 'off') return null
  if (sync.status === 'syncing') return { cls: 'bg-card text-muted', icon: '⟳', text: 'กำลัง sync', spin: true }
  if (sync.status === 'error') return { cls: 'bg-expense-soft text-expense', icon: '!', text: 'sync ไม่สำเร็จ', spin: false }
  if (sync.pending) return { cls: 'bg-card text-muted', icon: '•', text: 'รอ sync', spin: false }
  return { cls: 'bg-card text-income', icon: '✓', text: 'sync แล้ว', spin: false }
})

const router = useRouter()
function tap() {
  if (sync.status === 'error') router.push('/settings')
  else if (sync.status !== 'syncing') syncByUser()
}
</script>

<template>
  <button
    v-if="view"
    class="inline-flex items-center gap-[5px] rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap shadow-card"
    :class="view.cls"
    type="button"
    :title="sync.error || undefined"
    @click="tap"
  >
    <span class="inline-block w-3.5 text-center" :class="{ 'animate-spin motion-reduce:animate-none': view.spin }">{{ view.icon }}</span>{{ view.text }}
  </button>
</template>
