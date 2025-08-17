import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'

const requestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  documentId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { content, documentId } = requestSchema.parse(body)

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Please provide a clear, concise summary of the following content. Focus on the main points and key takeaways:

${content}

Summary:`,
      maxTokens: 500,
    })

    return {
      summary: text,
      documentId,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    console.error('AI summarization error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate summary'
    })
  }
})