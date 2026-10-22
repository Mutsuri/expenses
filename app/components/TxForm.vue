<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { CATEGORIES, type TxType } from '#shared/utils/categories'
import { todayISO } from '#shared/utils/cycle'
import { formatMoney, parseMoney } from '#shared/utils/format'
import type { Transaction } from '#shared/utils/stats'

const props = defineProps<{ initial?: Transaction; accountId?: string }>()
const emit = defineEmits<{ save: [value: Omit<Transaction, 'id' | 'createdAt'>] }>()
const { state } = useStore()

const type = ref<TxType>(props.initial?.type ?? 'expense')
const amount = ref(props.initial ? formatMoney(props.initial.amount).replace(/,/g, '') : '')
const category = ref(props.initial?.category ?? CATEGORIES.expense[0]!.id)
const accountId = ref(props.initial?.accountId ?? props.accountId ?? state.accounts[0]?.id ?? '')
const date = ref(props.initial?.date ?? todayISO())
const note = ref(props.initial?.note ?? '')
const error = ref('')

watch(type, (t) => {
  if (!CATEGORIES[t].some((c) => c.id === category.value)) category.value = CATEGORIES[t][0]!.id
})

function submit() {
  const value = parseMoney(amount.value)
  if (!value) return (error.value = 'ใส่จำนวนเงิน')
  if (!accountId.value) return (error.value = 'เลือกบัญชี')
  emit('save', { type: type.value, amount: value, category: category.value, accountId: accountId.value, date: date.value, note: note.value.trim() })
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="seg">
      <button type="button" :class="{ on: type === 'expense', expense: true }" @click="type = 'expense'">รายจ่าย</button>
      <button type="button" :class="{ on: type === 'income', income: true }" @click="type = 'income'">รายรับ</button>
    </div>

    <label class="amount card" :class="type">
      <span class="baht">฿</span>
      <input v-model="amount" class="num" inputmode="decimal" placeholder="0.00" autofocus @input="error = ''">
    </label>

    <div class="section-title"><span>หมวด</span></div>
    <div class="cats">
      <button v-for="c in CATEGORIES[type]" :key="c.id" type="button" class="cat" :class="{ on: category === c.id }" @click="category = c.id">
        <span class="icon">{{ c.icon }}</span>
        <span>{{ c.name }}</span>
      </button>
    </div>

    <div class="section-title"><span>รายละเอียด</span></div>
    <div class="card">
      <label class="field">
        <span>บัญชี</span>
        <select v-model="accountId" class="input">
          <option v-for="a in state.accounts" :key="a.id" :value="a.id">{{ a.name }} ({{ bankById(a.bankId).name }})</option>
        </select>
      </label>
      <label class="field">
        <span>วันที่</span>
        <input v-model="date" type="date" class="input" required>
      </label>
      <label class="field" style="margin-bottom: 0">
        <span>บันทึกช่วยจำ</span>
        <input v-model="note" class="input" placeholder="เช่น ข้าวเที่ยง">
      </label>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn btn-primary btn-block save" type="submit">บันทึก</button>
  </form>
</template>

<style scoped>
.seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--card-2); border-radius: 14px; padding: 4px; margin-bottom: 12px; }
.seg button { border: 0; background: transparent; border-radius: 10px; padding: 10px; font-weight: 600; color: var(--muted); }
.seg button.on { background: var(--card); box-shadow: var(--shadow); }
.seg button.on.expense { color: var(--expense); }
.seg button.on.income { color: var(--income); }
.amount { display: flex; align-items: center; gap: 8px; padding: 14px 18px; }
.baht { font-size: 28px; font-weight: 600; color: var(--muted); }
.amount input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 36px; font-weight: 700; }
.amount.expense input { color: var(--expense); }
.amount.income input { color: var(--income); }
.cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; border: 2px solid transparent; border-radius: 14px; background: var(--card); box-shadow: var(--shadow); font-size: 12px; }
.cat .icon { font-size: 24px; }
.cat.on { border-color: var(--accent); }
.save { margin-top: 18px; }
.error { color: var(--expense); text-align: center; margin: 12px 0 0; }
</style>
