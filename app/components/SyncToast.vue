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
  <Transition
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-200"
    enter-from-class="opacity-0 -translate-y-2"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="show"
      class="fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold whitespace-nowrap text-bg shadow-[0_6px_20px_rgb(0_0_0/0.2)]"
      role="status"
    >
      ✓ sync ขึ้น Google Sheet แล้ว
    </div>
  </Transition>
</template>
