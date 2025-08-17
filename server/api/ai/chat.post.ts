export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { message, context } = body

    // Check if OpenAI API key is configured
    const config = useRuntimeConfig()
    const apiKey = config.openaiApiKey
    
    if (apiKey && apiKey !== 'your-api-key-here') {
      // Use OpenAI if configured
      try {
        const response = await $fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: context || 'You are a helpful AI assistant for Athena, a collaborative workspace application.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          }
        })
        
        return {
          success: true,
          response: response.choices[0]?.message?.content || 'No response generated',
          provider: 'openai'
        }
      } catch (openaiError) {
        console.warn('OpenAI API error, falling back to local response:', openaiError)
      }
    }

    // Fallback to local AI simulation
    const localResponse = generateLocalAIResponse(message, context)
    
    return {
      success: true,
      response: localResponse,
      provider: 'local'
    }
  } catch (error) {
    console.error('AI chat error:', error)
    
    return {
      success: false,
      error: 'Failed to process AI request',
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      provider: 'fallback'
    }
  }
})

function generateLocalAIResponse(message: string, context?: string): string {
  const lowercaseMessage = message.toLowerCase()
  
  // Simple pattern matching for common queries
  if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
    return "Hello! I'm Athena's AI assistant. I can help you with document creation, collaboration, and workspace management. How can I assist you today?"
  }
  
  if (lowercaseMessage.includes('document') || lowercaseMessage.includes('create')) {
    return "I can help you create and manage documents! Athena supports rich text documents, visual whiteboards, and structured databases. Would you like me to guide you through creating a new document?"
  }
  
  if (lowercaseMessage.includes('collaborate') || lowercaseMessage.includes('share')) {
    return "Collaboration is one of Athena's key features! You can share documents with team members, see real-time edits with live cursors, and use comments for async communication. Would you like to know more about any specific collaboration feature?"
  }
  
  if (lowercaseMessage.includes('workspace')) {
    return "Workspaces in Athena help organize your documents and team members. Each workspace can have multiple documents of different types, and you can control access permissions for different users. What would you like to know about workspaces?"
  }
  
  if (lowercaseMessage.includes('help') || lowercaseMessage.includes('how')) {
    return "I'm here to help! I can assist with:\n\n• Creating and organizing documents\n• Setting up collaboration\n• Managing workspaces\n• Understanding Athena's features\n• Getting started with templates\n\nWhat specific topic would you like help with?"
  }
  
  if (lowercaseMessage.includes('template')) {
    return "Athena offers various templates to get you started quickly:\n\n• Meeting Notes\n• Project Planning\n• Knowledge Base Articles\n• Team Retrospectives\n• Design Briefs\n\nWould you like me to help you choose the right template for your needs?"
  }
  
  // Default response with helpful suggestions
  return `I understand you're asking about "${message}". While I'm running in local mode without external AI, I can still help you with Athena's features! 

Try asking me about:
• Document creation and editing
• Real-time collaboration
• Workspace management
• Available templates
• Getting started guides

What would you like to explore?`
}