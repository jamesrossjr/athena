import jwt from 'jsonwebtoken'

interface DocumentResponse {
  id: string
  title: string
  type: 'document' | 'whiteboard' | 'database'
  content?: any
  metadata: {
    createdAt: string
    updatedAt: string
    version: number
    wordCount?: number
    collaborators: string[]
  }
  permissions: {
    read: boolean
    write: boolean
    share: boolean
  }
  workspace: {
    id: string
    name: string
  }
  links?: Array<{
    id: string
    title: string
    type: string
    relationship: 'references' | 'contains' | 'related'
  }>
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  meta: {
    version: string
    timestamp: string
    rateLimitRemaining: number
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate and authorize request
    const { userId, scopes } = await authenticateRequest(event)
    
    // Check required scope
    if (!scopes.includes('documents:read')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions - documents:read scope required'
      })
    }

    // Parse query parameters
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 100) // Max 100 items
    const type = query.type as string
    const workspaceId = query.workspace_id as string
    const search = query.search as string
    const sortBy = query.sort_by as string || 'updated_at'
    const sortOrder = query.sort_order as string || 'desc'
    const includeContent = query.include_content === 'true'
    const includeLinks = query.include_links === 'true'

    // Mock documents data
    const allDocuments = await getUserDocuments(userId, {
      type,
      workspaceId,
      search,
      sortBy,
      sortOrder
    })

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDocuments = allDocuments.slice(startIndex, endIndex)

    // Transform documents for API response
    const documents: DocumentResponse[] = await Promise.all(
      paginatedDocuments.map(async (doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        content: includeContent ? doc.content : undefined,
        metadata: {
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          version: doc.version,
          wordCount: doc.content ? doc.content.split(' ').length : undefined,
          collaborators: doc.collaborators || []
        },
        permissions: {
          read: true,
          write: doc.ownerId === userId || doc.editors?.includes(userId) || false,
          share: doc.ownerId === userId || doc.editors?.includes(userId) || false
        },
        workspace: {
          id: doc.workspaceId,
          name: doc.workspaceName || 'Default Workspace'
        },
        links: includeLinks ? await getDocumentLinks(doc.id) : undefined
      }))
    )

    const response: PaginatedResponse<DocumentResponse> = {
      data: documents,
      pagination: {
        page,
        limit,
        total: allDocuments.length,
        hasNext: endIndex < allDocuments.length,
        hasPrev: page > 1
      },
      meta: {
        version: 'v2.0',
        timestamp: new Date().toISOString(),
        rateLimitRemaining: await getRateLimitRemaining(userId)
      }
    }

    // Set rate limit headers
    setHeader(event, 'X-RateLimit-Remaining', response.meta.rateLimitRemaining.toString())
    setHeader(event, 'X-RateLimit-Reset', (Date.now() + 3600000).toString()) // 1 hour from now

    return response
  } catch (error) {
    console.error('API v2 documents error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Authentication middleware
async function authenticateRequest(event: any): Promise<{ userId: string; scopes: string[] }> {
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const token = authorization.slice(7) // Remove 'Bearer '
  
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret || 'fallback-secret') as any
    
    // Check token expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token expired'
      })
    }

    return {
      userId: decoded.sub,
      scopes: decoded.scope.split(' ')
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    })
  }
}

// Mock database functions
async function getUserDocuments(userId: string, filters: any): Promise<any[]> {
  // Mock documents - in production, query actual database
  const mockDocuments = [
    {
      id: 'doc_1',
      title: 'Project Roadmap 2024',
      type: 'document',
      content: 'This is our comprehensive project roadmap for 2024...',
      workspaceId: 'ws_1',
      workspaceName: 'Product Team',
      ownerId: userId,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      version: 3,
      collaborators: [userId, 'user_2'],
      editors: [userId]
    },
    {
      id: 'doc_2',
      title: 'API Documentation',
      type: 'document',
      content: 'Complete API documentation for developers...',
      workspaceId: 'ws_1',
      workspaceName: 'Product Team',
      ownerId: userId,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      version: 5,
      collaborators: [userId, 'user_3', 'user_4'],
      editors: [userId, 'user_3']
    },
    {
      id: 'board_1',
      title: 'Design System Brainstorm',
      type: 'whiteboard',
      content: { nodes: [], edges: [] }, // Whiteboard data structure
      workspaceId: 'ws_2',
      workspaceName: 'Design Team',
      ownerId: 'user_2',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-16'),
      version: 2,
      collaborators: [userId, 'user_2', 'user_5'],
      editors: ['user_2']
    }
  ]

  let filtered = mockDocuments

  // Apply filters
  if (filters.type) {
    filtered = filtered.filter(doc => doc.type === filters.type)
  }

  if (filters.workspaceId) {
    filtered = filtered.filter(doc => doc.workspaceId === filters.workspaceId)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(doc => 
      doc.title.toLowerCase().includes(searchLower) ||
      (typeof doc.content === 'string' && doc.content.toLowerCase().includes(searchLower))
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue, bValue
    
    switch (filters.sortBy) {
      case 'title':
        aValue = a.title
        bValue = b.title
        break
      case 'created_at':
        aValue = a.createdAt
        bValue = b.createdAt
        break
      case 'updated_at':
      default:
        aValue = a.updatedAt
        bValue = b.updatedAt
        break
    }

    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  return filtered
}

async function getDocumentLinks(documentId: string): Promise<any[]> {
  // Mock links - in production, query knowledge graph
  return [
    {
      id: 'doc_2',
      title: 'API Documentation',
      type: 'document',
      relationship: 'references'
    },
    {
      id: 'board_2',
      title: 'Architecture Diagram',
      type: 'whiteboard',
      relationship: 'contains'
    }
  ]
}

async function getRateLimitRemaining(userId: string): Promise<number> {
  // Mock rate limiting - in production, use Redis or similar
  return 950 // 950 requests remaining out of 1000 per hour
}