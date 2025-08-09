import { prisma } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Get session token from cookie
    const sessionToken = getCookie(event, 'auth-token')
    
    if (!sessionToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      })
    }

    // Find valid session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isVerified: true,
            createdAt: true,
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      // Session expired or doesn't exist
      setCookie(event, 'auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      })
      
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired'
      })
    }

    return {
      success: true,
      user: session.user
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Get current user error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})