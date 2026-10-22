<script setup lang="ts">
const store = useStore()
const router = useRouter()
</script>

<template>
  <main class="page">
    <TopBar title="เพิ่มบัญชี" back="/" />
    <AccountForm @save="(v) => router.replace(`/accounts/${store.addAccount(v)}`)" />
  </main>
</template>
