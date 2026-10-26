<script setup lang="ts">
// ภาพรวมทุกบัญชี (ไม่รวมบัญชีรับเงินเดือน เงินสด และบัตรเครดิต) ในรอบที่เลือก: ยอดรวม รับ-จ่ายรวม และของแต่ละบัญชี
// เงินที่โอนมาจากบัญชีรับเงินเดือนนับเป็นรายรับหมวดเงินเดือน
import { bankById } from '#shared/utils/banks'
import { cycleOf, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatDay, formatMoney } from '#shared/utils/format'
import { categoryById, type TxType } from '#shared/utils/categories'
import { activePlans } from '#shared/utils/installment'
import { groupCategoryOf, inCycle, inOverview, isCredit, overview } from '#shared/utils/stats'

const { state, cycleSettings } = useStore()

const cycleKey = ref(cycleOf(todayISO(), cycleSettings.value).key)
const cycle = computed(() => shiftCycle(cycleKey.value, 0, cycleSettings.value))
const salaryIds = computed(() => new Set(state.accounts.filter((a) => a.salary).map((a) => a.id)))
const accounts = computed(() => state.accounts.filter(inOverview))
const data = computed(() => overview(accounts.value, state.transactions, cycle.value, salaryIds.value))
const breakdownType = ref<'expense' | 'income'>('expense')
// บัตรเครดิตแสดงแยก: ยอดใช้ไปของแต่ละบัตรในรอบที่เลือก
const cards = computed(() => overview(state.accounts.filter(isCredit), state.transactions, cycle.value).rows)
const cardsTotal = computed(() => cards.value.reduce((s, r) => s + r.summary.expense, 0))
// แตะบัตรเพื่อขยายดูรายการในรอบนี้ (ดูอย่างเดียว) ใหม่สุดก่อน
const openCards = ref(new Set<string>())
function toggleCard(id: string) {
  const next = new Set(openCards.value)
  if (!next.delete(id)) next.add(id)
  openCards.value = next
}
const cardItems = (id: string) =>
  inCycle(state.transactions, cycle.value)
    .filter((t) => t.accountId === id && t.type === 'expense')
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
// รายการผ่อนที่ยังมีงวดเหลือ (นับจากวันนี้ ไม่ขึ้นกับรอบที่เลือก)
const plansOf = (id: string) => activePlans(state.transactions, id, todayISO())
// รายการในหมวดที่แตะขยาย: นับแบบเดียวกับยอดรวม (groupCategoryOf)
function itemsFor(type: TxType, category: string) {
  const ids = new Set(accounts.value.map((a) => a.id))
  return inCycle(state.transactions, cycle.value).filter((t) => {
    const c = groupCategoryOf(t, ids, salaryIds.value)
    return c?.type === type && c.category === category
  })
}
</script>

<template>
  <main class="page page-wide">
    <TopBar title="ภาพรวมทุกบัญชี" back="/" />

    <!-- มือถือ: ยอดรวม → แต่ละบัญชี → แยกตามหมวด / จอกว้าง: ยอดรวมกับหมวดซ้าย แต่ละบัญชีขวา -->
    <div class="lg:grid lg:grid-cols-[400px_1fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8">
      <div class="lg:col-start-1 lg:row-start-1">
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
          <p class="mt-2 text-xs text-muted">ไม่รวมบัญชีรับเงินเดือน เงินสด และบัตรเครดิต (เงินที่โอนมาจากบัญชีรับเงินเดือนนับเป็นรายรับ) และไม่นับเงินที่โอนกันเองระหว่างบัญชีอื่น</p>
        </section>
      </div>

      <div class="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div class="section-title lg:mt-0"><span>แต่ละบัญชี ({{ data.rows.length }})</span><span>รวมเงินโอน</span></div>
        <div class="grid gap-2.5">
          <!-- ดูอย่างเดียว ไม่ใช่ลิงก์ (กันสับสนกับหน้าแรก) -->
          <div v-for="r in data.rows" :key="r.account.id" class="card flex items-center gap-3">
            <BankLogo :bank-id="r.account.bankId" />
            <div class="min-w-0 flex-1">
              <div class="truncate font-semibold">{{ r.account.name || bankById(r.account.bankId).name }}</div>
              <div class="flex flex-wrap gap-x-3 text-[13px] tabular-nums">
                <span class="text-income">รับ {{ formatMoney(r.summary.income) }}</span>
                <span class="text-expense">จ่าย {{ formatMoney(r.summary.expense) }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[11px] text-muted">คงเหลือ</div>
              <div class="text-[17px] font-bold tabular-nums">{{ formatMoney(r.summary.closing) }}</div>
            </div>
          </div>
        </div>

        <!-- บัตรเครดิต: แยกจากยอดรวมด้านบน -->
        <template v-if="cards.length">
          <div class="section-title">
            <span>บัตรเครดิต ({{ cards.length }})</span>
            <span>ใช้ไปรวม <b class="text-expense tabular-nums">{{ formatMoney(cardsTotal) }}</b></span>
          </div>
          <div class="grid gap-2.5">
            <div v-for="r in cards" :key="r.account.id" class="card">
              <button
                type="button"
                class="flex w-full items-center gap-3 text-left"
                :aria-expanded="openCards.has(r.account.id)"
                @click="toggleCard(r.account.id)"
              >
                <BankLogo :bank-id="r.account.bankId" />
                <div class="min-w-0 flex-1 truncate font-semibold">{{ r.account.name || bankById(r.account.bankId).name }}</div>
                <div class="text-right">
                  <div class="text-[11px] text-muted">ใช้ไปรอบนี้</div>
                  <div class="text-[17px] font-bold tabular-nums text-expense">{{ formatMoney(r.summary.expense) }}</div>
                </div>
                <span class="w-4 text-center text-muted transition-transform" :class="{ 'rotate-90': openCards.has(r.account.id) }" aria-hidden="true">›</span>
              </button>

              <!-- รายการที่รูดบัตรในรอบนี้ (ดูอย่างเดียว) -->
              <div v-if="openCards.has(r.account.id)" class="mt-3 divide-y divide-line rounded-xl bg-card-2 px-3">
                <div v-for="t in cardItems(r.account.id)" :key="t.id" class="flex items-center gap-3 py-2 text-sm">
                  <span class="w-14 flex-none text-[13px] text-muted">{{ formatDay(t.date) }}</span>
                  <span class="flex-none text-lg">{{ categoryById('expense', t.category).icon }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="truncate">{{ t.note || categoryById('expense', t.category).name }}</div>
                    <div v-if="t.note" class="truncate text-xs text-muted">{{ categoryById('expense', t.category).name }}</div>
                  </div>
                  <span class="flex-none tabular-nums">{{ formatMoney(t.amount) }}</span>
                </div>
                <p v-if="!cardItems(r.account.id).length" class="py-3 text-center text-sm text-muted">ยังไม่มีรายการในรอบนี้</p>
              </div>

              <!-- กำลังผ่อน: งวดที่จ่ายแล้วและยอดที่ยังเหลือ -->
              <template v-if="openCards.has(r.account.id) && plansOf(r.account.id).length">
                <div class="mt-3 mb-1.5 text-[13px] font-semibold text-muted">กำลังผ่อน</div>
                <div class="divide-y divide-line rounded-xl bg-card-2 px-3">
                  <div v-for="p in plansOf(r.account.id)" :key="p.planId" class="flex items-center gap-3 py-2 text-sm">
                    <span class="flex-none text-lg">{{ categoryById('expense', p.category).icon }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="truncate">{{ p.name || categoryById('expense', p.category).name }}</div>
                      <div class="text-xs text-muted">จ่ายแล้ว {{ p.paid }}/{{ p.of }} งวด · เหลือ {{ p.of - p.paid }} งวด</div>
                    </div>
                    <div class="text-right">
                      <div class="text-[11px] text-muted">ยังเหลือ</div>
                      <div class="tabular-nums">{{ formatMoney(p.remaining) }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <div class="lg:col-start-1 lg:row-start-2">
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
        <CategoryBreakdown :summary="data.total" :type="breakdownType" :items-for="itemsFor" />
      </div>
    </div>
  </main>
</template>
