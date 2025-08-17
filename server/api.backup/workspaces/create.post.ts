import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const createSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  ownerId: z.string().cuid('Invalid owner ID')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = createSchema.parse(body)

    const newWorkspace = await prisma.workspace.create({
      data: {
        name: validatedData.name,
        ownerId: validatedData.ownerId
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        },
        documents: true
      }
    })

    return newWorkspace
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