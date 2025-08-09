import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  isVerified: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }),

  getters: {
    fullName: (state) => {
      if (!state.user || (!state.user.firstName && !state.user.lastName)) return null
      return `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim()
    },
    initials: (state) => {
      if (!state.user) return 'U'
      const firstName = state.user.firstName || ''
      const lastName = state.user.lastName || ''
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || state.user.email.charAt(0).toUpperCase()
    }
  },

  actions: {
    async fetchUser() {
      this.isLoading = true
      try {
        const response = await $fetch('/api/auth/me')
        if (response.success && response.user) {
          this.user = response.user
          this.isAuthenticated = true
        } else {
          this.user = null
          this.isAuthenticated = false
        }
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
      } finally {
        this.isLoading = false
      }
    },

    async login(credentials: { email: string; password: string; rememberMe?: boolean }) {
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: credentials
        })

        if (response.success && response.user) {
          this.user = response.user
          this.isAuthenticated = true
          return { success: true, message: response.message }
        } else {
          throw new Error('Login failed')
        }
      } catch (error: any) {
        this.user = null
        this.isAuthenticated = false
        throw error
      }
    },

    async register(userData: { 
      email: string
      password: string
      passwordConfirmation: string
      firstName?: string
      lastName?: string
    }) {
      try {
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          body: userData
        })

        if (response.success && response.user) {
          this.user = response.user
          this.isAuthenticated = true
          return { success: true, message: response.message }
        } else {
          throw new Error('Registration failed')
        }
      } catch (error: any) {
        this.user = null
        this.isAuthenticated = false
        throw error
      }
    },

    async loginWithGoogle(idToken: string) {
      try {
        const response = await $fetch('/api/auth/google/login', {
          method: 'POST',
          body: { idToken }
        })

        if (response.success && response.user) {
          this.user = response.user
          this.isAuthenticated = true
          return { success: true, message: response.message }
        } else {
          throw new Error('Google login failed')
        }
      } catch (error: any) {
        this.user = null
        this.isAuthenticated = false
        throw error
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Logout API error:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
        // Redirect to login page
        await navigateTo('/auth/login')
      }
    },

    async requestPasswordReset(email: string) {
      try {
        const response = await $fetch('/api/auth/reset-password/request', {
          method: 'POST',
          body: { email }
        })
        return response
      } catch (error: any) {
        throw error
      }
    },

    async confirmPasswordReset(token: string, password: string, passwordConfirmation: string) {
      try {
        const response = await $fetch('/api/auth/reset-password/confirm', {
          method: 'POST',
          body: { token, password, passwordConfirmation }
        })
        return response
      } catch (error: any) {
        throw error
      }
    }
  }
})