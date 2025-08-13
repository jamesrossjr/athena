/**
 * POST /api/pages
 * Create a new page
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { CreatePageRequest } from '~/types/unified-data-layer'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get request body
    const body = await readBody(event) as CreatePageRequest

    // Validate required fields
    if (!body.workspaceId || !body.title || !body.type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace ID, title, and type are required'
      })
    }

    // Verify workspace exists and user owns it
    const workspace = await dataService.getWorkspace(body.workspaceId)
    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }

    if (workspace.userId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to workspace'
      })
    }

    // Create page
    const page = await dataService.createPage({
      workspaceId: body.workspaceId,
      title: body.title.trim(),
      type: body.type,
      properties: body.properties
    })

    // Create initial content block based on page type
    let initialBlock = null
    
    switch (body.type) {
      case 'DOCUMENT':
        initialBlock = await dataService.createBlock({
          pageId: page.id,
          type: 'TEXT',
          content: {
            text: ''
          },
          position: 0
        })
        break
      
      case 'DATABASE':
        // Create column definitions
        initialBlock = await dataService.createBlock({
          pageId: page.id,
          type: 'DATABASE_COLUMN',
          content: {
            name: 'Name',
            type: 'text'
          },
          position: 0
        })
        break
        
      case 'WHITEBOARD':
        // Create initial canvas area
        initialBlock = await dataService.createBlock({
          pageId: page.id,
          type: 'SHAPE',
          content: {
            type: 'rectangle',
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            style: {
              fill: '#f0f0f0',
              stroke: '#ccc',
              strokeWidth: 1
            }
          },
          position: 0
        })
        break
    }

    return {
      success: true,
      data: page,
      meta: {
        initialBlockId: initialBlock?.id
      }
    }
  } catch (error) {
    console.error('Error creating page:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create page'
    })
  }
})