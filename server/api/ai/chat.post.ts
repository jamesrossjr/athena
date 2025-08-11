import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { message, context, personality, modelConfig } = body

    // Build system prompt based on personality
    const systemPrompt = buildSystemPrompt(personality, context)

    // Use the specified model or default
    const model = modelConfig?.currentModel || 'llama3:8b'
    const temperature = modelConfig?.temperature || 0.7
    const topP = modelConfig?.topP || 0.9
    const topK = modelConfig?.topK || 40

    // Prepare the request to Ollama
    const ollamaPayload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: false,
      options: {
        temperature,
        top_p: topP,
        top_k: topK
      }
    }

    // Make request to local Ollama instance
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaPayload)
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      content: data.message?.content || 'I apologize, I could not process that request.',
      model: data.model,
      sources: extractSources(context), // Extract relevant sources from context
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    return {
      success: false,
      error: error.message,
      content: 'I\'m having trouble connecting to my AI services right now. Please try again in a moment.',
      timestamp: new Date().toISOString()
    }
  }
})

function buildSystemPrompt(personality: any, context: any) {
  const name = personality?.name || 'Jarvis'
  const style = personality?.style || 'professional'
  const proactiveness = personality?.proactiveness || 'medium'
  
  let prompt = `You are ${name}, a sophisticated AI assistant integrated into the Athena digital paper application.

PERSONALITY & BEHAVIOR:
- You are ${style} in your communication style
- Your proactiveness level is ${proactiveness}
- You are witty, intelligent, and genuinely helpful
- You anticipate user needs and offer proactive assistance
- You have access to the user's documents, workspace, system context, and conversation history

CURRENT CONTEXT:
${context ? JSON.stringify(context, null, 2) : 'No specific context provided'}

${context?.memoryContext && context.memoryContext.length > 0 ? `
RELEVANT CONVERSATION HISTORY:
${context.memoryContext.map((mem: any) => `- ${mem.content.substring(0, 200)}${mem.content.length > 200 ? '...' : ''}`).join('\n')}
` : ''}

CAPABILITIES:
- Document creation, editing, and management
- Code analysis and development assistance  
- File organization and workspace management
- System monitoring and maintenance
- Proactive suggestions based on user behavior
- Integration with development tools and workflows
- Git operations (status, commits, push/pull)
- NPM package management
- File system operations
- System monitoring and health checks

COMMUNICATION GUIDELINES:
- Be conversational but efficient
- Offer specific, actionable advice
- When appropriate, suggest follow-up actions
- Reference the user's current context and conversation history when relevant
- Use markdown formatting for code or structured content
- If the user asks you to perform system operations, be helpful but explain what you're doing

SPECIAL COMMANDS YOU CAN EXECUTE:
- Git operations: "Let me check your git status" or "I can help you commit these changes"
- File operations: "I can read/write files for you"
- System monitoring: "Let me check system health"
- NPM operations: "I can install packages or run scripts"

Remember: You are not just answering questions - you are an intelligent assistant helping to manage and enhance the user's digital workspace. Use your memory of past conversations to provide personalized assistance.`

  return prompt
}

function extractSources(context: any): string[] {
  const sources = []
  
  if (context) {
    if (context.currentDocument) {
      sources.push(`Current Document: ${context.currentDocument}`)
    }
    
    if (context.openDocuments && context.openDocuments > 0) {
      sources.push(`${context.openDocuments} open documents`)
    }
    
    if (context.recentActions && context.recentActions.length > 0) {
      sources.push('Recent user actions')
    }
  }
  
  return sources
}