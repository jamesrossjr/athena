import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const querySchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  workspaceId: z.string().cuid('Invalid workspace ID').optional(),
  enabled: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const validatedQuery = querySchema.parse(query)

    const rules = await prisma.automationRule.findMany({
      where: {
        userId: validatedQuery.userId,
        ...(validatedQuery.workspaceId && { workspaceId: validatedQuery.workspaceId }),
        ...(validatedQuery.enabled !== undefined && { enabled: validatedQuery.enabled })
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return {
      rules: rules.map(rule => ({
        ...rule,
        executionCount: rule._count.executions
      }))
    }
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
      statusMessage: 'Failed to fetch automation rules'
    })
  }
})