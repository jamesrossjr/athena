export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text, action = 'improve' } = body

    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text content is required'
      })
    }

    // Check if OpenAI API key is configured
    const config = useRuntimeConfig()
    const apiKey = config.openaiApiKey
    
    if (apiKey && apiKey !== 'your-api-key-here') {
      try {
        const systemPrompt = getSystemPrompt(action)
        
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
                content: systemPrompt
              },
              {
                role: 'user',
                content: text
              }
            ],
            max_tokens: Math.max(text.length * 1.5, 200),
            temperature: action === 'creative' ? 0.8 : 0.3
          }
        })
        
        return {
          success: true,
          improvedText: response.choices[0]?.message?.content || text,
          provider: 'openai',
          action,
          originalLength: text.length,
          improvedLength: response.choices[0]?.message?.content?.length || 0
        }
      } catch (openaiError) {
        console.warn('OpenAI API error, falling back to local improvement:', openaiError)
      }
    }

    // Fallback to local text improvement
    const improvedText = improveTextLocally(text, action)
    
    return {
      success: true,
      improvedText,
      provider: 'local',
      action,
      originalLength: text.length,
      improvedLength: improvedText.length
    }
  } catch (error) {
    console.error('Text improvement error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to improve text'
    })
  }
})

function getSystemPrompt(action: string): string {
  switch (action) {
    case 'grammar':
      return 'Fix grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and style.'
    case 'clarity':
      return 'Improve the clarity and readability of the following text. Make it more concise and easier to understand.'
    case 'professional':
      return 'Rewrite the following text in a more professional and formal tone while preserving the original meaning.'
    case 'creative':
      return 'Rewrite the following text in a more creative and engaging way while preserving the core message.'
    case 'simplify':
      return 'Simplify the following text to make it easier to understand. Use simpler words and shorter sentences.'
    default:
      return 'Improve the following text by fixing grammar, enhancing clarity, and making it more engaging.'
  }
}

function improveTextLocally(text: string, action: string): string {
  let improved = text
  
  // Basic improvements that work locally
  switch (action) {
    case 'grammar':
      improved = fixBasicGrammar(text)
      break
    case 'clarity':
      improved = improveClarityLocally(text)
      break
    case 'professional':
      improved = makeProfessional(text)
      break
    case 'simplify':
      improved = simplifyText(text)
      break
    default:
      improved = applyBasicImprovements(text)
  }
  
  return improved
}

function fixBasicGrammar(text: string): string {
  return text
    .replace(/\bi\b/g, 'I') // Capitalize standalone 'i'
    .replace(/(\w+)  +(\w+)/g, '$1 $2') // Fix double spaces
    .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Ensure space after punctuation
    .replace(/([a-z])([A-Z])/g, '$1. $2') // Add periods between sentences
    .trim()
}

function improveClarityLocally(text: string): string {
  // Simple clarity improvements
  const replacements = [
    [/\bthat is to say\b/gi, 'meaning'],
    [/\bin order to\b/gi, 'to'],
    [/\bdue to the fact that\b/gi, 'because'],
    [/\bat this point in time\b/gi, 'now'],
    [/\bfor the purpose of\b/gi, 'to']
  ]
  
  let improved = text
  replacements.forEach(([pattern, replacement]) => {
    improved = improved.replace(pattern, replacement)
  })
  
  return improved
}

function makeProfessional(text: string): string {
  const replacements = [
    [/\bkinda\b/gi, 'somewhat'],
    [/\bsorta\b/gi, 'somewhat'],
    [/\bgonna\b/gi, 'going to'],
    [/\bwanna\b/gi, 'want to'],
    [/\byeah\b/gi, 'yes'],
    [/\bnope\b/gi, 'no']
  ]
  
  let improved = text
  replacements.forEach(([pattern, replacement]) => {
    improved = improved.replace(pattern, replacement)
  })
  
  return improved
}

function simplifyText(text: string): string {
  const replacements = [
    [/\butilize\b/gi, 'use'],
    [/\bfacilitate\b/gi, 'help'],
    [/\bdemonstrate\b/gi, 'show'],
    [/\baccommodate\b/gi, 'fit'],
    [/\binitiate\b/gi, 'start'],
    [/\bterminate\b/gi, 'end']
  ]
  
  let improved = text
  replacements.forEach(([pattern, replacement]) => {
    improved = improved.replace(pattern, replacement)
  })
  
  return improved
}

function applyBasicImprovements(text: string): string {
  return fixBasicGrammar(improveClarityLocally(text))
}