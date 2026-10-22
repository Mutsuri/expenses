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

function view(t: Transaction) {
  if (t.type === 'transfer') {
    const out = t.accountId === props.accountId
    // รับโอนจากบัญชีรับเงินเดือน = เงินเดือน
    if (!out && state.accounts.find((a) => a.id === t.accountId)?.salary) {
      return { icon: '💼', title: t.note || 'เงินเดือน', sub: `เงินเดือน · จาก ${accountName(t.accountId)}`, cls: 'income' }
    }
    const label = out ? `โอนไป ${accountName(t.toAccountId)}` : `รับโอนจาก ${accountName(t.accountId)}`
    // รับโอน = รายรับ, โอนออก = รายจ่าย
    return { icon: '🔁', title: t.note || label, sub: t.note ? label : out ? 'โอนออก (รายจ่าย)' : 'รับโอน (รายรับ)', cls: out ? 'expense' : 'income' }
  }
  const c = categoryById(t.type, t.category)
  return { icon: c.icon, title: t.note || c.name, sub: c.name, cls: t.type }
}
</script>

<template>
  <div v-if="groups.length" class="list">
    <div v-for="g in groups" :key="g.date">
      <div class="day">
        <span>{{ formatWeekday(g.date) }}</span>
        <span class="num" :class="g.net >= 0 ? 'income' : 'expense'">{{ formatMoney(g.net, { sign: true }) }}</span>
      </div>
      <div class="card items">
        <NuxtLink v-for="t in g.items" :key="t.id" :to="`/tx/${t.id}`" class="item">
          <span class="icon">{{ view(t).icon }}</span>
          <div class="body">
            <div>{{ view(t).title }}</div>
            <div class="sub muted">{{ view(t).sub }}</div>
          </div>
          <b class="num" :class="view(t).cls">{{ formatMoney(signedFor(t, accountId), { sign: true }) }}</b>
        </NuxtLink>
      </div>
    </div>
  </div>
  <div v-else class="card muted empty">ยังไม่มีรายการในรอบนี้<br>กดปุ่ม + เพื่อจด</div>
</template>

<style scoped>
.day { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); margin: 16px 4px 6px; }
.items { padding: 4px 16px; }
.item { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.item + .item { border-top: 1px solid var(--line); }
.icon { font-size: 22px; width: 36px; height: 36px; display: grid; place-items: center; background: var(--card-2); border-radius: 50%; flex: none; }
.body { flex: 1; min-width: 0; }
.body > div:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub { font-size: 13px; }
.empty { text-align: center; padding: 28px 16px; }
</style>
