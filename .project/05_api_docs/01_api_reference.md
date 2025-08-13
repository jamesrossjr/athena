# 📖 Complete API Reference

**Version**: 1.0  
**Base URL**: `https://api.athena.app/v1`  
**Authentication**: Bearer Token (JWT)  

## Table of Contents

1. [Authentication](#authentication)
2. [Workspaces](#workspaces)
3. [Pages](#pages)
4. [Blocks](#blocks)
5. [Links](#links)
6. [Search](#search)
7. [AI Services](#ai-services)
8. [Collaboration](#collaboration)
9. [Files & Media](#files--media)
10. [Analytics](#analytics)
11. [Administration](#administration)

---

## Authentication

### POST /auth/login

Authenticate user with email and password.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": "user-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.athena.app/avatars/user-123.jpg",
    "created_at": "2025-08-01T10:00:00Z",
    "last_login": "2025-08-12T14:20:00Z",
    "preferences": {
      "theme": "light",
      "timezone": "America/New_York",
      "ai_enabled": true
    }
  }
}
```

**Error Responses:**
```http
HTTP/1.1 401 Unauthorized
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

HTTP/1.1 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Try again in 5 minutes."
  }
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### POST /auth/logout

Invalidate current session and refresh token.

**Request:**
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```http
HTTP/1.1 204 No Content
```

### POST /auth/register

Register new user account.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "Jane Smith",
  "invite_code": "ALPHA2025" // Optional for beta access
}
```

---

## Workspaces

### GET /workspaces

List user's accessible workspaces.

**Request:**
```http
GET /workspaces?limit=20&offset=0&sort=updated_at&order=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `limit` (integer, optional): Number of workspaces to return (1-100, default: 50)
- `offset` (integer, optional): Number of workspaces to skip (default: 0)
- `sort` (string, optional): Sort field (`name`, `created_at`, `updated_at`, default: `updated_at`)
- `order` (string, optional): Sort order (`asc`, `desc`, default: `desc`)
- `search` (string, optional): Search workspace names and descriptions

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "ws-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "name": "Personal Workspace",
      "description": "My personal productivity workspace",
      "icon": "🏠",
      "color": "#3b82f6",
      "owner_id": "user-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "visibility": "private",
      "member_count": 1,
      "page_count": 25,
      "storage_used": 15728640, // bytes
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-08-12T14:20:00Z",
      "permissions": {
        "can_edit": true,
        "can_delete": true,
        "can_invite": true,
        "can_admin": true
      }
    },
    {
      "id": "ws-8e5b6c3d-9e2f-5ba1-c3d4-2e5b6c7d8e9f",
      "name": "Team Projects",
      "description": "Collaborative workspace for team projects",
      "icon": "👥",
      "color": "#10b981",
      "owner_id": "user-9f6c7d4e-ae3f-6cb2-d4e5-3f6c7d8e9fag",
      "visibility": "team",
      "member_count": 5,
      "page_count": 87,
      "storage_used": 52428800,
      "created_at": "2025-07-15T09:30:00Z",
      "updated_at": "2025-08-12T16:45:00Z",
      "permissions": {
        "can_edit": true,
        "can_delete": false,
        "can_invite": true,
        "can_admin": false
      }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### POST /workspaces

Create a new workspace.

**Request:**
```http
POST /workspaces
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Marketing Campaign",
  "description": "Q4 marketing campaign planning and execution",
  "icon": "📢",
  "color": "#f59e0b",
  "visibility": "team", // private, team, public
  "template": "marketing" // Optional template ID
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "id": "ws-af7e8f5g-bf4g-7ec3-e5f6-4g7e8f9gah1i",
  "name": "Marketing Campaign",
  "description": "Q4 marketing campaign planning and execution",
  "icon": "📢",
  "color": "#f59e0b",
  "owner_id": "user-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "visibility": "team",
  "member_count": 1,
  "page_count": 0,
  "storage_used": 0,
  "created_at": "2025-08-12T15:30:00Z",
  "updated_at": "2025-08-12T15:30:00Z",
  "permissions": {
    "can_edit": true,
    "can_delete": true,
    "can_invite": true,
    "can_admin": true
  }
}
```

### GET /workspaces/{workspace_id}

Get detailed information about a specific workspace.

**Request:**
```http
GET /workspaces/ws-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "id": "ws-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "name": "Personal Workspace",
  "description": "My personal productivity workspace",
  "icon": "🏠",
  "color": "#3b82f6",
  "owner_id": "user-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "visibility": "private",
  "settings": {
    "ai_enabled": true,
    "collaboration_enabled": true,
    "public_sharing": false,
    "comment_permissions": "members",
    "default_page_permissions": "inherit"
  },
  "statistics": {
    "page_count": 25,
    "member_count": 1,
    "storage_used": 15728640,
    "ai_requests_this_month": 127,
    "last_activity": "2025-08-12T14:20:00Z"
  },
  "members": [
    {
      "user_id": "user-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://cdn.athena.app/avatars/user-123.jpg",
      "role": "owner",
      "joined_at": "2025-08-01T10:00:00Z",
      "last_seen": "2025-08-12T14:20:00Z"
    }
  ],
  "recent_pages": [
    {
      "id": "page-456",
      "title": "Project Planning",
      "type": "document",
      "updated_at": "2025-08-12T14:20:00Z"
    }
  ],
  "created_at": "2025-08-01T10:00:00Z",
  "updated_at": "2025-08-12T14:20:00Z"
}
```

### PUT /workspaces/{workspace_id}

Update workspace information.

**Request:**
```http
PUT /workspaces/ws-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Updated Workspace Name",
  "description": "Updated description",
  "icon": "🎯",
  "color": "#ef4444",
  "settings": {
    "ai_enabled": false,
    "public_sharing": true
  }
}
```

### DELETE /workspaces/{workspace_id}

Delete workspace and all its content.

**Request:**
```http
DELETE /workspaces/ws-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 204 No Content
```

---

## Pages

### GET /pages

List pages in workspace with filtering and search.

**Request:**
```http
GET /pages?workspace_id=ws-123&type=document&search=project&limit=20&offset=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `workspace_id` (string, required): Workspace ID to list pages from
- `type` (string, optional): Filter by page type (`document`, `database`, `whiteboard`, `kanban`, `calendar`)
- `search` (string, optional): Search in page titles and content
- `parent_id` (string, optional): Filter by parent page ID
- `tags` (string, optional): Comma-separated list of tags to filter by
- `created_by` (string, optional): Filter by creator user ID
- `updated_since` (string, optional): ISO 8601 timestamp to filter recent updates
- `limit` (integer, optional): Number of pages to return (1-100, default: 50)
- `offset` (integer, optional): Number of pages to skip (default: 0)
- `sort` (string, optional): Sort field (`title`, `created_at`, `updated_at`, `type`)
- `order` (string, optional): Sort order (`asc`, `desc`)

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "workspace_id": "ws-123",
      "title": "Project Planning Document",
      "type": "document",
      "icon": "📋",
      "cover_image": null,
      "parent_id": null,
      "path": "/Project Planning Document",
      "url": "/workspace/ws-123/page/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "status": "published", // draft, published, archived
      "visibility": "workspace", // private, workspace, public
      "tags": ["planning", "q4", "strategy"],
      "metadata": {
        "word_count": 1247,
        "block_count": 12,
        "reading_time": 5, // minutes
        "last_edited_by": "user-123",
        "last_edited_at": "2025-08-12T14:20:00Z",
        "version": 15,
        "language": "en"
      },
      "permissions": {
        "can_read": true,
        "can_edit": true,
        "can_comment": true,
        "can_share": true,
        "can_delete": true
      },
      "collaboration": {
        "active_users": 2,
        "last_comment_at": "2025-08-12T13:45:00Z",
        "sharing_enabled": true
      },
      "created_by": "user-123",
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-08-12T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_cursor": "eyJpZCI6InBhZ2UtNDU2In0="
  },
  "filters": {
    "applied": {
      "type": "document",
      "search": "project"
    },
    "available": {
      "types": ["document", "database", "whiteboard", "kanban"],
      "tags": ["planning", "q4", "strategy", "team", "design"],
      "creators": [
        {"id": "user-123", "name": "John Doe"},
        {"id": "user-456", "name": "Jane Smith"}
      ]
    }
  }
}
```

### POST /pages

Create a new page.

**Request:**
```http
POST /pages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "workspace_id": "ws-123",
  "title": "New Project Proposal",
  "type": "document",
  "icon": "💡",
  "parent_id": null,
  "template_id": "template-business-proposal", // Optional
  "content": [
    {
      "type": "heading",
      "content": "Executive Summary",
      "level": 1,
      "position": 0
    },
    {
      "type": "paragraph", 
      "content": "This proposal outlines...",
      "position": 1
    }
  ],
  "tags": ["proposal", "q4"],
  "visibility": "workspace",
  "status": "draft"
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "id": "page-af7e8f5g-bf4g-7ec3-e5f6-4g7e8f9gah1i",
  "workspace_id": "ws-123",
  "title": "New Project Proposal",
  "type": "document",
  "icon": "💡",
  "cover_image": null,
  "parent_id": null,
  "path": "/New Project Proposal",
  "url": "/workspace/ws-123/page/page-af7e8f5g-bf4g-7ec3-e5f6-4g7e8f9gah1i",
  "status": "draft",
  "visibility": "workspace",
  "tags": ["proposal", "q4"],
  "content": [
    {
      "id": "block-1",
      "type": "heading",
      "content": "Executive Summary",
      "level": 1,
      "position": 0,
      "created_at": "2025-08-12T15:30:00Z"
    },
    {
      "id": "block-2",
      "type": "paragraph",
      "content": "This proposal outlines...",
      "position": 1,
      "created_at": "2025-08-12T15:30:00Z"
    }
  ],
  "metadata": {
    "word_count": 4,
    "block_count": 2,
    "reading_time": 1,
    "last_edited_by": "user-123",
    "last_edited_at": "2025-08-12T15:30:00Z",
    "version": 1,
    "language": "en"
  },
  "permissions": {
    "can_read": true,
    "can_edit": true,
    "can_comment": true,
    "can_share": true,
    "can_delete": true
  },
  "created_by": "user-123",
  "created_at": "2025-08-12T15:30:00Z",
  "updated_at": "2025-08-12T15:30:00Z"
}
```

### GET /pages/{page_id}

Get detailed page information including content.

**Request:**
```http
GET /pages/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e?include=content,links,collaborators,comments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `include` (string, optional): Comma-separated list of additional data to include
  - `content`: Include full page content blocks
  - `links`: Include outgoing and incoming links
  - `collaborators`: Include current collaborators
  - `comments`: Include recent comments
  - `activity`: Include recent activity
  - `versions`: Include version history

**Response:**
```http
HTTP/1.1 200 OK
{
  "id": "page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "workspace_id": "ws-123",
  "title": "Project Planning Document",
  "type": "document",
  "icon": "📋",
  "cover_image": null,
  "parent_id": null,
  "path": "/Project Planning Document",
  "url": "/workspace/ws-123/page/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "status": "published",
  "visibility": "workspace",
  "tags": ["planning", "q4", "strategy"],
  "content": [
    {
      "id": "block-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "type": "heading",
      "content": "Project Overview",
      "level": 1,
      "position": 0,
      "metadata": {
        "anchor_id": "project-overview"
      },
      "created_at": "2025-08-01T10:00:00Z",
      "updated_at": "2025-08-01T10:00:00Z"
    },
    {
      "id": "block-8e5b6c3d-9e2f-5ba1-c3d4-2e5b6c7d8e9f",
      "type": "paragraph",
      "content": "This project aims to improve user experience across our platform by implementing a new design system and updating key user flows.",
      "position": 1,
      "formatting": {
        "bold": [[70, 84]], // "design system"
        "italic": [[89, 108]]  // "updating key user"
      },
      "created_at": "2025-08-01T10:05:00Z",
      "updated_at": "2025-08-12T14:20:00Z"
    }
  ],
  "links": {
    "outgoing": [
      {
        "id": "link-1",
        "target_page_id": "page-456",
        "target_page_title": "Design System Guidelines",
        "target_type": "page",
        "link_type": "reference",
        "created_at": "2025-08-01T10:15:00Z"
      }
    ],
    "incoming": [
      {
        "id": "link-2",
        "source_page_id": "page-789",
        "source_page_title": "Q4 Roadmap",
        "source_type": "page",
        "link_type": "reference",
        "created_at": "2025-08-01T11:30:00Z"
      }
    ]
  },
  "collaborators": [
    {
      "user_id": "user-123",
      "name": "John Doe",
      "avatar": "https://cdn.athena.app/avatars/user-123.jpg",
      "status": "active", // active, away, offline
      "cursor_position": 150,
      "selection": {"from": 150, "to": 165},
      "last_seen": "2025-08-12T14:20:00Z",
      "permissions": "edit"
    }
  ],
  "metadata": {
    "word_count": 1247,
    "block_count": 12,
    "reading_time": 5,
    "last_edited_by": "user-123",
    "last_edited_at": "2025-08-12T14:20:00Z",
    "version": 15,
    "language": "en",
    "ai_generated_percentage": 15
  },
  "permissions": {
    "can_read": true,
    "can_edit": true,
    "can_comment": true,
    "can_share": true,
    "can_delete": true
  },
  "created_by": "user-123",
  "created_at": "2025-08-01T10:00:00Z",
  "updated_at": "2025-08-12T14:20:00Z"
}
```

### PUT /pages/{page_id}

Update page metadata and properties.

**Request:**
```http
PUT /pages/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Updated Project Plan",
  "icon": "🎯", 
  "tags": ["planning", "q4", "strategy", "high-priority"],
  "status": "published",
  "visibility": "public"
}
```

### PATCH /pages/{page_id}/content

Update page content using operational transforms.

**Request:**
```http
PATCH /pages/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e/content
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "operations": [
    {
      "type": "insert",
      "position": 150,
      "content": "This is new text",
      "block_id": "block-8e5b6c3d-9e2f-5ba1-c3d4-2e5b6c7d8e9f"
    },
    {
      "type": "format",
      "range": {"from": 150, "to": 166},
      "attributes": {"bold": true},
      "block_id": "block-8e5b6c3d-9e2f-5ba1-c3d4-2e5b6c7d8e9f"
    }
  ],
  "version": 15, // For conflict resolution
  "user_id": "user-123"
}
```

### POST /pages/{page_id}/transform

Transform page to different type.

**Request:**
```http
POST /pages/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e/transform
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "target_type": "database",
  "preserve_content": true,
  "transformation_options": {
    "extract_tables": true,
    "create_columns_from_headings": true,
    "parse_lists_as_rows": true
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "id": "page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "type": "database",
  "transformation_summary": {
    "blocks_processed": 12,
    "columns_created": 4,
    "rows_created": 8,
    "content_preserved": 95.2 // percentage
  },
  "updated_at": "2025-08-12T15:45:00Z"
}
```

### DELETE /pages/{page_id}

Delete page (move to trash).

**Request:**
```http
DELETE /pages/page-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 204 No Content
```

---

## Blocks

### GET /pages/{page_id}/blocks

Get all blocks in a page.

**Request:**
```http
GET /pages/page-123/blocks?type=paragraph,heading&limit=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `type` (string, optional): Comma-separated list of block types to filter
- `position_start` (integer, optional): Get blocks starting from position
- `position_end` (integer, optional): Get blocks up to position
- `limit` (integer, optional): Maximum number of blocks to return
- `include_metadata` (boolean, optional): Include block metadata

### POST /pages/{page_id}/blocks

Create a new block in page.

**Request:**
```http
POST /pages/page-123/blocks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "paragraph",
  "content": "This is a new paragraph with **bold** text.",
  "position": 5,
  "parent_id": null,
  "formatting": {
    "bold": [[26, 30]] // "bold"
  }
}
```

### PUT /blocks/{block_id}

Update block content and properties.

**Request:**
```http
PUT /blocks/block-456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Updated paragraph content with *italic* formatting.",
  "formatting": {
    "italic": [[31, 37]] // "italic"
  }
}
```

### POST /blocks/{block_id}/move

Move block to new position.

**Request:**
```http
POST /blocks/block-456/move
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "new_position": 2,
  "parent_id": "block-789" // Optional: move under different parent
}
```

### DELETE /blocks/{block_id}

Delete block.

**Request:**
```http
DELETE /blocks/block-456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Links

### GET /links

Get links in workspace.

**Request:**
```http
GET /links?workspace_id=ws-123&source_id=page-456&type=reference
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `workspace_id` (string, required): Workspace ID
- `source_id` (string, optional): Filter by source page/block ID
- `target_id` (string, optional): Filter by target page/block ID  
- `type` (string, optional): Filter by link type (reference, embed, mention)
- `limit` (integer, optional): Maximum links to return

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "link-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "source_id": "page-456",
      "source_type": "page",
      "source_title": "Project Planning",
      "target_id": "page-789",
      "target_type": "page", 
      "target_title": "Design Guidelines",
      "link_type": "reference",
      "context": {
        "surrounding_text": "...refer to our design guidelines for...",
        "position": 150
      },
      "created_by": "user-123",
      "created_at": "2025-08-01T10:15:00Z"
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

### POST /links

Create a new link between content.

**Request:**
```http
POST /links
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "source_id": "page-456",
  "source_type": "page",
  "target_id": "page-789", 
  "target_type": "page",
  "link_type": "reference",
  "context": {
    "position": 150,
    "surrounding_text": "...refer to our design guidelines for..."
  }
}
```

### DELETE /links/{link_id}

Delete a link.

**Request:**
```http
DELETE /links/link-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Search

### GET /search

Search across all content in workspace.

**Request:**
```http
GET /search?q=project%20planning&workspace_id=ws-123&types=page,block&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `q` (string, required): Search query
- `workspace_id` (string, required): Workspace to search in
- `types` (string, optional): Content types to search (page, block, comment)
- `page_types` (string, optional): Page types to include (document, database, etc.)
- `tags` (string, optional): Filter by tags
- `created_by` (string, optional): Filter by creator
- `date_range` (string, optional): Date range filter (7d, 30d, 90d, 1y)
- `limit` (integer, optional): Maximum results to return (1-100, default: 20)
- `offset` (integer, optional): Results to skip

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "page-456",
      "type": "page",
      "title": "Project Planning Document",
      "page_type": "document",
      "snippet": "This <mark>project</mark> aims to improve user experience by implementing a comprehensive <mark>planning</mark> process...",
      "url": "/workspace/ws-123/page/page-456",
      "score": 0.95,
      "highlights": [
        {
          "field": "title",
          "text": "<mark>Project</mark> <mark>Planning</mark> Document"
        },
        {
          "field": "content", 
          "text": "...comprehensive <mark>planning</mark> process that will..."
        }
      ],
      "metadata": {
        "word_count": 1247,
        "last_updated": "2025-08-12T14:20:00Z",
        "created_by": "John Doe"
      }
    },
    {
      "id": "block-789",
      "type": "block",
      "parent_page_id": "page-101",
      "parent_page_title": "Team Handbook", 
      "block_type": "paragraph",
      "snippet": "Our <mark>project</mark> <mark>planning</mark> methodology follows agile principles...",
      "url": "/workspace/ws-123/page/page-101#block-789",
      "score": 0.87,
      "highlights": [
        {
          "field": "content",
          "text": "Our <mark>project</mark> <mark>planning</mark> methodology..."
        }
      ],
      "metadata": {
        "position": 5,
        "last_updated": "2025-08-10T09:15:00Z",
        "created_by": "Jane Smith"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "has_more": false
  },
  "facets": {
    "types": {
      "page": 10,
      "block": 5
    },
    "page_types": {
      "document": 8,
      "database": 2
    },
    "tags": {
      "planning": 7,
      "strategy": 4,
      "q4": 3
    },
    "creators": {
      "John Doe": 8,
      "Jane Smith": 4,
      "Mike Johnson": 3
    }
  },
  "suggestions": [
    "project management",
    "planning tools", 
    "project timeline"
  ]
}
```

### GET /search/suggestions

Get search suggestions as user types.

**Request:**
```http
GET /search/suggestions?q=proj&workspace_id=ws-123&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "suggestions": [
    "project planning",
    "project management", 
    "project timeline",
    "project roadmap"
  ]
}
```

---

## AI Services

### POST /ai/generate

Generate content using AI.

**Request:**
```http
POST /ai/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "prompt": "Write a project proposal introduction for a new mobile app",
  "context": {
    "workspace_id": "ws-123",
    "page_id": "page-456",
    "page_type": "document",
    "selection": "Project Proposal",
    "surrounding_content": "# Project Proposal\n\n## Introduction\n\n[Generate content here]"
  },
  "options": {
    "model": "gpt-4", // gpt-4, claude-3, local
    "max_tokens": 500,
    "temperature": 0.7,
    "style": "professional", // professional, casual, creative
    "format": "paragraph" // paragraph, bullet-points, outline
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "content": "Our proposed mobile application represents a significant opportunity to revolutionize how users interact with productivity tools on the go. By combining intuitive design with powerful functionality, this app will bridge the gap between desktop productivity and mobile convenience, enabling users to maintain their workflow seamlessly across all devices.",
  "metadata": {
    "model_used": "gpt-4",
    "processing_time": 1.2, // seconds
    "confidence": 0.92,
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 75,
      "total_tokens": 225
    }
  },
  "alternatives": [
    {
      "content": "The mobile application we're proposing will transform the productivity landscape...",
      "confidence": 0.89
    }
  ],
  "suggestions": {
    "next_sections": [
      "Market Analysis",
      "Technical Requirements", 
      "Timeline and Milestones"
    ]
  }
}
```

### POST /ai/analyze

Analyze content using AI.

**Request:**
```http
POST /ai/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Our Q4 strategy focuses on three key areas: user acquisition, product development, and market expansion. We plan to increase our marketing spend by 40% while launching two major features. The competitive landscape shows significant opportunity in the SMB segment.",
  "analysis_types": ["summary", "sentiment", "topics", "insights"],
  "options": {
    "model": "claude-3",
    "detail_level": "comprehensive" // brief, standard, comprehensive
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "summary": {
    "content": "Q4 strategy prioritizes user acquisition, product development, and market expansion with 40% increased marketing spend and two major feature launches, targeting SMB opportunities.",
    "key_points": [
      "Three strategic focus areas for Q4",
      "40% marketing spend increase planned",
      "Two major product features in development",
      "SMB market opportunity identified"
    ]
  },
  "sentiment": {
    "overall": "positive",
    "confidence": 0.87,
    "aspects": {
      "strategy": "optimistic",
      "market_outlook": "positive",
      "resource_allocation": "confident"
    }
  },
  "topics": [
    {
      "name": "Strategy & Planning",
      "confidence": 0.95,
      "keywords": ["strategy", "Q4", "areas", "plan"]
    },
    {
      "name": "Marketing & Growth",
      "confidence": 0.92, 
      "keywords": ["user acquisition", "marketing spend", "market expansion"]
    },
    {
      "name": "Product Development",
      "confidence": 0.89,
      "keywords": ["features", "development", "launching"]
    }
  ],
  "insights": [
    {
      "type": "opportunity",
      "description": "SMB segment shows strong potential for expansion",
      "confidence": 0.84
    },
    {
      "type": "resource_allocation",
      "description": "Significant marketing investment indicates growth focus",
      "confidence": 0.91
    }
  ],
  "metadata": {
    "model_used": "claude-3",
    "processing_time": 0.8,
    "usage": {
      "prompt_tokens": 95,
      "completion_tokens": 180,
      "total_tokens": 275
    }
  }
}
```

### POST /ai/suggest

Get AI suggestions for content improvement.

**Request:**
```http
POST /ai/suggest
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "The project will be completed soon and we expect good results from the implementation.",
  "suggestion_types": ["grammar", "style", "clarity", "enhancement"],
  "context": {
    "content_type": "business_document",
    "audience": "executives",
    "purpose": "status_update"
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "suggestions": [
    {
      "type": "clarity",
      "original": "The project will be completed soon",
      "suggested": "The project is scheduled for completion by Q4 2025",
      "reason": "Specific timeline provides clearer expectations",
      "confidence": 0.89
    },
    {
      "type": "enhancement",
      "original": "we expect good results",
      "suggested": "we anticipate achieving our target KPIs and delivering measurable business value",
      "reason": "More specific and professional language for executive audience",
      "confidence": 0.92
    }
  ],
  "overall_assessment": {
    "clarity_score": 6.5,
    "professionalism_score": 7.2,
    "engagement_score": 5.8,
    "recommendations": [
      "Add specific metrics and timelines",
      "Use more assertive language",
      "Include quantifiable outcomes"
    ]
  }
}
```

### POST /ai/command

Execute natural language commands.

**Request:**
```http
POST /ai/command
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "command": "create a database for tracking customer feedback with columns for date, customer name, feedback, and priority",
  "context": {
    "workspace_id": "ws-123",
    "current_page_id": "page-456"
  }
}
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "interpretation": {
    "action": "create_page",
    "confidence": 0.95,
    "parameters": {
      "type": "database",
      "title": "Customer Feedback Tracker",
      "schema": {
        "columns": [
          {"name": "Date", "type": "date"},
          {"name": "Customer Name", "type": "text"},
          {"name": "Feedback", "type": "long_text"},
          {"name": "Priority", "type": "select", "options": ["Low", "Medium", "High"]}
        ]
      }
    }
  },
  "execution": {
    "status": "completed",
    "created_page_id": "page-new-123",
    "url": "/workspace/ws-123/page/page-new-123"
  }
}
```

---

## Collaboration

### GET /pages/{page_id}/collaborators

Get current collaborators on a page.

**Request:**
```http
GET /pages/page-456/collaborators
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "user_id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://cdn.athena.app/avatars/user-123.jpg",
      "status": "active", // active, away, offline
      "permissions": "edit", // view, comment, edit, admin
      "cursor_position": 150,
      "selection": {"from": 150, "to": 165},
      "last_seen": "2025-08-12T14:20:00Z",
      "joined_at": "2025-08-12T14:00:00Z",
      "session_duration": 1200 // seconds
    }
  ],
  "statistics": {
    "total_collaborators": 1,
    "active_now": 1,
    "peak_concurrent": 3,
    "total_session_time": 3600
  }
}
```

### POST /pages/{page_id}/invite

Invite user to collaborate on page.

**Request:**
```http
POST /pages/page-456/invite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "colleague@example.com",
  "role": "editor", // viewer, commenter, editor
  "message": "Would love your feedback on this project plan!"
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "invitation_id": "inv-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "email": "colleague@example.com",
  "role": "editor",
  "status": "sent", // sent, accepted, declined, expired
  "expires_at": "2025-08-19T15:30:00Z",
  "invited_by": "user-123",
  "created_at": "2025-08-12T15:30:00Z"
}
```

### GET /pages/{page_id}/activity

Get recent activity on a page.

**Request:**
```http
GET /pages/page-456/activity?limit=20&types=content,comments,collaborators
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `limit` (integer, optional): Maximum activities to return
- `types` (string, optional): Activity types to include (content, comments, collaborators, sharing)
- `since` (string, optional): ISO timestamp to get activities since

**Response:**
```http
HTTP/1.1 200 OK
{
  "data": [
    {
      "id": "activity-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
      "type": "content_change",
      "user": {
        "id": "user-123",
        "name": "John Doe",
        "avatar": "https://cdn.athena.app/avatars/user-123.jpg"
      },
      "description": "Updated paragraph in 'Project Overview' section",
      "metadata": {
        "block_id": "block-456",
        "change_type": "content_update",
        "characters_added": 45,
        "characters_removed": 12
      },
      "timestamp": "2025-08-12T14:20:00Z"
    },
    {
      "id": "activity-8e5b6c3d-9e2f-5ba1-c3d4-2e5b6c7d8e9f",
      "type": "comment_added",
      "user": {
        "id": "user-456", 
        "name": "Jane Smith",
        "avatar": "https://cdn.athena.app/avatars/user-456.jpg"
      },
      "description": "Added comment on 'Timeline' section",
      "metadata": {
        "comment_id": "comment-789",
        "block_id": "block-890",
        "comment_preview": "Should we push this deadline back by a week?"
      },
      "timestamp": "2025-08-12T13:45:00Z"
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

### POST /pages/{page_id}/comments

Add comment to page or block.

**Request:**
```http
POST /pages/page-456/comments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "This section needs more detail about the technical requirements.",
  "block_id": "block-789", // Optional: comment on specific block
  "position": 150, // Optional: position within block
  "parent_comment_id": null // Optional: reply to another comment
}
```

**Response:**
```http
HTTP/1.1 201 Created
{
  "id": "comment-7f4a5b2c-8d1e-4a9b-b2c3-1f4a5b6c7d8e",
  "content": "This section needs more detail about the technical requirements.",
  "block_id": "block-789",
  "position": 150,
  "author": {
    "id": "user-123",
    "name": "John Doe",
    "avatar": "https://cdn.athena.app/avatars/user-123.jpg"
  },
  "replies": [],
  "reactions": [],
  "status": "open", // open, resolved
  "created_at": "2025-08-12T15:30:00Z",
  "updated_at": "2025-08-12T15:30:00Z"
}
```

---

This comprehensive API reference provides detailed documentation for all major endpoints. Each endpoint includes request/response examples, parameter descriptions, and error handling information to support effective integration with the Athena platform.

**Related Documentation:**
- [WebSocket API Guide](./03_websocket_guide.md)
- [Authentication Guide](./04_authentication.md)
- [Rate Limiting & Usage](./05_rate_limiting.md)
- [Error Handling](./06_error_handling.md)