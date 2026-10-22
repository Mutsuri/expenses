<script setup lang="ts">
const store = useStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const tx = computed(() => store.state.transactions.find((t) => t.id === id))

function remove() {
  if (!confirm('ลบรายการนี้?')) return
  store.removeTransaction(id)
  router.back()
}
</script>

<template>
  <main class="page">
    <TopBar title="แก้ไขรายการ" back />
    <template v-if="tx">
      <TxForm :initial="tx" @save="(v) => { store.updateTransaction(id, v); router.back() }" />
      <button class="btn btn-danger btn-block del" @click="remove">ลบรายการ</button>
    </template>
    <p v-else class="muted">ไม่พบรายการนี้</p>
  </main>
</template>

<style scoped>
.del { margin-top: 10px; }
</style>
