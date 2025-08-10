export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize authentication state on app startup
  // Ignore 401 errors during initialization as they're expected when not logged in
  try {
    await authStore.fetchUser()
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.status === 401) {
      // Expected when not authenticated - silently ignore
      console.log('User not authenticated, continuing with guest session')
    } else {
      // Log other unexpected errors
      console.error('Auth initialization error:', error)
    }
  }
})