export default defineNuxtRouteMiddleware((to) => {
  const { username } = useAuth()
  if (!username.value && to.path !== '/login') return navigateTo('/login', { replace: true })
  if (username.value && to.path === '/login') return navigateTo('/', { replace: true })
})
