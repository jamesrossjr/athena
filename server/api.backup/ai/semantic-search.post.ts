import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'
import { prisma } from '~/server/utils/db'
import { z } from 'zod'


const requestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  workspaceId: z.string().cuid('Invalid workspace ID'),
  currentDocumentId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { query, workspaceId, currentDocumentId } = requestSchema.parse(body)

    // Get all documents from the workspace
    const documents = await prisma.document.findMany({
      where: {
        workspaceId,
        ...(currentDocumentId && { id: { not: currentDocumentId } })
      },
      include: {
        workspace: true
      }
    })

    if (documents.length === 0) {
      return {
        results: [],
        message: 'No documents found in workspace'
      }
    }

    // Generate embedding for the search query
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: query
    })

    // For demo purposes, we'll do a simple text-based search
    // In production, you'd use ChromaDB with proper embeddings
    const searchResults = documents
      .filter(doc => {
        const content = typeof doc.content === 'string' 
          ? doc.content 
          : JSON.stringify(doc.content)
        
        return doc.title.toLowerCase().includes(query.toLowerCase()) ||
               content.toLowerCase().includes(query.toLowerCase())
      })
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        content: typeof doc.content === 'string' 
          ? doc.content.substring(0, 200) + '...'
          : 'Structured content',
        relevanceScore: 0.8, // Mock score
        updatedAt: doc.updatedAt
      }))
      .slice(0, 5) // Limit to 5 results

    return {
      results: searchResults,
      query,
      totalFound: searchResults.length
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    console.error('Semantic search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to perform semantic search'
    })
  }
})