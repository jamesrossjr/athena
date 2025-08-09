import { OAuth2Client } from 'google-auth-library'
import { AuthUtils } from '~/utils/auth'
import { prisma } from '~/utils/database'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { idToken } = body

    if (!idToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID token is required'
      })
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email || !payload.sub) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Google token'
      })
    }

    const { email, sub: googleId, given_name: firstName, family_name: lastName, email_verified } = payload

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (user) {
      // Check if Google account is linked
      let socialAccount = await prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider: 'google',
            providerId: googleId
          }
        }
      })

      // Link Google account if not already linked
      if (!socialAccount) {
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerId: googleId,
            email: email.toLowerCase(),
          }
        })
      }
    } else {
      // Create new user with Google account
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: '', // No password for OAuth users
          firstName,
          lastName,
          isVerified: email_verified || false,
          socialAccounts: {
            create: {
              provider: 'google',
              providerId: googleId,
              email: email.toLowerCase(),
            }
          }
        }
      })

      // Send welcome email (async, don't wait)
      try {
        const { EmailService } = await import('~/utils/email')
        EmailService.sendWelcomeEmail(user.email, user.firstName || undefined)
          .catch(error => console.error('Welcome email failed:', error))
      } catch (importError) {
        console.error('Failed to import EmailService:', importError)
      }
    }

    // Create session
    const sessionToken = AuthUtils.generateSessionToken()
    const expiresAt = AuthUtils.getSessionExpiry(false) // Default to 24h, could be made configurable

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        userAgent: getHeader(event, 'user-agent'),
        ipAddress: getClientIP(event),
      }
    })

    // Set session cookie
    setCookie(event, 'auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      message: 'Login successful'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Google OAuth error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})