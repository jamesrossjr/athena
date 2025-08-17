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
  // Function to find an available port
  async function findAvailablePort(startPort: number = 3001): Promise<number> {
    const net = await import('net')
    
    return new Promise((resolve, reject) => {
      const server = net.createServer()
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use, try the next one
          findAvailablePort(startPort + 1).then(resolve).catch(reject)
        } else {
          reject(err)
        }
      })
      
      server.listen(startPort, () => {
        const port = (server.address() as any)?.port
        server.close(() => resolve(port))
      })
    })
  }
  
  // Start WebSocket server on available port
  findAvailablePort(3001).then((port) => {
    try {
      const wss = new WebSocketServer({ port })
      console.log(`🔌 WebSocket server started on port ${port}`)
      
      setupWebSocketServer(wss)
    } catch (error) {
      console.error('Failed to start WebSocket server:', error)
    }
  }).catch((error) => {
    console.error('Failed to find available port for WebSocket server:', error)
  })
  
  function setupWebSocketServer(wss: WebSocketServer) {
    wss.on('connection', (ws: any, request: IncomingMessage) => {
      console.log('👋 New WebSocket connection')
      
      const url = new URL(request.url!, `http://${request.headers.host}`)
      const documentId = url.searchParams.get('documentId')
      
      if (documentId) {
        // This is a Yjs collaboration connection
        setupYjsConnection(ws, documentId)
      } else {
        // This is a regular WebSocket connection for presence/chat
        setupRegularConnection(ws)
      }
    })

    function setupYjsConnection(ws: any, documentId: string) {
    console.log(`🔗 Setting up Yjs connection for document: ${documentId}`)
    
    // Get or create document session with Yjs document
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
    
    // Set up Yjs WebSocket connection manually
    const closeConnection = () => {
      session.clients.delete(ws)
      if (session.clients.size === 0) {
        // Keep the document in memory for a while in case users reconnect
        setTimeout(() => {
          if (session.clients.size === 0) {
            documentSessions.delete(documentId)
            console.log(`🗑️ Cleaned up document session: ${documentId}`)
          }
        }, 30000) // 30 second grace period
      }
    }
    
    // Send sync step 1
    const encoder = syncProtocol.writeSync(syncProtocol.messageYjsSyncStep1, Y.encodeStateVector(session.yDoc))
    if (ws.readyState === 1) {
      ws.send(encoder)
    }
    
    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
      try {
        const m = new Uint8Array(message)
        const messageType = m[0]
        
        if (messageType === syncProtocol.messageYjsSync) {
          // Handle sync protocol messages
          const encodedState = Y.encodeStateAsUpdate(session.yDoc)
          const encoder = syncProtocol.writeSync(syncProtocol.messageYjsSyncStep2, encodedState)
          if (ws.readyState === 1) {
            ws.send(encoder)
          }
        } else if (messageType === awarenessProtocol.messageAwareness) {
          // Handle awareness protocol messages  
          awarenessProtocol.applyAwarenessUpdate(session.awareness, m.slice(1), ws)
        }
      } catch (error) {
        console.error('Error handling Yjs message:', error)
      }
    })
    
    ws.on('close', closeConnection)
    ws.on('error', (error: Error) => {
      console.error('Yjs WebSocket error:', error)
      closeConnection()
    })
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
            
            broadcastToDocument(currentDocumentId, {
              type: 'user_joined',
              userId,
              timestamp: new Date().toISOString()
            }, ws)
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
      console.log('👋 WebSocket connection closed')
      if (currentDocumentId) {
        leaveDocument(currentDocumentId, ws)
        
        broadcastToDocument(currentDocumentId, {
          type: 'user_left',
          userId,
          timestamp: new Date().toISOString()
        })
      }
    })

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
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
    
    console.log(`📝 Client joined document ${documentId} (${session.clients.size} total)`)
  }

  function leaveDocument(documentId: string, ws: any) {
    const session = documentSessions.get(documentId)
    if (session) {
      session.clients.delete(ws)
      
      if (session.clients.size === 0) {
        documentSessions.delete(documentId)
        console.log(`📝 Document ${documentId} session ended`)
      } else {
        console.log(`📝 Client left document ${documentId} (${session.clients.size} remaining)`)
      }
    }
  }

    function broadcastToDocument(documentId: string, message: any, excludeWs?: any) {
      const session = documentSessions.get(documentId)
      if (!session) return
      
      const messageStr = JSON.stringify(message)
      
      session.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === 1) { // WebSocket.OPEN
          client.send(messageStr)
        }
      })
    }
  }
})