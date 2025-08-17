export interface WebSocketMessage {
  type: string
  documentId?: string
  userId?: string
  data?: any
  timestamp?: string
}

export const useWebSocket = (documentId: string, userId: string = 'anonymous') => {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const users = ref<Set<string>>(new Set())

  const connect = () => {
    if (process.client) {
      try {
        ws.value = new WebSocket('ws://localhost:3001')
        
        ws.value.onopen = () => {
          console.log('🔌 Connected to WebSocket server')
          isConnected.value = true
          
          // Join the document
          sendMessage({
            type: 'join_document',
            documentId,
            userId
          })
        }
        
        ws.value.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }
        
        ws.value.onclose = () => {
          console.log('🔌 Disconnected from WebSocket server')
          isConnected.value = false
          users.value.clear()
        }
        
        ws.value.onerror = (error) => {
          console.error('WebSocket error:', error)
          isConnected.value = false
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
      }
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
      users.value.clear()
    }
  }

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.value && isConnected.value) {
      ws.value.send(JSON.stringify(message))
    }
  }

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'user_joined':
        if (message.userId && message.userId !== userId) {
          users.value.add(message.userId)
          console.log(`👋 User ${message.userId} joined the document`)
        }
        break
        
      case 'user_left':
        if (message.userId) {
          users.value.delete(message.userId)
          console.log(`👋 User ${message.userId} left the document`)
        }
        break
        
      case 'cursor_position':
        // Handle cursor position updates
        // This would be implemented based on specific editor needs
        break
        
      case 'content_change':
        // Handle content changes from other users
        // This would be implemented based on specific editor needs
        break
    }
  }

  const sendCursorPosition = (position: any) => {
    sendMessage({
      type: 'cursor_position',
      documentId,
      userId,
      data: position
    })
  }

  const sendContentChange = (change: any) => {
    sendMessage({
      type: 'content_change',
      documentId,
      userId,
      data: change
    })
  }

  // Auto-connect when the composable is used
  onMounted(() => {
    connect()
  })

  // Auto-disconnect when component is unmounted
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    users: readonly(users),
    connect,
    disconnect,
    sendMessage,
    sendCursorPosition,
    sendContentChange
  }
}