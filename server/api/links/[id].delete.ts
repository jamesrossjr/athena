/**
 * DELETE /api/links/[id]
 * Delete a block link
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

    // Get link ID from route params
    const linkId = getRouterParam(event, 'id')
    if (!linkId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Link ID is required'
      })
    }

    // Get the link with related blocks to verify access
    const link = await prisma.blockLink.findUnique({
      where: { id: linkId },
      include: {
        sourceBlock: {
          include: {
            page: {
              include: { workspace: true }
            }
          }
        },
        targetBlock: {
          include: {
            page: {
              include: { workspace: true }
            }
          }
        }
      }
    })

    if (!link) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Link not found'
      })
    }

    // Verify user has access to both source and target blocks
    const sourceWorkspaceUserId = link.sourceBlock?.page?.workspace?.userId
    const targetWorkspaceUserId = link.targetBlock?.page?.workspace?.userId

    if (sourceWorkspaceUserId !== userId && targetWorkspaceUserId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Delete the link
    await dataService.deleteBlockLink(linkId)

    return {
      success: true,
      message: 'Link deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting block link:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete block link'
    })
  }
})