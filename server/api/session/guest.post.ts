/**
 * POST /api/session/guest
 * Create a new guest session for stateless mode
 */

import { sessionModeService, SessionMode } from '~/services/session-modes'

export default defineEventHandler(async (event) => {
  try {
    // Create new guest session
    const guestSession = sessionModeService.createGuestSession()

    // Set session cookie
    setCookie(event, 'guest-session-id', guestSession.sessionId, {
      httpOnly: false, // Allow client-side access for guest mode
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return {
      success: true,
      data: {
        sessionId: guestSession.sessionId,
        mode: SessionMode.GUEST,
        expiresAt: guestSession.expiresAt,
        features: {
          temporaryData: true,
          noSignupRequired: true,
          dataLostOnReload: true,
          limitedFeatures: false
        },
        message: 'Guest session created - data will not be saved after browser reload'
      }
    }

  } catch (error) {
    console.error('Error creating guest session:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create guest session'
    })
  }
})