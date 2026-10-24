<script setup lang="ts">
// ต้องเชื่อม Google Sheet ให้ได้ก่อนเริ่มใช้งาน ยังไม่เชื่อมต่อจะไม่มีข้อมูลเก็บในเครื่อง
const { sync } = useSync()
const { state } = useStore()
const auth = useAuth()
const router = useRouter()

// sync ครั้งแรกสำเร็จแล้วเข้าแอปได้
watch(() => isSheetLinked(state.syncConfig), (linked) => linked && router.replace('/'))
</script>

<template>
  <main class="page">
    <TopBar title="เชื่อมต่อ Google Sheet" />
    <p class="mx-1 mb-3.5 text-[15px] text-muted">
      ข้อมูลของ {{ auth.displayName.value }} เก็บไว้ใน Google Sheet ต้องเชื่อมต่อให้สำเร็จก่อนจึงจะเริ่มจดได้
    </p>

    <div class="card">
      <p v-if="sync.status === 'syncing'" class="mb-3.5 text-sm text-muted">กำลังเชื่อมต่อ…</p>
      <p v-else-if="sync.status === 'error'" class="mb-3.5 text-sm text-expense">เชื่อมต่อไม่สำเร็จ: {{ sync.error }}</p>
      <SheetForm submit-label="เชื่อมต่อ" />
    </div>

    <button class="mx-auto mt-6 block rounded-lg px-2 py-1 text-sm text-muted underline" type="button" @click="auth.logout()">
      ออกจากระบบ
    </button>
  </main>
</template>
