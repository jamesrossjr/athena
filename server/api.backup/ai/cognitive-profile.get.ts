import { cognitiveModelingEngine } from '~/server/utils/cognitiveModeling'

export default defineEventHandler(async (event) => {
  try {
    // Get user ID from authentication context
    const userId = getCookie(event, 'user-id') || 'anonymous'
    
    // Get user's cognitive profile
    const profile = await cognitiveModelingEngine.getUserCognitiveProfile(userId)
    
    return {
      success: true,
      profile: {
        userId: profile.userId,
        organizationStyle: profile.organizationStyle,
        writingStyle: profile.writingStyle,
        thinkingPatterns: profile.thinkingPatterns,
        workPatterns: profile.workPatterns,
        communicationStyle: profile.communicationStyle,
        knowledgeDomains: profile.knowledgeDomains,
        modelConfidence: profile.modelConfidence,
        lastUpdated: profile.lastUpdated
      }
    }
  } catch (error) {
    console.error('Error fetching cognitive profile:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cognitive profile'
    })
  }
})