/**
 * GET /api/workspaces
 * Get all workspaces for the authenticated user
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

    // Get query parameters
    const query = getQuery(event)
    const includePages = query.include_pages === 'true'
    const includeUser = query.include_user === 'true'

    const workspaces = await dataService.getWorkspaces(userId, {
      include: {
        pages: includePages,
        user: includeUser
      }
    })

    return {
      success: true,
      data: workspaces,
      total: workspaces.length
    }
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch workspaces'
    })
  }
})