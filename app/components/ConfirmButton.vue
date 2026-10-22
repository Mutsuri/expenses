<script setup lang="ts">
// ปุ่มที่ต้องแตะสองครั้ง ใช้แทน confirm() ซึ่งบางเบราว์เซอร์บล็อก (เช่นแอปบนหน้าจอโฮม)
const props = withDefaults(defineProps<{ label: string; confirmLabel?: string }>(), { confirmLabel: 'แตะอีกครั้งเพื่อยืนยัน' })
const emit = defineEmits<{ confirm: [] }>()

const armed = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function tap() {
  if (armed.value) {
    clearTimeout(timer)
    armed.value = false
    emit('confirm')
    return
  }
  armed.value = true
  timer = setTimeout(() => (armed.value = false), 4000)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button type="button" :class="{ armed }" @click="tap">{{ armed ? props.confirmLabel : props.label }}</button>
</template>

<style scoped>
.armed { background: var(--expense) !important; color: #fff !important; }
</style>
