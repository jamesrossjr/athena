import { prisma } from '~/server/utils/db'
import type { SmartSuggestion, SuggestionAction } from '~/types/automation'


export class SmartSuggestionsEngine {
  static async generateSuggestionsForUser(userId: string) {
    try {
      console.log(`🧠 Generating smart suggestions for user: ${userId}`)

      // Get user's recent activity
      const recentDocuments = await prisma.document.findMany({
        where: {
          workspace: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
          workspace: true
        }
      })

      const suggestions: Omit<SmartSuggestion, 'id' | 'createdAt' | 'dismissedAt' | 'acceptedAt'>[] = []

      // Analyze for organization suggestions
      const organizationSuggestion = this.analyzeOrganizationOpportunities(recentDocuments, userId)
      if (organizationSuggestion) suggestions.push(organizationSuggestion)

      // Analyze for duplicate content
      const duplicateSuggestion = this.analyzeDuplicateContent(recentDocuments, userId)
      if (duplicateSuggestion) suggestions.push(duplicateSuggestion)

      // Analyze for workspace creation
      const workspaceSuggestion = this.analyzeWorkspaceNeeds(recentDocuments, userId)
      if (workspaceSuggestion) suggestions.push(workspaceSuggestion)

      // Analyze for content improvement
      const contentSuggestion = this.analyzeContentQuality(recentDocuments, userId)
      if (contentSuggestion) suggestions.push(contentSuggestion)

      // Save suggestions to database
      for (const suggestion of suggestions) {
        await prisma.smartSuggestion.create({
          data: suggestion
        })
      }

      console.log(`💡 Generated ${suggestions.length} suggestions for user: ${userId}`)
      return suggestions
    } catch (error) {
      console.error('Smart suggestions generation error:', error)
      return []
    }
  }

  static analyzeOrganizationOpportunities(documents: any[], userId: string) {
    // Look for documents with similar titles or content that could be organized
    const titlePatterns = new Map<string, any[]>()
    
    documents.forEach(doc => {
      const words = doc.title.toLowerCase().split(' ')
      words.forEach(word => {
        if (word.length > 3) { // Ignore short words
          if (!titlePatterns.has(word)) {
            titlePatterns.set(word, [])
          }
          titlePatterns.get(word)!.push(doc)
        }
      })
    })

    // Find patterns with multiple documents
    for (const [keyword, docs] of titlePatterns) {
      if (docs.length >= 3) {
        return {
          userId,
          type: 'organize_documents',
          title: `Organize "${keyword}" documents`,
          description: `You have ${docs.length} documents related to "${keyword}". Consider creating a dedicated workspace or folder.`,
          confidence: Math.min(0.9, docs.length * 0.2),
          data: {
            keyword,
            documentIds: docs.map(d => d.id),
            documentTitles: docs.map(d => d.title)
          },
          actions: [
            {
              id: 'create-workspace',
              label: 'Create Workspace',
              type: 'primary',
              endpoint: '/api/workspaces/create',
              payload: { name: `${keyword} Project` }
            },
            {
              id: 'dismiss',
              label: 'Not Now',
              type: 'dismiss'
            }
          ] as SuggestionAction[]
        }
      }
    }

    return null
  }

  static analyzeDuplicateContent(documents: any[], userId: string) {
    // Simple duplicate detection based on title similarity
    const similarTitles = []
    
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const similarity = this.calculateStringSimilarity(
          documents[i].title,
          documents[j].title
        )
        
        if (similarity > 0.8) {
          similarTitles.push([documents[i], documents[j], similarity])
        }
      }
    }

    if (similarTitles.length > 0) {
      const [doc1, doc2] = similarTitles[0]
      return {
        userId,
        type: 'merge_duplicates',
        title: 'Potential duplicate documents detected',
        description: `"${doc1.title}" and "${doc2.title}" appear very similar. Consider merging them.`,
        confidence: 0.7,
        data: {
          document1: { id: doc1.id, title: doc1.title },
          document2: { id: doc2.id, title: doc2.title }
        },
        actions: [
          {
            id: 'compare-documents',
            label: 'Compare Documents',
            type: 'primary'
          },
          {
            id: 'dismiss',
            label: 'Keep Separate',
            type: 'dismiss'
          }
        ] as SuggestionAction[]
      }
    }

    return null
  }

  static analyzeWorkspaceNeeds(documents: any[], userId: string) {
    // Check if user has many documents in one workspace
    const workspaceCounts = new Map<string, number>()
    
    documents.forEach(doc => {
      const count = workspaceCounts.get(doc.workspaceId) || 0
      workspaceCounts.set(doc.workspaceId, count + 1)
    })

    for (const [workspaceId, count] of workspaceCounts) {
      if (count > 20) {
        return {
          userId,
          type: 'create_workspace',
          title: 'Consider creating additional workspaces',
          description: `You have ${count} documents in one workspace. Breaking them into topic-based workspaces might improve organization.`,
          confidence: 0.6,
          data: {
            workspaceId,
            documentCount: count
          },
          actions: [
            {
              id: 'create-workspace',
              label: 'Create New Workspace',
              type: 'primary'
            },
            {
              id: 'dismiss',
              label: 'Keep As Is',
              type: 'dismiss'
            }
          ] as SuggestionAction[]
        }
      }
    }

    return null
  }

  static analyzeContentQuality(documents: any[], userId: string) {
    // Look for documents that might benefit from AI enhancement
    const shortDocuments = documents.filter(doc => {
      if (typeof doc.content === 'string') {
        return doc.content.length < 100 && doc.content.length > 10
      }
      return false
    })

    if (shortDocuments.length > 0) {
      const doc = shortDocuments[0]
      return {
        userId,
        type: 'improve_content',
        title: 'Expand document content',
        description: `"${doc.title}" could benefit from additional content. Let AI help you expand it.`,
        confidence: 0.5,
        data: {
          documentId: doc.id,
          documentTitle: doc.title,
          currentLength: doc.content.length
        },
        actions: [
          {
            id: 'ai-expand',
            label: 'Expand with AI',
            type: 'primary'
          },
          {
            id: 'dismiss',
            label: 'Leave As Is',
            type: 'dismiss'
          }
        ] as SuggestionAction[]
      }
    }

    return null
  }

  static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}