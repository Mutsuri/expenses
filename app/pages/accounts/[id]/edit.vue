<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const account = computed(() => store.state.accounts.find((a) => a.id === id))
const txCount = computed(() => store.state.transactions.filter((t) => t.accountId === id).length)

function remove() {
  const msg = txCount.value ? `ลบบัญชีนี้และรายการทั้งหมด ${txCount.value} รายการ?` : 'ลบบัญชีนี้?'
  if (!confirm(msg)) return
  store.removeAccount(id)
  router.replace('/')
}
</script>

<template>
  <main class="page">
    <TopBar title="แก้ไขบัญชี" :back="`/accounts/${id}`" />
    <template v-if="account">
      <AccountForm :initial="account" @save="(v) => { store.updateAccount(id, v); router.replace(`/accounts/${id}`) }" />
      <button class="btn btn-danger btn-block del" @click="remove">ลบบัญชี</button>
    </template>
    <p v-else class="muted">ไม่พบบัญชีนี้</p>
  </main>
</template>

<style scoped>
.del { margin-top: 10px; }
</style>
