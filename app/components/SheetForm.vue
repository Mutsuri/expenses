<script setup lang="ts">
// ฟอร์มลิงก์เว็บแอป Apps Script + รหัสลับ ใช้ในหน้าเชื่อมต่อครั้งแรกและหน้าตั้งค่า
defineProps<{ submitLabel: string }>()

const { sync, configure } = useSync()
const sheetUrl = ref('')
const sheetSecret = ref('')
const showSecret = ref(false)
// ค่าที่บันทึกไว้โหลดจาก IndexedDB ทีหลัง เติมให้เมื่อช่องยังว่าง
watch(() => [sync.url, sync.secret] as const, ([url, secret]) => {
  if (!sheetUrl.value) sheetUrl.value = url
  if (!sheetSecret.value) sheetSecret.value = secret
}, { immediate: true })

const urlError = computed(() =>
  sheetUrl.value && !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(sheetUrl.value.trim())
    ? 'ต้องเป็นลิงก์เว็บแอปที่ลงท้ายด้วย /exec (ไม่ใช่ลิงก์หน้าแก้โค้ด)'
    : '',
)

function connect() {
  if (urlError.value) return
  configure(sheetUrl.value, sheetSecret.value)
}
</script>

<template>
  <form @submit.prevent="connect">
    <label class="field">
      <span>ลิงก์เว็บแอปของ Apps Script</span>
      <input v-model="sheetUrl" class="input" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec">
      <small v-if="urlError" class="mx-1 mt-1.5 block text-[13px] text-expense">{{ urlError }}</small>
    </label>
    <label class="field">
      <span>รหัสลับ (ตรงกับ SECRET ใน Apps Script)</span>
      <div class="relative">
        <input v-model="sheetSecret" class="input pr-16" :type="showSecret ? 'text' : 'password'" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button
          type="button"
          class="absolute inset-y-0 right-0 px-3.5 text-[13px] font-semibold text-accent"
          :aria-label="showSecret ? 'ซ่อนรหัสลับ' : 'แสดงรหัสลับ'"
          @click.prevent="showSecret = !showSecret"
        >
          {{ showSecret ? 'ซ่อน' : 'แสดง' }}
        </button>
      </div>
    </label>
    <div class="flex flex-wrap gap-2">
      <button class="btn btn-primary" type="submit" :disabled="!sheetUrl || !sheetSecret || sync.status === 'syncing'">{{ submitLabel }}</button>
      <slot />
    </div>
  </form>
</template>
