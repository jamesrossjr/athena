# 🔌 Athena API Documentation

**Version**: 1.0  
**Last Updated**: August 2025  
**Base URL**: `https://api.athena.app/v1`  
**Status**: Beta Release  

## Overview

The Athena API provides programmatic access to all core functionality including workspace management, content creation and editing, collaboration features, and AI-powered assistance. Our REST API follows OpenAPI 3.0 specifications and supports both JSON and real-time WebSocket communication.

### API Philosophy

- **Resource-Oriented**: URLs represent resources, HTTP methods represent actions
- **Stateless**: Each request contains all necessary information
- **Consistent**: Predictable patterns across all endpoints
- **Versioned**: Backward compatibility through API versioning
- **Real-time Ready**: WebSocket support for collaborative features

## Quick Start

### Authentication

All API requests require authentication using JSON Web Tokens (JWT).

```bash
# Get authentication token
curl -X POST https://api.athena.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Making API Requests

Include the access token in the Authorization header:

```bash
curl -X GET https://api.athena.app/v1/workspaces \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Basic Example: Creating a Page

```bash
# Create a new page in a workspace
curl -X POST https://api.athena.app/v1/pages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws-123",
    "title": "My First Page",
    "type": "document",
    "content": [
      {
        "type": "heading",
        "content": "Welcome to Athena",
        "level": 1
      },
      {
        "type": "paragraph",
        "content": "This is my first page created via the API."
      }
    ]
  }'
```

## API Reference

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string", 
  "expires_in": 3600,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatar": "string|null"
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

#### POST /auth/logout
Invalidate current session.

### Workspace Endpoints

#### GET /workspaces
List user's workspaces.

**Query Parameters:**
- `limit` (optional): Number of workspaces to return (default: 50)
- `offset` (optional): Number of workspaces to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "ws-123",
      "name": "My Workspace",
      "icon": "🏢",
      "description": "Personal productivity workspace",
      "owner_id": "user-123",
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-08-12T15:30:00Z",
      "member_count": 1,
      "page_count": 15
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

#### POST /workspaces
Create a new workspace.

**Request Body:**
```json
{
  "name": "string",
  "icon": "string",
  "description": "string"
}
```

#### GET /workspaces/{workspace_id}
Get workspace details.

#### PUT /workspaces/{workspace_id}
Update workspace.

#### DELETE /workspaces/{workspace_id}
Delete workspace.

### Page Endpoints

#### GET /pages
List pages in workspace.

**Query Parameters:**
- `workspace_id`: Required workspace ID
- `type` (optional): Filter by page type (document, database, whiteboard, kanban, calendar)
- `limit` (optional): Number of pages to return (default: 50)
- `offset` (optional): Number of pages to skip (default: 0)
- `search` (optional): Search query for page titles and content

**Response:**
```json
{
  "data": [
    {
      "id": "page-456",
      "workspace_id": "ws-123",
      "title": "Project Planning",
      "type": "document",
      "content": [...],
      "metadata": {
        "word_count": 1250,
        "last_edited_by": "user-123",
        "last_edited_at": "2025-08-12T14:20:00Z"
      },
      "links": ["page-789", "page-101"],
      "backlinks": ["page-234"],
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-08-12T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

#### POST /pages
Create a new page.

**Request Body:**
```json
{
  "workspace_id": "string",
  "title": "string",
  "type": "document|database|whiteboard|kanban|calendar",
  "content": [...],
  "parent_id": "string|null"
}
```

#### GET /pages/{page_id}
Get page details.

**Response:**
```json
{
  "id": "page-456",
  "workspace_id": "ws-123",
  "title": "Project Planning",
  "type": "document",
  "content": [
    {
      "id": "block-1",
      "type": "heading",
      "content": "Project Overview",
      "level": 1,
      "position": 0
    },
    {
      "id": "block-2", 
      "type": "paragraph",
      "content": "This project aims to...",
      "position": 1
    }
  ],
  "metadata": {
    "word_count": 1250,
    "last_edited_by": "user-123",
    "last_edited_at": "2025-08-12T14:20:00Z"
  },
  "links": ["page-789", "page-101"],
  "backlinks": ["page-234"],
  "collaborators": [
    {
      "user_id": "user-123",
      "name": "John Doe",
      "avatar": "https://...",
      "last_seen": "2025-08-12T14:20:00Z",
      "cursor_position": 150
    }
  ],
  "created_at": "2025-08-01T10:00:00Z",
  "updated_at": "2025-08-12T14:20:00Z"
}
```

#### PUT /pages/{page_id}
Update page content and metadata.

#### DELETE /pages/{page_id}
Delete page.

#### POST /pages/{page_id}/transform
Transform page to different type.

**Request Body:**
```json
{
  "target_type": "database|document|whiteboard|kanban|calendar",
  "preserve_content": true,
  "transformation_options": {
    // Type-specific transformation options
  }
}
```

### Block Endpoints

#### GET /pages/{page_id}/blocks
Get all blocks in a page.

#### POST /pages/{page_id}/blocks
Create a new block.

**Request Body:**
```json
{
  "type": "paragraph|heading|list|table|code|image",
  "content": "string|object",
  "position": "number",
  "parent_id": "string|null"
}
```

#### PUT /blocks/{block_id}
Update block content.

#### DELETE /blocks/{block_id}
Delete block.

#### POST /blocks/{block_id}/move
Move block to new position.

### Link Endpoints

#### GET /links
Get links in workspace.

**Query Parameters:**
- `workspace_id`: Required workspace ID
- `source_id` (optional): Filter by source page/block
- `target_id` (optional): Filter by target page/block

#### POST /links
Create a new link.

**Request Body:**
```json
{
  "source_id": "string",
  "target_id": "string", 
  "source_type": "page|block",
  "target_type": "page|block",
  "link_type": "reference|embed|mention"
}
```

#### DELETE /links/{link_id}
Delete link.

### Search Endpoints

#### GET /search
Search across all content.

**Query Parameters:**
- `q`: Required search query
- `workspace_id`: Required workspace ID
- `types` (optional): Comma-separated list of content types to search
- `limit` (optional): Number of results to return (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "page-456",
      "type": "page",
      "title": "Project Planning",
      "snippet": "This project aims to improve user experience...",
      "url": "/workspace/ws-123/page/page-456",
      "score": 0.95,
      "highlights": [
        {
          "field": "content",
          "text": "This <mark>project</mark> aims to improve..."
        }
      ]
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  },
  "facets": {
    "types": {
      "page": 3,
      "block": 2
    }
  }
}
```

### AI Endpoints

#### POST /ai/generate
Generate content using AI.

**Request Body:**
```json
{
  "prompt": "string",
  "context": {
    "workspace_id": "string",
    "page_id": "string|null",
    "page_type": "string|null",
    "selection": "string|null"
  },
  "options": {
    "model": "gpt-4|claude-3|local",
    "max_tokens": 500,
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "content": "Generated content based on your prompt...",
  "model_used": "gpt-4",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "confidence": 0.92
}
```

#### POST /ai/analyze
Analyze content using AI.

**Request Body:**
```json
{
  "content": "string",
  "analysis_type": "summary|sentiment|topics|structure",
  "options": {
    "model": "gpt-4|claude-3|local"
  }
}
```

#### POST /ai/suggest
Get AI suggestions for content improvement.

**Request Body:**
```json
{
  "content": "string",
  "suggestion_type": "grammar|style|structure|enhancement",
  "context": {
    "content_type": "document|email|report|creative",
    "audience": "technical|business|general"
  }
}
```

### Collaboration Endpoints

#### GET /pages/{page_id}/collaborators
Get current collaborators on a page.

#### POST /pages/{page_id}/invite
Invite user to collaborate on page.

**Request Body:**
```json
{
  "email": "string",
  "role": "viewer|editor|admin",
  "message": "string"
}
```

#### GET /pages/{page_id}/activity
Get recent activity on a page.

**Response:**
```json
{
  "data": [
    {
      "id": "activity-123",
      "type": "content_change|user_joined|user_left|comment_added",
      "user": {
        "id": "user-123",
        "name": "John Doe",
        "avatar": "https://..."
      },
      "description": "Updated paragraph in section 'Overview'",
      "metadata": {
        "block_id": "block-456",
        "change_type": "content_update"
      },
      "timestamp": "2025-08-12T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

## WebSocket API

For real-time collaboration features, connect to the WebSocket endpoint:

**URL**: `wss://api.athena.app/v1/ws`

### Connection

```javascript
const ws = new WebSocket('wss://api.athena.app/v1/ws')

// Authenticate after connection
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }))
}

// Join a page for collaboration
ws.send(JSON.stringify({
  type: 'join_page',
  page_id: 'page-456'
}))
```

### Message Types

#### Operation Messages
Real-time content changes using operational transforms.

```json
{
  "type": "operation",
  "page_id": "page-456",
  "operation": {
    "type": "insert",
    "position": 150,
    "content": "Hello world",
    "attributes": { "bold": true }
  },
  "user_id": "user-123",
  "timestamp": "2025-08-12T14:20:00.123Z"
}
```

#### Awareness Messages
User presence and cursor positions.

```json
{
  "type": "awareness",
  "page_id": "page-456",
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "avatar": "https://...",
    "cursor": 150,
    "selection": { "from": 150, "to": 165 }
  },
  "timestamp": "2025-08-12T14:20:00.123Z"
}
```

## Data Models

### Page Content Structure

Pages use a block-based content model:

```typescript
interface Page {
  id: string
  workspace_id: string
  title: string
  type: 'document' | 'database' | 'whiteboard' | 'kanban' | 'calendar'
  content: Block[]
  metadata: PageMetadata
  links: string[]     // Outgoing link IDs
  backlinks: string[] // Incoming link IDs
  created_at: string  // ISO 8601
  updated_at: string  // ISO 8601
}

interface Block {
  id: string
  type: string
  content: any
  position: number
  parent_id?: string
  metadata?: Record<string, any>
}
```

### Block Types

#### Text Blocks
```json
{
  "type": "paragraph",
  "content": "This is a paragraph with **bold** and *italic* text.",
  "formatting": {
    "bold": [[18, 22]],
    "italic": [[27, 33]]
  }
}
```

#### Heading Blocks
```json
{
  "type": "heading",
  "content": "Chapter 1: Introduction", 
  "level": 1
}
```

#### List Blocks
```json
{
  "type": "list",
  "list_type": "bullet",
  "items": [
    {
      "content": "First item",
      "checked": false
    },
    {
      "content": "Second item",
      "checked": true
    }
  ]
}
```

#### Database Blocks
```json
{
  "type": "database",
  "schema": {
    "columns": [
      {
        "id": "col-1",
        "name": "Task",
        "type": "text",
        "primary": true
      },
      {
        "id": "col-2", 
        "name": "Status",
        "type": "select",
        "options": ["Todo", "In Progress", "Done"]
      }
    ]
  },
  "rows": [
    {
      "id": "row-1",
      "values": {
        "col-1": "Complete API documentation",
        "col-2": "In Progress"
      }
    }
  ]
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required",
        "code": "REQUIRED_FIELD"
      }
    ],
    "request_id": "req-123",
    "timestamp": "2025-08-12T14:20:00Z"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized  
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `WORKSPACE_FULL` - Workspace has reached page limit
- `CONTENT_TOO_LARGE` - Content exceeds size limits

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **Authenticated requests**: 1000 requests per hour per user
- **AI requests**: 100 requests per hour per user
- **WebSocket messages**: 100 messages per minute per connection

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1691856000
```

## Pagination

List endpoints support cursor-based pagination:

**Request:**
```bash
GET /pages?workspace_id=ws-123&limit=20&offset=0
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_cursor": "eyJpZCI6InBhZ2UtNDU2In0="
  }
}
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Webhook Events

- `page.created` - New page created
- `page.updated` - Page content changed
- `page.deleted` - Page deleted
- `workspace.member_added` - New workspace member
- `collaboration.user_joined` - User joined collaborative session

### Webhook Configuration

```bash
POST /webhooks
{
  "url": "https://your-app.com/webhooks/athena",
  "events": ["page.created", "page.updated"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "page.created",
  "data": {
    "page": {
      "id": "page-456",
      "title": "New Page",
      "workspace_id": "ws-123"
    }
  },
  "timestamp": "2025-08-12T14:20:00Z",
  "webhook_id": "wh-123"
}
```

## SDK Libraries

Official SDKs are available for popular languages:

### JavaScript/TypeScript
```bash
npm install @athena-app/sdk
```

```javascript
import { AthenaClient } from '@athena-app/sdk'

const client = new AthenaClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.athena.app/v1'
})

// Create a page
const page = await client.pages.create({
  workspace_id: 'ws-123',
  title: 'My Page',
  type: 'document'
})
```

### Python
```bash
pip install athena-sdk
```

```python
from athena_sdk import AthenaClient

client = AthenaClient(api_key='your-api-key')

# Create a page
page = client.pages.create(
    workspace_id='ws-123',
    title='My Page',
    type='document'
)
```

### Go
```bash
go get github.com/athena-app/go-sdk
```

```go
import "github.com/athena-app/go-sdk/athena"

client := athena.NewClient("your-api-key")

page, err := client.Pages.Create(&athena.CreatePageRequest{
    WorkspaceID: "ws-123",
    Title:      "My Page",
    Type:       "document",
})
```

## API Versioning

- Current version: `v1`
- Version specified in URL path: `/v1/`
- Backward compatibility maintained within major versions
- Deprecation notices provided 6 months before breaking changes

## Support

- **Documentation**: [https://docs.athena.app/api](https://docs.athena.app/api)
- **OpenAPI Spec**: [https://api.athena.app/v1/openapi.json](https://api.athena.app/v1/openapi.json)
- **Status Page**: [https://status.athena.app](https://status.athena.app)
- **Developer Support**: [developers@athena.app](mailto:developers@athena.app)

---

**API Changelog**
- [v1.0.0](./CHANGELOG.md#v100) - Initial release
- [v1.0.1](./CHANGELOG.md#v101) - Bug fixes and improvements
- [v1.1.0](./CHANGELOG.md#v110) - Database API endpoints

**Related Documents**
- [API Reference](./01_api_reference.md)
- [SDK Documentation](./02_sdk_docs.md)
- [WebSocket Guide](./03_websocket_guide.md)
- [Authentication Guide](./04_authentication.md)