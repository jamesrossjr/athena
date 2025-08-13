# Unified Data Layer

## Overview

The Unified Data Layer is the foundational architecture of the Athena application. It treats all user-generated content as interconnected database records, enabling powerful features like polymorphic pages and universal linking.

## Core Principle

**Everything is a Database Record** - Every piece of information in the application (workspaces, pages, blocks, etc.) is a structured record with a stable, globally unique identifier (UUID). This allows for unlimited connections between any records, creating a powerful knowledge graph.

## Architecture

### Core Entities

#### 1. Workspaces
The top-level container for all user content.

```typescript
interface Workspace {
  id: string          // UUID primary key
  userId: string      // Foreign key to users
  name: string        // Workspace name
  icon?: string       // Optional icon
  color?: string      // Optional color theme
  settings?: object   // Workspace-specific settings
  createdAt: Date
  updatedAt: Date
}
```

#### 2. Pages
The primary user-facing container. Polymorphic entity that can represent different types of content.

```typescript
interface Page {
  id: string          // UUID primary key
  workspaceId: string // Foreign key to workspaces
  title: string       // Page title
  type: PageType      // DOCUMENT, DATABASE, TABLE, WHITEBOARD, etc.
  properties?: object // Type-specific metadata
  createdAt: Date
  updatedAt: Date
}
```

#### 3. Blocks
The atomic unit of content. Pages are composed of many blocks.

```typescript
interface Block {
  id: string          // UUID primary key
  pageId: string      // Foreign key to pages
  parentId?: string   // Optional parent block for nesting
  type: BlockType     // TEXT, HEADING, IMAGE, DATABASE_ROW, etc.
  content: object     // The actual block data (JSON)
  position: number    // Ordering within page/parent
  createdAt: Date
  updatedAt: Date
}
```

#### 4. Block Links
Manages relationships between blocks, enabling the knowledge graph.

```typescript
interface BlockLink {
  id: string          // UUID primary key
  sourceBlockId: string
  targetBlockId: string
  linkType: LinkType  // REFERENCE, EMBED, BACKLINK, etc.
  metadata?: object   // Additional link data
  createdAt: Date
}
```

### Supported Page Types

- **DOCUMENT** - Rich text document (like Notion)
- **DATABASE** - Structured data collection
- **TABLE** - Spreadsheet-like interface
- **WHITEBOARD** - Visual canvas for diagrams
- **IDE** - Code editor environment
- **KANBAN** - Task board view
- **CALENDAR** - Calendar/timeline view

### Supported Block Types

#### Text Content
- **TEXT** - Paragraph text
- **HEADING** - H1-H6 headings
- **LIST_ITEM** - Bulleted/numbered lists
- **QUOTE** - Block quotes
- **CODE** - Code blocks

#### Media
- **IMAGE** - Image blocks
- **VIDEO** - Video embeds
- **AUDIO** - Audio embeds
- **FILE** - File attachments

#### Database
- **DATABASE_ROW** - Row in a database
- **DATABASE_COLUMN** - Column definition
- **DATABASE_CELL** - Individual cell

#### Interactive
- **CHECKBOX** - Todo checkboxes
- **TOGGLE** - Collapsible sections
- **CALLOUT** - Highlighted boxes

#### Whiteboard
- **SHAPE** - Geometric shapes
- **STICKY_NOTE** - Notes on canvas
- **CONNECTOR** - Lines/arrows

## API Endpoints

### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create new workspace
- `GET /api/workspaces/[id]` - Get workspace details
- `PUT /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### Pages
- `GET /api/pages` - List pages (with filters)
- `POST /api/pages` - Create new page
- `GET /api/pages/[id]` - Get page with blocks
- `PUT /api/pages/[id]` - Update page
- `DELETE /api/pages/[id]` - Delete page

### Blocks
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/[id]` - Update block
- `DELETE /api/blocks/[id]` - Delete block
- `GET /api/blocks/[id]/links` - Get block relationships

### Links
- `POST /api/links` - Create block link
- `DELETE /api/links/[id]` - Delete link

### Search
- `GET /api/search` - Search across all content

## Usage Examples

### Creating a New Workspace

```typescript
const { createWorkspace } = useWorkspace()

const workspace = await createWorkspace({
  name: "My Project",
  icon: "🚀",
  color: "#3B82F6"
})
```

### Creating a Page

```typescript
const { createPage } = useWorkspace()

const page = await createPage({
  title: "Project Notes",
  type: "DOCUMENT",
  properties: {
    template: "meeting-notes"
  }
})
```

### Creating Blocks

```typescript
// Create a heading block
const heading = await $fetch('/api/blocks', {
  method: 'POST',
  body: {
    pageId: page.id,
    type: 'HEADING',
    content: {
      text: 'Project Overview',
      level: 1
    },
    position: 0
  }
})

// Create a text block
const textBlock = await $fetch('/api/blocks', {
  method: 'POST',
  body: {
    pageId: page.id,
    type: 'TEXT',
    content: {
      text: 'This project aims to...'
    },
    position: 1
  }
})
```

### Creating Links Between Blocks

```typescript
const { createReference } = useLinks()

// Create a reference link
const link = await createReference(
  sourceBlockId,
  targetBlockId,
  {
    reason: 'related-concept',
    strength: 0.8
  }
)
```

### Real-time Updates

```typescript
const { subscribeToPage } = useRealtime()

// Subscribe to page updates
const unsubscribe = subscribeToPage(pageId, (event) => {
  if (event.type === 'updated') {
    // Handle page update
    console.log('Page updated:', event.data)
  }
})

// Cleanup
onUnmounted(() => {
  unsubscribe()
})
```

## Workspace Selection Flow

The application enforces a workspace context for all operations:

1. User logs in
2. **Workspace Selector** is shown if no workspace is active
3. User selects or creates a workspace
4. Application loads with workspace context
5. All subsequent operations occur within that workspace

```typescript
// Middleware ensures workspace selection
export default defineNuxtRouteMiddleware((to) => {
  const { hasWorkspace } = useWorkspace()
  
  if (!hasWorkspace.value && !isPublicRoute(to.path)) {
    return navigateTo('/workspace-selector')
  }
})
```

## Linking System

The linking system enables powerful connections between any content:

### Automatic Linking
- **Mentions** - `[[Page Title]]` syntax creates automatic links
- **Backlinks** - Automatic reverse references
- **Similar Content** - AI-suggested connections

### Manual Linking
- **References** - User-created connections
- **Embeds** - Inline content from other blocks
- **Relations** - Database-style relationships

### Link Types
- **REFERENCE** - Basic mention/citation
- **EMBED** - Inline embedded content
- **BACKLINK** - Automatic reverse link
- **RELATION** - Database foreign key
- **ALIAS** - Alternative name/redirect

## Real-time Synchronization

The system supports real-time collaboration through:

1. **WebSocket connections** (production)
2. **Polling fallback** (development)
3. **Event-driven updates** for all entities
4. **Conflict resolution** for concurrent edits

## Performance Considerations

### Database Optimization
- Comprehensive indexing on all foreign keys
- Efficient queries with proper `include` usage
- Pagination for large result sets
- Connection pooling

### Caching Strategy
- Client-side caching of frequently accessed data
- Optimistic updates for better UX
- Smart invalidation on real-time events

### Scalability
- Designed to handle 1M+ blocks
- Hierarchical block structure for efficient queries
- Lazy loading of block content
- Tree shaking for unused block types

## Security

### Access Control
- Workspace-level isolation
- User ownership verification
- Resource-based permissions

### Data Integrity
- Foreign key constraints
- Cascading deletes for cleanup
- Transaction safety for complex operations

## Development

### Adding New Block Types

1. Add to `BlockType` enum in `types/unified-data-layer.ts`
2. Create content interface (e.g., `NewBlockContent`)
3. Update block creation logic in `services/unified-data-layer.ts`
4. Add UI components for the new block type

### Adding New Page Types

1. Add to `PageType` enum
2. Update page creation logic
3. Add type-specific properties handling
4. Create specialized UI for the page type

## Migration Path

The system maintains backward compatibility with existing Document entities while transitioning to the new architecture:

1. **Legacy Support** - Existing documents continue to work
2. **Gradual Migration** - Convert documents to pages/blocks over time
3. **Dual API** - Both old and new APIs supported during transition
4. **Data Preservation** - No data loss during migration

This unified architecture provides the foundation for all advanced Athena features while maintaining simplicity and performance.