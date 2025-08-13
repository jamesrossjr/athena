/**
 * GET /api/pages
 * Get pages with optional filtering
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { PageType } from '~/types/unified-data-layer'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get query parameters
    const query = getQuery(event)
    const workspaceId = query.workspace_id as string
    const type = query.type as PageType
    const includeWorkspace = query.include_workspace === 'true'
    const includeBlocks = query.include_blocks === 'true'
    const includeLinks = query.include_links === 'true'

    // Validate workspace access if specified
    if (workspaceId) {
      const workspace = await dataService.getWorkspace(workspaceId)
      if (!workspace || workspace.userId !== userId) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied to workspace'
        })
      }
    }

    // Get pages
    const pages = await dataService.getPages({
      workspaceId,
      type,
      include: {
        workspace: includeWorkspace,
        blocks: includeBlocks,
        links: includeLinks
      }
    })

    // Filter out pages from workspaces user doesn't own (if no workspace specified)
    const filteredPages = workspaceId ? pages : pages.filter(page => 
      page.workspace?.userId === userId
    )

    return {
      success: true,
      data: filteredPages,
      total: filteredPages.length
    }
  } catch (error) {
    console.error('Error fetching pages:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch pages'
    })
  }
})