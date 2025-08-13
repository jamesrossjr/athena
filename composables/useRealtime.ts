/**
 * Real-time Data Synchronization Composable
 * 
 * Provides real-time updates for the unified data layer
 * using WebSockets or Server-Sent Events.
 */

import type { RealtimeEvent } from '~/types/unified-data-layer'

interface RealtimeConnection {
  socket: WebSocket | null
  isConnected: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
}

// Global state for real-time connection
const connection = ref<RealtimeConnection>({
  socket: null,
  isConnected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5
})

// Event listeners for different entity types
const eventListeners = reactive({
  workspace: new Map<string, Function[]>(),
  page: new Map<string, Function[]>(),
  block: new Map<string, Function[]>(),
  link: new Map<string, Function[]>()
})

export const useRealtime = () => {
  const { currentWorkspace } = useWorkspace()

  // Connect to real-time service
  const connect = async () => {
    if (connection.value.isConnected || !currentWorkspace.value) {
      return
    }

    try {
      // For now, we'll use a simple polling approach since WebSockets require server setup
      // In a production environment, you'd implement proper WebSocket or SSE
      startPolling()
      
      connection.value.isConnected = true
      connection.value.reconnectAttempts = 0

      console.log('Real-time connection established')
    } catch (error) {
      console.error('Failed to establish real-time connection:', error)
      scheduleReconnect()
    }
  }

  // Disconnect from real-time service
  const disconnect = () => {
    if (connection.value.socket) {
      connection.value.socket.close()
      connection.value.socket = null
    }
    
    stopPolling()
    connection.value.isConnected = false
    
    console.log('Real-time connection closed')
  }

  // Simple polling implementation (fallback for WebSocket)
  let pollingInterval: NodeJS.Timeout | null = null
  const pollingFrequency = 5000 // 5 seconds

  const startPolling = () => {
    if (pollingInterval) return

    pollingInterval = setInterval(async () => {
      await checkForUpdates()
    }, pollingFrequency)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Check for updates (polling implementation)
  const lastUpdateTime = ref<Date>(new Date())

  const checkForUpdates = async () => {
    if (!currentWorkspace.value) return

    try {
      // Check for updated pages in the workspace
      const pages = await $fetch('/api/pages', {
        query: {
          workspace_id: currentWorkspace.value.id,
          updated_after: lastUpdateTime.value.toISOString()
        }
      })

      if (pages.success && pages.data.length > 0) {
        for (const page of pages.data) {
          emitEvent({
            type: 'updated',
            entity: 'page',
            id: page.id,
            data: page,
            userId: 'system', // We don't have the actual user ID in polling
            timestamp: new Date()
          })
        }
      }

      lastUpdateTime.value = new Date()
    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  // Schedule reconnection
  const scheduleReconnect = () => {
    if (connection.value.reconnectAttempts >= connection.value.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = Math.pow(2, connection.value.reconnectAttempts) * 1000 // Exponential backoff
    connection.value.reconnectAttempts++

    setTimeout(() => {
      console.log(`Attempting to reconnect (${connection.value.reconnectAttempts}/${connection.value.maxReconnectAttempts})`)
      connect()
    }, delay)
  }

  // Emit event to listeners
  const emitEvent = (event: RealtimeEvent) => {
    const entityListeners = eventListeners[event.entity].get(event.id) || []
    const globalListeners = eventListeners[event.entity].get('*') || []
    
    const allListeners = entityListeners.concat(globalListeners)
    allListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    })
  }

  // Subscribe to events for a specific entity
  const subscribe = (
    entity: 'workspace' | 'page' | 'block' | 'link',
    id: string,
    callback: (event: RealtimeEvent) => void
  ) => {
    if (!eventListeners[entity].has(id)) {
      eventListeners[entity].set(id, [])
    }
    
    eventListeners[entity].get(id)!.push(callback)

    // Return unsubscribe function
    return () => {
      const listeners = eventListeners[entity].get(id)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
        
        // Clean up empty listener arrays
        if (listeners.length === 0) {
          eventListeners[entity].delete(id)
        }
      }
    }
  }

  // Subscribe to all events of an entity type
  const subscribeToAll = (
    entity: 'workspace' | 'page' | 'block' | 'link',
    callback: (event: RealtimeEvent) => void
  ) => {
    return subscribe(entity, '*', callback)
  }

  // Broadcast a local change (to be sent to other clients)
  const broadcastChange = async (event: Omit<RealtimeEvent, 'userId' | 'timestamp'>) => {
    // In a real implementation, this would send the event to the server
    // For now, we'll just emit it locally for testing
    emitEvent({
      ...event,
      userId: 'current-user', // Would get from auth
      timestamp: new Date()
    })

    // In production, you'd send this to your WebSocket server:
    // if (connection.value.socket) {
    //   connection.value.socket.send(JSON.stringify(event))
    // }
  }

  // Workspace-specific subscriptions
  const subscribeToWorkspace = (workspaceId: string, callback: (event: RealtimeEvent) => void) => {
    return subscribe('workspace', workspaceId, callback)
  }

  const subscribeToPage = (pageId: string, callback: (event: RealtimeEvent) => void) => {
    return subscribe('page', pageId, callback)
  }

  const subscribeToBlock = (blockId: string, callback: (event: RealtimeEvent) => void) => {
    return subscribe('block', blockId, callback)
  }

  // Automatic connection management
  watch(() => currentWorkspace.value?.id, (newWorkspaceId, oldWorkspaceId) => {
    if (oldWorkspaceId) {
      disconnect()
    }
    
    if (newWorkspaceId) {
      connect()
    }
  })

  // Connect when component mounts (if workspace is available)
  onMounted(() => {
    if (currentWorkspace.value) {
      connect()
    }
  })

  // Disconnect when component unmounts
  onUnmounted(() => {
    disconnect()
  })

  return {
    // Connection state
    isConnected: readonly(computed(() => connection.value.isConnected)),
    reconnectAttempts: readonly(computed(() => connection.value.reconnectAttempts)),

    // Connection management
    connect,
    disconnect,

    // Event subscriptions
    subscribe,
    subscribeToAll,
    subscribeToWorkspace,
    subscribeToPage,
    subscribeToBlock,

    // Broadcasting
    broadcastChange,

    // Manual update checking
    checkForUpdates
  }
}

// Utility composable for specific entity real-time updates
export const useRealtimeEntity = (
  entity: 'workspace' | 'page' | 'block' | 'link',
  id: string
) => {
  const { subscribe, broadcastChange } = useRealtime()
  const lastUpdate = ref<Date>(new Date())
  const isStale = ref(false)

  // Subscribe to updates for this entity
  const unsubscribe = subscribe(entity, id, (event) => {
    lastUpdate.value = event.timestamp
    
    if (event.type === 'updated' || event.type === 'created') {
      isStale.value = true
    }
  })

  // Mark as fresh (up to date)
  const markFresh = () => {
    isStale.value = false
    lastUpdate.value = new Date()
  }

  // Broadcast a change for this entity
  const broadcastUpdate = (data?: any) => {
    broadcastChange({
      type: 'updated',
      entity,
      id,
      data
    })
    markFresh()
  }

  const broadcastCreation = (data?: any) => {
    broadcastChange({
      type: 'created',
      entity,
      id,
      data
    })
    markFresh()
  }

  const broadcastDeletion = () => {
    broadcastChange({
      type: 'deleted',
      entity,
      id
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    lastUpdate: readonly(lastUpdate),
    isStale: readonly(isStale),
    markFresh,
    broadcastUpdate,
    broadcastCreation,
    broadcastDeletion
  }
}