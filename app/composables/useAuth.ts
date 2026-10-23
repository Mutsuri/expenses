// หน้าเข้าสู่ระบบแบบใส่ชื่อผู้ใช้อย่างเดียว (ใช้กันในบ้าน)
// ข้อมูลแยกตามผู้ใช้ เปิดข้อมูลของคนที่ login เท่านั้น
import { USERS } from '#shared/utils/users'

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
  const store = useStore()
  // จำผู้ใช้ไว้แล้ว: เปิดข้อมูลของคนนั้นเลย
  if (username.value) store.open(username.value)

  return {
    username: readonly(username),
    displayName: computed(() => (username.value ? USERS[username.value]! : '')),
    /** คืน true ถ้าชื่อผู้ใช้ถูกต้อง แล้วเปิดข้อมูลของผู้ใช้คนนั้น */
    async login(input: string): Promise<boolean> {
      const u = input.trim().toLowerCase()
      if (!USERS[u]) return false
      username.value = u
      try {
        localStorage.setItem(KEY, u)
      } catch {}
      await store.open(u)
      return true
    },
    /** รีโหลดเพื่อล้างข้อมูลของผู้ใช้คนนี้ออกจากหน่วยความจำ */
    logout() {
      username.value = null
      try {
        localStorage.removeItem(KEY)
      } catch {}
      window.location.replace(`${useRuntimeConfig().app.baseURL}login`)
    },
  }
}
