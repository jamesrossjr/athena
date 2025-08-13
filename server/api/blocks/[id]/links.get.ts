/**
 * GET /api/blocks/[id]/links
 * Get all links for a specific block
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
    const block = await dataService.getBlock(blockId, { 
      include: { 
        page: { 
          include: { workspace: true } 
        } 
      } 
    })
    
    if (!block) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Block not found'
      })
    }

    if (block.page?.workspace?.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Get all links for this block
    const links = await dataService.getBlockLinks(blockId)

    // Get detailed information about linked blocks
    const enrichedLinks = await Promise.all(
      links.map(async (link) => {
        const sourceBlock = link.sourceBlockId === blockId ? block : 
          await dataService.getBlock(link.sourceBlockId, { include: { page: true } })
        
        const targetBlock = link.targetBlockId === blockId ? block :
          await dataService.getBlock(link.targetBlockId, { include: { page: true } })

        return {
          ...link,
          sourceBlock: sourceBlock ? {
            id: sourceBlock.id,
            type: sourceBlock.type,
            content: sourceBlock.content,
            page: sourceBlock.page ? {
              id: sourceBlock.page.id,
              title: sourceBlock.page.title,
              type: sourceBlock.page.type
            } : null
          } : null,
          targetBlock: targetBlock ? {
            id: targetBlock.id,
            type: targetBlock.type,
            content: targetBlock.content,
            page: targetBlock.page ? {
              id: targetBlock.page.id,
              title: targetBlock.page.title,
              type: targetBlock.page.type
            } : null
          } : null
        }
      })
    )

    // Separate incoming and outgoing links
    const outgoingLinks = enrichedLinks.filter(link => link.sourceBlockId === blockId)
    const incomingLinks = enrichedLinks.filter(link => link.targetBlockId === blockId)

    return {
      success: true,
      data: {
        blockId,
        outgoingLinks,
        incomingLinks,
        totalLinks: links.length
      }
    }
  } catch (error) {
    console.error('Error fetching block links:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch block links'
    })
  }
})