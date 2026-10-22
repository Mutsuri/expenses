<script setup lang="ts">
const { sync, syncByUser } = useSync()

const view = computed(() => {
  if (sync.status === 'off') return null
  if (sync.status === 'syncing') return { cls: 'busy', icon: '⟳', text: 'กำลัง sync' }
  if (sync.status === 'error') return { cls: 'bad', icon: '!', text: 'sync ไม่สำเร็จ' }
  if (sync.pending) return { cls: 'wait', icon: '•', text: 'รอ sync' }
  return { cls: 'ok', icon: '✓', text: 'sync แล้ว' }
})

const router = useRouter()
function tap() {
  if (sync.status === 'error') router.push('/settings')
  else if (sync.status !== 'syncing') syncByUser()
}
</script>

<template>
  <button v-if="view" class="badge" :class="view.cls" type="button" :title="sync.error || undefined" @click="tap">
    <span class="icon">{{ view.icon }}</span>{{ view.text }}
  </button>
</template>

<style scoped>
.badge { display: inline-flex; align-items: center; gap: 5px; border: 0; border-radius: 99px; padding: 6px 12px; font-size: 13px; font-weight: 600; background: var(--card); box-shadow: var(--shadow); white-space: nowrap; }
.icon { display: inline-block; width: 14px; text-align: center; }
.ok { color: var(--income); }
.wait, .busy { color: var(--muted); }
.busy .icon { animation: spin 1s linear infinite; }
.bad { color: var(--expense); background: var(--expense-soft); }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .busy .icon { animation: none; } }
</style>
