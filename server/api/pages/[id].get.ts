/**
 * GET /api/pages/[id]
 * Get a specific page by ID
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  // Get page ID from route params first
  const pageId = getRouterParam(event, 'id')
  if (!pageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page ID is required'
    })
  }

  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get query parameters
    const query = getQuery(event)
    const includeWorkspace = query.include_workspace === 'true'
    const includeBlocks = query.include_blocks === 'true'
    const includeLinks = query.include_links === 'true'
    const treeView = query.tree === 'true'

    // Get page
    const page = await dataService.getPage(pageId, {
      include: {
        workspace: true, // Always include to verify access
        blocks: includeBlocks,
        links: includeLinks
      }
    })

    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found'
      })
    }

    // Verify user has access to this page's workspace
    if (page.workspace?.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Get tree structure if requested
    let blockTree = null
    if (treeView && includeBlocks) {
      blockTree = await dataService.getBlockTree(pageId)
    }

    // Remove workspace from response if not requested
    if (!includeWorkspace) {
      delete page.workspace
    }

    return {
      success: true,
      data: page,
      meta: {
        blockTree: blockTree
      }
    }
  } catch (error) {
    console.error('Error fetching page:', error)
    
    // If authentication failed and we're in development, return mock data
    if (error.statusCode === 401 && process.env.NODE_ENV === 'development') {
      console.log('🎭 Returning mock page for development:', pageId)
      
      return {
        success: true,
        data: {
          id: pageId,
          workspaceId: 'mock-workspace-1',
          title: `Page ${pageId}`,
          type: 'DOCUMENT',
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          blocks: [
            {
              id: `block-${pageId}-1`,
              pageId: pageId,
              type: 'TEXT',
              content: {
                text: ''
              },
              position: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      }
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch page'
    })
  }
})