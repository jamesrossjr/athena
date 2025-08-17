import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const paramsSchema = z.object({
  id: z.string().cuid('Invalid workspace ID')
})

interface GraphNode {
  id: string
  title: string
  type: string
  content: string
  group: number
}

interface GraphLink {
  source: string
  target: string
  type: 'reference' | 'similarity'
  weight: number
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const validatedParams = paramsSchema.parse(params)

    // Get all documents from the workspace
    const documents = await prisma.document.findMany({
      where: {
        workspaceId: validatedParams.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (documents.length === 0) {
      return {
        nodes: [],
        links: [],
        message: 'No documents found in workspace'
      }
    }

    // Create nodes
    const nodes: GraphNode[] = documents.map((doc, index) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      content: typeof doc.content === 'string' 
        ? doc.content.substring(0, 100) + '...'
        : 'Structured content',
      group: getGroupByType(doc.type)
    }))

    // Create links based on content similarity and references
    const links: GraphLink[] = []

    // For demo purposes, create some mock connections
    // In production, this would analyze actual content for links and similarity
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i]
        const doc2 = documents[j]
        
        // Check for title similarity (mock relationship)
        const similarity = calculateTitleSimilarity(doc1.title, doc2.title)
        
        if (similarity > 0.3) {
          links.push({
            source: doc1.id,
            target: doc2.id,
            type: 'similarity',
            weight: similarity
          })
        }
        
        // Check for explicit references (mock - would parse [[Document Title]] syntax)
        if (hasReference(doc1, doc2) || hasReference(doc2, doc1)) {
          links.push({
            source: doc1.id,
            target: doc2.id,
            type: 'reference',
            weight: 1.0
          })
        }
      }
    }

    const graphData: GraphData = {
      nodes,
      links
    }

    return graphData
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid workspace ID',
        data: error.errors
      })
    }
    
    console.error('Graph generation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate knowledge graph'
    })
  }
})

function getGroupByType(type: string): number {
  switch (type) {
    case 'PAGE': return 1
    case 'WHITEBOARD': return 2
    case 'DATABASE': return 3
    default: return 0
  }
}

function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(' ')
  const words2 = title2.toLowerCase().split(' ')
  
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return commonWords.length / totalWords
}

function hasReference(doc1: any, doc2: any): boolean {
  // Mock implementation - would check for [[Document Title]] patterns
  const content1 = typeof doc1.content === 'string' ? doc1.content : ''
  return content1.toLowerCase().includes(doc2.title.toLowerCase())
}