import { registerSchema } from '~/utils/validation'
import { AuthUtils } from '~/utils/auth'
import { EmailService } from '~/utils/email'
import { prisma } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: validationResult.error.errors
      })
    }

    const { email, password, firstName, lastName } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An account with this email already exists'
      })
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    })

    // Send welcome email (async, don't wait)
    EmailService.sendWelcomeEmail(user.email, user.firstName || undefined)
      .catch(error => console.error('Welcome email failed:', error))

    // Create session
    const sessionToken = AuthUtils.generateSessionToken()
    const expiresAt = AuthUtils.getSessionExpiry(false)

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
      user,
      message: 'Account created successfully'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})