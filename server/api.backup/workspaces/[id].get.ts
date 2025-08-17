import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const paramsSchema = z.object({
  id: z.string().cuid('Invalid workspace ID')
})

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const validatedParams = paramsSchema.parse(params)

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: validatedParams.id
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        },
        documents: {
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    })

    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }

    return workspace
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid workspace ID',
        data: error.errors
      })
    }
    
    throw error
  }
})