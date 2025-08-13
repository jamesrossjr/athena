/**
 * PUT /api/workspaces/[id]
 * Update a workspace
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { UpdateWorkspaceRequest } from '~/types/unified-data-layer'

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

    // Get request body
    const body = await readBody(event) as UpdateWorkspaceRequest

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

    // Validate name if provided
    if (body.name !== undefined && body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace name cannot be empty'
      })
    }

    // Update workspace
    const updatedWorkspace = await dataService.updateWorkspace(workspaceId, {
      name: body.name?.trim(),
      icon: body.icon,
      color: body.color,
      settings: body.settings
    })

    return {
      success: true,
      data: updatedWorkspace
    }
  } catch (error) {
    console.error('Error updating workspace:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update workspace'
    })
  }
})