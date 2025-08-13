# ADR-002: Real-time Technology - WebSocket vs Server-Sent Events

**Status**: Accepted  
**Date**: August 2025  
**Deciders**: Engineering Team  

## Context and Problem Statement

Athena requires real-time collaboration features including:
- Live text editing with operational transformation
- User presence and cursors
- Database updates across multiple users
- Whiteboard collaborative drawing
- System notifications and status updates

We need to choose the appropriate real-time communication technology that can handle bidirectional communication efficiently while being scalable and reliable.

## Decision Drivers

- **Bidirectional Communication**: Both client-to-server and server-to-client messaging
- **Low Latency**: Sub-100ms response times for editing operations
- **Scalability**: Support for hundreds of concurrent users per document
- **Browser Support**: Universal browser compatibility
- **Development Complexity**: Ease of implementation and debugging
- **Infrastructure**: Compatibility with current hosting solutions
- **Fallback Options**: Graceful degradation when real-time fails

## Considered Options

### Option A: WebSockets
- Full-duplex communication protocol
- Low latency and overhead
- Native browser support
- Real-time bidirectional messaging
- Persistent connections

### Option B: Server-Sent Events (SSE)
- Unidirectional server-to-client communication
- HTTP-based, simpler infrastructure
- Automatic reconnection
- Better with proxies and firewalls
- Would require separate HTTP requests for client-to-server

### Option C: Long Polling
- HTTP-based fallback solution
- Simple implementation
- Higher latency and resource usage
- Good compatibility with all networks

## Decision Outcome

**Chosen option: WebSockets with SSE fallback**

### Rationale

1. **Bidirectional Requirements**: Collaborative editing requires efficient client-to-server communication for operations and server-to-client for broadcasting changes. WebSockets provide native bidirectional support.

2. **Performance**: WebSockets have lower latency and overhead compared to HTTP-based alternatives, crucial for real-time editing feel.

3. **Operational Transform Compatibility**: The chosen OT library (TipTap Collaboration) is designed for WebSocket communication patterns.

4. **Single Connection**: One persistent connection handles all real-time features (editing, presence, notifications) reducing complexity.

5. **Scalability**: Modern WebSocket implementations can handle thousands of concurrent connections per server.

### Implementation Details

```typescript
// WebSocket message protocol
interface WebSocketMessage {
  type: 'operation' | 'awareness' | 'auth' | 'sync'
  room: string  // page or workspace ID
  data: any
  timestamp: number
  userId?: string
}

// Client-side WebSocket manager
class CollaborationManager {
  private ws: WebSocket
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  connect(pageId: string) {
    this.ws = new WebSocket(`${wsUrl}/collaborate/${pageId}`)
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    this.ws.onopen = () => this.onConnect()
    this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data))
    this.ws.onclose = () => this.handleReconnect()
    this.ws.onerror = (error) => this.handleError(error)
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect(this.currentPageId)
      }, Math.pow(2, this.reconnectAttempts) * 1000)
    } else {
      // Fall back to HTTP polling
      this.fallbackToPolling()
    }
  }
}
```

```typescript
// Server-side WebSocket handling (Node.js)
import { Server as SocketIOServer } from 'socket.io'

export class CollaborationServer {
  private io: SocketIOServer
  
  setupCollaboration(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: { origin: process.env.FRONTEND_URL },
      transports: ['websocket', 'polling'] // Fallback to polling
    })
    
    this.io.on('connection', (socket) => {
      socket.on('join-page', (pageId, userId) => {
        socket.join(`page:${pageId}`)
        this.broadcastUserJoined(pageId, userId)
      })
      
      socket.on('operation', (data) => {
        this.handleOperation(socket, data)
      })
      
      socket.on('awareness', (data) => {
        this.broadcastAwareness(socket, data)
      })
    })
  }
  
  private handleOperation(socket: any, operation: any) {
    // Apply operational transform
    const transformedOp = this.operationalTransform.apply(operation)
    
    // Broadcast to all users in the same page
    socket.to(`page:${operation.pageId}`).emit('operation', transformedOp)
    
    // Persist to database
    this.persistOperation(transformedOp)
  }
}
```

### Fallback Strategy

```typescript
// SSE fallback for environments where WebSockets are blocked
class SSEFallback {
  private eventSource: EventSource
  
  connect(pageId: string) {
    this.eventSource = new EventSource(`/api/collaborate/${pageId}/stream`)
    
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleServerMessage(data)
    }
    
    // Use HTTP requests for client-to-server communication
    this.sendOperation = (operation) => {
      fetch(`/api/collaborate/${pageId}/operation`, {
        method: 'POST',
        body: JSON.stringify(operation)
      })
    }
  }
}
```

## Positive Consequences

- **Low Latency**: Real-time feel for collaborative editing
- **Efficient**: Single persistent connection for all real-time features
- **Scalable**: Can handle many concurrent users per document
- **Flexible**: Supports various types of real-time data (text, presence, notifications)
- **Standard Protocol**: Well-understood technology with good tooling

## Negative Consequences

- **Connection Management**: More complex than HTTP requests
- **Proxy Issues**: Some corporate firewalls may block WebSockets
- **State Management**: Need to handle connection drops and reconnections
- **Resource Usage**: Persistent connections consume server resources
- **Debugging**: More complex to debug than simple HTTP requests

## Compliance

This decision supports our requirements:
- Real-time collaborative editing (bidirectional, low latency)
- User presence awareness (efficient broadcasting)
- Scalability (connection pooling, room-based organization)
- Reliability (reconnection logic, fallback options)

## Implementation Plan

### Phase 1: Basic WebSocket Infrastructure (Week 1-2)
- Set up WebSocket server with Socket.io
- Implement basic room management
- Add authentication and authorization
- Create client-side connection manager

### Phase 2: Collaborative Editing (Week 3-4)
- Integrate with TipTap collaboration
- Implement operational transformation
- Add conflict resolution
- Create user presence system

### Phase 3: Advanced Features (Week 5-6)
- Database collaboration
- Whiteboard real-time features
- Notification system
- Performance optimization

### Phase 4: Reliability & Scaling (Week 7-8)
- Add SSE fallback
- Implement connection pooling
- Add monitoring and metrics
- Load testing and optimization

## Monitoring and Metrics

```typescript
// WebSocket metrics to track
interface WebSocketMetrics {
  activeConnections: number
  messagesPerSecond: number
  averageLatency: number
  reconnectionRate: number
  errorRate: number
  fallbackUsage: number
}

// Health check endpoint
app.get('/health/websocket', (req, res) => {
  res.json({
    status: 'healthy',
    activeConnections: wsServer.connectionCount,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})
```

## Security Considerations

1. **Authentication**: JWT token validation on connection
2. **Authorization**: Page-level access control for rooms
3. **Rate Limiting**: Prevent message spam and abuse
4. **Data Validation**: Validate all incoming messages
5. **CORS**: Proper cross-origin configuration

---

**Related ADRs**
- [ADR-001: Database Choice](./001-database-choice.md)
- [ADR-003: AI Integration Strategy](./003-ai-integration-strategy.md)