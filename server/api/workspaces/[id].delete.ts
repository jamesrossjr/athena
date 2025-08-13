/**
 * DELETE /api/workspaces/[id]
 * Delete a workspace
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

    // Verify workspace exists and user owns it
    const existingWorkspace = await dataService.getWorkspace(workspaceId)
    if (!existingWorkspace) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }

    if (existingWorkspace.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Delete workspace (cascades to pages and blocks)
    await dataService.deleteWorkspace(workspaceId)

    return {
      success: true,
      message: 'Workspace deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting workspace:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete workspace'
    })
  }
})