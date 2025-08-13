/**
 * GET /api/search
 * Search across workspaces, pages, and blocks
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { SearchQuery, PageType, BlockType } from '~/types/unified-data-layer'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get query parameters
    const queryParams = getQuery(event)
    const query = queryParams.q as string
    const workspaceId = queryParams.workspace_id as string
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = parseInt(queryParams.offset as string) || 0
    
    // Parse array parameters
    const pageTypes = queryParams.page_types ? 
      (queryParams.page_types as string).split(',') as PageType[] : 
      undefined
    const blockTypes = queryParams.block_types ? 
      (queryParams.block_types as string).split(',') as BlockType[] : 
      undefined

    // Validate query
    if (!query || query.trim().length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Search query must be at least 2 characters'
      })
    }

    // Verify workspace access if specified
    if (workspaceId) {
      const workspace = await dataService.getWorkspace(workspaceId)
      if (!workspace || workspace.userId !== userId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied to workspace'
        })
      }
    }

    // Perform search
    const searchQuery: SearchQuery = {
      query: query.trim(),
      workspaceId,
      pageTypes,
      blockTypes,
      limit,
      offset
    }

    const results = await dataService.search(searchQuery)

    return {
      success: true,
      data: results.data,
      pagination: {
        total: results.total,
        page: results.page,
        limit: results.limit,
        hasMore: results.hasMore
      }
    }
  } catch (error) {
    console.error('Error performing search:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})