# RFC: Real-time Collaboration System

**RFC ID**: RFC-001  
**Status**: Draft  
**Author**: James  
**Created**: August 2025  
**Updated**: August 2025  

## Summary

This RFC proposes the implementation of a real-time collaboration system for Athena that enables multiple users to simultaneously edit documents, databases, whiteboards, and other content types with conflict resolution and user presence awareness.

## Motivation

Currently, Athena supports single-user editing experiences. To compete with modern productivity tools like Notion, Figma, and Google Docs, we need real-time collaboration that allows teams to work together seamlessly. This is consistently the #1 requested feature from alpha users.

### User Stories
- As a team member, I want to see who else is editing a document so I can coordinate with them
- As a collaborator, I want my changes to appear instantly for other users
- As a project manager, I want to see live updates in kanban boards as team members move tasks
- As a designer, I want to collaborate on whiteboards in real-time

## Detailed Design

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Server        │    │   Client B      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ TipTap      │◄┼────┼►│ WebSocket   │◄┼────┼►│ TipTap      │ │
│ │ Editor      │ │    │ │ Server      │ │    │ │ Editor      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │ ┌─────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Operational │ │    │ ┌─────────────┐ │
│ │ Awareness   │◄┼────┼►│ Transform   │◄┼────┼►│ Awareness   │ │
│ │ Layer       │ │    │ │ Engine      │ │    │ │ Layer       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. WebSocket Connection Management
- Establish persistent connections for each active user
- Handle connection drops and reconnection with state sync
- Room-based organization (one room per page/document)

#### 2. Operational Transformation (OT) Engine
- Transform concurrent operations to maintain consistency
- Support for text, structured data, and visual element operations
- Conflict resolution with last-writer-wins for non-conflicting edits

#### 3. User Presence & Awareness
- Track user cursors, selections, and active areas
- Show user avatars and typing indicators
- Display user activity status (active, away, offline)

#### 4. State Synchronization
- Initial state sync when users join
- Incremental updates via operational transforms
- Periodic full-state checkpoints for recovery

### Implementation Phases

#### Phase 1: Text Collaboration (Month 1)
- WebSocket infrastructure
- TipTap collaborative editing
- Basic user presence
- Text-only conflict resolution

#### Phase 2: Structured Data (Month 2)
- Database/table real-time updates
- Kanban board collaboration
- Row/cell-level locking
- Structured data transforms

#### Phase 3: Visual Collaboration (Month 3)
- Whiteboard real-time drawing
- Shape and object synchronization
- Canvas-based presence
- Visual element conflict resolution

### Technical Specifications

#### WebSocket Protocol
```typescript
interface CollaborationMessage {
  type: 'operation' | 'awareness' | 'state' | 'presence'
  pageId: string
  userId: string
  timestamp: number
  data: any
}

interface Operation {
  type: 'insert' | 'delete' | 'format' | 'move'
  position: number | Position
  content?: any
  attributes?: Record<string, any>
}

interface AwarenessState {
  user: UserInfo
  cursor?: Position
  selection?: Range
  viewport?: Viewport
  lastSeen: number
}
```

#### Database Schema Changes
```sql
-- New tables for collaboration
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP,
  last_active TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'away', 'disconnected'))
);

CREATE TABLE operations_log (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  user_id UUID REFERENCES users(id),
  operation_type TEXT,
  operation_data JSONB,
  applied_at TIMESTAMP,
  server_order BIGSERIAL
);
```

### User Experience

#### Presence Indicators
- Colored user avatars at cursor positions
- Typing indicators for active users
- User list with status in sidebar
- Activity highlights for recent changes

#### Conflict Resolution UX
- Automatic merging for non-conflicting changes
- Visual indicators for conflicting areas
- Undo/redo with multi-user awareness
- Version history with collaboration context

#### Performance Considerations
- Debounced operations (200ms) to reduce network traffic
- Client-side prediction for immediate feedback
- Efficient diff algorithms for large documents
- Connection quality indicators

## Alternatives Considered

### 1. CRDT (Conflict-free Replicated Data Types)
**Pros**: No central coordination needed, eventual consistency
**Cons**: Complex implementation, larger memory footprint, harder to debug
**Decision**: OT chosen for better performance and simpler debugging

### 2. Event Sourcing Only
**Pros**: Complete audit trail, easy to replay events
**Cons**: Performance issues with large documents, complex state reconstruction
**Decision**: Hybrid approach with periodic snapshots

### 3. Pessimistic Locking
**Pros**: No conflicts, simple implementation
**Cons**: Poor user experience, doesn't fit real-time collaboration
**Decision**: Rejected in favor of optimistic collaboration

## Security Considerations

### Authentication & Authorization
- JWT-based WebSocket authentication
- Page-level permissions check on join
- User session validation on each operation

### Data Integrity
- Server-side operation validation
- Rate limiting to prevent spam
- Malformed operation rejection

### Privacy
- Operations contain minimal user data
- Presence data excluded from logs
- Option to hide cursor from other users

## Performance Impact

### Client-Side
- Additional 100-200KB JavaScript bundle
- ~50MB RAM per collaborative session
- WebSocket connection overhead

### Server-Side
- WebSocket connections: ~1KB per connection
- Operation processing: ~1ms per operation
- Database writes: batched every 5 seconds

### Network
- Initial sync: ~10KB per document
- Operations: ~100-500 bytes each
- Presence updates: ~50 bytes every 2 seconds

## Testing Strategy

### Unit Tests
- Operation transformation algorithms
- Conflict resolution logic
- WebSocket message handling
- State synchronization

### Integration Tests
- Multi-user editing scenarios
- Connection drop recovery
- Performance under load
- Cross-browser compatibility

### User Testing
- Alpha testing with 10 simultaneous users
- Beta testing with real-world teams
- Performance testing with large documents
- Mobile collaboration testing

## Migration Plan

### Rollout Strategy
1. **Feature Flag**: Enable for internal testing
2. **Alpha Users**: Invite 20 alpha users to test
3. **Gradual Rollout**: 10% → 50% → 100% of users
4. **Monitoring**: Real-time performance and error tracking

### Backwards Compatibility
- Existing single-user documents work unchanged
- Automatic upgrade to collaborative when second user joins
- Fallback to single-user mode if collaboration fails

### Data Migration
- No existing data migration needed
- New tables created alongside existing schema
- Collaboration features opt-in initially

## Risks & Mitigations

### High-Risk Items
1. **Operational Transform Complexity**
   - Risk: Bugs in conflict resolution causing data loss
   - Mitigation: Extensive testing, gradual rollout, real-time monitoring

2. **Performance at Scale**
   - Risk: Poor performance with many concurrent users
   - Mitigation: Load testing, connection limits, efficient algorithms

3. **WebSocket Reliability**
   - Risk: Connection drops causing sync issues
   - Mitigation: Robust reconnection logic, state recovery

### Medium-Risk Items
1. **Client-Side Complexity**: Additional bundle size and memory usage
2. **Server Costs**: Increased infrastructure needs for WebSocket connections

## Open Questions

1. Should we implement presence for non-editing users (viewers)?
2. What's the maximum number of concurrent users per document?
3. How do we handle collaboration in offline mode?
4. Should we support voice/video chat integration?

## Timeline

### Week 1-2: Infrastructure
- WebSocket server setup
- Basic message routing
- Authentication integration

### Week 3-4: Text Collaboration
- TipTap collaborative editing
- Basic operational transforms
- User presence for text

### Week 5-6: Structured Data
- Database collaboration
- Kanban board real-time updates
- Cell-level conflict resolution

### Week 7-8: Visual Collaboration
- Whiteboard real-time features
- Shape synchronization
- Canvas presence

### Week 9-10: Polish & Testing
- Performance optimization
- Comprehensive testing
- Alpha user feedback integration

### Week 11-12: Launch
- Beta rollout
- Monitoring and bug fixes
- Documentation and training

## Success Metrics

### Technical Metrics
- Message latency < 100ms (95th percentile)
- Operation conflicts < 1% of total operations
- Connection uptime > 99.5%
- Zero data loss incidents

### User Experience Metrics
- Collaboration session duration > 10 minutes average
- Multi-user document usage > 30% of all sessions
- User satisfaction score > 4.0/5 for collaboration features
- < 5% user reports of synchronization issues

---

**Next Steps**
1. Review and approve this RFC
2. Create detailed technical specifications
3. Begin Phase 1 implementation
4. Set up monitoring and testing infrastructure

**Stakeholders**
- Engineering: Technical implementation and architecture
- Product: User experience and feature requirements
- QA: Testing strategy and quality assurance
- Users: Alpha testing and feedback