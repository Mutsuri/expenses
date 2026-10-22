<script setup lang="ts">
import { formatMoney } from '#shared/utils/format'
import type { CycleSummary } from '#shared/utils/stats'

defineProps<{ summary: CycleSummary; opening?: number }>()
</script>

<template>
  <div class="card summary">
    <div class="row two">
      <div class="box in">
        <div class="label">รายรับ</div>
        <div class="val num income">{{ formatMoney(summary.income) }}</div>
      </div>
      <div class="box out">
        <div class="label">รายจ่าย</div>
        <div class="val num expense">{{ formatMoney(summary.expense) }}</div>
      </div>
    </div>
    <div class="line">
      <span>รับ − จ่าย รอบนี้</span>
      <b class="num" :class="summary.net >= 0 ? 'income' : 'expense'">{{ formatMoney(summary.net, { sign: true }) }}</b>
    </div>
    <template v-if="opening !== undefined">
      <div class="line">
        <span>ยอดยกมาต้นรอบ</span>
        <span class="num">{{ formatMoney(opening) }}</span>
      </div>
      <div class="line strong">
        <span>คงเหลือท้ายรอบ</span>
        <b class="num">{{ formatMoney(summary.closing) }}</b>
      </div>
    </template>
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
