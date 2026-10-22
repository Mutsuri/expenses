<script setup lang="ts">
// แจ้งสั้น ๆ เมื่อการแก้ไขถูกบันทึกขึ้น Google Sheet แล้ว
const { sync } = useSync()
const show = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(() => sync.doneAt, (at) => {
  if (!at) return
  show.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (show.value = false), 2000)
})
</script>

<template>
  <Transition name="toast">
    <div v-if="show" class="toast" role="status">✓ sync ขึ้น Google Sheet แล้ว</div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  top: calc(env(safe-area-inset-top) + 12px);
  transform: translateX(-50%);
  z-index: 50;
  background: var(--text);
  color: var(--bg);
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.2);
  white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -8px); }
</style>
