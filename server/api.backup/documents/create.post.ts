import { prisma } from '~/server/utils/db'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['PAGE', 'WHITEBOARD', 'DATABASE']),
  workspaceId: z.string().cuid('Invalid workspace ID'),
  content: z.any().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = createSchema.parse(body)

    const newDocument = await prisma.document.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        content: validatedData.content || null,
        workspaceId: validatedData.workspaceId
      },
      include: {
        workspace: true
      }
    })

    return newDocument
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