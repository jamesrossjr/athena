import { passwordResetSchema } from '~/utils/validation'
import { AuthUtils } from '~/utils/auth'
import { prisma } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate input
    const validationResult = passwordResetSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: validationResult.error.errors
      })
    }

    const { token, password } = validationResult.data

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset token'
      })
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(password)

    // Update user password and mark reset token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true }
      }),
      // Invalidate all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: passwordReset.userId }
      })
    ])

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Password reset confirm error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})