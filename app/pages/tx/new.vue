<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const accountId = typeof route.query.account === 'string' ? route.query.account : undefined

if (!store.state.accounts.length) router.replace('/accounts/new')
</script>

<template>
  <main class="page">
    <TopBar title="จดรายการ" back />
    <TxForm :account-id="accountId" @save="(v) => { store.addTransaction(v); router.back() }" />
  </main>
</template>
