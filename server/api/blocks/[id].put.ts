/**
 * PUT /api/blocks/[id]
 * Update a block
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { UpdateBlockRequest } from '~/types/unified-data-layer'

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

    // Get request body
    const body = await readBody(event) as UpdateBlockRequest

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

    // Verify parent block if specified
    if (body.parentId) {
      const parentBlock = await dataService.getBlock(body.parentId)
      if (!parentBlock || parentBlock.pageId !== existingBlock.pageId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid parent block'
        })
      }
    }

    // Update block
    const updatedBlock = await dataService.updateBlock(blockId, {
      parentId: body.parentId,
      type: body.type,
      content: body.content,
      position: body.position
    })

    return {
      success: true,
      data: updatedBlock
    }
  } catch (error) {
    console.error('Error updating block:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update block'
    })
  }
})