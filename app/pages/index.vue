<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { cycleOf, cycleTodayISO, daysBetween, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatDay, formatMoney, formatWeekdayYear } from '#shared/utils/format'
import { balanceOf, inCycle, summarize } from '#shared/utils/stats'

const { state } = useStore()
const { displayName } = useAuth()
const today = todayISO()

// รอบใหม่เริ่มตอนตี 3 ของวันเงินเดือนออก
const cycle = computed(() => cycleOf(cycleTodayISO(), state.settings))
const nextPayday = computed(() => shiftCycle(cycle.value.key, 1, state.settings).start)
const paydayText = computed(() => {
  if (today === cycle.value.start) return 'เงินเดือนออกวันนี้'
  const days = daysBetween(today, nextPayday.value)
  return days === 0 ? 'เงินเดือนเข้าตี 3 วันนี้' : `อีก ${days} วันเงินเดือนออก`
})

const accounts = computed(() =>
  state.accounts.map((a) => {
    const txs = state.transactions.filter((t) => t.accountId === a.id)
    return { ...a, balance: balanceOf(a, txs), cycle: summarize(inCycle(txs, cycle.value), 0) }
  }),
)
const total = computed(() => accounts.value.reduce((s, a) => s + a.balance, 0))
</script>

<template>
  <main class="page">
    <div class="hello muted">สวัสดี {{ displayName }}</div>
    <TopBar title="จดจ่าย">
      <SyncBadge />
      <NuxtLink to="/settings" class="gear" aria-label="ตั้งค่า">⚙︎</NuxtLink>
    </TopBar>

    <CycleNotice />

    <section class="hero">
      <div class="hero-label">ยอดเงินรวมทุกบัญชี</div>
      <div class="hero-total num">฿{{ formatMoney(total) }}</div>
      <div class="hero-cycle">
        รอบนี้ {{ formatDay(cycle.start) }} – {{ formatDay(cycle.end) }}
        <span class="pill">{{ paydayText }}</span>
      </div>
      <div class="hero-next">เงินเดือนรอบหน้า: {{ formatWeekdayYear(nextPayday) }}</div>
    </section>

    <div class="section-title">
      <span>บัญชี ({{ accounts.length }})</span>
      <NuxtLink to="/accounts/new" class="link">+ เพิ่มบัญชี</NuxtLink>
    </div>

    <div v-if="accounts.length" class="accounts">
      <NuxtLink v-for="a in accounts" :key="a.id" :to="`/accounts/${a.id}`" class="card acc">
        <BankLogo :bank-id="a.bankId" />
        <div class="acc-body">
          <div class="acc-name">{{ a.name || bankById(a.bankId).name }}</div>
          <div class="muted acc-sub">
            {{ bankById(a.bankId).name }}<template v-if="a.last4"> · •••{{ a.last4 }}</template>
          </div>
        </div>
        <div class="acc-right">
          <div class="num acc-bal">{{ formatMoney(a.balance) }}</div>
          <div v-if="a.cycle.expense" class="num acc-sub expense">จ่ายรอบนี้ {{ formatMoney(a.cycle.expense, { short: true }) }}</div>
        </div>
      </NuxtLink>
    </div>
    <NuxtLink v-else to="/accounts/new" class="card empty">
      <div class="empty-icon">🏦</div>
      <b>เพิ่มบัญชีแรก</b>
      <div class="muted">เลือกธนาคาร ตั้งชื่อ แล้วใส่ยอดเงินตอนนี้</div>
    </NuxtLink>
  </main>
</template>

<style scoped>
.hello { font-size: 14px; margin: 4px 0 -8px; }
.gear { width: 40px; height: 40px; border-radius: 50%; background: var(--card); box-shadow: var(--shadow); display: grid; place-items: center; font-size: 20px; }
.hero { background: linear-gradient(135deg, #2f6fed, #6a4ff0); color: #fff; border-radius: 22px; padding: 18px; }
.hero-label { font-size: 13px; opacity: 0.85; }
.hero-total { font-size: 34px; font-weight: 700; line-height: 1.2; margin: 2px 0 8px; }
.hero-cycle { font-size: 14px; display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; }
.pill { background: rgb(255 255 255 / 0.2); border-radius: 99px; padding: 1px 10px; font-size: 13px; font-weight: 600; }
.hero-next { font-size: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgb(255 255 255 / 0.25); opacity: 0.85; }
.link { color: var(--accent); font-weight: 600; }
.accounts { display: grid; gap: 10px; }
.acc { display: flex; align-items: center; gap: 12px; }
.acc-body { flex: 1; min-width: 0; }
.acc-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acc-sub { font-size: 13px; }
.acc-right { text-align: right; }
.acc-bal { font-weight: 700; font-size: 17px; }
.empty { display: block; text-align: center; padding: 28px 16px; }
.empty-icon { font-size: 40px; }
</style>
