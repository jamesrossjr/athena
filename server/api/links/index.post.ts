/**
 * POST /api/links
 * Create a universal link between any two pieces of content
 */

import { PrismaClient } from '@prisma/client'
import { createUniversalLinkingService } from '~/services/universal-linking'
import { requireUserSession } from '~/utils/auth'
import type { CreateLinkRequest } from '~/services/universal-linking'

const prisma = new PrismaClient()
const linkingService = createUniversalLinkingService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    await requireUserSession(event)

    // Get request body
    const body = await readBody(event) as CreateLinkRequest

    // Validate required fields
    if (!body.sourceType || !body.sourceId || !body.targetType || !body.targetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'sourceType, sourceId, targetType, and targetId are required'
      })
    }

    // Prevent self-linking
    if (body.sourceType === body.targetType && body.sourceId === body.targetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot link content to itself'
      })
    }

    // Create the universal link
    const link = await linkingService.createLink(body)

    return {
      success: true,
      data: link
    }
  } catch (error) {
    console.error('Error creating link:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create link'
    })
  }
})