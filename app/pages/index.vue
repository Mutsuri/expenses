<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { cycleOf, daysBetween, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatDay, formatMoney, formatWeekdayYear } from '#shared/utils/format'
import { balanceOf, involves } from '#shared/utils/stats'

const { state } = useStore()
const { displayName } = useAuth()
const today = todayISO()

const cycle = computed(() => cycleOf(today, state.settings))
const nextPayday = computed(() => shiftCycle(cycle.value.key, 1, state.settings).start)
const paydayText = computed(() =>
  today === cycle.value.start ? 'เงินเดือนออกวันนี้' : `อีก ${daysBetween(today, nextPayday.value)} วันเงินเดือนออก`,
)

// บัญชีรับเงินเดือนขึ้นก่อน
const accounts = computed(() =>
  [...state.accounts]
    .sort((a, b) => Number(!!b.salary) - Number(!!a.salary))
    .map((a) => {
      const txs = state.transactions.filter((t) => involves(t, a.id))
      return { ...a, balance: balanceOf(a, txs) }
    }),
)
</script>

<template>
  <main class="page">
    <div class="mt-1 -mb-2 text-sm text-muted">สวัสดี {{ displayName }}</div>
    <TopBar title="จดจ่าย">
      <SyncBadge />
      <NuxtLink to="/settings" class="grid size-10 place-items-center rounded-full bg-card text-xl shadow-card" aria-label="ตั้งค่า">⚙︎</NuxtLink>
    </TopBar>

    <SyncWarning />
    <CycleNotice />

    <section class="rounded-[22px] bg-linear-135 from-[#2f6fed] to-[#6a4ff0] p-[18px] text-white">
      <div class="text-[13px] opacity-85">รอบเงินเดือนนี้</div>
      <div class="mt-0.5 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span class="text-2xl leading-[1.2] font-bold">{{ formatDay(cycle.start) }} – {{ formatDay(cycle.end) }}</span>
        <span class="rounded-full bg-white/20 px-2.5 py-px text-[13px] font-semibold">{{ paydayText }}</span>
      </div>
      <div class="mt-3 border-t border-white/25 pt-2.5 text-xs opacity-85">เงินเดือนรอบหน้า: {{ formatWeekdayYear(nextPayday) }}</div>
    </section>

    <div class="section-title">
      <span>บัญชี ({{ accounts.length }})</span>
      <NuxtLink to="/accounts/new" class="font-semibold text-accent">+ เพิ่มบัญชี</NuxtLink>
    </div>

    <div v-if="accounts.length" class="grid gap-2.5">
      <NuxtLink v-for="a in accounts" :key="a.id" :to="`/accounts/${a.id}`" class="card flex items-center gap-3">
        <BankLogo :bank-id="a.bankId" />
        <div class="min-w-0 flex-1">
          <div class="truncate font-semibold">
            {{ a.name || bankById(a.bankId).name }}
            <span
              v-if="a.salary"
              class="ml-1 rounded-full bg-card-2 px-2 pt-[3px] pb-0.5 align-[1px] text-[11px] font-semibold whitespace-nowrap text-accent"
            >
              💼 รับเงินเดือน
            </span>
          </div>
          <div class="text-[13px] text-muted">
            {{ bankById(a.bankId).name }}<template v-if="a.last4"> · •••{{ a.last4 }}</template>
          </div>
        </div>
        <div class="text-right text-[17px] font-bold tabular-nums">{{ formatMoney(a.balance) }}</div>
      </NuxtLink>
    </div>
    <NuxtLink v-else to="/accounts/new" class="card block px-4 py-7 text-center">
      <div class="text-[40px]">🏦</div>
      <b>เพิ่มบัญชีแรก</b>
      <div class="text-muted">เลือกธนาคาร ตั้งชื่อ แล้วใส่ยอดเงินตอนนี้</div>
    </NuxtLink>
  </main>
</template>
