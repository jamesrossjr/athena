/**
 * GET /api/guest/workspaces
 * Get workspaces in guest mode (from temporary storage)
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

    // Get workspaces from guest session
    const workspaces = sessionModeService.guestOperations.getWorkspaces(guestSessionId)

    return {
      success: true,
      data: workspaces,
      meta: {
        mode: 'GUEST',
        temporary: true,
        count: workspaces.length,
        expiresAt: guestSession.expiresAt,
        warning: 'All data is temporary and will be lost when browser is closed'
      }
    }

  } catch (error) {
    console.error('Error getting guest workspaces:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get workspaces'
    })
  }
})