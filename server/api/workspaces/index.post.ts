/**
 * POST /api/workspaces
 * Create a new workspace
 */

import { PrismaClient } from '@prisma/client'
import { createUnifiedDataLayerService } from '~/services/unified-data-layer'
import { requireUserSession } from '~/utils/auth'
import type { CreateWorkspaceRequest } from '~/types/unified-data-layer'

const prisma = new PrismaClient()
const dataService = createUnifiedDataLayerService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Get request body
    const body = await readBody(event) as CreateWorkspaceRequest

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace name is required'
      })
    }

    // Create workspace
    const workspace = await dataService.createWorkspace(userId, {
      name: body.name.trim(),
      icon: body.icon,
      color: body.color,
      settings: body.settings
    })

    // Create a default "Getting Started" page with blocks
    const defaultPage = await prisma.page.create({
      data: {
        userId: session.user.id,
        workspaceId: workspace.id,
        title: 'Getting Started',
        type: 'DOCUMENT',
        icon: '📝'
      }
    })

    // Create initial blocks for the page
    await prisma.block.create({
      data: {
        pageId: defaultPage.id,
        type: 'HEADING',
        content: {
          text: 'Welcome to your new workspace!',
          level: 1
        },
        position: 0
      }
    })

    await prisma.block.create({
      data: {
        pageId: defaultPage.id,
        type: 'TEXT',
        content: {
          text: 'This is your first page. You can start writing, creating databases, or organizing your thoughts here.'
        },
        position: 1
      }
    })

    await prisma.block.create({
      data: {
        pageId: defaultPage.id,
        type: 'TEXT',
        content: {
          text: 'Use the command palette (Ctrl+K) to create new pages and manage your workspace.'
        },
        position: 2
      }
    })

    return {
      success: true,
      data: workspace,
      meta: {
        defaultPageId: defaultPage.id
      }
    }
  } catch (error) {
    console.error('Error creating workspace:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create workspace'
    })
  }
})