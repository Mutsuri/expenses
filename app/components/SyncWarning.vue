<script setup lang="ts">
// เตือนบนหน้าแรกเมื่อไม่ได้ sync กับ Google Sheet นานเกินไป (ยังไม่เชื่อมต่อจะเข้าหน้าแรกไม่ได้)
const STALE_DAYS = 2
const DAY = 86_400_000

const { sync, syncByUser } = useSync()

const daysAgo = computed(() => (sync.lastSyncAt ? Math.floor((Date.now() - sync.lastSyncAt) / DAY) : null))
const stale = computed(() => sync.status !== 'syncing' && (daysAgo.value === null || daysAgo.value >= STALE_DAYS))
</script>

<template>
  <section v-if="stale" class="card mb-3.5 border-2 border-expense bg-expense-soft" role="alert">
    <b>⚠️ {{ daysAgo === null ? 'ยังไม่เคย sync กับ Google Sheet' : `ไม่ได้ sync กับ Google Sheet มา ${daysAgo} วันแล้ว` }}</b>
    <p v-if="sync.error" class="mt-1 text-sm">สาเหตุ: {{ sync.error }}</p>
    <p v-else class="mt-1 text-sm">ข้อมูลที่จดช่วงนี้ยังไม่ได้ขึ้นชีต</p>
    <div class="mt-2.5 flex gap-2">
      <button class="btn btn-primary px-3.5 py-2 text-sm" type="button" @click="syncByUser()">sync ตอนนี้</button>
      <NuxtLink to="/settings" class="btn px-3.5 py-2 text-sm">ตั้งค่า</NuxtLink>
    </div>
  </section>
</template>
