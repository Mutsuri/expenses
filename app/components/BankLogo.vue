<script setup lang="ts">
import { bankById } from '#shared/utils/banks'

const props = withDefaults(defineProps<{ bankId: string; size?: number }>(), { size: 44 })
const bank = computed(() => bankById(props.bankId))
const base = useRuntimeConfig().app.baseURL
</script>

<template>
  <!-- ไฟล์โลโก้เป็นสัญลักษณ์สีขาว พื้นสีประจำธนาคารใส่ตรงนี้ -->
  <span class="logo" :style="{ width: `${size}px`, height: `${size}px`, background: bank.color, fontSize: `${size * 0.5}px` }">
    <img v-if="bank.logo" :src="`${base}banks/${bank.id}.svg`" :alt="bank.name">
    <template v-else>{{ bank.id === 'cash' ? '💵' : '👛' }}</template>
  </span>
</template>

<style scoped>
.logo { border-radius: 26%; flex: none; display: grid; place-items: center; overflow: hidden; }
img { width: 100%; height: 100%; display: block; }
</style>
