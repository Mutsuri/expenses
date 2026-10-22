<script setup lang="ts">
import { categoryById } from '#shared/utils/categories'
import { formatMoney, formatWeekday } from '#shared/utils/format'
import { groupByDay, type Transaction } from '#shared/utils/stats'

const props = defineProps<{ items: Transaction[] }>()
const groups = computed(() => groupByDay(props.items))
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
          <span class="icon">{{ categoryById(t.type, t.category).icon }}</span>
          <div class="body">
            <div>{{ t.note || categoryById(t.type, t.category).name }}</div>
            <div class="sub muted">{{ categoryById(t.type, t.category).name }}</div>
          </div>
          <b class="num" :class="t.type">{{ t.type === 'income' ? '+' : '-' }}{{ formatMoney(t.amount) }}</b>
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
