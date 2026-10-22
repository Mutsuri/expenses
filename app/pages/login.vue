<script setup lang="ts">
const { login } = useAuth()
const router = useRouter()
const base = useRuntimeConfig().app.baseURL
const name = ref('')
const error = ref('')

function submit() {
  if (login(name.value)) router.replace('/')
  else error.value = 'ไม่พบชื่อผู้ใช้นี้'
}
</script>

<template>
  <main class="page login">
    <div class="brand">
      <img class="logo" :src="`${base}icon-192.png`" alt="" width="72" height="72">
      <h1>จดจ่าย</h1>
      <p class="muted">จดรายรับ – รายจ่ายแยกตามบัญชี</p>
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
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn btn-primary btn-block" type="submit" :disabled="!name.trim()">เข้าสู่ระบบ</button>
    </form>
  </main>
</template>

<style scoped>
.login { min-height: 100dvh; display: flex; flex-direction: column; justify-content: center; padding-bottom: 20vh; }
.brand { text-align: center; margin-bottom: 24px; }
/* รูปเดียวกับไอคอนบนหน้าจอโฮม */
.logo { width: 72px; height: 72px; margin: 0 auto 12px; border-radius: 22px; display: block; }
h1 { margin: 0; font-size: 28px; }
.brand p { margin: 4px 0 0; }
.error { color: var(--expense); margin: -4px 4px 12px; font-size: 14px; }
.btn:disabled { opacity: 0.5; }
</style>
