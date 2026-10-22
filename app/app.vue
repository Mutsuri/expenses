<script setup lang="ts">
const { state } = useStore()
</script>

<template>
  <NuxtPage v-if="state.ready" />
</template>
