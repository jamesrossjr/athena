/**
 * Session Mode Composable
 * 
 * Manages client-side session mode state and provides methods
 * for switching between guest and logged-in modes.
 */

import { SessionMode } from '~/services/session-modes'

interface SessionState {
  mode: SessionMode | 'NONE'
  sessionId?: string
  userId?: string
  authenticated: boolean
  features: {
    temporaryData?: boolean
    persistentData?: boolean
    noSignupRequired?: boolean
    dataLostOnReload?: boolean
    limitedFeatures?: boolean
    fullFeatures?: boolean
    cloudSync?: boolean
    collaboration?: boolean
  }
  dataCount?: {
    workspaces: number
    pages: number
    blocks: number
    links: number
  }
  expiresAt?: Date
}

// Global reactive state
const sessionState = ref<SessionState>({
  mode: 'NONE',
  authenticated: false,
  features: {}
})

const isLoading = ref(false)

export const useSessionMode = () => {
  
  /**
   * Initialize session mode on app load
   */
  const initializeSession = async () => {
    if (process.client) {
      isLoading.value = true
      try {
        const response = await $fetch('/api/session/mode')
        if (response.success) {
          updateSessionState(response.data)
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
      } finally {
        isLoading.value = false
      }
    }
  }

  /**
   * Create a new guest session
   */
  const startGuestSession = async () => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/session/guest', {
        method: 'POST'
      })
      
      if (response.success) {
        updateSessionState({
          mode: SessionMode.GUEST,
          sessionId: response.data.sessionId,
          authenticated: false,
          features: response.data.features,
          expiresAt: new Date(response.data.expiresAt)
        })
        
        return response.data
      }
    } catch (error) {
      console.error('Failed to start guest session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Switch to logged-in mode (would trigger login flow)
   */
  const switchToLoggedIn = async () => {
    // This would typically redirect to login or show login modal
    // For now, we'll just show that this option is available
    return {
      action: 'login_required',
      message: 'Login flow would be initiated here',
      benefits: [
        'Persistent data storage',
        'Cloud synchronization', 
        'Collaboration features',
        'Advanced functionality'
      ]
    }
  }

  /**
   * Promote guest session to logged-in (after signup/login)
   */
  const promoteGuestSession = async (userCredentials: { userId: string, sessionToken: string, user: any }) => {
    if (sessionState.value.mode !== SessionMode.GUEST) {
      throw new Error('Can only promote guest sessions')
    }

    isLoading.value = true
    try {
      const response = await $fetch('/api/session/promote', {
        method: 'POST',
        body: {
          guestSessionId: sessionState.value.sessionId,
          ...userCredentials
        }
      })

      if (response.success) {
        updateSessionState({
          mode: SessionMode.LOGGED_IN,
          userId: userCredentials.userId,
          authenticated: true,
          features: {
            persistentData: true,
            fullFeatures: true,
            cloudSync: true,
            collaboration: true
          }
        })

        return response.data
      }
    } catch (error) {
      console.error('Failed to promote guest session:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * End current session
   */
  const endSession = async () => {
    if (sessionState.value.mode === SessionMode.GUEST) {
      // Clear guest session
      try {
        await $fetch('/api/session/guest', { method: 'DELETE' })
      } catch (error) {
        console.warn('Failed to clean up guest session:', error)
      }
    } else if (sessionState.value.mode === SessionMode.LOGGED_IN) {
      // Logout
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch (error) {
        console.warn('Failed to logout:', error)
      }
    }

    // Reset state
    updateSessionState({
      mode: 'NONE',
      authenticated: false,
      features: {}
    })
  }

  /**
   * Update session state
   */
  const updateSessionState = (newState: Partial<SessionState>) => {
    sessionState.value = {
      ...sessionState.value,
      ...newState
    }
  }

  /**
   * Check if data will be lost on reload
   */
  const willLoseDataOnReload = computed(() => {
    return sessionState.value.mode === SessionMode.GUEST
  })

  /**
   * Get session capabilities
   */
  const capabilities = computed(() => {
    const mode = sessionState.value.mode
    
    return {
      canSave: mode === SessionMode.LOGGED_IN,
      canSync: mode === SessionMode.LOGGED_IN,
      canCollaborate: mode === SessionMode.LOGGED_IN,
      hasFullFeatures: mode === SessionMode.LOGGED_IN,
      isTemporary: mode === SessionMode.GUEST,
      isPersistent: mode === SessionMode.LOGGED_IN
    }
  })

  /**
   * Get user-friendly session description
   */
  const sessionDescription = computed(() => {
    switch (sessionState.value.mode) {
      case SessionMode.GUEST:
        return {
          title: 'Guest Mode',
          description: 'Your work is temporary and will be lost when you close the browser',
          icon: '👤',
          color: 'amber',
          action: 'Sign up to save your work'
        }
      case SessionMode.LOGGED_IN:
        return {
          title: 'Logged In',
          description: 'Your work is automatically saved and synchronized',
          icon: '✅',
          color: 'green',
          action: 'All features available'
        }
      default:
        return {
          title: 'No Session',
          description: 'Choose how you want to use Athena',
          icon: '🚀',
          color: 'blue',
          action: 'Start working'
        }
    }
  })

  // Auto-initialize on client
  if (process.client) {
    onMounted(() => {
      initializeSession()
    })
  }

  return {
    // State
    sessionState: readonly(sessionState),
    isLoading: readonly(isLoading),
    
    // Computed
    willLoseDataOnReload,
    capabilities,
    sessionDescription,
    
    // Methods
    initializeSession,
    startGuestSession,
    switchToLoggedIn,
    promoteGuestSession,
    endSession,
    updateSessionState
  }
}