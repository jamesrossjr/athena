/**
 * POST /api/blocks
 * Create a new block
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { CreateBlockRequest } from '~/types/unified-data-layer'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get request body
    const body = await readBody(event) as CreateBlockRequest

    // Validate required fields
    if (!body.pageId || !body.type || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page ID, type, and content are required'
      })
    }

    // Verify page exists and user has access
    const page = await dataService.getPage(body.pageId, { include: { workspace: true } })
    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found'
      })
    }

    if (page.workspace?.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Verify parent block exists if specified
    if (body.parentId) {
      const parentBlock = await dataService.getBlock(body.parentId)
      if (!parentBlock || parentBlock.pageId !== body.pageId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid parent block'
        })
      }
    }

    // Create block
    const block = await dataService.createBlock({
      pageId: body.pageId,
      parentId: body.parentId,
      type: body.type,
      content: body.content,
      position: body.position
    })

    return {
      success: true,
      data: block
    }
  } catch (error) {
    console.error('Error creating block:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create block'
    })
  }
})