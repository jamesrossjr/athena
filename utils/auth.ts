import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })
  }

  static async verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, password)
    } catch (error) {
      return false
    }
  }

  static generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  static generateJWT(payload: JWTPayload, expiresIn: string = '24h'): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set')
    }
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any })
  }

  static verifyJWT(token: string): JWTPayload | null {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set')
      }
      return jwt.verify(token, secret) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static generateSessionToken(): string {
    return randomBytes(64).toString('hex')
  }

  static getSessionExpiry(rememberMe: boolean = false): Date {
    const now = new Date()
    if (rememberMe) {
      // 30 days for "remember me"
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else {
      // 24 hours for regular session
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  static getPasswordResetExpiry(): Date {
    const now = new Date()
    // 1 hour for password reset tokens
    return new Date(now.getTime() + 60 * 60 * 1000)
  }
}