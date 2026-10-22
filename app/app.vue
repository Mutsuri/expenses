<script setup lang="ts">
const { state } = useStore()
useSync()
</script>

<template>
  <NuxtPage v-if="state.ready" />
  <SyncToast />
</template>
