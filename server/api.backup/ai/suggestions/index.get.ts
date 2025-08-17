import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const querySchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  limit: z.number().min(1).max(50).optional().default(10),
  dismissed: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const validatedQuery = querySchema.parse(query)

    const suggestions = await prisma.smartSuggestion.findMany({
      where: {
        userId: validatedQuery.userId,
        ...(validatedQuery.dismissed !== undefined && {
          dismissedAt: validatedQuery.dismissed ? { not: null } : null
        })
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: validatedQuery.limit
    })

    return { suggestions }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch suggestions'
    })
  }
})