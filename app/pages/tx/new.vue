<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const accountId = typeof route.query.account === 'string' ? route.query.account : undefined
const type = route.query.type === 'transfer' ? 'transfer' : undefined
const toAccountId = typeof route.query.to === 'string' ? route.query.to : undefined

if (!store.state.accounts.length) router.replace('/accounts/new')

function save(v: Parameters<typeof store.addTransaction>[0], months?: number) {
  if (months) store.addInstallments(v, months)
  else store.addTransaction(v)
  router.back()
}
</script>

<template>
  <main class="page">
    <TopBar :title="type === 'transfer' ? (toAccountId ? 'ชำระบัตรเครดิต' : 'โอนเงิน') : 'จดรายการ'" back />
    <TxForm :account-id="accountId" :type="type" :to-account-id="toAccountId" @save="save" />
  </main>
</template>
