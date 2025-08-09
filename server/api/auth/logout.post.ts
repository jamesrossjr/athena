import { prisma } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Get session token from cookie
    const sessionToken = getCookie(event, 'auth-token')
    
    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token: sessionToken }
      })
    }

    // Clear the cookie
    setCookie(event, 'auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return {
      success: true,
      message: 'Logged out successfully'
    }

  } catch (error) {
    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})