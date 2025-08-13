import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'

export interface SessionState {
  user: User | null
  status: 'authenticated' | 'unauthenticated' | 'authenticating'
  currentWorkspace: any | null
  isFirstTimeUser: boolean
  authMethod: 'magic-link' | 'google' | 'guest' | null
  sessionInitialized: boolean
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    user: null,
    status: 'unauthenticated',
    currentWorkspace: null,
    isFirstTimeUser: false,
    authMethod: null,
    sessionInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => state.status === 'authenticated',
    isLoading: (state) => state.status === 'authenticating',
    userEmail: (state) => state.user?.email || '',
    userName: (state) => {
      if (!state.user) return ''
      const metadata = state.user.user_metadata
      return metadata?.full_name || metadata?.name || state.user.email?.split('@')[0] || 'User'
    },
    userInitials: (state) => {
      if (!state.user) return 'U'
      const metadata = state.user.user_metadata
      const name = metadata?.full_name || metadata?.name || state.user.email
      if (name) {
        const parts = name.split(' ')
        if (parts.length >= 2) {
          return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        }
        return name.charAt(0).toUpperCase()
      }
      return 'U'
    }
  },

  actions: {
    setUser(user: User | null) {
      this.user = user
      if (user) {
        this.status = 'authenticated'
      } else {
        this.status = 'unauthenticated'
        this.currentWorkspace = null
      }
    },

    setStatus(status: 'authenticated' | 'unauthenticated' | 'authenticating') {
      this.status = status
    },

    setCurrentWorkspace(workspace: any) {
      this.currentWorkspace = workspace
    },

    setFirstTimeUser(isFirstTime: boolean) {
      this.isFirstTimeUser = isFirstTime
    },

    setAuthMethod(method: 'magic-link' | 'google' | 'guest' | null) {
      this.authMethod = method
    },

    async loadSession() {
      this.status = 'authenticating'
      
      try {
        const { supabase } = useSupabase()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error loading session:', error)
          this.setUser(null)
          return
        }

        if (session?.user) {
          this.setUser(session.user)
          
          // Check if this is their first login
          await this.checkFirstTimeUser()
          
          // Initialize workspace
          await this.initializeWorkspace()
        } else {
          this.setUser(null)
        }
      } catch (error) {
        console.error('Session load error:', error)
        this.setUser(null)
      } finally {
        this.sessionInitialized = true
      }
    },

    async checkFirstTimeUser() {
      if (!this.user) return
      
      try {
        // Check if user has any workspaces in the database
        const response = await $fetch('/api/workspaces/check-user', {
          headers: {
            'Authorization': `Bearer ${(await useSupabase().supabase.auth.getSession()).data.session?.access_token}`
          }
        })
        
        this.setFirstTimeUser(!response.hasWorkspaces)
      } catch (error) {
        console.error('Error checking first time user:', error)
        // Default to first time user if we can't check
        this.setFirstTimeUser(true)
      }
    },

    async initializeWorkspace() {
      if (!this.user) return

      const workspaceStore = useWorkspaceStore()
      
      if (this.isFirstTimeUser) {
        // Create default workspace for new user
        await this.createDefaultWorkspace()
      } else {
        // Load existing workspaces for returning user
        await this.loadUserWorkspaces()
      }
    },

    async createDefaultWorkspace() {
      if (!this.user) return

      try {
        const workspaceName = `${this.userName}'s Workspace`
        
        const response = await $fetch('/api/workspaces/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await useSupabase().supabase.auth.getSession()).data.session?.access_token}`
          },
          body: {
            name: workspaceName,
            icon: '🏠',
            color: '#3b82f6'
          }
        })

        if (response.success) {
          this.setCurrentWorkspace(response.workspace)
          
          // Create welcome page
          await this.createWelcomePage(response.workspace.id)
          
          console.log('Default workspace created:', response.workspace)
        }
      } catch (error) {
        console.error('Error creating default workspace:', error)
      }
    },

    async createWelcomePage(workspaceId: string) {
      try {
        const welcomeContent = {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Welcome to Athena! 🎉' }]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'This is your first page in Athena. Here are some things you can do:' }
              ]
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Press ' },
                        { type: 'text', marks: [{ type: 'code' }], text: 'Ctrl+K' },
                        { type: 'text', text: ' to open the Command Palette' }
                      ]
                    }
                  ]
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Type "Page" and press Enter to see page-related commands' }
                      ]
                    }
                  ]
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Transform this page into different types (Database, Whiteboard, etc.)' }
                      ]
                    }
                  ]
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        { type: 'text', text: 'Create new pages and organize them in your workspace' }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Happy creating! ✨' }
              ]
            }
          ]
        }

        const response = await $fetch('/api/pages/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await useSupabase().supabase.auth.getSession()).data.session?.access_token}`
          },
          body: {
            workspaceId,
            title: 'Welcome to Athena',
            type: 'DOCUMENT',
            icon: '👋',
            content: welcomeContent
          }
        })

        if (response.success) {
          console.log('Welcome page created:', response.page)
          // Navigate to the welcome page
          await navigateTo(`/page/${response.page.id}`)
        }
      } catch (error) {
        console.error('Error creating welcome page:', error)
      }
    },

    async loadUserWorkspaces() {
      if (!this.user) return

      try {
        const response = await $fetch('/api/workspaces/list', {
          headers: {
            'Authorization': `Bearer ${(await useSupabase().supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (response.success && response.workspaces.length > 0) {
          // Set the last accessed workspace as current
          const lastWorkspace = response.workspaces
            .sort((a: any, b: any) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())[0]
          
          this.setCurrentWorkspace(lastWorkspace)
          console.log('Loaded user workspaces, current:', lastWorkspace)
        }
      } catch (error) {
        console.error('Error loading user workspaces:', error)
      }
    },

    clearSession() {
      this.user = null
      this.status = 'unauthenticated'
      this.currentWorkspace = null
      this.isFirstTimeUser = false
      this.authMethod = null
      this.sessionInitialized = false
    }
  }
})