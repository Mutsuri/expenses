<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const account = computed(() => store.state.accounts.find((a) => a.id === id))
const txCount = computed(() => store.state.transactions.filter((t) => t.accountId === id).length)

const confirmText = computed(() => (txCount.value ? `แตะอีกครั้งเพื่อลบ (รวม ${txCount.value} รายการ)` : 'แตะอีกครั้งเพื่อลบ'))

function remove() {
  store.removeAccount(id)
  router.replace('/')
}
</script>

<template>
  <main class="page">
    <TopBar title="แก้ไขบัญชี" :back="`/accounts/${id}`" />
    <template v-if="account">
      <AccountForm :initial="account" @save="(v) => { store.updateAccount(id, v); router.replace(`/accounts/${id}`) }" />
      <ConfirmButton class="btn btn-danger btn-block mt-2.5" label="ลบบัญชี" :confirm-label="confirmText" @confirm="remove" />
    </template>
    <p v-else class="text-muted">ไม่พบบัญชีนี้</p>
  </main>
</template>
