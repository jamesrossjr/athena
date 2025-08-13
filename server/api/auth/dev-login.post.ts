/**
 * DEV ONLY: Quick login for development
 * Creates a test user and session for development purposes
 */

import { AuthUtils } from '~/utils/auth'
import { prisma } from '~/utils/database'
import { getRequestIP } from 'h3'

export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found'
    })
  }

  try {
    const testEmail = 'dev@athena.local'
    const testPassword = 'devpassword123'

    // Check if test user exists
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    })

    // Create test user if it doesn't exist
    if (!user) {
      const hashedPassword = await AuthUtils.hashPassword(testPassword)
      
      user = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          firstName: 'Dev',
          lastName: 'User',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        }
      })
    }

    // Create new session
    const sessionToken = AuthUtils.generateSessionToken()
    const expiresAt = AuthUtils.getSessionExpiry(false)

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        userAgent: getHeader(event, 'user-agent') || 'dev',
        ipAddress: getRequestIP(event) || '127.0.0.1',
      }
    })

    // Set session cookie
    setCookie(event, 'auth-token', sessionToken, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in dev
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return {
      success: true,
      user,
      message: 'Development session created'
    }

  } catch (error: any) {
    console.error('Dev login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create development session'
    })
  }
})