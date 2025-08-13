import { ref } from 'vue'
import type { AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  message: string
  error?: string
}

export const useAuth = () => {
  const sessionStore = useSessionStore()
  const { supabase } = useSupabase()
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Sign in with magic link (passwordless authentication)
   */
  const signInWithMagicLink = async (email: string): Promise<AuthResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const { data, error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redirect URL after clicking magic link
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true, // Create user if they don't exist
        }
      })

      if (authError) {
        throw authError
      }

      // Set auth method for tracking
      sessionStore.setAuthMethod('magic-link')

      return {
        success: true,
        message: `Check your inbox! A secure login link has been sent to ${email}.`
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send magic link'
      error.value = errorMessage
      
      console.error('Magic link error:', err)

      return {
        success: false,
        message: 'Failed to send magic link',
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async (): Promise<AuthResult> => {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (authError) {
        throw authError
      }

      // Set auth method for tracking
      sessionStore.setAuthMethod('google')

      return {
        success: true,
        message: 'Redirecting to Google...'
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in with Google'
      error.value = errorMessage
      
      console.error('Google auth error:', err)

      return {
        success: false,
        message: 'Failed to sign in with Google',
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Continue as guest (temporary session)
   */
  const continueAsGuest = async (): Promise<AuthResult> => {
    try {
      // Set guest session mode
      sessionStore.setAuthMethod('guest')
      sessionStore.setStatus('authenticated')
      
      // Create a temporary user object for guest mode
      const guestUser = {
        id: `guest-${Date.now()}`,
        email: 'guest@athena.app',
        user_metadata: {
          full_name: 'Guest User'
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString()
      } as any

      sessionStore.setUser(guestUser)
      sessionStore.setFirstTimeUser(true)

      // Initialize guest workspace
      await sessionStore.initializeWorkspace()

      return {
        success: true,
        message: 'Guest session started'
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start guest session'
      error.value = errorMessage
      
      console.error('Guest session error:', err)

      return {
        success: false,
        message: 'Failed to start guest session',
        error: errorMessage
      }
    }
  }

  /**
   * Sign out user
   */
  const signOut = async (): Promise<AuthResult> => {
    isLoading.value = true
    error.value = null

    try {
      // Only call Supabase signOut if not in guest mode
      if (sessionStore.authMethod !== 'guest') {
        const { error: authError } = await supabase.auth.signOut()
        if (authError) {
          throw authError
        }
      }

      // Clear session store
      sessionStore.clearSession()

      // Clear any localStorage data if in guest mode
      if (sessionStore.authMethod === 'guest') {
        localStorage.removeItem('athena-workspaces')
        localStorage.removeItem('athena-guest-session')
      }

      // Redirect to home page
      await navigateTo('/')

      return {
        success: true,
        message: 'Signed out successfully'
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign out'
      error.value = errorMessage
      
      console.error('Sign out error:', err)

      return {
        success: false,
        message: 'Failed to sign out',
        error: errorMessage
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Listen for authentication state changes
   */
  const listenForAuthStateChange = () => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            sessionStore.setUser(session.user)
            
            // Check if this is their first login
            await sessionStore.checkFirstTimeUser()
            
            // Initialize workspace
            await sessionStore.initializeWorkspace()
          }
          break

        case 'SIGNED_OUT':
          sessionStore.clearSession()
          break

        case 'TOKEN_REFRESHED':
          if (session?.user) {
            sessionStore.setUser(session.user)
          }
          break

        case 'USER_UPDATED':
          if (session?.user) {
            sessionStore.setUser(session.user)
          }
          break

        default:
          break
      }
    })
  }

  /**
   * Handle magic link callback
   */
  const handleAuthCallback = async (): Promise<AuthResult> => {
    try {
      const { data, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        throw authError
      }

      if (data.session?.user) {
        // User is now authenticated, the auth state change listener will handle the rest
        return {
          success: true,
          message: 'Successfully signed in!'
        }
      } else {
        throw new Error('No session found')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed'
      error.value = errorMessage
      
      console.error('Auth callback error:', err)

      return {
        success: false,
        message: 'Authentication failed',
        error: errorMessage
      }
    }
  }

  /**
   * Get current session
   */
  const getCurrentSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    } catch (err) {
      console.error('Get session error:', err)
      return null
    }
  }

  /**
   * Refresh session
   */
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      return data.session
    } catch (err) {
      console.error('Refresh session error:', err)
      return null
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Actions
    signInWithMagicLink,
    signInWithGoogle,
    continueAsGuest,
    signOut,
    listenForAuthStateChange,
    handleAuthCallback,
    getCurrentSession,
    refreshSession
  }
}