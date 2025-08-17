import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  userId: z.string().cuid('Invalid user ID'),
  workspaceId: z.string().cuid('Invalid workspace ID'),
  trigger: z.object({
    type: z.enum(['document_created', 'document_updated', 'document_tagged', 'schedule', 'ai_detection']),
    config: z.record(z.any())
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'starts_with', 'greater_than', 'in_list']),
    value: z.any(),
    type: z.enum(['text', 'number', 'date', 'boolean', 'list'])
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(['ai_summarize', 'ai_extract_tasks', 'create_document', 'add_tag', 'send_notification']),
    config: z.record(z.any()),
    order: z.number()
  })),
  settings: z.object({
    maxExecutions: z.number().optional(),
    cooldownMinutes: z.number().optional(),
    notifyOnSuccess: z.boolean().optional(),
    notifyOnError: z.boolean().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = createRuleSchema.parse(body)

    const rule = await prisma.automationRule.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: validatedData.userId,
        workspaceId: validatedData.workspaceId,
        trigger: validatedData.trigger,
        conditions: validatedData.conditions || null,
        actions: validatedData.actions,
        settings: validatedData.settings || {}
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`🤖 Created automation rule: ${rule.name}`)

    return rule
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    console.error('Automation rule creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create automation rule'
    })
  }
})