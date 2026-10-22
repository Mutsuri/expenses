<script setup lang="ts">
// เตือนบนหน้าแรกเมื่อไม่ได้ sync กับ Google Sheet นานเกินไป หรือยังไม่ได้เชื่อมต่อ
const STALE_DAYS = 2
const DAY = 86_400_000

const { sync, syncByUser } = useSync()

const daysAgo = computed(() => (sync.lastSyncAt ? Math.floor((Date.now() - sync.lastSyncAt) / DAY) : null))
const kind = computed<'off' | 'stale' | null>(() => {
  if (sync.status === 'off') return 'off'
  if (sync.status === 'syncing') return null
  if (daysAgo.value === null || daysAgo.value >= STALE_DAYS) return 'stale'
  return null
})
</script>

<template>
  <section v-if="kind" class="warn card" role="alert">
    <template v-if="kind === 'off'">
      <b>⚠️ ยังไม่ได้เชื่อมต่อ Google Sheet</b>
      <p>ข้อมูลอยู่ในเครื่องนี้อย่างเดียว</p>
      <div class="actions">
        <NuxtLink to="/settings" class="btn btn-primary">ไปตั้งค่า</NuxtLink>
      </div>
    </template>
    <template v-else>
      <b>⚠️ {{ daysAgo === null ? 'ยังไม่เคย sync กับ Google Sheet' : `ไม่ได้ sync กับ Google Sheet มา ${daysAgo} วันแล้ว` }}</b>
      <p v-if="sync.error">สาเหตุ: {{ sync.error }}</p>
      <p v-else>ข้อมูลที่จดช่วงนี้ยังไม่ได้ขึ้นชีต</p>
      <div class="actions">
        <button class="btn btn-primary" type="button" @click="syncByUser()">sync ตอนนี้</button>
        <NuxtLink to="/settings" class="btn">ตั้งค่า</NuxtLink>
      </div>
    </template>
  </section>
</template>

<style scoped>
.warn { margin-bottom: 14px; border: 2px solid var(--expense); background: var(--expense-soft); }
p { margin: 4px 0 0; font-size: 14px; }
.actions { display: flex; gap: 8px; margin-top: 10px; }
.actions .btn { padding: 8px 14px; font-size: 14px; }
</style>
