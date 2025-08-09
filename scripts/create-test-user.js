import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Hash a simple password for testing
    const hashedPassword = await argon2.hash('TestPassword123!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isVerified: true,
      },
    })

    console.log('Test user created successfully:')
    console.log('Email: test@example.com')
    console.log('Password: TestPassword123!')
    console.log('User ID:', user.id)
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Test user already exists.')
    } else {
      console.error('Error creating test user:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()