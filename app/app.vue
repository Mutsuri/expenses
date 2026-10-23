<script setup lang="ts">
const { state } = useStore()
const route = useRoute()
// เปิดข้อมูลของผู้ใช้ที่จำไว้ (ถ้ามี) ก่อนแสดงหน้า
useAuth()
useSync()
</script>

<template>
  <!-- หน้าอื่นนอกจาก login รอจนเปิดข้อมูลของผู้ใช้เสร็จ -->
  <NuxtPage v-if="state.ready || route.path === '/login'" />
  <SyncToast />
</template>
