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
  <header class="bar">
    <button v-if="back" class="icon" aria-label="ย้อนกลับ" @click="goBack(back)">‹</button>
    <h1>{{ title }}</h1>
    <div class="right"><slot /></div>
  </header>
</template>

<style scoped>
.bar { display: flex; align-items: center; gap: 8px; min-height: 48px; margin-bottom: 8px; }
h1 { font-size: 22px; font-weight: 700; margin: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.icon { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--card); box-shadow: var(--shadow); font-size: 28px; line-height: 1; padding-bottom: 4px; }
.right { display: flex; gap: 8px; }
</style>
