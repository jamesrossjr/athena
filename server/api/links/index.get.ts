/**
 * GET /api/links
 * Query links and knowledge graph data
 */

import { PrismaClient } from '@prisma/client'
import { createUniversalLinkingService } from '~/services/universal-linking'
import { requireUserSession } from '~/utils/auth'
import type { LinkQuery } from '~/services/universal-linking'

const prisma = new PrismaClient()
const linkingService = createUniversalLinkingService(prisma)

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    await requireUserSession(event)

    // Parse query parameters
    const query = getQuery(event)
    
    // Handle different query modes
    if (query.mode === 'knowledge-graph') {
      // Return the knowledge graph
      const graph = await linkingService.getKnowledgeGraph(query.workspaceId as string)
      
      return {
        success: true,
        data: graph,
        mode: 'knowledge-graph'
      }
    }
    
    if (query.mode === 'content-links') {
      // Get all links for a specific piece of content
      if (!query.contentType || !query.contentId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'contentType and contentId are required for content-links mode'
        })
      }
      
      const links = await linkingService.getLinksForContent(
        query.contentType as any,
        query.contentId as string,
        query.includeBacklinks !== 'false'
      )
      
      return {
        success: true,
        data: links,
        mode: 'content-links'
      }
    }
    
    if (query.mode === 'related-content') {
      // Find related content
      if (!query.contentType || !query.contentId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'contentType and contentId are required for related-content mode'
        })
      }
      
      const depth = query.depth ? parseInt(query.depth as string) : 1
      const relatedContent = await linkingService.findRelatedContent(
        query.contentType as any,
        query.contentId as string,
        depth
      )
      
      return {
        success: true,
        data: relatedContent,
        mode: 'related-content'
      }
    }
    
    // Default: query links with filters
    const linkQuery: LinkQuery = {}
    
    if (query.sourceType) linkQuery.sourceType = query.sourceType as any
    if (query.sourceId) linkQuery.sourceId = query.sourceId as string
    if (query.targetType) linkQuery.targetType = query.targetType as any
    if (query.targetId) linkQuery.targetId = query.targetId as string
    if (query.linkType) linkQuery.linkType = query.linkType as any
    
    const links = await linkingService.queryLinks(linkQuery)
    
    return {
      success: true,
      data: links,
      mode: 'query'
    }
  } catch (error) {
    console.error('Error querying links:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to query links'
    })
  }
})