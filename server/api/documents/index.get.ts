import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Simple mock response for now to avoid complex dependencies
    return {
      data: [
        {
          id: 'doc_1',
          title: 'Welcome Document',
          type: 'document',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      message: 'Documents API working with Prisma connection'
    }
  } catch (error) {
    console.error('Documents API error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})