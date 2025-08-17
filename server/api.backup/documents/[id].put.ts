import { prisma } from '~/server/utils/db'
import { z } from 'zod'
import { cache } from '~/server/utils/cache'

const paramsSchema = z.object({
  id: z.string().cuid('Invalid document ID')
})

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.any().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const body = await readBody(event)
    
    const validatedParams = paramsSchema.parse(params)
    const validatedData = updateSchema.parse(body)

    const updatedDocument = await prisma.document.update({
      where: {
        id: validatedParams.id
      },
      data: validatedData,
      include: {
        workspace: true
      }
    })

    // Invalidate cache
    await cache.del(cache.key.document(validatedParams.id))
    await cache.invalidatePattern(`workspace:${updatedDocument.workspaceId}*`)
    console.log('🗑️ Invalidated cache for document:', validatedParams.id)

    return updatedDocument
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})