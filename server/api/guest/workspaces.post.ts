/**
 * POST /api/guest/workspaces
 * Create workspace in guest mode (temporary storage)
 */

import { sessionModeService } from '~/services/session-modes'

export default defineEventHandler(async (event) => {
  try {
    // Get guest session ID from cookie
    const guestSessionId = getCookie(event, 'guest-session-id')
    if (!guestSessionId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Guest session required'
      })
    }

    // Verify guest session exists
    const guestSession = sessionModeService.getGuestSession(guestSessionId)
    if (!guestSession) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired guest session'
      })
    }

    // Get request body
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace name is required'
      })
    }

    // Create workspace in guest session
    const workspace = sessionModeService.guestOperations.createWorkspace(guestSessionId, {
      name: body.name.trim(),
      icon: body.icon || '📁',
      color: body.color || '#3b82f6',
      settings: body.settings || {},
      type: 'temporary'
    })

    // Create a default "Getting Started" page
    const defaultPage = sessionModeService.guestOperations.createPage(guestSessionId, {
      workspaceId: workspace.id,
      title: 'Getting Started',
      type: 'DOCUMENT',
      icon: '📝',
      properties: {
        templateName: 'blank',
        allowComments: true
      }
    })

    // Create initial blocks
    const blocks = [
      {
        pageId: defaultPage.id,
        type: 'HEADING',
        content: { text: 'Welcome to your temporary workspace!', level: 1 },
        position: 0
      },
      {
        pageId: defaultPage.id,
        type: 'TEXT',
        content: { text: 'This workspace is running in Guest Mode - your data will be lost when you close the browser.' },
        position: 1
      },
      {
        pageId: defaultPage.id,
        type: 'TEXT',
        content: { text: 'Sign up or log in to save your work permanently and unlock all features.' },
        position: 2
      }
    ]

    for (const block of blocks) {
      sessionModeService.guestOperations.createBlock(guestSessionId, block)
    }

    return {
      success: true,
      data: workspace,
      meta: {
        defaultPageId: defaultPage.id,
        mode: 'GUEST',
        temporary: true,
        expiresAt: guestSession.expiresAt,
        warning: 'Data will be lost when browser is closed'
      }
    }

  } catch (error) {
    console.error('Error creating guest workspace:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create workspace'
    })
  }
})