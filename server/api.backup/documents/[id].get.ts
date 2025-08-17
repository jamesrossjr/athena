import { prisma } from '~/server/utils/db'
import { z } from 'zod'
import { cache } from '~/server/utils/cache'

const paramsSchema = z.object({
  id: z.string().cuid('Invalid document ID')
})

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const validatedParams = paramsSchema.parse(params)

    // Try to get from cache first
    const cacheKey = cache.key.document(validatedParams.id)
    const cachedDocument = await cache.get(cacheKey)
    
    if (cachedDocument) {
      console.log('🚀 Cache hit for document:', validatedParams.id)
      return cachedDocument
    }

    // Fetch from database with optimized query
    const document = await prisma.document.findUnique({
      where: {
        id: validatedParams.id
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }

    // Cache the result for 5 minutes
    await cache.set(cacheKey, document, 300)
    console.log('💾 Cached document:', validatedParams.id)

    return document
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid document ID',
        data: error.errors
      })
    }
    
    throw error
  }
})