<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { accountCycles, type CycleRow } from '#shared/utils/history'
import { cycleOf, shiftCycle, todayISO } from '#shared/utils/cycle'
import { formatCycleShort, formatMoney } from '#shared/utils/format'
import { balanceOf, inCycle, involves, summarize } from '#shared/utils/stats'

const { state, cycleSettings } = useStore()
const route = useRoute()
const id = route.params.id as string

const account = computed(() => state.accounts.find((a) => a.id === id))
const bank = computed(() => bankById(account.value?.bankId ?? 'other'))
const txs = computed(() => state.transactions.filter((t) => involves(t, id)))

const tab = ref<'list' | 'stats'>(route.query.tab === 'stats' ? 'stats' : 'list')
const cycleKey = ref(cycleOf(todayISO(), cycleSettings.value).key)
const cycle = computed(() => shiftCycle(cycleKey.value, 0, cycleSettings.value))

const balance = computed(() => (account.value ? balanceOf(account.value, txs.value) : 0))
const cycleTxs = computed(() => inCycle(txs.value, cycle.value))
const breakdownType = ref<'expense' | 'income'>('expense')

const salaryIds = computed(() => new Set(state.accounts.filter((a) => a.salary).map((a) => a.id)))
const history = computed(() =>
  account.value ? accountCycles(account.value, state.transactions, cycleSettings.value, todayISO(), salaryIds.value) : [],
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
// PC: กด N เพื่อจดรายการ
const router = useRouter()
function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement
  if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey || el.closest('input, textarea, select')) return
  e.preventDefault()
  router.push(`/tx/new?account=${id}`)
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

function pickCycle(key: string) {
  cycleKey.value = key
  tab.value = 'list'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main v-if="account" class="page page-wide">
    <TopBar :title="account.name" back="/">
      <NuxtLink :to="`/accounts/${id}/edit`" class="p-2 font-semibold text-accent">แก้ไข</NuxtLink>
    </TopBar>

    <!-- จอกว้าง: ยอดเงินและสรุปซ้าย รายการหรือตารางขวา -->
    <div class="lg:grid lg:grid-cols-[400px_1fr] lg:items-start lg:gap-8">
      <div>
        <section class="card flex items-center gap-3.5">
          <BankLogo :bank-id="account.bankId" :size="52" />
          <div>
            <div class="text-[13px] text-muted">{{ bank.name }}<template v-if="account.last4"> · •••{{ account.last4 }}</template></div>
            <div class="text-[28px] leading-[1.2] font-bold tabular-nums">฿{{ formatMoney(balance) }}</div>
            <div v-if="account.salary" class="mt-0.5 text-xs font-semibold text-accent">💼 บัญชีรับเงินเดือน</div>
          </div>
        </section>

        <div class="mt-4 mb-3 grid grid-cols-2 rounded-[14px] bg-card-2 p-1">
          <button
            v-for="t in [{ key: 'list', label: 'รายการ' }, { key: 'stats', label: 'สถิติ' }] as const"
            :key="t.key"
            class="rounded-[10px] p-2 font-semibold"
            :class="tab === t.key ? 'bg-card text-ink shadow-card' : 'text-muted'"
            @click="tab = t.key"
          >
            {{ t.label }}
          </button>
        </div>

        <template v-if="tab === 'list'">
          <CycleNav v-model="cycleKey" />
          <div class="h-2.5" />
          <SummaryCard :row="row" />

          <div class="section-title">
            <span>แยกตามหมวด</span>
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
          <CategoryBreakdown :summary="row.summary" :type="breakdownType" />
        </template>

        <template v-else>
          <div class="section-title"><span>รายรับ–รายจ่าย 12 รอบล่าสุด</span><span>แตะแท่งเพื่อดูรายละเอียด</span></div>
          <CycleChart :rows="history" :selected="cycleKey" @select="cycleKey = $event" />
        </template>
      </div>

      <div>
        <template v-if="tab === 'list'">
          <div class="section-title lg:mt-0"><span>รายการ ({{ cycleTxs.length }})</span></div>
          <TxList :items="cycleTxs" :account-id="id" />
        </template>

        <template v-else>
          <div class="section-title lg:mt-0"><span>แยกรายรอบ</span></div>
          <!-- คอลัมน์แรกชิดซ้าย ที่เหลือชิดขวา -->
          <div
            class="card divide-y divide-line px-3 py-1 [&>*]:grid [&>*]:w-full [&>*]:grid-cols-[1.1fr_1fr_1fr_1fr] [&>*]:gap-1.5 [&>*]:px-0.5 [&>*]:py-2.5 [&>*]:text-right [&>*>span:first-child]:text-left"
          >
            <div class="text-xs text-muted">
              <span>รอบ</span><span>รับ</span><span>จ่าย</span><span>คงเหลือ</span>
            </div>
            <button v-for="r in history" :key="r.cycle.key" class="text-sm transition-colors hover:text-accent" @click="pickCycle(r.cycle.key)">
              <span>{{ formatCycleShort(r.cycle.key) }}</span>
              <span class="tabular-nums text-income">{{ formatMoney(r.summary.income, { short: true }) }}</span>
              <span class="tabular-nums text-expense">{{ formatMoney(r.summary.expense, { short: true }) }}</span>
              <span class="tabular-nums">{{ formatMoney(r.summary.closing, { short: true }) }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>

    <NuxtLink :to="`/tx/new?account=${id}`" class="fab" aria-label="จดรายการ" title="จดรายการ (N)">+</NuxtLink>
  </main>
  <main v-else class="page">
    <TopBar title="ไม่พบบัญชี" back="/" />
  </main>
</template>
