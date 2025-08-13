/**
 * GET /api/workspaces/[id]
 * Get a specific workspace by ID
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get workspace ID from route params
    const workspaceId = getRouterParam(event, 'id')
    if (!workspaceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace ID is required'
      })
    }

    // Get query parameters
    const query = getQuery(event)
    const includePages = query.include_pages === 'true'
    const includeUser = query.include_user === 'true'

    // Get workspace
    const workspace = await dataService.getWorkspace(workspaceId, {
      include: {
        pages: includePages,
        user: includeUser
      }
    })

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }

    // Verify ownership
    if (workspace.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    return {
      success: true,
      data: workspace
    }
  } catch (error) {
    console.error('Error fetching workspace:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch workspace'
    })
  }
})