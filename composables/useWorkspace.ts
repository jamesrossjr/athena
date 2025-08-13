/**
 * Workspace Context Composable
 * 
 * Manages the current workspace context and provides methods
 * for workspace operations throughout the application.
 */

import type { WorkspaceWithRelations, PageWithRelations } from '~/types/unified-data-layer'

// Guest session management
const ensureGuestSession = async () => {
  // Check if we already have a guest session cookie
  const guestSessionId = useCookie('guest-session-id')
  
  if (!guestSessionId.value) {
    // Create a new guest session
    try {
      const response = await $fetch('/api/guest/session', {
        method: 'POST'
      })
      
      if (response.success && response.sessionId) {
        guestSessionId.value = response.sessionId
      }
    } catch (error) {
      console.error('Failed to create guest session:', error)
      throw new Error('Failed to initialize guest session')
    }
  }
}

// Global state for current workspace
const currentWorkspace = ref<WorkspaceWithRelations | null>(null)
const currentPage = ref<any | null>(null)
const isWorkspaceLoading = ref(false)
const workspaceError = ref<string | null>(null)

export const useWorkspace = () => {
  // Methods
  const setCurrentWorkspace = (workspace: WorkspaceWithRelations | null) => {
    currentWorkspace.value = workspace
    workspaceError.value = null
    
    // Store in session storage for persistence
    if (process.client) {
      if (workspace) {
        sessionStorage.setItem('currentWorkspace', JSON.stringify({
          id: workspace.id,
          name: workspace.name,
          icon: workspace.icon,
          color: workspace.color
        }))
      } else {
        sessionStorage.removeItem('currentWorkspace')
      }
    }
  }

  const loadWorkspace = async (workspaceId: string) => {
    try {
      isWorkspaceLoading.value = true
      workspaceError.value = null

      const response = await $fetch(`/api/workspaces/${workspaceId}`, {
        query: { include_pages: true }
      })

      if (response.success) {
        setCurrentWorkspace(response.data)
        return response.data
      } else {
        throw new Error('Failed to load workspace')
      }
    } catch (error) {
      console.error('Error loading workspace:', error)
      workspaceError.value = 'Failed to load workspace'
      throw error
    } finally {
      isWorkspaceLoading.value = false
    }
  }

  const createWorkspace = async (data: { name: string; icon?: string; color?: string }) => {
    try {
      // Check if user is authenticated by trying to get auth store
      const authStore = useAuthStore()
      let response
      
      if (authStore.isAuthenticated) {
        // User is authenticated - use regular workspace endpoint
        response = await $fetch('/api/workspaces', {
          method: 'POST',
          body: data
        })
      } else {
        // User is not authenticated - use guest mode
        // First ensure we have a guest session
        await ensureGuestSession()
        
        response = await $fetch('/api/guest/workspaces', {
          method: 'POST',
          body: data
        })
      }

      if (response.success) {
        setCurrentWorkspace(response.data)
        return response.data
      } else {
        throw new Error('Failed to create workspace')
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw error
    }
  }

  const updateWorkspace = async (workspaceId: string, data: { name?: string; icon?: string; color?: string }) => {
    try {
      const response = await $fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        body: data
      })

      if (response.success) {
        // Update current workspace if it's the one being updated
        if (currentWorkspace.value?.id === workspaceId) {
          setCurrentWorkspace(response.data)
        }
        return response.data
      } else {
        throw new Error('Failed to update workspace')
      }
    } catch (error) {
      console.error('Error updating workspace:', error)
      throw error
    }
  }

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      await $fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE'
      })

      // Clear current workspace if it was deleted
      if (currentWorkspace.value?.id === workspaceId) {
        setCurrentWorkspace(null)
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
      throw error
    }
  }

  const getAllWorkspaces = async () => {
    try {
      const response = await $fetch('/api/workspaces', {
        query: { include_pages: true }
      })

      if (response.success) {
        return response.data
      } else {
        throw new Error('Failed to load workspaces')
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      throw error
    }
  }

  const createPage = async (data: { title: string; type: string; icon?: string; properties?: any }) => {
    if (!currentWorkspace.value) {
      throw new Error('No workspace selected')
    }

    try {
      const authStore = useAuthStore()
      let response
      
      if (authStore.isAuthenticated) {
        response = await $fetch('/api/pages', {
          method: 'POST',
          body: {
            workspaceId: currentWorkspace.value.id,
            ...data
          }
        })
      } else {
        // Use guest endpoint
        response = await $fetch('/api/guest/pages', {
          method: 'POST',
          body: {
            workspaceId: currentWorkspace.value.id,
            ...data
          }
        })
      }

      if (response.success) {
        // Add page to current workspace's pages array
        if (currentWorkspace.value.pages) {
          currentWorkspace.value.pages.unshift(response.data)
        }
        return response.data
      } else {
        throw new Error('Failed to create page')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      throw error
    }
  }

  const updatePage = async (pageId: string, data: { title?: string; icon?: string; properties?: any }) => {
    if (!currentWorkspace.value) {
      throw new Error('No workspace selected')
    }

    try {
      const authStore = useAuthStore()
      
      if (authStore.isAuthenticated) {
        // For authenticated users, make API call
        const response = await $fetch(`/api/pages/${pageId}`, {
          method: 'PATCH',
          body: data
        })
        
        if (response.success) {
          // Update page in current workspace's pages array
          if (currentWorkspace.value.pages) {
            const pageIndex = currentWorkspace.value.pages.findIndex(p => p.id === pageId)
            if (pageIndex !== -1) {
              currentWorkspace.value.pages[pageIndex] = {
                ...currentWorkspace.value.pages[pageIndex],
                ...data,
                updatedAt: new Date().toISOString()
              }
            }
          }
          return response.data
        }
      } else {
        // For guest users, update in session storage/cookies
        // This is a simplified implementation for guest mode
        if (currentWorkspace.value.pages) {
          const pageIndex = currentWorkspace.value.pages.findIndex(p => p.id === pageId)
          if (pageIndex !== -1) {
            currentWorkspace.value.pages[pageIndex] = {
              ...currentWorkspace.value.pages[pageIndex],
              ...data,
              updatedAt: new Date().toISOString()
            }
            // Store would need to persist this to cookies/session
            return currentWorkspace.value.pages[pageIndex]
          }
        }
      }
      
      throw new Error('Failed to update page')
    } catch (error) {
      console.error('Error updating page:', error)
      throw error
    }
  }

  const getPages = async (filters?: { type?: string }) => {
    if (!currentWorkspace.value) {
      throw new Error('No workspace selected')
    }

    try {
      const query: any = { 
        workspace_id: currentWorkspace.value.id,
        include_blocks: false
      }
      
      if (filters?.type) {
        query.type = filters.type
      }

      const response = await $fetch('/api/pages', { query })

      if (response.success) {
        return response.data
      } else {
        throw new Error('Failed to load pages')
      }
    } catch (error) {
      console.error('Error loading pages:', error)
      throw error
    }
  }

  // Initialize workspace from session storage on client
  const initializeWorkspace = () => {
    if (process.client && !currentWorkspace.value) {
      const stored = sessionStorage.getItem('currentWorkspace')
      if (stored) {
        try {
          const workspaceData = JSON.parse(stored)
          // Load full workspace data
          loadWorkspace(workspaceData.id).catch(() => {
            // Clear invalid stored workspace
            sessionStorage.removeItem('currentWorkspace')
          })
        } catch (error) {
          console.error('Error initializing workspace from storage:', error)
          sessionStorage.removeItem('currentWorkspace')
        }
      }
    }
  }

  // Computed properties
  const hasWorkspace = computed(() => !!currentWorkspace.value)
  const workspaceId = computed(() => currentWorkspace.value?.id || null)
  const workspaceName = computed(() => currentWorkspace.value?.name || '')
  const workspaceIcon = computed(() => currentWorkspace.value?.icon || '📁')
  const workspacePages = computed(() => currentWorkspace.value?.pages || [])

  // Required workspace check for pages
  const requireWorkspace = () => {
    if (!currentWorkspace.value) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No workspace selected. Please select a workspace first.'
      })
    }
    return currentWorkspace.value
  }

  return {
    // State
    currentWorkspace: readonly(currentWorkspace),
    currentPage,
    isWorkspaceLoading: readonly(isWorkspaceLoading),
    workspaceError: readonly(workspaceError),

    // Computed
    hasWorkspace,
    workspaceId,
    workspaceName,
    workspaceIcon,
    workspacePages,

    // Methods
    setCurrentWorkspace,
    loadWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getAllWorkspaces,
    createPage,
    updatePage,
    getPages,
    initializeWorkspace,
    requireWorkspace
  }
}