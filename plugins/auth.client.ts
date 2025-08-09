export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize authentication state on app startup
  await authStore.fetchUser()
})