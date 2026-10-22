<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { CATEGORIES } from '#shared/utils/categories'
import { todayISO } from '#shared/utils/cycle'
import { formatMoney, parseMoney } from '#shared/utils/format'
import type { Transaction, TxKind } from '#shared/utils/stats'

const props = defineProps<{ initial?: Transaction; accountId?: string; type?: TxKind }>()
const emit = defineEmits<{ save: [value: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>] }>()
const { state } = useStore()

const salaryId = state.accounts.find((a) => a.salary)?.id
const type = ref<TxKind>(props.initial?.type ?? props.type ?? 'expense')
const amount = ref(props.initial ? formatMoney(props.initial.amount).replace(/,/g, '') : '')
const category = ref(props.initial?.category ?? CATEGORIES.expense[0]!.id)
// โอน: เริ่มจากบัญชีรับเงินเดือน
const accountId = ref(
  props.initial?.accountId ?? props.accountId ?? (type.value === 'transfer' ? salaryId : undefined) ?? state.accounts[0]?.id ?? '',
)
const toAccountId = ref(props.initial?.toAccountId ?? '')
const date = ref(props.initial?.date ?? todayISO())
const note = ref(props.initial?.note ?? '')
const error = ref('')

const label = (a: { name: string; bankId: string; salary?: boolean }) => `${a.name} (${bankById(a.bankId).name})${a.salary ? ' 💼' : ''}`
const targets = computed(() => state.accounts.filter((a) => a.id !== accountId.value))

watch(type, (t) => {
  error.value = ''
  if (t !== 'transfer' && !CATEGORIES[t].some((c) => c.id === category.value)) category.value = CATEGORIES[t][0]!.id
})
// ปลายทางต้องไม่ใช่บัญชีเดียวกับต้นทาง
watch(
  [type, accountId],
  () => {
    if (type.value === 'transfer' && !targets.value.some((a) => a.id === toAccountId.value)) toAccountId.value = targets.value[0]?.id ?? ''
  },
  { immediate: true },
)

function submit() {
  const value = parseMoney(amount.value)
  if (!value) return (error.value = 'ใส่จำนวนเงิน')
  if (!accountId.value) return (error.value = 'เลือกบัญชี')
  if (type.value === 'transfer') {
    if (!toAccountId.value || toAccountId.value === accountId.value) return (error.value = 'เลือกบัญชีปลายทาง')
    return emit('save', {
      type: 'transfer', amount: value, category: 'transfer', accountId: accountId.value, toAccountId: toAccountId.value,
      date: date.value, note: note.value.trim(),
    })
  }
  // toAccountId: undefined ล้างค่าเดิมเมื่อแก้รายการโอนเป็นรายรับ/รายจ่าย
  emit('save', {
    type: type.value, amount: value, category: category.value, accountId: accountId.value, toAccountId: undefined,
    date: date.value, note: note.value.trim(),
  })
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="seg">
      <button type="button" :class="{ on: type === 'expense', expense: true }" @click="type = 'expense'">รายจ่าย</button>
      <button type="button" :class="{ on: type === 'income', income: true }" @click="type = 'income'">รายรับ</button>
      <button v-if="state.accounts.length > 1" type="button" :class="{ on: type === 'transfer', transfer: true }" @click="type = 'transfer'">โอน</button>
    </div>

    <label class="amount card" :class="type">
      <span class="baht">฿</span>
      <input v-model="amount" class="num" inputmode="decimal" placeholder="0.00" autofocus @input="error = ''">
    </label>

    <template v-if="type !== 'transfer'">
      <div class="section-title"><span>หมวด</span></div>
      <div class="cats">
        <button v-for="c in CATEGORIES[type]" :key="c.id" type="button" class="cat" :class="{ on: category === c.id }" @click="category = c.id">
          <span class="icon">{{ c.icon }}</span>
          <span>{{ c.name }}</span>
        </button>
      </div>
    </template>

    <div class="section-title"><span>รายละเอียด</span></div>
    <div class="card">
      <label class="field">
        <span>{{ type === 'transfer' ? 'จากบัญชี' : 'บัญชี' }}</span>
        <select v-model="accountId" class="input">
          <option v-for="a in state.accounts" :key="a.id" :value="a.id">{{ label(a) }}</option>
        </select>
      </label>
      <label v-if="type === 'transfer'" class="field">
        <span>ไปบัญชี</span>
        <select v-model="toAccountId" class="input">
          <option v-for="a in targets" :key="a.id" :value="a.id">{{ label(a) }}</option>
        </select>
      </label>
      <label class="field">
        <span>วันที่</span>
        <input v-model="date" type="date" class="input" required>
      </label>
      <label class="field" style="margin-bottom: 0">
        <span>บันทึกช่วยจำ</span>
        <input v-model="note" class="input" :placeholder="type === 'transfer' ? 'เช่น ค่าใช้จ่ายเดือนนี้' : 'เช่น ข้าวเที่ยง'">
      </label>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn btn-primary btn-block save" type="submit">{{ type === 'transfer' ? 'บันทึกการโอน' : 'บันทึก' }}</button>
  </form>
</template>

<style scoped>
.seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; background: var(--card-2); border-radius: 14px; padding: 4px; margin-bottom: 12px; }
.seg button { border: 0; background: transparent; border-radius: 10px; padding: 10px; font-weight: 600; color: var(--muted); }
.seg button.on { background: var(--card); box-shadow: var(--shadow); }
.seg button.on.expense { color: var(--expense); }
.seg button.on.income { color: var(--income); }
.seg button.on.transfer { color: var(--accent); }
.amount { display: flex; align-items: center; gap: 8px; padding: 14px 18px; }
.baht { font-size: 28px; font-weight: 600; color: var(--muted); }
.amount input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 36px; font-weight: 700; }
.amount.expense input { color: var(--expense); }
.amount.income input { color: var(--income); }
.amount.transfer input { color: var(--accent); }
.cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; border: 2px solid transparent; border-radius: 14px; background: var(--card); box-shadow: var(--shadow); font-size: 12px; }
.cat .icon { font-size: 24px; }
.cat.on { border-color: var(--accent); }
.save { margin-top: 18px; }
.error { color: var(--expense); text-align: center; margin: 12px 0 0; }
</style>
