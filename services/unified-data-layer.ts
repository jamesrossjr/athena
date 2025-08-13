/**
 * Unified Data Layer Service
 * 
 * This service provides a high-level API for interacting with the
 * unified data layer entities (Workspaces, Pages, Blocks, Links).
 */

import { PrismaClient } from '@prisma/client'
import type {
  Workspace,
  Page,
  Block,
  BlockLink,
  WorkspaceWithRelations,
  PageWithRelations,
  BlockWithRelations,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  CreatePageRequest,
  UpdatePageRequest,
  CreateBlockRequest,
  UpdateBlockRequest,
  CreateBlockLinkRequest,
  WorkspaceQuery,
  PageQuery,
  BlockQuery,
  SearchQuery,
  SearchResult,
  CollectionResponse,
  RealtimeEvent
} from '~/types/unified-data-layer'

export class UnifiedDataLayerService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // Workspace Operations
  async getWorkspaces(userId: string, query?: WorkspaceQuery): Promise<WorkspaceWithRelations[]> {
    return await this.prisma.workspace.findMany({
      where: { userId },
      include: {
        pages: query?.include?.pages || false,
        user: query?.include?.user || false
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getWorkspace(id: string, query?: WorkspaceQuery): Promise<WorkspaceWithRelations | null> {
    return await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        pages: query?.include?.pages || false,
        user: query?.include?.user || false
      }
    })
  }

  async createWorkspace(userId: string, data: CreateWorkspaceRequest): Promise<Workspace> {
    return await this.prisma.workspace.create({
      data: {
        userId,
        ...data
      }
    })
  }

  async updateWorkspace(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    return await this.prisma.workspace.update({
      where: { id },
      data
    })
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.prisma.workspace.delete({
      where: { id }
    })
  }

  // Page Operations
  async getPages(query: PageQuery): Promise<PageWithRelations[]> {
    const where: any = {}
    if (query.workspaceId) where.workspaceId = query.workspaceId
    if (query.type) where.type = query.type

    return await this.prisma.page.findMany({
      where,
      include: {
        workspace: query.include?.workspace || false,
        blocks: query.include?.blocks || false,
        sourceLinks: query.include?.links || false,
        targetLinks: query.include?.links || false
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  async getPage(id: string, query?: PageQuery): Promise<PageWithRelations | null> {
    return await this.prisma.page.findUnique({
      where: { id },
      include: {
        workspace: query?.include?.workspace || false,
        blocks: query?.include?.blocks ? {
          orderBy: { position: 'asc' }
        } : false,
        sourceLinks: query?.include?.links || false,
        targetLinks: query?.include?.links || false
      }
    })
  }

  async createPage(data: CreatePageRequest): Promise<Page> {
    return await this.prisma.page.create({
      data
    })
  }

  async updatePage(id: string, data: UpdatePageRequest): Promise<Page> {
    return await this.prisma.page.update({
      where: { id },
      data
    })
  }

  async deletePage(id: string): Promise<void> {
    await this.prisma.page.delete({
      where: { id }
    })
  }

  // Block Operations
  async getBlocks(query: BlockQuery): Promise<BlockWithRelations[]> {
    const where: any = {}
    if (query.pageId) where.pageId = query.pageId
    if (query.parentId) where.parentId = query.parentId
    if (query.type) where.type = query.type

    return await this.prisma.block.findMany({
      where,
      include: {
        page: query.include?.page || false,
        parent: query.include?.parent || false,
        children: query.include?.children ? {
          orderBy: { position: 'asc' }
        } : false,
        sourceLinks: query.include?.links || false,
        targetLinks: query.include?.links || false
      },
      orderBy: { position: 'asc' }
    })
  }

  async getBlock(id: string, query?: BlockQuery): Promise<BlockWithRelations | null> {
    return await this.prisma.block.findUnique({
      where: { id },
      include: {
        page: query?.include?.page || false,
        parent: query?.include?.parent || false,
        children: query?.include?.children ? {
          orderBy: { position: 'asc' }
        } : false,
        sourceLinks: query?.include?.links || false,
        targetLinks: query?.include?.links || false
      }
    })
  }

  async createBlock(data: CreateBlockRequest): Promise<Block> {
    // If no position specified, append to end
    if (data.position === undefined) {
      const lastBlock = await this.prisma.block.findFirst({
        where: { 
          pageId: data.pageId,
          parentId: data.parentId 
        },
        orderBy: { position: 'desc' }
      })
      data.position = (lastBlock?.position || 0) + 1
    }

    return await this.prisma.block.create({
      data
    })
  }

  async updateBlock(id: string, data: UpdateBlockRequest): Promise<Block> {
    return await this.prisma.block.update({
      where: { id },
      data
    })
  }

  async deleteBlock(id: string): Promise<void> {
    await this.prisma.block.delete({
      where: { id }
    })
  }

  async moveBlock(id: string, newPosition: number, newParentId?: string): Promise<Block> {
    return await this.prisma.block.update({
      where: { id },
      data: {
        position: newPosition,
        parentId: newParentId
      }
    })
  }

  // Block Link Operations
  async createBlockLink(data: CreateBlockLinkRequest): Promise<BlockLink> {
    return await this.prisma.blockLink.create({
      data
    })
  }

  async deleteBlockLink(id: string): Promise<void> {
    await this.prisma.blockLink.delete({
      where: { id }
    })
  }

  async getBlockLinks(blockId: string): Promise<BlockLink[]> {
    return await this.prisma.blockLink.findMany({
      where: {
        OR: [
          { sourceBlockId: blockId },
          { targetBlockId: blockId }
        ]
      }
    })
  }

  // Search Operations
  async search(query: SearchQuery): Promise<CollectionResponse<SearchResult>> {
    const results: SearchResult[] = []
    const limit = query.limit || 20
    const offset = query.offset || 0

    // Search pages
    if (!query.blockTypes || query.blockTypes.length === 0) {
      const pages = await this.prisma.page.findMany({
        where: {
          workspaceId: query.workspaceId,
          type: query.pageTypes ? { in: query.pageTypes } : undefined,
          OR: [
            { title: { contains: query.query, mode: 'insensitive' } }
          ]
        },
        include: { workspace: true },
        take: limit,
        skip: offset
      })

      results.push(...pages.map(page => ({
        type: 'page' as const,
        id: page.id,
        title: page.title,
        score: 1.0,
        context: {
          workspaceId: page.workspaceId
        }
      })))
    }

    // Search blocks
    const blocks = await this.prisma.block.findMany({
      where: {
        page: query.workspaceId ? { workspaceId: query.workspaceId } : undefined,
        type: query.blockTypes ? { in: query.blockTypes } : undefined
      },
      include: { page: true },
      take: limit,
      skip: offset
    })

    // Filter blocks by content search (since we can't do full-text search on JSON in SQLite)
    const matchingBlocks = blocks.filter(block => {
      const contentStr = JSON.stringify(block.content).toLowerCase()
      return contentStr.includes(query.query.toLowerCase())
    })

    results.push(...matchingBlocks.map(block => ({
      type: 'block' as const,
      id: block.id,
      title: this.extractBlockTitle(block),
      content: this.extractBlockContent(block),
      score: 0.8,
      context: {
        workspaceId: block.page.workspaceId,
        pageId: block.pageId,
        parentId: block.parentId || undefined
      }
    })))

    return {
      data: results.slice(0, limit),
      total: results.length,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: results.length > limit
    }
  }

  // Utility methods
  private extractBlockTitle(block: Block): string {
    switch (block.type) {
      case 'TEXT':
        return (block.content as any)?.text?.substring(0, 50) || 'Text block'
      case 'HEADING':
        return (block.content as any)?.text || 'Heading'
      default:
        return `${block.type} block`
    }
  }

  private extractBlockContent(block: Block): string {
    switch (block.type) {
      case 'TEXT':
      case 'HEADING':
        return (block.content as any)?.text || ''
      default:
        return JSON.stringify(block.content)
    }
  }

  // Tree operations for hierarchical blocks
  async getBlockTree(pageId: string): Promise<BlockWithRelations[]> {
    const allBlocks = await this.prisma.block.findMany({
      where: { pageId },
      include: {
        children: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    })

    // Build tree structure
    const rootBlocks = allBlocks.filter(block => !block.parentId)
    
    const buildTree = (blocks: any[]): any[] => {
      return blocks.map(block => ({
        ...block,
        children: buildTree(allBlocks.filter(child => child.parentId === block.id))
      }))
    }

    return buildTree(rootBlocks)
  }

  async duplicatePage(pageId: string, newTitle?: string): Promise<Page> {
    const originalPage = await this.getPage(pageId, { include: { blocks: true } })
    if (!originalPage) throw new Error('Page not found')

    // Create new page
    const newPage = await this.createPage({
      workspaceId: originalPage.workspaceId,
      title: newTitle || `${originalPage.title} (Copy)`,
      type: originalPage.type,
      properties: originalPage.properties
    })

    // Duplicate all blocks
    if (originalPage.blocks) {
      const blockIdMap = new Map<string, string>()
      
      for (const block of originalPage.blocks) {
        const newBlock = await this.createBlock({
          pageId: newPage.id,
          parentId: block.parentId ? blockIdMap.get(block.parentId) : undefined,
          type: block.type,
          content: block.content,
          position: block.position
        })
        blockIdMap.set(block.id, newBlock.id)
      }
    }

    return newPage
  }

  // Real-time event emission (to be integrated with WebSocket/SSE)
  private emitRealtimeEvent(event: RealtimeEvent): void {
    // This would integrate with your real-time system
    // For now, just log the event
    console.log('Realtime event:', event)
  }
}

// Factory function for creating service instance
export function createUnifiedDataLayerService(prisma: PrismaClient): UnifiedDataLayerService {
  return new UnifiedDataLayerService(prisma)
}