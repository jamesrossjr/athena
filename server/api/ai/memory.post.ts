import { readBody } from 'h3'

// Simple in-memory vector store for now
// In production, you'd use ChromaDB or another vector database
class SimpleVectorStore {
  private memories: Array<{
    id: string
    content: string
    embedding?: number[]
    metadata: any
    timestamp: Date
  }> = []

  async store(id: string, content: string, metadata: any = {}) {
    const embedding = await this.generateEmbedding(content)
    
    this.memories.push({
      id,
      content,
      embedding,
      metadata,
      timestamp: new Date()
    })
  }

  async search(query: string, limit: number = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    
    // Calculate similarity scores
    const scored = this.memories.map(memory => ({
      ...memory,
      similarity: this.cosineSimilarity(queryEmbedding, memory.embedding || [])
    }))

    // Sort by similarity and return top results
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  async getAllMemories() {
    return this.memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async deleteMemory(id: string) {
    this.memories = this.memories.filter(m => m.id !== id)
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple word frequency-based embedding (in production, use proper embeddings)
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0)
    const embedding = new Array(100).fill(0)
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      embedding[hash % 100] += 1
    })
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }
}

// Global vector store instance
const vectorStore = new SimpleVectorStore()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { action, data } = body

    switch (action) {
      case 'store':
        await vectorStore.store(data.id, data.content, data.metadata)
        return {
          success: true,
          message: 'Memory stored successfully'
        }

      case 'search':
        const results = await vectorStore.search(data.query, data.limit || 5)
        return {
          success: true,
          results: results.map(r => ({
            id: r.id,
            content: r.content,
            metadata: r.metadata,
            similarity: r.similarity,
            timestamp: r.timestamp
          }))
        }

      case 'get_all':
        const memories = await vectorStore.getAllMemories()
        return {
          success: true,
          memories: memories.map(m => ({
            id: m.id,
            content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
            metadata: m.metadata,
            timestamp: m.timestamp
          }))
        }

      case 'delete':
        await vectorStore.deleteMemory(data.id)
        return {
          success: true,
          message: 'Memory deleted successfully'
        }

      case 'store_conversation':
        // Store a conversation exchange
        const conversationId = `conv-${Date.now()}`
        await vectorStore.store(
          conversationId,
          `User: ${data.userMessage}\nAssistant: ${data.assistantMessage}`,
          {
            type: 'conversation',
            userMessage: data.userMessage,
            assistantMessage: data.assistantMessage,
            context: data.context || {}
          }
        )
        return {
          success: true,
          id: conversationId,
          message: 'Conversation stored in memory'
        }

      case 'store_document_interaction':
        // Store document-related interactions
        const docId = `doc-${Date.now()}`
        await vectorStore.store(
          docId,
          `Document interaction: ${data.action} on ${data.documentTitle}. ${data.details || ''}`,
          {
            type: 'document',
            action: data.action,
            documentId: data.documentId,
            documentTitle: data.documentTitle,
            details: data.details
          }
        )
        return {
          success: true,
          id: docId,
          message: 'Document interaction stored in memory'
        }

      case 'get_relevant_context':
        // Get relevant context for current situation
        const contextResults = await vectorStore.search(data.query, 3)
        const relevantContext = contextResults
          .filter(r => r.similarity > 0.1) // Only include relevant results
          .map(r => ({
            content: r.content,
            metadata: r.metadata,
            timestamp: r.timestamp
          }))

        return {
          success: true,
          context: relevantContext
        }

      default:
        return {
          success: false,
          error: 'Unknown memory action'
        }
    }

  } catch (error) {
    console.error('AI Memory API Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})