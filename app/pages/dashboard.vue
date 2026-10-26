<script setup lang="ts">
// ภาพรวมทุกบัญชีในรอบที่เลือก: ยอดรวม รับ-จ่ายรวม และของแต่ละบัญชี
import { bankById } from '#shared/utils/banks'
import { cycleOf, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatMoney } from '#shared/utils/format'
import { overview } from '#shared/utils/stats'

const { state, cycleSettings } = useStore()

const cycleKey = ref(cycleOf(todayISO(), cycleSettings.value).key)
const cycle = computed(() => shiftCycle(cycleKey.value, 0, cycleSettings.value))
const salaryIds = computed(() => new Set(state.accounts.filter((a) => a.salary).map((a) => a.id)))
// บัญชีรับเงินเดือนขึ้นก่อน เหมือนหน้าแรก
const accounts = computed(() => [...state.accounts].sort((a, b) => Number(!!b.salary) - Number(!!a.salary)))
const data = computed(() => overview(accounts.value, state.transactions, cycle.value, salaryIds.value))
const breakdownType = ref<'expense' | 'income'>('expense')
</script>

<template>
  <main class="page page-wide">
    <TopBar title="ภาพรวมทุกบัญชี" back="/" />

    <!-- จอกว้าง: ยอดรวมซ้าย แต่ละบัญชีขวา -->
    <div class="lg:grid lg:grid-cols-[400px_1fr] lg:items-start lg:gap-8">
      <div>
        <CycleNav v-model="cycleKey" />

        <section class="card mt-2.5">
          <div class="text-[13px] text-muted">ยอดเงินรวมทุกบัญชี ณ สิ้นรอบ</div>
          <div class="text-[28px] leading-[1.2] font-bold tabular-nums">฿{{ formatMoney(data.total.closing) }}</div>
          <div class="mt-3 grid grid-cols-2 gap-2.5">
            <div class="rounded-[14px] bg-income-soft px-3 py-2.5">
              <div class="text-[13px] text-muted">รายรับรวม</div>
              <div class="text-xl font-bold tabular-nums text-income">{{ formatMoney(data.total.income) }}</div>
            </div>
            <div class="rounded-[14px] bg-expense-soft px-3 py-2.5">
              <div class="text-[13px] text-muted">รายจ่ายรวม</div>
              <div class="text-xl font-bold tabular-nums text-expense">{{ formatMoney(data.total.expense) }}</div>
            </div>
          </div>
          <p class="mt-2 text-xs text-muted">ยอดรวมไม่นับเงินที่โอนระหว่างบัญชีของตัวเอง</p>
        </section>

        <div class="section-title">
          <span>แยกตามหมวด (ทุกบัญชี)</span>
          <span class="inline-flex rounded-[10px] bg-card-2 p-0.5">
            <button
              v-for="t in [{ key: 'expense', label: 'จ่าย' }, { key: 'income', label: 'รับ' }] as const"
              :key="t.key"
              class="rounded-lg px-3 py-0.5 text-[13px] font-semibold"
              :class="breakdownType === t.key ? 'bg-card text-ink shadow-card' : 'text-muted'"
              @click="breakdownType = t.key"
            >
              {{ t.label }}
            </button>
          </span>
        </div>
        <CategoryBreakdown :summary="data.total" :type="breakdownType" />
      </div>

      <div>
        <div class="section-title lg:mt-0"><span>แต่ละบัญชี ({{ data.rows.length }})</span><span>รวมเงินโอน</span></div>
        <div class="grid gap-2.5">
          <NuxtLink
            v-for="r in data.rows"
            :key="r.account.id"
            :to="`/accounts/${r.account.id}`"
            class="card flex items-center gap-3 transition-colors hover:bg-card-2"
          >
            <BankLogo :bank-id="r.account.bankId" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 font-semibold">
                <span class="truncate">{{ r.account.name || bankById(r.account.bankId).name }}</span>
                <span v-if="r.account.salary" class="flex-none text-[13px]" aria-label="บัญชีรับเงินเดือน">💼</span>
              </div>
              <div class="flex flex-wrap gap-x-3 text-[13px] tabular-nums">
                <span class="text-income">รับ {{ formatMoney(r.summary.income) }}</span>
                <span class="text-expense">จ่าย {{ formatMoney(r.summary.expense) }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[11px] text-muted">คงเหลือ</div>
              <div class="text-[17px] font-bold tabular-nums">{{ formatMoney(r.summary.closing) }}</div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>
