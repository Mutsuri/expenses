<script setup lang="ts">
import { bankById } from '#shared/utils/banks'

const props = withDefaults(defineProps<{ bankId: string; size?: number }>(), { size: 44 })
const bank = computed(() => bankById(props.bankId))
const base = useRuntimeConfig().app.baseURL
</script>

<template>
  <!-- ไฟล์โลโก้เป็นสัญลักษณ์สีขาว พื้นสีประจำธนาคารใส่ตรงนี้ -->
  <span
    class="grid flex-none place-items-center overflow-hidden rounded-[26%]"
    :style="{ width: `${size}px`, height: `${size}px`, background: bank.color, fontSize: `${size * 0.5}px` }"
  >
    <!-- สัญลักษณ์ในไฟล์เต็มกรอบ ย่อให้มีขอบเหมือนภาพตัวอย่างของ omise/banks-logo -->
    <img v-if="bank.logo" class="block size-[78%]" :src="`${base}banks/${bank.id}.svg`" :alt="bank.name">
    <template v-else>{{ ({ credit: '💳', cash: '💵' } as Record<string, string>)[bank.id] ?? '👛' }}</template>
  </span>
</template>
