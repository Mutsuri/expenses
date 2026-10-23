<script setup lang="ts">
const { login } = useAuth()
const router = useRouter()
const base = useRuntimeConfig().app.baseURL
const name = ref('')
const error = ref('')

async function submit() {
  if (await login(name.value)) router.replace('/')
  else error.value = 'ไม่พบชื่อผู้ใช้นี้'
}
</script>

<template>
  <main class="page flex min-h-dvh flex-col justify-center pb-[20vh]">
    <div class="mb-6 text-center">
      <!-- รูปเดียวกับไอคอนบนหน้าจอโฮม -->
      <img class="mx-auto mb-3 block size-[72px] rounded-[22px]" :src="`${base}icon-192.png`" alt="" width="72" height="72">
      <h1 class="text-[28px] font-bold">จดจ่าย</h1>
      <p class="mt-1 text-muted">จดรายรับ – รายจ่ายแยกตามบัญชี</p>
    </div>

    <form class="card" @submit.prevent="submit">
      <label class="field">
        <span>ชื่อผู้ใช้</span>
        <input
          v-model="name"
          class="input"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          autofocus
          @input="error = ''"
        >
      </label>
      <p v-if="error" class="mx-1 -mt-1 mb-3 text-sm text-expense">{{ error }}</p>
      <button class="btn btn-primary btn-block" type="submit" :disabled="!name.trim()">เข้าสู่ระบบ</button>
    </form>
  </main>
</template>
