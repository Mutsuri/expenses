<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { accountCycles, type CycleRow } from '#shared/utils/history'
import { cycleOf, shiftCycle, cycleTodayISO } from '#shared/utils/cycle'
import { formatCycleShort, formatMoney } from '#shared/utils/format'
import { balanceOf, inCycle, summarize } from '#shared/utils/stats'

const { state } = useStore()
const route = useRoute()
const id = route.params.id as string

const account = computed(() => state.accounts.find((a) => a.id === id))
const bank = computed(() => bankById(account.value?.bankId ?? 'other'))
const txs = computed(() => state.transactions.filter((t) => t.accountId === id))

const tab = ref<'list' | 'stats'>(route.query.tab === 'stats' ? 'stats' : 'list')
const cycleKey = ref(cycleOf(cycleTodayISO(), state.settings).key)
const cycle = computed(() => shiftCycle(cycleKey.value, 0, state.settings))

const balance = computed(() => (account.value ? balanceOf(account.value, txs.value) : 0))
const cycleTxs = computed(() => inCycle(txs.value, cycle.value))
const breakdownType = ref<'expense' | 'income'>('expense')

const history = computed(() =>
  account.value ? accountCycles(account.value, state.transactions, state.settings, cycleTodayISO()) : [],
)
// รอบก่อนเปิดบัญชีไม่มีข้อมูล แสดงเป็นศูนย์
const row = computed<CycleRow>(
  () =>
    history.value.find((r) => r.cycle.key === cycleKey.value) ?? {
      cycle: cycle.value,
      carriedIn: 0,
      starting: 0,
      summary: summarize([], 0),
    },
)
const avg = computed(() => {
  // เฉลี่ยจากรอบที่จบแล้วเท่านั้น
  const done = history.value.slice(1).filter((r) => r.summary.income || r.summary.expense)
  if (!done.length) return null
  const n = done.length
  return {
    n,
    income: Math.round(done.reduce((s, r) => s + r.summary.income, 0) / n),
    expense: Math.round(done.reduce((s, r) => s + r.summary.expense, 0) / n),
  }
})

function pickCycle(key: string) {
  cycleKey.value = key
  tab.value = 'list'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main v-if="account" class="page">
    <TopBar :title="account.name" back="/">
      <NuxtLink :to="`/accounts/${id}/edit`" class="edit">แก้ไข</NuxtLink>
    </TopBar>

    <section class="head card">
      <BankLogo :bank-id="account.bankId" :size="52" />
      <div>
        <div class="muted small">{{ bank.name }}<template v-if="account.last4"> · •••{{ account.last4 }}</template></div>
        <div class="bal num">฿{{ formatMoney(balance) }}</div>
      </div>
    </section>

    <div class="tabs">
      <button :class="{ on: tab === 'list' }" @click="tab = 'list'">รายการ</button>
      <button :class="{ on: tab === 'stats' }" @click="tab = 'stats'">สถิติ</button>
    </div>

    <template v-if="tab === 'list'">
      <CycleNav v-model="cycleKey" />
      <div style="height: 10px" />
      <SummaryCard :row="row" />

      <div class="section-title">
        <span>แยกตามหมวด</span>
        <span class="mini-tabs">
          <button :class="{ on: breakdownType === 'expense' }" @click="breakdownType = 'expense'">จ่าย</button>
          <button :class="{ on: breakdownType === 'income' }" @click="breakdownType = 'income'">รับ</button>
        </span>
      </div>
      <CategoryBreakdown :summary="row.summary" :type="breakdownType" />

      <div class="section-title"><span>รายการ ({{ cycleTxs.length }})</span></div>
      <TxList :items="cycleTxs" />
    </template>

    <template v-else>
      <div class="section-title"><span>รายรับ–รายจ่าย 12 รอบล่าสุด</span><span>แตะแท่งเพื่อดูรอบนั้น</span></div>
      <CycleChart :rows="history" :selected="cycleKey" @select="pickCycle" />

      <div v-if="avg" class="card avg">
        <div>
          <div class="muted small">รับเฉลี่ย/รอบ</div>
          <b class="num income">{{ formatMoney(avg.income, { short: true }) }}</b>
        </div>
        <div>
          <div class="muted small">จ่ายเฉลี่ย/รอบ</div>
          <b class="num expense">{{ formatMoney(avg.expense, { short: true }) }}</b>
        </div>
        <div>
          <div class="muted small">เหลือเฉลี่ย/รอบ</div>
          <b class="num">{{ formatMoney(avg.income - avg.expense, { short: true, sign: true }) }}</b>
        </div>
        <div class="muted tiny">จาก {{ avg.n }} รอบที่จบแล้ว</div>
      </div>

      <div class="section-title"><span>แยกรายรอบ</span></div>
      <div class="card table">
        <div class="tr th">
          <span>รอบ</span><span>รับ</span><span>จ่าย</span><span>คงเหลือ</span>
        </div>
        <button v-for="r in history" :key="r.cycle.key" class="tr" @click="pickCycle(r.cycle.key)">
          <span>{{ formatCycleShort(r.cycle.key) }}</span>
          <span class="num income">{{ formatMoney(r.summary.income, { short: true }) }}</span>
          <span class="num expense">{{ formatMoney(r.summary.expense, { short: true }) }}</span>
          <span class="num">{{ formatMoney(r.summary.closing, { short: true }) }}</span>
        </button>
      </div>
    </template>

    <NuxtLink :to="`/tx/new?account=${id}`" class="fab" aria-label="จดรายการ">+</NuxtLink>
  </main>
  <main v-else class="page">
    <TopBar title="ไม่พบบัญชี" back="/" />
  </main>
</template>

<style scoped>
.edit { color: var(--accent); font-weight: 600; padding: 8px; }
.head { display: flex; align-items: center; gap: 14px; }
.small { font-size: 13px; }
.tiny { font-size: 12px; grid-column: 1 / -1; }
.bal { font-size: 28px; font-weight: 700; line-height: 1.2; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; background: var(--card-2); border-radius: 14px; padding: 4px; margin: 16px 0 12px; }
.tabs button, .mini-tabs button { border: 0; background: transparent; border-radius: 10px; padding: 8px; font-weight: 600; color: var(--muted); }
.tabs button.on, .mini-tabs button.on { background: var(--card); color: var(--text); box-shadow: var(--shadow); }
.mini-tabs { display: inline-flex; background: var(--card-2); border-radius: 10px; padding: 2px; }
.mini-tabs button { padding: 2px 12px; font-size: 13px; border-radius: 8px; }
.avg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; margin-top: 10px; }
.table { padding: 4px 12px; }
.tr { display: grid; grid-template-columns: 1.1fr 1fr 1fr 1fr; gap: 6px; width: 100%; border: 0; background: none; padding: 10px 2px; text-align: right; font-size: 14px; }
.tr > span:first-child { text-align: left; }
.tr + .tr { border-top: 1px solid var(--line); }
.th { font-size: 12px; color: var(--muted); }
</style>
