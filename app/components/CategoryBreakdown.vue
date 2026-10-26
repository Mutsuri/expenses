<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { categoryById, type TxType } from '#shared/utils/categories'
import { formatDay, formatMoney } from '#shared/utils/format'
import type { CycleSummary, Transaction } from '#shared/utils/stats'

const props = defineProps<{
  summary: CycleSummary
  type: TxType
  /** ใส่มาเมื่อต้องการให้แตะหมวดเพื่อขยายดูรายการในหมวดนั้น */
  itemsFor?: (type: TxType, category: string) => Transaction[]
}>()
const { state } = useStore()

const rows = computed(() => {
  const list = props.summary.byCategory.filter((c) => c.type === props.type)
  const total = list.reduce((s, c) => s + c.amount, 0)
  return list.map((c) => ({ ...c, cat: categoryById(c.type, c.category), pct: total ? (c.amount / total) * 100 : 0 }))
})

// หมวดที่ขยายอยู่ (เปิดได้หลายหมวดพร้อมกัน)
const open = ref(new Set<string>())
watch(() => props.type, () => (open.value = new Set()))
function toggle(category: string) {
  const next = new Set(open.value)
  if (!next.delete(category)) next.add(category)
  open.value = next
}

const accountName = (id?: string) => {
  const a = state.accounts.find((x) => x.id === id)
  return a ? a.name || bankById(a.bankId).name : ''
}
// ใหม่สุดก่อน
const items = (category: string) =>
  [...(props.itemsFor?.(props.type, category) ?? [])].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
</script>

<template>
  <div v-if="rows.length" class="card">
    <div v-for="r in rows" :key="r.category">
      <component
        :is="itemsFor ? 'button' : 'div'"
        :type="itemsFor ? 'button' : undefined"
        class="flex w-full items-center gap-3 py-1.5 text-left"
        :aria-expanded="itemsFor ? open.has(r.category) : undefined"
        @click="itemsFor && toggle(r.category)"
      >
        <span class="w-8 text-center text-[22px]">{{ r.cat.icon }}</span>
        <div class="flex-1">
          <div class="flex justify-between text-[15px]">
            <span>{{ r.cat.name }}</span>
            <span class="tabular-nums"><span class="mr-1.5 text-[13px] text-muted">{{ r.pct.toFixed(0) }}%</span> {{ formatMoney(r.amount) }}</span>
          </div>
          <div class="mt-1 h-1.5 overflow-hidden rounded-[3px] bg-card-2">
            <div class="h-full rounded-[3px]" :class="type === 'income' ? 'bg-income' : 'bg-expense'" :style="{ width: `${r.pct}%` }" />
          </div>
        </div>
        <span v-if="itemsFor" class="w-4 text-center text-muted transition-transform" :class="{ 'rotate-90': open.has(r.category) }" aria-hidden="true">›</span>
      </component>

      <!-- รายการในหมวดนี้ แตะเพื่อแก้ไข -->
      <div v-if="itemsFor && open.has(r.category)" class="mb-2 ml-11 divide-y divide-line rounded-xl bg-card-2 px-3">
        <NuxtLink v-for="t in items(r.category)" :key="t.id" :to="`/tx/${t.id}`" class="flex items-center gap-3 py-2 text-sm">
          <span class="w-14 flex-none text-[13px] text-muted">{{ formatDay(t.date) }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate">{{ t.note || r.cat.name }}</div>
            <div class="truncate text-xs text-muted">
              {{ accountName(t.accountId) }}<template v-if="t.toAccountId"> → {{ accountName(t.toAccountId) }}</template>
            </div>
          </div>
          <span class="flex-none tabular-nums">{{ formatMoney(t.amount) }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
  <div v-else class="card text-center text-sm text-muted">ยังไม่มี{{ type === 'expense' ? 'รายจ่าย' : 'รายรับ' }}ในรอบนี้</div>
</template>
