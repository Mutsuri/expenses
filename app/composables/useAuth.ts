// หน้าเข้าสู่ระบบแบบใส่ชื่อผู้ใช้อย่างเดียว ไว้แยกคนใช้ ไม่ใช่ระบบป้องกันข้อมูล
// (โค้ดเว็บเปิดให้ทุกคนดูได้ ข้อมูลจริงป้องกันด้วยรหัสลับของ Google Sheet)

const USERS: Record<string, string> = {
  mutto: 'Mutsuri',
}

const KEY = 'expenses.user'

function readSaved(): string | null {
  try {
    const u = localStorage.getItem(KEY)
    return u && USERS[u] ? u : null
  } catch {
    return null
  }
}

const username = ref<string | null>(import.meta.client ? readSaved() : null)

export function useAuth() {
  return {
    username: readonly(username),
    displayName: computed(() => (username.value ? USERS[username.value]! : '')),
    /** คืน true ถ้าชื่อผู้ใช้ถูกต้อง */
    login(input: string): boolean {
      const u = input.trim().toLowerCase()
      if (!USERS[u]) return false
      username.value = u
      try {
        localStorage.setItem(KEY, u)
      } catch {}
      return true
    },
    logout() {
      username.value = null
      try {
        localStorage.removeItem(KEY)
      } catch {}
    },
  }
}
