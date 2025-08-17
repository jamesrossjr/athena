import { cognitiveModelingEngine } from '~/server/utils/cognitiveModeling'

interface GhostwriteRequest {
  prompt: string
  contentType: 'document' | 'email' | 'summary' | 'plan' | 'notes' | 'proposal'
  length: 'short' | 'medium' | 'long'
  context?: string
  tone?: 'maintain' | 'formal' | 'casual' | 'technical'
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<GhostwriteRequest>(event)
    const { prompt, contentType, length, context, tone } = body

    // Validate request
    if (!prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Prompt is required'
      })
    }

    // Get user ID from authentication context
    const userId = getCookie(event, 'user-id') || 'anonymous'
    
    // Get user's cognitive profile
    const profile = await cognitiveModelingEngine.getUserCognitiveProfile(userId)
    
    // Enhanced prompt with user context
    let enhancedPrompt = prompt
    
    if (context) {
      enhancedPrompt = `Context: ${context}\n\nTask: ${prompt}`
    }

    // Add length specifications
    const lengthInstructions = {
      short: 'Keep response concise, under 200 words.',
      medium: 'Provide a moderate-length response, 200-500 words.',
      long: 'Create a comprehensive response, 500+ words with detailed explanations.'
    }
    
    enhancedPrompt += `\n\n${lengthInstructions[length]}`

    // Override tone if specified
    if (tone && tone !== 'maintain') {
      enhancedPrompt += `\n\nWrite in a ${tone} tone.`
    }

    // Generate content in user's style
    const generatedContent = await cognitiveModelingEngine.generateContentInUserStyle(
      userId,
      enhancedPrompt,
      contentType
    )

    // Track this generation for learning
    await cognitiveModelingEngine.analyzeUserAction(userId, {
      type: 'ai_generation',
      data: {
        prompt,
        contentType,
        generatedLength: generatedContent.length,
        userAccepted: null // Will be updated when user provides feedback
      }
    })

    return {
      success: true,
      content: generatedContent,
      metadata: {
        contentType,
        length,
        wordCount: generatedContent.split(' ').length,
        modelConfidence: profile.modelConfidence,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating content:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate content'
    })
  }
})