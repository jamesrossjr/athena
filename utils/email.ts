import nodemailer from 'nodemailer'

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null

  private static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
    return this.transporter
  }

  static async sendWelcomeEmail(email: string, firstName?: string) {
    const transporter = this.getTransporter()
    const name = firstName || 'there'
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Athena!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Welcome to Athena, ${name}!</h1>
          <p style="color: #4b5563; font-size: 16px;">
            Thank you for creating your account. You can now save your work, access personalized features, and sync your data across devices.
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #1f2937;">Getting Started:</h3>
            <ul style="color: #4b5563; margin: 10px 0;">
              <li>Create your first workspace</li>
              <li>Start writing and organizing your thoughts</li>
              <li>Explore AI-powered features</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `,
    }

    try {
      await transporter?.sendMail(mailOptions)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't throw error - email failure shouldn't block registration
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, firstName?: string) {
    const transporter = this.getTransporter()
    const name = firstName || 'there'
    const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Reset Your Athena Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Password Reset Request</h1>
          <p style="color: #4b5563; font-size: 16px;">
            Hi ${name},
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
            <p style="color: #9ca3af; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </div>
      `,
    }

    try {
      await transporter?.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error('Failed to send password reset email')
    }
  }
}