<script setup lang="ts">
import { BANKS, bankById } from '#shared/utils/banks'
import { formatMoney, parseMoney } from '#shared/utils/format'
import type { Account } from '#shared/utils/stats'

const props = defineProps<{ initial?: Account }>()
const emit = defineEmits<{ save: [value: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>] }>()

const bankId = ref(props.initial?.bankId ?? '')
const name = ref(props.initial?.name ?? '')
const last4 = ref(props.initial?.last4 ?? '')
const opening = ref(props.initial ? formatMoney(props.initial.openingBalance).replace(/,/g, '') : '')
const { state, hasSalary } = useStore()
// บัญชีแรกตั้งเป็นบัญชีรับเงินเดือนไว้ก่อน (เฉพาะผู้ใช้ที่มีเงินเดือน)
const salary = ref(props.initial?.salary ?? (hasSalary.value && !state.accounts.some((a) => a.salary)))
const currentSalary = computed(() => state.accounts.find((a) => a.salary && a.id !== props.initial?.id))
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
    salary: salary.value,
  })
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="section-title"><span>ธนาคาร</span></div>
    <div class="grid grid-cols-4 gap-2 min-[420px]:grid-cols-5">
      <button
        v-for="b in BANKS"
        :key="b.id"
        type="button"
        class="flex flex-col items-center gap-1.5 rounded-[14px] border-2 bg-card px-1 py-2.5 text-center text-[11px] leading-[1.3] shadow-card"
        :class="bankId === b.id ? 'border-accent' : 'border-transparent'"
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
        <input v-model="name" class="input" :placeholder="hasSalary ? (bankId ? `เช่น ${bankById(bankId).name} เงินเดือน` : 'เช่น บัญชีเงินเดือน') : 'เช่น บัญชีออมทรัพย์'">
      </label>
      <label class="field">
        <span>เลขบัญชี 4 ตัวท้าย (ไม่บังคับ)</span>
        <input v-model="last4" class="input" inputmode="numeric" maxlength="4" placeholder="1234">
      </label>
      <label class="field mb-0">
        <span>ยอดเงินในบัญชีตอนนี้ (บาท)</span>
        <input v-model="opening" class="input tabular-nums" inputmode="decimal" placeholder="0.00">
      </label>
    </div>

    <label v-if="hasSalary" class="card mt-2.5 flex cursor-pointer items-start gap-3">
      <input v-model="salary" type="checkbox" class="mt-0.5 size-[22px] flex-none accent-accent">
      <div>
        <b>💼 บัญชีรับเงินเดือน</b>
        <div class="mt-0.5 text-[13px] text-muted">
          ใช้รับเงินเดือน แล้วโอนไปบัญชีอื่นเพื่อใช้จ่าย
          <template v-if="salary && currentSalary"><br>จะเปลี่ยนจาก "{{ currentSalary.name }}" มาเป็นบัญชีนี้</template>
        </div>
      </div>
    </label>

    <p v-if="error" class="mt-3 text-center text-expense">{{ error }}</p>
    <button class="btn btn-primary btn-block mt-[18px]" type="submit">บันทึก</button>
  </form>
</template>
