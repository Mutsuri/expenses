<script setup lang="ts">
import type { CycleRow } from '#shared/utils/history'
import { shiftCycle } from '#shared/utils/cycle'
import { formatCycleShort, formatMoney } from '#shared/utils/format'

const props = defineProps<{ row: CycleRow }>()
const { state } = useStore()
const prevLabel = computed(() => formatCycleShort(shiftCycle(props.row.cycle.key, -1, state.settings).key))
</script>

<template>
  <div class="card summary">
    <div class="row two">
      <div class="box in">
        <div class="label">รายรับ</div>
        <div class="val num income">{{ formatMoney(row.summary.income) }}</div>
      </div>
      <div class="box out">
        <div class="label">รายจ่าย</div>
        <div class="val num expense">{{ formatMoney(row.summary.expense) }}</div>
      </div>
    </div>
    <div v-if="row.carriedIn" class="line">
      <span>ยกมาจากรอบ {{ prevLabel }}</span>
      <span class="num">{{ formatMoney(row.carriedIn) }}</span>
    </div>
    <div v-if="row.starting" class="line">
      <span>ยอดเริ่มต้นบัญชี</span>
      <span class="num">{{ formatMoney(row.starting) }}</span>
    </div>
    <div class="line">
      <span>รับ − จ่าย รอบนี้</span>
      <b class="num" :class="row.summary.net >= 0 ? 'income' : 'expense'">{{ formatMoney(row.summary.net, { sign: true }) }}</b>
    </div>
    <div class="line strong">
      <span>คงเหลือ</span>
      <b class="num">{{ formatMoney(row.summary.closing) }}</b>
    </div>
  </div>
</template>

<style scoped>
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.box { border-radius: 14px; padding: 10px 12px; }
.in { background: var(--income-soft); }
.out { background: var(--expense-soft); }
.label { font-size: 13px; color: var(--muted); }
.val { font-size: 20px; font-weight: 700; }
.line { display: flex; justify-content: space-between; padding: 6px 4px; font-size: 15px; }
.line + .line { border-top: 1px solid var(--line); }
.strong { font-size: 16px; }
</style>
