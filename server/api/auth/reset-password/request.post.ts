import { passwordResetRequestSchema } from '~/utils/validation'
import { AuthUtils } from '~/utils/auth'
import { EmailService } from '~/utils/email'
import { prisma } from '~/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validate input
    const validationResult = passwordResetRequestSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: validationResult.error.errors
      })
    }

    const { email } = validationResult.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions'
      }
    }

    // Generate reset token
    const resetToken = AuthUtils.generateToken()
    const expiresAt = AuthUtils.getPasswordResetExpiry()

    // Save reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      }
    })

    // Send reset email
    try {
      await EmailService.sendPasswordResetEmail(
        user.email, 
        resetToken, 
        user.firstName || undefined
      )
    } catch (emailError) {
      console.error('Password reset email failed:', emailError)
      // Don't expose email sending errors to client
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send password reset email'
      })
    }

    return {
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Password reset request error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})