/**
 * DELETE /api/blocks/[id]
 * Delete a block
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

    // Get block ID from route params
    const blockId = getRouterParam(event, 'id')
    if (!blockId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Block ID is required'
      })
    }

    // Verify block exists and user has access
    const existingBlock = await dataService.getBlock(blockId, { 
      include: { 
        page: { 
          include: { workspace: true } 
        } 
      } 
    })
    
    if (!existingBlock) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Block not found'
      })
    }

    if (existingBlock.page?.workspace?.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Delete block (cascades to children and links)
    await dataService.deleteBlock(blockId)

    return {
      success: true,
      message: 'Block deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting block:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete block'
    })
  }
})