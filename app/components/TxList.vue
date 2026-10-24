<script setup lang="ts">
import { bankById } from '#shared/utils/banks'
import { categoryById } from '#shared/utils/categories'
import { formatMoney, formatWeekday } from '#shared/utils/format'
import { groupByDay, signedFor, type Transaction } from '#shared/utils/stats'

// accountId = บัญชีที่กำลังดู ใช้บอกว่าการโอนเป็นเข้าหรือออก
const props = defineProps<{ items: Transaction[]; accountId: string }>()
const { state } = useStore()
const groups = computed(() => groupByDay(props.items, props.accountId))

const accountName = (id?: string) => {
  const a = state.accounts.find((x) => x.id === id)
  return a ? a.name || bankById(a.bankId).name : 'บัญชีที่ลบไปแล้ว'
}

// sub = ข้อความบรรทัดล่าง, peer = ชื่อบัญชีอีกฝั่งของการโอน (ต่อท้าย sub)
function view(t: Transaction): { icon: string; title: string; sub: string; peer?: string; color: string } {
  if (t.type === 'transfer') {
    const out = t.accountId === props.accountId
    const peer = accountName(out ? t.toAccountId : t.accountId)
    // รับโอนจากบัญชีรับเงินเดือน = เงินเดือน
    if (!out && state.accounts.find((a) => a.id === t.accountId)?.salary) {
      return { icon: '💼', title: t.note || 'เงินเดือน', sub: 'เงินเดือน · จาก', peer, color: 'text-income' }
    }
    // รับโอน = รายรับ, โอนออก = รายจ่าย
    return {
      icon: '🔁',
      title: t.note || (out ? `โอนไป ${peer}` : `รับโอนจาก ${peer}`),
      sub: out ? 'โอนออก · ไป' : 'รับโอน · จาก',
      peer,
      color: out ? 'text-expense' : 'text-income',
    }
  }
  const c = categoryById(t.type, t.category)
  return { icon: c.icon, title: t.note || c.name, sub: c.name, color: t.type === 'income' ? 'text-income' : 'text-expense' }
}
</script>

<template>
  <div v-if="groups.length">
    <div v-for="g in groups" :key="g.date">
      <div class="mx-1 mt-4 mb-1.5 flex justify-between text-[13px] text-muted">
        <span>{{ formatWeekday(g.date) }}</span>
        <span class="tabular-nums" :class="g.net >= 0 ? 'text-income' : 'text-expense'">{{ formatMoney(g.net, { sign: true }) }}</span>
      </div>
      <div class="card divide-y divide-line px-4 py-1">
        <NuxtLink v-for="t in g.items" :key="t.id" :to="`/tx/${t.id}`" class="-mx-4 flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-card-2">
          <span class="grid size-9 flex-none place-items-center rounded-full bg-card-2 text-[22px]">{{ view(t).icon }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate">{{ view(t).title }}</div>
            <div class="flex items-center gap-1 text-[13px] text-muted">
              <span>{{ view(t).sub }}</span>
              <span v-if="view(t).peer" class="truncate">{{ view(t).peer }}</span>
            </div>
          </div>
          <b class="tabular-nums" :class="view(t).color">{{ formatMoney(signedFor(t, accountId), { sign: true }) }}</b>
        </NuxtLink>
      </div>
    </div>
  </div>
  <div v-else class="card px-4 py-7 text-center text-muted">ยังไม่มีรายการในรอบนี้<br>กดปุ่ม + เพื่อจด</div>
</template>
