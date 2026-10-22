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
  <section v-if="kind" class="card mb-3.5 border-2 border-expense bg-expense-soft" role="alert">
    <template v-if="kind === 'off'">
      <b>⚠️ ยังไม่ได้เชื่อมต่อ Google Sheet</b>
      <p class="mt-1 text-sm">ข้อมูลอยู่ในเครื่องนี้อย่างเดียว</p>
      <div class="mt-2.5 flex gap-2">
        <NuxtLink to="/settings" class="btn btn-primary px-3.5 py-2 text-sm">ไปตั้งค่า</NuxtLink>
      </div>
    </template>
    <template v-else>
      <b>⚠️ {{ daysAgo === null ? 'ยังไม่เคย sync กับ Google Sheet' : `ไม่ได้ sync กับ Google Sheet มา ${daysAgo} วันแล้ว` }}</b>
      <p v-if="sync.error" class="mt-1 text-sm">สาเหตุ: {{ sync.error }}</p>
      <p v-else class="mt-1 text-sm">ข้อมูลที่จดช่วงนี้ยังไม่ได้ขึ้นชีต</p>
      <div class="mt-2.5 flex gap-2">
        <button class="btn btn-primary px-3.5 py-2 text-sm" type="button" @click="syncByUser()">sync ตอนนี้</button>
        <NuxtLink to="/settings" class="btn px-3.5 py-2 text-sm">ตั้งค่า</NuxtLink>
      </div>
    </template>
  </section>
</template>
