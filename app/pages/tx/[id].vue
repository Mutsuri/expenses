<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const tx = computed(() => store.state.transactions.find((t) => t.id === id))

function remove() {
  store.removeTransaction(id)
  router.back()
}
</script>

<template>
  <main class="page">
    <TopBar title="แก้ไขรายการ" back />
    <template v-if="tx">
      <TxForm :initial="tx" @save="(v) => { store.updateTransaction(id, v); router.back() }" />
      <ConfirmButton class="btn btn-danger btn-block mt-2.5" label="ลบรายการ" confirm-label="แตะอีกครั้งเพื่อลบ" @confirm="remove" />
    </template>
    <p v-else class="text-muted">ไม่พบรายการนี้</p>
  </main>
</template>
