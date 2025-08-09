import { prisma } from '~/utils/database'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server side during hydration
  if (process.server) return

  const { $fetch } = useNuxtApp()
  
  try {
    // Try to get current user
    const response = await $fetch('/api/auth/me')
    
    // If we get here, user is authenticated
    return
    
  } catch (error: any) {
    // User is not authenticated, redirect to login
    if (to.path !== '/auth/login' && to.path !== '/auth/register') {
      return navigateTo('/auth/login')
    }
  }
})