export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server side during hydration
  if (process.server) return

  const { $fetch } = useNuxtApp()
  
  try {
    // Try to get current user
    await $fetch('/api/auth/me')
    
    // If we get here, user is authenticated, redirect to home
    return navigateTo('/')
    
  } catch (error: any) {
    // User is not authenticated, allow access to auth pages
    return
  }
})