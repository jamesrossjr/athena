/**
 * GET /api/session/mode
 * Get current session mode and information
 */

import { sessionModeService } from '~/services/session-modes'

export default defineEventHandler(async (event) => {
  try {
    // Check for guest session first
    const guestSessionId = getCookie(event, 'guest-session-id')
    if (guestSessionId) {
      const guestSession = sessionModeService.getGuestSession(guestSessionId)
      if (guestSession) {
        return {
          success: true,
          data: {
            mode: 'GUEST',
            sessionId: guestSession.sessionId,
            expiresAt: guestSession.expiresAt,
            dataCount: {
              workspaces: guestSession.data.workspaces.size,
              pages: guestSession.data.pages.size,
              blocks: guestSession.data.blocks.size,
              links: guestSession.data.links.size
            },
            settings: guestSession.settings,
            features: {
              temporaryData: true,
              noSignupRequired: true,
              dataLostOnReload: true,
              limitedFeatures: false
            }
          }
        }
      } else {
        // Guest session expired, clear cookie
        deleteCookie(event, 'guest-session-id')
      }
    }

    // Check for logged-in session
    const authToken = getCookie(event, 'auth-token')
    if (authToken) {
      // This would normally validate with the auth service
      // For now, we'll assume it's valid and return logged-in mode
      return {
        success: true,
        data: {
          mode: 'LOGGED_IN',
          authenticated: true,
          persistent: true,
          features: {
            persistentData: true,
            fullFeatures: true,
            cloudSync: true,
            collaboration: true
          }
        }
      }
    }

    // No session found
    return {
      success: true,
      data: {
        mode: 'NONE',
        message: 'No active session found'
      }
    }

  } catch (error) {
    console.error('Error getting session mode:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get session mode'
    })
  }
})