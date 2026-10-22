<script setup lang="ts">
// boolean มาก่อน string เพื่อให้เขียน <TopBar back /> แล้วได้ true
defineProps<{ title: string; back?: boolean | string }>()
const router = useRouter()

function goBack(to: string | boolean) {
  if (typeof to === 'string') router.push(to)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="mb-2 flex min-h-12 items-center gap-2">
    <button
      v-if="back"
      class="size-10 rounded-full bg-card pb-1 text-[28px] leading-none shadow-card"
      aria-label="ย้อนกลับ"
      @click="goBack(back)"
    >
      ‹
    </button>
    <h1 class="m-0 flex-1 truncate text-[22px] font-bold">{{ title }}</h1>
    <div class="flex gap-2"><slot /></div>
  </header>
</template>
