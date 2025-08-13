/**
 * GET /api/blocks
 * Get blocks (for testing)
 */

import { PrismaClient } from '@prisma/client'
import { requireUserSession } from '~/utils/auth'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    await requireUserSession(event)
    
    const query = getQuery(event)
    const pageId = query.pageId as string
    
    const blocks = await prisma.block.findMany({
      where: pageId ? { pageId } : {},
      orderBy: { position: 'asc' },
      take: 10
    })
    
    return {
      success: true,
      data: blocks
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get blocks'
    })
  }
})