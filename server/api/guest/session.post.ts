/**
 * POST /api/guest/session
 * Create a new guest session for temporary workspace usage
 */

import { sessionModeService } from '~/services/session-modes'

export default defineEventHandler(async (event) => {
  try {
    // Create a new guest session
    const guestSession = sessionModeService.createGuestSession()
    
    // Set the guest session cookie
    setCookie(event, 'guest-session-id', guestSession.sessionId, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in dev
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return {
      success: true,
      sessionId: guestSession.sessionId,
      expiresAt: guestSession.expiresAt,
      message: 'Guest session created'
    }

  } catch (error: any) {
    console.error('Error creating guest session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create guest session'
    })
  }
})