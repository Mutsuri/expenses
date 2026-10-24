export default defineNuxtRouteMiddleware(async (to) => {
  const { username } = useAuth()
  if (!username.value) return to.path === '/login' ? undefined : navigateTo('/login', { replace: true })
  if (to.path === '/login') return navigateTo('/', { replace: true })

  // ต้องเชื่อม Google Sheet ก่อนใช้งาน (ลิงก์อยู่ในข้อมูลที่เข้ารหัส รอเปิดข้อมูลก่อน)
  const store = useStore()
  await store.whenReady()
  const linked = isSheetLinked(store.state.syncConfig)
  if (!linked && to.path !== '/connect') return navigateTo('/connect', { replace: true })
  if (linked && to.path === '/connect') return navigateTo('/', { replace: true })
})
