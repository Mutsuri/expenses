<script setup lang="ts">
// ปุ่มตา ซ่อน/แสดงจำนวนเงินของบัญชีรับเงินเดือน (ใช้ในลิงก์ได้ ไม่พาไปหน้าอื่น)
const { hidden, toggle } = useHideSalary()
</script>

<template>
  <button
    type="button"
    class="grid size-8 flex-none place-items-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-ink"
    :aria-label="hidden ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'"
    :title="hidden ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'"
    @click.prevent.stop="toggle"
  >
    <svg viewBox="0 0 24 24" class="size-5 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke-linejoin="round" />
      <circle cx="12" cy="12" r="3" />
      <path v-if="hidden" d="M4 4l16 16" stroke-linecap="round" />
    </svg>
  </button>
</template>
