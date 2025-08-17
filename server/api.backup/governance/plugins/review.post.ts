import { pluginReviewBoard } from '~/server/utils/pluginReviewBoard'

interface PluginReviewRequest {
  action: 'submit' | 'assign' | 'review' | 'approve' | 'reject'
  submissionId?: string
  reviewerId?: string
  pluginData?: any
  decision?: 'approve' | 'reject' | 'requires_changes'
  notes?: string
  securityOverrides?: any[]
}

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event) as PluginReviewRequest
    
    // Validate request
    if (!body.action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Action is required'
      })
    }

    let result: any

    switch (body.action) {
      case 'submit':
        if (!body.pluginData) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Plugin data is required for submission'
          })
        }
        result = await handlePluginSubmission(body.pluginData)
        break

      case 'assign':
        if (!body.submissionId || !body.reviewerId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Submission ID and reviewer ID are required'
          })
        }
        result = await handleReviewerAssignment(body.submissionId, body.reviewerId)
        break

      case 'review':
        if (!body.submissionId || !body.reviewerId || !body.decision || !body.notes) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Submission ID, reviewer ID, decision, and notes are required'
          })
        }
        result = await handlePluginReview(
          body.submissionId, 
          body.reviewerId, 
          body.decision, 
          body.notes,
          body.securityOverrides
        )
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unsupported action: ${body.action}`
        })
    }

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Plugin review API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Plugin review operation failed'
    })
  }
})

async function handlePluginSubmission(pluginData: any): Promise<any> {
  // Validate plugin data structure
  const requiredFields = ['name', 'version', 'description', 'author', 'repository', 'manifest']
  for (const field of requiredFields) {
    if (!pluginData[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  // Validate manifest structure
  if (!pluginData.manifest.permissions || !Array.isArray(pluginData.manifest.permissions)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid manifest: permissions array is required'
    })
  }

  // Submit plugin for review
  const submissionId = await pluginReviewBoard.submitPlugin(pluginData)
  
  return {
    submissionId,
    status: 'submitted',
    message: 'Plugin submitted for review successfully',
    estimatedReviewTime: '3-5 business days'
  }
}

async function handleReviewerAssignment(submissionId: string, reviewerId: string): Promise<any> {
  try {
    await pluginReviewBoard.assignReviewer(submissionId, reviewerId)
    
    return {
      submissionId,
      reviewerId,
      status: 'assigned',
      message: 'Reviewer assigned successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error.message || 'Assignment failed'
    })
  }
}

async function handlePluginReview(
  submissionId: string, 
  reviewerId: string, 
  decision: string, 
  notes: string,
  securityOverrides?: any[]
): Promise<any> {
  try {
    await pluginReviewBoard.submitReview(
      submissionId, 
      reviewerId, 
      decision as 'approve' | 'reject' | 'requires_changes',
      notes,
      securityOverrides
    )
    
    return {
      submissionId,
      reviewerId,
      decision,
      status: 'reviewed',
      message: `Plugin review completed with decision: ${decision}`
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error.message || 'Review submission failed'
    })
  }
}