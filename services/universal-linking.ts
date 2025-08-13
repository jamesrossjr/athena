/**
 * Universal Linking Service
 * 
 * This service provides the core functionality for creating links between
 * any content in the knowledge graph - pages to pages, blocks to blocks,
 * pages to blocks, and any combination thereof.
 */

import { PrismaClient } from '@prisma/client'
import type { Link, ContentType, LinkType } from '~/types/unified-data-layer'

export interface CreateLinkRequest {
  sourceType: ContentType
  sourceId: string
  targetType: ContentType
  targetId: string
  linkType?: LinkType
  metadata?: Record<string, any>
}

export interface LinkQuery {
  sourceType?: ContentType
  sourceId?: string
  targetType?: ContentType
  targetId?: string
  linkType?: LinkType
  includeBacklinks?: boolean
}

export class UniversalLinkingService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Create a link between any two pieces of content
   */
  async createLink(request: CreateLinkRequest): Promise<Link> {
    const linkData: any = {
      sourceType: request.sourceType,
      targetType: request.targetType,
      linkType: request.linkType || 'REFERENCE',
      metadata: request.metadata
    }

    // Set the appropriate ID fields based on content type
    if (request.sourceType === 'PAGE') {
      linkData.sourcePageId = request.sourceId
    } else {
      linkData.sourceBlockId = request.sourceId
    }

    if (request.targetType === 'PAGE') {
      linkData.targetPageId = request.targetId
    } else {
      linkData.targetBlockId = request.targetId
    }

    // Validate that the source and target exist
    await this.validateContentExists(request.sourceType, request.sourceId)
    await this.validateContentExists(request.targetType, request.targetId)

    return await this.prisma.link.create({
      data: linkData
    })
  }

  /**
   * Get all links for a piece of content (both outgoing and incoming)
   */
  async getLinksForContent(contentType: ContentType, contentId: string, includeBacklinks = true): Promise<{
    outgoing: Link[]
    incoming: Link[]
  }> {
    const outgoingQuery: any = {}
    const incomingQuery: any = {}

    if (contentType === 'PAGE') {
      outgoingQuery.sourcePageId = contentId
      incomingQuery.targetPageId = contentId
    } else {
      outgoingQuery.sourceBlockId = contentId
      incomingQuery.targetBlockId = contentId
    }

    const [outgoing, incoming] = await Promise.all([
      this.prisma.link.findMany({
        where: outgoingQuery,
        orderBy: { createdAt: 'desc' }
      }),
      includeBacklinks ? this.prisma.link.findMany({
        where: incomingQuery,
        orderBy: { createdAt: 'desc' }
      }) : []
    ])

    return { outgoing, incoming }
  }

  /**
   * Query links with flexible filters
   */
  async queryLinks(query: LinkQuery): Promise<Link[]> {
    const where: any = {}

    if (query.linkType) {
      where.linkType = query.linkType
    }

    if (query.sourceType && query.sourceId) {
      if (query.sourceType === 'PAGE') {
        where.sourcePageId = query.sourceId
      } else {
        where.sourceBlockId = query.sourceId
      }
    }

    if (query.targetType && query.targetId) {
      if (query.targetType === 'PAGE') {
        where.targetPageId = query.targetId
      } else {
        where.targetBlockId = query.targetId
      }
    }

    return await this.prisma.link.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Delete a link
   */
  async deleteLink(linkId: string): Promise<void> {
    await this.prisma.link.delete({
      where: { id: linkId }
    })
  }

  /**
   * Get the knowledge graph - all content and their connections
   */
  async getKnowledgeGraph(workspaceId?: string): Promise<{
    nodes: Array<{
      id: string
      type: 'page' | 'block'
      title: string
      data: any
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      type: LinkType
      metadata?: any
    }>
  }> {
    // Get all pages (optionally filtered by workspace)
    const pageWhere: any = workspaceId ? { workspaceId } : {}
    const pages = await this.prisma.page.findMany({
      where: pageWhere,
      include: {
        blocks: true
      }
    })

    // Get all blocks from these pages
    const pageIds = pages.map(p => p.id)
    const blocks = await this.prisma.block.findMany({
      where: {
        pageId: { in: pageIds }
      }
    })

    // Get all links between this content
    const linkWhere: any = {}
    if (pageIds.length > 0) {
      linkWhere.OR = [
        { sourcePageId: { in: pageIds } },
        { targetPageId: { in: pageIds } },
        { sourceBlockId: { in: blocks.map(b => b.id) } },
        { targetBlockId: { in: blocks.map(b => b.id) } }
      ]
    }

    const links = await this.prisma.link.findMany({
      where: linkWhere
    })

    // Build nodes array
    const nodes = [
      ...pages.map(page => ({
        id: page.id,
        type: 'page' as const,
        title: page.title,
        data: page
      })),
      ...blocks.map(block => ({
        id: block.id,
        type: 'block' as const,
        title: this.getBlockTitle(block),
        data: block
      }))
    ]

    // Build edges array
    const edges = links.map(link => ({
      id: link.id,
      source: link.sourcePageId || link.sourceBlockId!,
      target: link.targetPageId || link.targetBlockId!,
      type: link.linkType as LinkType,
      metadata: link.metadata
    }))

    return { nodes, edges }
  }

  /**
   * Find related content based on links
   */
  async findRelatedContent(contentType: ContentType, contentId: string, depth = 1): Promise<{
    pages: Array<any>
    blocks: Array<any>
  }> {
    let relatedPageIds = new Set<string>()
    let relatedBlockIds = new Set<string>()
    
    const processedContent = new Set<string>()
    const toProcess = [{ type: contentType, id: contentId }]

    for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
      const currentBatch = [...toProcess]
      toProcess.length = 0

      for (const content of currentBatch) {
        const contentKey = `${content.type}:${content.id}`
        if (processedContent.has(contentKey)) continue
        processedContent.add(contentKey)

        const links = await this.getLinksForContent(content.type, content.id)
        
        for (const link of [...links.outgoing, ...links.incoming]) {
          if (link.targetPageId && !relatedPageIds.has(link.targetPageId)) {
            relatedPageIds.add(link.targetPageId)
            if (currentDepth < depth - 1) {
              toProcess.push({ type: 'PAGE', id: link.targetPageId })
            }
          }
          if (link.targetBlockId && !relatedBlockIds.has(link.targetBlockId)) {
            relatedBlockIds.add(link.targetBlockId)
            if (currentDepth < depth - 1) {
              toProcess.push({ type: 'BLOCK', id: link.targetBlockId })
            }
          }
          if (link.sourcePageId && !relatedPageIds.has(link.sourcePageId)) {
            relatedPageIds.add(link.sourcePageId)
            if (currentDepth < depth - 1) {
              toProcess.push({ type: 'PAGE', id: link.sourcePageId })
            }
          }
          if (link.sourceBlockId && !relatedBlockIds.has(link.sourceBlockId)) {
            relatedBlockIds.add(link.sourceBlockId)
            if (currentDepth < depth - 1) {
              toProcess.push({ type: 'BLOCK', id: link.sourceBlockId })
            }
          }
        }
      }
    }

    // Fetch the actual content
    const [pages, blocks] = await Promise.all([
      relatedPageIds.size > 0 ? this.prisma.page.findMany({
        where: { id: { in: Array.from(relatedPageIds) } }
      }) : [],
      relatedBlockIds.size > 0 ? this.prisma.block.findMany({
        where: { id: { in: Array.from(relatedBlockIds) } },
        include: { page: true }
      }) : []
    ])

    return { pages, blocks }
  }

  private async validateContentExists(contentType: ContentType, contentId: string): Promise<void> {
    if (contentType === 'PAGE') {
      const page = await this.prisma.page.findUnique({
        where: { id: contentId }
      })
      if (!page) {
        throw new Error(`Page with id ${contentId} not found`)
      }
    } else {
      const block = await this.prisma.block.findUnique({
        where: { id: contentId }
      })
      if (!block) {
        throw new Error(`Block with id ${contentId} not found`)
      }
    }
  }

  private getBlockTitle(block: any): string {
    switch (block.type) {
      case 'HEADING':
        return (block.content as any)?.text || 'Heading'
      case 'TEXT':
        const text = (block.content as any)?.text || ''
        return text.length > 50 ? text.substring(0, 50) + '...' : text || 'Text block'
      default:
        return `${block.type} block`
    }
  }
}

// Factory function
export function createUniversalLinkingService(prisma: PrismaClient): UniversalLinkingService {
  return new UniversalLinkingService(prisma)
}