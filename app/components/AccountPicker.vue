<script setup lang="ts">
// เลือกบัญชีด้วยปุ่มมีโลโก้ (แทน <select> ที่หน้าตาต่างกันไปตามเครื่อง)
import { bankById } from '#shared/utils/banks'
import type { Account } from '#shared/utils/stats'

defineProps<{ accounts: Account[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3" role="radiogroup">
    <button
      v-for="a in accounts"
      :key="a.id"
      type="button"
      role="radio"
      :aria-checked="model === a.id"
      class="flex min-w-0 items-center gap-2 rounded-xl border-2 bg-card-2 px-2.5 py-2 text-left text-sm transition-colors"
      :class="model === a.id ? 'border-accent' : 'border-transparent hover:border-line'"
      @click="model = a.id"
    >
      <BankLogo :bank-id="a.bankId" :size="28" />
      <span class="min-w-0 flex-1 truncate">{{ a.name || bankById(a.bankId).name }}</span>
      <span v-if="a.salary" class="flex-none text-xs" aria-label="บัญชีรับเงินเดือน">💼</span>
    </button>
  </div>
</template>
