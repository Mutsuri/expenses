<script setup lang="ts">
import { BANKS, bankById } from '#shared/utils/banks'
import { formatMoney, parseMoney } from '#shared/utils/format'
import type { Account } from '#shared/utils/stats'

const props = defineProps<{ initial?: Account }>()
const emit = defineEmits<{ save: [value: Omit<Account, 'id' | 'createdAt'>] }>()

const bankId = ref(props.initial?.bankId ?? '')
const name = ref(props.initial?.name ?? '')
const last4 = ref(props.initial?.last4 ?? '')
const opening = ref(props.initial ? formatMoney(props.initial.openingBalance).replace(/,/g, '') : '')
const error = ref('')

function submit() {
  if (!bankId.value) return (error.value = 'เลือกธนาคารก่อน')
  const amount = opening.value.trim() === '' ? 0 : parseMoney(opening.value)
  if (amount === null) return (error.value = 'ยอดเงินไม่ถูกต้อง')
  emit('save', {
    bankId: bankId.value,
    name: name.value.trim() || bankById(bankId.value).name,
    last4: last4.value.replace(/\D/g, '').slice(-4),
    openingBalance: amount,
  })
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="section-title"><span>ธนาคาร</span></div>
    <div class="banks">
      <button
        v-for="b in BANKS"
        :key="b.id"
        type="button"
        class="bank"
        :class="{ on: bankId === b.id }"
        @click="bankId = b.id; error = ''"
      >
        <BankLogo :bank-id="b.id" :size="40" />
        <span>{{ b.name }}</span>
      </button>
    </div>

    <div class="section-title"><span>รายละเอียด</span></div>
    <div class="card">
      <label class="field">
        <span>ชื่อบัญชี</span>
        <input v-model="name" class="input" :placeholder="bankId ? `เช่น ${bankById(bankId).name} เงินเดือน` : 'เช่น บัญชีเงินเดือน'">
      </label>
      <label class="field">
        <span>เลขบัญชี 4 ตัวท้าย (ไม่บังคับ)</span>
        <input v-model="last4" class="input" inputmode="numeric" maxlength="4" placeholder="1234">
      </label>
      <label class="field" style="margin-bottom: 0">
        <span>ยอดเงินในบัญชีตอนนี้ (บาท)</span>
        <input v-model="opening" class="input num" inputmode="decimal" placeholder="0.00">
      </label>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn btn-primary btn-block save" type="submit">บันทึก</button>
  </form>
</template>

<style scoped>
.banks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.bank { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 4px; border: 2px solid transparent; border-radius: 14px; background: var(--card); box-shadow: var(--shadow); font-size: 11px; line-height: 1.3; text-align: center; }
.bank.on { border-color: var(--accent); }
.save { margin-top: 18px; }
.error { color: var(--expense); text-align: center; margin: 12px 0 0; }
@media (min-width: 420px) { .banks { grid-template-columns: repeat(5, 1fr); } }
</style>
