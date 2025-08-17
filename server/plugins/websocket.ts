import { WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'

interface WebSocketMessage {
  type: string
  documentId?: string
  userId?: string
  data?: any
}

interface DocumentSession {
  documentId: string
  clients: Set<any>
  yDoc: Y.Doc
  awareness: awarenessProtocol.Awareness
}

const documentSessions = new Map<string, DocumentSession>()

export default defineNitroPlugin((nitroApp) => {
  // Function to try starting WebSocket server with fallback
  async function startWebSocketServer(startPort: number = 3001, maxAttempts: number = 5): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const port = startPort + attempt
      
      try {
        const wss = new WebSocketServer({ port })
        console.log(`🔌 WebSocket server started on port ${port}`)
        
        setupWebSocketHandlers(wss)
        return // Success, exit function
        
      } catch (error: any) {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${port} in use, trying ${port + 1}...`)
          continue
        } else {
          console.error('WebSocket server error:', error)
          break
        }
      }
    }
    
    console.error(`❌ Failed to start WebSocket server after ${maxAttempts} attempts`)
  }

  function setupWebSocketHandlers(wss: WebSocketServer) {
    wss.on('connection', (ws: any, request: IncomingMessage) => {
      console.log('👋 New WebSocket connection')
      
      const url = new URL(request.url!, `http://${request.headers.host}`)
      const documentId = url.searchParams.get('documentId')
      
      if (documentId) {
        setupYjsConnection(ws, documentId)
      } else {
        setupRegularConnection(ws)
      }
    })

    wss.on('error', (error) => {
      console.error('WebSocket server error:', error)
    })
  }

  function setupYjsConnection(ws: any, documentId: string) {
    console.log(`🔗 Setting up Yjs connection for document: ${documentId}`)
    
    if (!documentSessions.has(documentId)) {
      const yDoc = new Y.Doc()
      const awareness = new awarenessProtocol.Awareness(yDoc)
      documentSessions.set(documentId, {
        documentId,
        clients: new Set(),
        yDoc,
        awareness
      })
    }
    
    const session = documentSessions.get(documentId)!
    session.clients.add(ws)
    
    const closeConnection = () => {
      session.clients.delete(ws)
      if (session.clients.size === 0) {
        setTimeout(() => {
          if (session.clients.size === 0) {
            documentSessions.delete(documentId)
            console.log(`🗑️ Cleaned up document session: ${documentId}`)
          }
        }, 30000)
      }
    }
    
    ws.on('message', (message: Buffer) => {
      try {
        const m = new Uint8Array(message)
        const messageType = m[0]
        
        if (messageType === syncProtocol.messageYjsSync) {
          const encodedState = Y.encodeStateAsUpdate(session.yDoc)
          const encoder = syncProtocol.writeSync(syncProtocol.messageYjsSyncStep2, encodedState)
          if (ws.readyState === 1) {
            ws.send(encoder)
          }
        } else if (messageType === awarenessProtocol.messageAwareness) {
          awarenessProtocol.applyAwarenessUpdate(session.awareness, m.slice(1), ws)
        }
      } catch (error) {
        console.error('Error handling Yjs message:', error)
      }
    })
    
    ws.on('close', closeConnection)
    ws.on('error', closeConnection)
  }

  function setupRegularConnection(ws: any) {
    let currentDocumentId: string | null = null
    let userId: string | null = null

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString())
        
        switch (message.type) {
          case 'join_document':
            if (currentDocumentId) {
              leaveDocument(currentDocumentId, ws)
            }
            currentDocumentId = message.documentId!
            userId = message.userId || 'anonymous'
            joinDocument(currentDocumentId, ws)
            break
            
          case 'cursor_position':
            if (currentDocumentId) {
              broadcastToDocument(currentDocumentId, {
                type: 'cursor_position',
                userId,
                data: message.data,
                timestamp: new Date().toISOString()
              }, ws)
            }
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      if (currentDocumentId) {
        leaveDocument(currentDocumentId, ws)
      }
    })
  }

  function joinDocument(documentId: string, ws: any) {
    if (!documentSessions.has(documentId)) {
      const yDoc = new Y.Doc()
      const awareness = new awarenessProtocol.Awareness(yDoc)
      documentSessions.set(documentId, {
        documentId,
        clients: new Set(),
        yDoc,
        awareness
      })
    }
    
    const session = documentSessions.get(documentId)!
    session.clients.add(ws)
    console.log(`📝 Client joined document ${documentId}`)
  }

  function leaveDocument(documentId: string, ws: any) {
    const session = documentSessions.get(documentId)
    if (session) {
      session.clients.delete(ws)
      if (session.clients.size === 0) {
        documentSessions.delete(documentId)
      }
    }
  }

  function broadcastToDocument(documentId: string, message: any, excludeWs?: any) {
    const session = documentSessions.get(documentId)
    if (!session) return
    
    const messageStr = JSON.stringify(message)
    session.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) {
        client.send(messageStr)
      }
    })
  }

  // Start the WebSocket server
  startWebSocketServer()
})