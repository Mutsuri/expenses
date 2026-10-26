<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { CATEGORIES } from '#shared/utils/categories'
import { todayISO } from '#shared/utils/cycle'
import { formatMoney, parseMoney } from '#shared/utils/format'
import { isCredit, type Transaction, type TxKind } from '#shared/utils/stats'

const props = defineProps<{ initial?: Transaction; accountId?: string; type?: TxKind }>()
// months: จดเป็นรายการผ่อน (เฉพาะรายจ่ายใหม่บนบัตรเครดิต)
const emit = defineEmits<{ save: [value: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, months?: number] }>()
const { state, hasSalary } = useStore()
// ผู้ใช้ที่ไม่มีเงินเดือนไม่ต้องมีหมวดเงินเดือน
const categories = computed(() => ({
  expense: CATEGORIES.expense,
  income: hasSalary.value ? CATEGORIES.income : CATEGORIES.income.filter((c) => c.id !== 'salary'),
}))

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

// บัตรเครดิตจดได้แค่รายจ่าย: ไม่มีให้เลือกตอนจดรายรับหรือโอน
const cashAccounts = computed(() => state.accounts.filter((a) => !isCredit(a)))
const accountOptions = computed(() => (type.value === 'expense' ? state.accounts : cashAccounts.value))
const onCredit = computed(() => isCredit(state.accounts.find((a) => a.id === accountId.value) ?? { bankId: '' }))

// แท็บประเภทรายการ (โอนได้เมื่อมีมากกว่าหนึ่งบัญชีที่ไม่ใช่บัตรเครดิต, บัตรเครดิตมีแค่รายจ่าย)
const tabs = computed(() =>
  [
    { type: 'expense' as const, label: 'รายจ่าย', color: 'text-expense' },
    { type: 'income' as const, label: 'รายรับ', color: 'text-income' },
    { type: 'transfer' as const, label: 'โอน', color: 'text-accent' },
  ].filter((t) => t.type === 'expense' || (!onCredit.value && (t.type !== 'transfer' || cashAccounts.value.length > 1))),
)

const label = (a: { name: string; bankId: string; salary?: boolean }) => `${a.name} (${bankById(a.bankId).name})${a.salary ? ' 💼' : ''}`
const targets = computed(() => cashAccounts.value.filter((a) => a.id !== accountId.value))

// ผ่อน: เฉพาะตอนจดรายจ่ายใหม่บนบัตรเครดิต (งวดที่สร้างแล้วแก้ทีละงวด)
const installment = ref(false)
const months = ref(10)
const MONTHS = [2, 3, 4, 6, 10, 12, 18, 24, 36]
const canInstall = computed(() => !props.initial && type.value === 'expense' && onCredit.value)
const perMonth = computed(() => {
  const v = parseMoney(amount.value)
  return v ? formatMoney(Math.floor(v / months.value)) : ''
})

watch(type, (t) => {
  error.value = ''
  if (t !== 'expense' && onCredit.value) accountId.value = cashAccounts.value[0]?.id ?? ''
  if (t !== 'transfer' && !categories.value[t].some((c) => c.id === category.value)) category.value = categories.value[t][0]!.id
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
  if (canInstall.value && installment.value && value < months.value) return (error.value = 'ยอดน้อยเกินกว่าจะแบ่งงวด')
  // toAccountId: undefined ล้างค่าเดิมเมื่อแก้รายการโอนเป็นรายรับ/รายจ่าย
  emit(
    'save',
    {
      type: type.value, amount: value, category: category.value, accountId: accountId.value, toAccountId: undefined,
      date: date.value, note: note.value.trim(),
    },
    canInstall.value && installment.value ? months.value : undefined,
  )
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="mb-3 grid auto-cols-fr grid-flow-col rounded-[14px] bg-card-2 p-1">
      <button
        v-for="t in tabs"
        :key="t.type"
        type="button"
        class="rounded-[10px] p-2.5 font-semibold"
        :class="type === t.type ? `bg-card shadow-card ${t.color}` : 'text-muted'"
        @click="type = t.type"
      >
        {{ t.label }}
      </button>
    </div>

    <label class="card flex items-center gap-2 px-[18px] py-3.5">
      <span class="text-[28px] font-semibold text-muted">฿</span>
      <input
        v-model="amount"
        class="min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums outline-none"
        :class="tabs.find((t) => t.type === type)?.color"
        inputmode="decimal"
        placeholder="0.00"
        autofocus
        @input="error = ''"
      >
    </label>

    <template v-if="type !== 'transfer'">
      <div class="section-title"><span>หมวด</span></div>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="c in categories[type]"
          :key="c.id"
          type="button"
          class="flex flex-col items-center gap-0.5 rounded-[14px] border-2 bg-card px-1 py-2.5 text-xs shadow-card"
          :class="category === c.id ? 'border-accent' : 'border-transparent'"
          @click="category = c.id"
        >
          <span class="text-2xl">{{ c.icon }}</span>
          <span>{{ c.name }}</span>
        </button>
      </div>
    </template>

    <div class="section-title"><span>รายละเอียด</span></div>
    <div class="card">
      <label class="field">
        <span>{{ type === 'transfer' ? 'จากบัญชี' : 'บัญชี' }}</span>
        <select v-model="accountId" class="input">
          <option v-for="a in accountOptions" :key="a.id" :value="a.id">{{ label(a) }}</option>
        </select>
      </label>
      <label v-if="type === 'transfer'" class="field">
        <span>ไปบัญชี</span>
        <select v-model="toAccountId" class="input">
          <option v-for="a in targets" :key="a.id" :value="a.id">{{ label(a) }}</option>
        </select>
      </label>
      <div v-if="canInstall" class="field">
        <label class="flex cursor-pointer items-center gap-2.5">
          <input v-model="installment" type="checkbox" class="size-[22px] flex-none accent-accent">
          <b>ผ่อนชำระ</b>
        </label>
        <div v-if="installment" class="mt-2 flex items-center gap-2">
          <select v-model.number="months" class="input w-auto">
            <option v-for="m in MONTHS" :key="m" :value="m">{{ m }} เดือน</option>
          </select>
          <span v-if="perMonth" class="text-sm text-muted">งวดละ ~{{ perMonth }}</span>
        </div>
        <p v-if="installment" class="mx-1 mt-1.5 text-[13px] text-muted">นับเป็นรายจ่ายรอบละงวด งวดแรกวันที่ซื้อ งวดต่อไปวันแรกของรอบถัด ๆ ไป</p>
      </div>
      <label class="field">
        <span>วันที่</span>
        <input v-model="date" type="date" class="input" required>
      </label>
      <label class="field mb-0">
        <span>บันทึกช่วยจำ</span>
        <input v-model="note" class="input" :placeholder="type === 'transfer' ? 'เช่น ค่าใช้จ่ายเดือนนี้' : 'เช่น ข้าวเที่ยง'">
      </label>
    </div>

    <p v-if="error" class="mt-3 text-center text-expense">{{ error }}</p>
    <button class="btn btn-primary btn-block mt-[18px]" type="submit">{{ type === 'transfer' ? 'บันทึกการโอน' : 'บันทึก' }}</button>
  </form>
</template>
