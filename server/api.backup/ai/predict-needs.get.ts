import { cognitiveModelingEngine } from '~/server/utils/cognitiveModeling'

export default defineEventHandler(async (event) => {
  try {
    // Get user ID from authentication context
    const userId = getCookie(event, 'user-id') || 'anonymous'
    
    // Get query parameters
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 10
    const types = query.types ? (query.types as string).split(',') : []
    
    // Predict information needs
    const predictions = await cognitiveModelingEngine.predictInformationNeeds(userId)
    
    // Filter by types if specified
    let filteredPredictions = predictions
    if (types.length > 0) {
      filteredPredictions = predictions.filter(p => types.includes(p.type))
    }
    
    // Limit results
    filteredPredictions = filteredPredictions.slice(0, limit)
    
    // Enhance predictions with actionable suggestions
    const enhancedPredictions = filteredPredictions.map(prediction => ({
      ...prediction,
      actions: generateActions(prediction),
      urgency: calculateUrgency(prediction),
      estimatedTimeToRead: estimateReadingTime(prediction)
    }))

    return {
      success: true,
      predictions: enhancedPredictions,
      metadata: {
        totalPredictions: predictions.length,
        filteredCount: filteredPredictions.length,
        averageRelevance: predictions.reduce((sum, p) => sum + p.relevanceScore, 0) / predictions.length,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error predicting information needs:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to predict information needs'
    })
  }
})

// Generate actionable suggestions for each prediction
function generateActions(prediction: any): Array<{
  label: string
  action: string
  icon: string
  primary?: boolean
}> {
  const actions = []

  switch (prediction.type) {
    case 'research_paper':
      actions.push(
        { label: 'Create Analysis', action: 'create_analysis', icon: 'i-heroicons-document-plus', primary: true },
        { label: 'Add to Reading List', action: 'add_to_reading_list', icon: 'i-heroicons-bookmark' },
        { label: 'Share with Team', action: 'share_team', icon: 'i-heroicons-users' },
        { label: 'Extract Key Points', action: 'extract_points', icon: 'i-heroicons-light-bulb' }
      )
      break
    
    case 'news_article':
      actions.push(
        { label: 'Create Summary', action: 'create_summary', icon: 'i-heroicons-document-text', primary: true },
        { label: 'Discuss in Channel', action: 'discuss', icon: 'i-heroicons-chat-bubble-left' },
        { label: 'Archive for Later', action: 'archive', icon: 'i-heroicons-archive-box' }
      )
      break
    
    case 'tool':
      actions.push(
        { label: 'Try Tool', action: 'try_tool', icon: 'i-heroicons-wrench', primary: true },
        { label: 'Compare Alternatives', action: 'compare', icon: 'i-heroicons-scale' },
        { label: 'Add to Tools Database', action: 'add_to_db', icon: 'i-heroicons-server' }
      )
      break
    
    case 'connection':
      actions.push(
        { label: 'Send Connection Request', action: 'connect', icon: 'i-heroicons-user-plus', primary: true },
        { label: 'View Profile', action: 'view_profile', icon: 'i-heroicons-eye' },
        { label: 'Find Common Interests', action: 'find_interests', icon: 'i-heroicons-heart' }
      )
      break
    
    case 'insight':
      actions.push(
        { label: 'Explore Insight', action: 'explore', icon: 'i-heroicons-magnifying-glass', primary: true },
        { label: 'Create Document', action: 'create_doc', icon: 'i-heroicons-document-plus' },
        { label: 'Schedule Review', action: 'schedule', icon: 'i-heroicons-calendar' }
      )
      break
  }

  return actions
}

// Calculate urgency based on relevance and type
function calculateUrgency(prediction: any): 'low' | 'medium' | 'high' {
  const urgencyFactors = {
    research_paper: 0.6,
    news_article: 0.8,
    tool: 0.5,
    connection: 0.7,
    insight: 0.9
  }

  const typeUrgency = urgencyFactors[prediction.type] || 0.5
  const relevanceUrgency = prediction.relevanceScore
  
  const combinedUrgency = (typeUrgency + relevanceUrgency) / 2

  if (combinedUrgency > 0.8) return 'high'
  if (combinedUrgency > 0.6) return 'medium'
  return 'low'
}

// Estimate reading time based on content type and description
function estimateReadingTime(prediction: any): string {
  const baseReadingSpeed = 200 // words per minute

  const estimatedWords = {
    research_paper: 3000,
    news_article: 800,
    tool: 500,
    connection: 100,
    insight: 300
  }

  const words = estimatedWords[prediction.type] || 500
  const minutes = Math.ceil(words / baseReadingSpeed)

  if (minutes < 2) return '1 min'
  if (minutes < 60) return `${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}