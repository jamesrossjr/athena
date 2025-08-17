import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  action: z.enum(['improve', 'fix-grammar', 'translate', 'simplify']),
  targetLanguage: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text, action, targetLanguage } = requestSchema.parse(body)

    let prompt = ''
    
    switch (action) {
      case 'improve':
        prompt = `Please improve the following text to make it clearer, more engaging, and better written while preserving the original meaning:

${text}

Improved version:`
        break
        
      case 'fix-grammar':
        prompt = `Please fix any grammar, spelling, and punctuation errors in the following text while keeping the original style and meaning:

${text}

Corrected version:`
        break
        
      case 'translate':
        const language = targetLanguage || 'Spanish'
        prompt = `Please translate the following text to ${language}:

${text}

Translation:`
        break
        
      case 'simplify':
        prompt = `Please simplify the following text to make it easier to understand while keeping the main ideas:

${text}

Simplified version:`
        break
    }

    const { text: result } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      maxTokens: 1000,
    })

    return {
      originalText: text,
      improvedText: result,
      action,
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
    
    console.error('AI text improvement error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to improve text'
    })
  }
})