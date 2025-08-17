import { prisma } from '~/server/utils/db'
import { z } from 'zod'
import type { DailyBriefing, BriefingSection } from '~/types/automation'


const paramsSchema = z.object({
  userId: z.string().cuid('Invalid user ID')
})

const querySchema = z.object({
  date: z.string().optional() // ISO date string
})

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const query = getQuery(event)
    const validatedParams = paramsSchema.parse(params)
    const validatedQuery = querySchema.parse(query)

    const targetDate = validatedQuery.date 
      ? new Date(validatedQuery.date)
      : new Date()
    
    // Set to start of day
    targetDate.setHours(0, 0, 0, 0)

    // Check if briefing already exists
    let briefing = await prisma.dailyBriefing.findUnique({
      where: {
        userId_date: {
          userId: validatedParams.userId,
          date: targetDate
        }
      }
    })

    // Generate briefing if it doesn't exist
    if (!briefing) {
      briefing = await generateDailyBriefing(validatedParams.userId, targetDate)
    }

    return briefing
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid parameters',
        data: error.errors
      })
    }
    
    console.error('Daily briefing error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate daily briefing'
    })
  }
})

async function generateDailyBriefing(userId: string, date: Date): Promise<any> {
  console.log(`📊 Generating daily briefing for user: ${userId}, date: ${date.toISOString()}`)

  const endDate = new Date(date)
  endDate.setDate(endDate.getDate() + 1)

  // Get user's workspaces
  const userWorkspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      documents: {
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }
    }
  })

  // Get recent activity
  const recentDocuments = userWorkspaces.flatMap(w => w.documents)
  const todayDocuments = recentDocuments.filter(doc => 
    doc.updatedAt >= date && doc.updatedAt < endDate
  )

  // Get automation executions
  const automationExecutions = await prisma.automationExecution.findMany({
    where: {
      triggeredAt: {
        gte: date,
        lt: endDate
      },
      rule: {
        userId
      }
    },
    include: {
      rule: {
        select: {
          name: true
        }
      }
    }
  })

  // Generate sections
  const sections: BriefingSection[] = []

  // Recent Activity Section
  if (recentDocuments.length > 0) {
    sections.push({
      type: 'recent_activity',
      title: 'Recent Activity',
      content: {
        documents: recentDocuments.slice(0, 5).map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          updatedAt: doc.updatedAt,
          isNew: doc.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        }))
      },
      priority: 'high'
    })
  }

  // AI Insights Section
  const insights = await generateAIInsights(userId, recentDocuments)
  if (insights.length > 0) {
    sections.push({
      type: 'ai_insights',
      title: 'AI Insights',
      content: { insights },
      priority: 'medium'
    })
  }

  // Automation Summary
  if (automationExecutions.length > 0) {
    sections.push({
      type: 'collaboration_updates',
      title: 'Automation Summary',
      content: {
        executions: automationExecutions.map(exec => ({
          ruleName: exec.rule.name,
          status: exec.status,
          triggeredAt: exec.triggeredAt
        })),
        totalExecutions: automationExecutions.length,
        successRate: automationExecutions.filter(e => e.status === 'COMPLETED').length / automationExecutions.length
      },
      priority: 'low'
    })
  }

  // Suggested Actions
  const suggestions = await generateSuggestedActions(userId, recentDocuments)
  if (suggestions.length > 0) {
    sections.push({
      type: 'suggested_reviews',
      title: 'Suggested Actions',
      content: { suggestions },
      priority: 'medium'
    })
  }

  // Calculate metrics
  const metrics = {
    documentsCreated: todayDocuments.filter(doc => 
      doc.createdAt >= date && doc.createdAt < endDate
    ).length,
    documentsUpdated: todayDocuments.length,
    collaborationEvents: 0, // Would calculate from collaboration events
    tasksCompleted: 0, // Would calculate from task completions
    aiInteractions: automationExecutions.length
  }

  // Save briefing
  const briefing = await prisma.dailyBriefing.create({
    data: {
      userId,
      date,
      sections,
      metrics
    }
  })

  console.log(`✅ Generated daily briefing with ${sections.length} sections`)
  return briefing
}

async function generateAIInsights(userId: string, documents: any[]): Promise<any[]> {
  const insights = []

  // Productivity insights
  if (documents.length > 0) {
    const avgDocLength = documents.reduce((sum, doc) => {
      const length = typeof doc.content === 'string' ? doc.content.length : 0
      return sum + length
    }, 0) / documents.length

    if (avgDocLength < 50) {
      insights.push({
        type: 'productivity',
        title: 'Content Depth Opportunity',
        description: 'Your recent documents are quite brief. Consider expanding them with more details or examples.',
        confidence: 0.7,
        actionable: true
      })
    }
  }

  // Pattern recognition
  const types = documents.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostUsedType = Object.entries(types).sort(([,a], [,b]) => b - a)[0]
  if (mostUsedType && mostUsedType[1] > 3) {
    insights.push({
      type: 'pattern',
      title: `${mostUsedType[0]} Focus`,
      description: `You've been creating mostly ${mostUsedType[0]} documents. Consider exploring other document types for variety.`,
      confidence: 0.8,
      actionable: false
    })
  }

  return insights
}

async function generateSuggestedActions(userId: string, documents: any[]): Promise<any[]> {
  const suggestions = []

  // Untagged documents
  const untaggedDocs = documents.filter(doc => !doc.tags || doc.tags.length === 0)
  if (untaggedDocs.length > 2) {
    suggestions.push({
      type: 'organization',
      title: 'Tag your documents',
      description: `${untaggedDocs.length} recent documents don't have tags. Adding tags improves organization and searchability.`,
      action: 'organize',
      documentIds: untaggedDocs.map(d => d.id)
    })
  }

  // Old documents that might need review
  const oldDocs = documents.filter(doc => {
    const daysSinceUpdate = (Date.now() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 30
  })
  
  if (oldDocs.length > 0) {
    suggestions.push({
      type: 'review',
      title: 'Review older documents',
      description: `${oldDocs.length} documents haven't been updated in over a month. They might need refreshing.`,
      action: 'review',
      documentIds: oldDocs.slice(0, 3).map(d => d.id)
    })
  }

  return suggestions
}