export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text, maxLength = 200 } = body

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
                content: `Summarize the following text in approximately ${maxLength} characters or less. Focus on the key points and main ideas.`
              },
              {
                role: 'user',
                content: text
              }
            ],
            max_tokens: Math.floor(maxLength / 3), // Rough token estimation
            temperature: 0.3
          }
        })
        
        return {
          success: true,
          summary: response.choices[0]?.message?.content || 'No summary generated',
          provider: 'openai',
          originalLength: text.length,
          summaryLength: response.choices[0]?.message?.content?.length || 0
        }
      } catch (openaiError) {
        console.warn('OpenAI API error, falling back to local summarization:', openaiError)
      }
    }

    // Fallback to local summarization
    const localSummary = generateLocalSummary(text, maxLength)
    
    return {
      success: true,
      summary: localSummary,
      provider: 'local',
      originalLength: text.length,
      summaryLength: localSummary.length
    }
  } catch (error) {
    console.error('Summarization error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to summarize text'
    })
  }
})

function generateLocalSummary(text: string, maxLength: number): string {
  // Simple local summarization using sentence extraction
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  if (sentences.length <= 2) {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
  }
  
  // Score sentences based on position and length
  const scoredSentences = sentences.map((sentence, index) => {
    const trimmed = sentence.trim()
    const positionScore = index === 0 ? 0.3 : (index === sentences.length - 1 ? 0.2 : 0.1)
    const lengthScore = Math.min(trimmed.length / 100, 0.4) // Favor medium-length sentences
    const keywordScore = countKeywords(trimmed) * 0.1
    
    return {
      sentence: trimmed,
      score: positionScore + lengthScore + keywordScore,
      length: trimmed.length
    }
  })
  
  // Sort by score and build summary
  scoredSentences.sort((a, b) => b.score - a.score)
  
  let summary = ''
  let currentLength = 0
  
  for (const item of scoredSentences) {
    if (currentLength + item.length + 2 <= maxLength) { // +2 for '. '
      if (summary) summary += '. '
      summary += item.sentence
      currentLength = summary.length
    }
  }
  
  return summary || text.substring(0, maxLength) + '...'
}

function countKeywords(sentence: string): number {
  const keywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant', 'major']
  const lowerSentence = sentence.toLowerCase()
  return keywords.reduce((count, keyword) => {
    return count + (lowerSentence.includes(keyword) ? 1 : 0)
  }, 0)
}