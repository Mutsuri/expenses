<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { cycleOf, daysBetween, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatDay, formatMoney, formatWeekdayYear } from '#shared/utils/format'
import { balanceOf, inCycle, inOverview, involves, summarize, summarizeGroup } from '#shared/utils/stats'

const { state, hasSalary, cycleSettings } = useStore()
const { displayName } = useAuth()
const today = todayISO()

const cycle = computed(() => cycleOf(today, cycleSettings.value))
const nextPayday = computed(() => shiftCycle(cycle.value.key, 1, cycleSettings.value).start)
const paydayText = computed(() => {
  if (!hasSalary.value) return `อีก ${daysBetween(today, nextPayday.value)} วันขึ้นเดือนใหม่`
  return today === cycle.value.start ? 'เงินเดือนออกวันนี้' : `อีก ${daysBetween(today, nextPayday.value)} วันเงินเดือนออก`
})

// บัญชีรับเงินเดือนขึ้นก่อน พร้อมรับ-จ่ายรอบนี้ของแต่ละบัญชี (รวมเงินโอน เหมือนหน้าบัญชี)
const salaryIds = computed(() => new Set(state.accounts.filter((a) => a.salary).map((a) => a.id)))
const accounts = computed(() =>
  [...state.accounts]
    .sort((a, b) => Number(!!b.salary) - Number(!!a.salary))
    .map((a) => {
      const txs = state.transactions.filter((t) => involves(t, a.id))
      return { ...a, balance: balanceOf(a, txs), cycle: summarize(inCycle(txs, cycle.value), 0, a.id, salaryIds.value) }
    }),
)
// ภาพรวมรอบนี้ ไม่รวมบัญชีรับเงินเดือนและเงินสด (เหมือนหน้าภาพรวม)
const others = computed(() => accounts.value.filter(inOverview))
const total = computed(() =>
  summarizeGroup(inCycle(state.transactions, cycle.value), 0, new Set(others.value.map((a) => a.id)), salaryIds.value),
)
const totalBalance = computed(() => others.value.reduce((s, a) => s + a.balance, 0))
</script>

<template>
  <main class="page page-wide">
    <div class="mt-1 -mb-2 text-sm text-muted">สวัสดี {{ displayName }}</div>
    <TopBar title="จดจ่าย">
      <SyncBadge />
      <NuxtLink to="/settings" class="grid size-10 place-items-center rounded-full bg-card text-xl shadow-card" aria-label="ตั้งค่า">⚙︎</NuxtLink>
    </TopBar>

    <!-- จอกว้าง: รอบเดือนซ้าย บัญชีขวา -->
    <div class="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
      <div>
        <SyncWarning />
        <CycleNotice />

        <section class="rounded-[22px] bg-linear-135 from-[#2f6fed] to-[#6a4ff0] p-[18px] text-white">
          <div class="text-[13px] opacity-85">{{ hasSalary ? 'รอบเงินเดือนนี้' : 'เดือนนี้' }}</div>
          <div class="mt-0.5 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span class="text-2xl leading-[1.2] font-bold">{{ formatDay(cycle.start) }} – {{ formatDay(cycle.end) }}</span>
            <span class="rounded-full bg-white/20 px-2.5 py-px text-[13px] font-semibold">{{ paydayText }}</span>
          </div>
          <div v-if="hasSalary" class="mt-3 border-t border-white/25 pt-2.5 text-xs opacity-85">เงินเดือนรอบหน้า: {{ formatWeekdayYear(nextPayday) }}</div>
        </section>

        <NuxtLink v-if="others.length" to="/dashboard" class="card mt-2.5 block transition-colors hover:bg-card-2">
          <div class="flex items-center justify-between text-[13px] text-muted">
            <span>📊 ภาพรวมทุกบัญชีรอบนี้</span>
            <span class="text-xl leading-none">›</span>
          </div>
          <div class="mt-0.5 text-[22px] font-bold tabular-nums">฿{{ formatMoney(totalBalance) }}</div>
          <div class="mt-0.5 flex flex-wrap gap-x-3 text-sm font-semibold tabular-nums">
            <span class="text-income">รับ {{ formatMoney(total.income) }}</span>
            <span class="text-expense">จ่าย {{ formatMoney(total.expense) }}</span>
          </div>
        </NuxtLink>
      </div>

      <div>
        <div class="section-title lg:mt-0">
          <span>บัญชี ({{ accounts.length }})</span>
          <NuxtLink to="/accounts/new" class="font-semibold text-accent">+ เพิ่มบัญชี</NuxtLink>
        </div>

        <div v-if="accounts.length" class="grid gap-2.5">
          <NuxtLink v-for="a in accounts" :key="a.id" :to="`/accounts/${a.id}`" class="card flex items-center gap-3 transition-colors hover:bg-card-2">
            <BankLogo :bank-id="a.bankId" />
            <div class="min-w-0 flex-1">
              <!-- ชื่อยาวถูกตัดเฉพาะชื่อ ป้ายเงินเดือนแสดงเต็มเสมอ -->
              <div class="flex items-center gap-1.5 font-semibold">
                <span class="truncate">{{ a.name || bankById(a.bankId).name }}</span>
                <span
                  v-if="a.salary"
                  class="flex-none -translate-y-0.5 rounded-full bg-card-2 px-2 pt-[3px] pb-0.5 text-[11px] font-semibold whitespace-nowrap text-accent"
                >
                  💼 รับเงินเดือน
                </span>
              </div>
              <div class="flex flex-wrap gap-x-3 text-[13px] tabular-nums">
                <span class="text-income">รับ {{ formatMoney(a.cycle.income) }}</span>
                <span class="text-expense">จ่าย {{ formatMoney(a.cycle.expense) }}</span>
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
      </div>
    </div>
  </main>
</template>
