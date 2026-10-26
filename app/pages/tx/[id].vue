<script setup lang="ts">
import { todayISO } from '#shared/utils/cycle'
import { formatMoney } from '#shared/utils/format'
import { installmentOf } from '#shared/utils/installment'

const store = useStore()
const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const tx = computed(() => store.state.transactions.find((t) => t.id === id))

// งวดของรายการผ่อน: แก้ได้ทีละงวด หรือลบทั้งแผน
const plan = installmentOf(id)
const planTxs = computed(() => (plan ? store.state.transactions.filter((t) => installmentOf(t.id)?.planId === plan.planId) : []))
const left = computed(() => planTxs.value.filter((t) => t.date > todayISO()))

function remove() {
  store.removeTransaction(id)
  router.back()
}
function removePlan() {
  store.removePlan(plan!.planId)
  router.back()
}
</script>

<template>
  <main class="page">
    <TopBar title="แก้ไขรายการ" back />
    <template v-if="tx">
      <div v-if="plan" class="card mb-3 text-[15px]">
        <b>💳 งวดที่ {{ plan.no }} จาก {{ plan.of }}</b>
        <p class="mt-0.5 text-sm text-muted">
          <template v-if="left.length">ยังไม่ถึงอีก {{ left.length }} งวด รวม {{ formatMoney(left.reduce((s, t) => s + t.amount, 0)) }}</template>
          <template v-else>ผ่อนครบทุกงวดแล้ว</template>
          · แก้ไขด้านล่างมีผลกับงวดนี้งวดเดียว
        </p>
      </div>
      <TxForm :initial="tx" @save="(v) => { store.updateTransaction(id, v); router.back() }" />
      <ConfirmButton class="btn btn-danger btn-block mt-2.5" :label="plan ? 'ลบงวดนี้' : 'ลบรายการ'" confirm-label="แตะอีกครั้งเพื่อลบ" @confirm="remove" />
      <ConfirmButton
        v-if="plan"
        class="btn btn-danger btn-block mt-2.5"
        :label="`ลบทุกงวด (${planTxs.length} งวด)`"
        confirm-label="แตะอีกครั้งเพื่อลบทุกงวด"
        @confirm="removePlan"
      />
    </template>
    <p v-else class="text-muted">ไม่พบรายการนี้</p>
  </main>
</template>
