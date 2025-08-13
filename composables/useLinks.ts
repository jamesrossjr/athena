/**
 * Links Management Composable
 * 
 * Provides methods for creating, managing, and querying
 * links between blocks in the unified data layer.
 */

import type { BlockLink, CreateBlockLinkRequest, LinkType } from '~/types/unified-data-layer'

export const useLinks = () => {
  // Create a new link between blocks
  const createLink = async (data: CreateBlockLinkRequest): Promise<BlockLink> => {
    try {
      const response = await $fetch('/api/links', {
        method: 'POST',
        body: data
      })

      if (response.success) {
        return response.data
      } else {
        throw new Error('Failed to create link')
      }
    } catch (error) {
      console.error('Error creating link:', error)
      throw error
    }
  }

  // Delete a link
  const deleteLink = async (linkId: string): Promise<void> => {
    try {
      await $fetch(`/api/links/${linkId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting link:', error)
      throw error
    }
  }

  // Get all links for a specific block
  const getBlockLinks = async (blockId: string) => {
    try {
      const response = await $fetch(`/api/blocks/${blockId}/links`)

      if (response.success) {
        return response.data
      } else {
        throw new Error('Failed to fetch block links')
      }
    } catch (error) {
      console.error('Error fetching block links:', error)
      throw error
    }
  }

  // Create a reference link (most common type)
  const createReference = async (sourceBlockId: string, targetBlockId: string, metadata?: any): Promise<BlockLink> => {
    return createLink({
      sourceBlockId,
      targetBlockId,
      linkType: 'REFERENCE',
      metadata
    })
  }

  // Create an embed link
  const createEmbed = async (sourceBlockId: string, targetBlockId: string, metadata?: any): Promise<BlockLink> => {
    return createLink({
      sourceBlockId,
      targetBlockId,
      linkType: 'EMBED',
      metadata
    })
  }

  // Create a relation link (for database relationships)
  const createRelation = async (sourceBlockId: string, targetBlockId: string, metadata?: any): Promise<BlockLink> => {
    return createLink({
      sourceBlockId,
      targetBlockId,
      linkType: 'RELATION',
      metadata
    })
  }

  // Find linked blocks based on content similarity
  const findSimilarBlocks = async (blockId: string, content: string, limit: number = 5) => {
    try {
      // This would use the search API to find blocks with similar content
      const { currentWorkspace } = useWorkspace()
      
      if (!currentWorkspace.value) {
        throw new Error('No workspace selected')
      }

      const response = await $fetch('/api/search', {
        query: {
          q: content.substring(0, 100), // Use first 100 chars as search query
          workspace_id: currentWorkspace.value.id,
          limit
        }
      })

      if (response.success) {
        // Filter out the current block and return only blocks
        return response.data.filter((result: any) => 
          result.type === 'block' && result.id !== blockId
        )
      } else {
        return []
      }
    } catch (error) {
      console.error('Error finding similar blocks:', error)
      return []
    }
  }

  // Auto-link blocks based on mentions (e.g., [[Block Title]] syntax)
  const extractMentions = (content: string): string[] => {
    const mentionRegex = /\[\[([^\]]+)\]\]/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  // Process mentions in content and create links
  const processMentions = async (blockId: string, content: string): Promise<BlockLink[]> => {
    const mentions = extractMentions(content)
    if (mentions.length === 0) return []

    const { currentWorkspace } = useWorkspace()
    if (!currentWorkspace.value) return []

    const createdLinks: BlockLink[] = []

    for (const mention of mentions) {
      try {
        // Search for blocks/pages with matching titles
        const response = await $fetch('/api/search', {
          query: {
            q: mention,
            workspace_id: currentWorkspace.value.id,
            limit: 1
          }
        })

        if (response.success && response.data.length > 0) {
          const target = response.data[0]
          
          if (target.type === 'block') {
            // Create reference link to the block
            const link = await createReference(blockId, target.id, {
              mention: mention,
              autoCreated: true
            })
            createdLinks.push(link)
          }
        }
      } catch (error) {
        console.error(`Error processing mention "${mention}":`, error)
      }
    }

    return createdLinks
  }

  // Create backlinks automatically
  const createBacklinks = async (sourceBlockId: string, targetBlockId: string): Promise<BlockLink[]> => {
    const links: BlockLink[] = []

    try {
      // Create the main reference link
      const referenceLink = await createReference(sourceBlockId, targetBlockId, {
        autoCreated: true
      })
      links.push(referenceLink)

      // Create automatic backlink
      const backlink = await createLink({
        sourceBlockId: targetBlockId,
        targetBlockId: sourceBlockId,
        linkType: 'BACKLINK',
        metadata: {
          autoCreated: true,
          originalLinkId: referenceLink.id
        }
      })
      links.push(backlink)

    } catch (error) {
      console.error('Error creating backlinks:', error)
    }

    return links
  }

  // Get the connection graph for a block (all connected blocks)
  const getConnectionGraph = async (blockId: string, depth: number = 2) => {
    const visited = new Set<string>()
    const graph: any = {
      nodes: [],
      edges: []
    }

    const exploreBlock = async (currentBlockId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentBlockId)) return

      visited.add(currentBlockId)

      try {
        // Get block details
        const blockResponse = await $fetch(`/api/blocks/${currentBlockId}`, {
          query: { include_page: true }
        })

        if (blockResponse.success) {
          graph.nodes.push({
            id: currentBlockId,
            type: blockResponse.data.type,
            content: blockResponse.data.content,
            page: blockResponse.data.page,
            depth: currentDepth
          })
        }

        // Get block links
        const linksData = await getBlockLinks(currentBlockId)
        
        // Add edges to graph
        for (const link of [...linksData.outgoingLinks, ...linksData.incomingLinks]) {
          graph.edges.push({
            id: link.id,
            source: link.sourceBlockId,
            target: link.targetBlockId,
            type: link.linkType,
            metadata: link.metadata
          })

          // Recursively explore connected blocks
          const nextBlockId = link.sourceBlockId === currentBlockId ? 
            link.targetBlockId : link.sourceBlockId
          
          if (currentDepth < depth) {
            await exploreBlock(nextBlockId, currentDepth + 1)
          }
        }
      } catch (error) {
        console.error(`Error exploring block ${currentBlockId}:`, error)
      }
    }

    await exploreBlock(blockId, 0)

    return graph
  }

  // Utility function to format link display
  const formatLinkDisplay = (link: any) => {
    const sourceTitle = link.sourceBlock?.page?.title || 'Unknown Page'
    const targetTitle = link.targetBlock?.page?.title || 'Unknown Page'
    
    return {
      id: link.id,
      display: `${sourceTitle} → ${targetTitle}`,
      type: link.linkType,
      source: {
        id: link.sourceBlockId,
        title: sourceTitle,
        type: link.sourceBlock?.type
      },
      target: {
        id: link.targetBlockId,
        title: targetTitle,
        type: link.targetBlock?.type
      },
      metadata: link.metadata
    }
  }

  return {
    // Core link operations
    createLink,
    deleteLink,
    getBlockLinks,

    // Convenience methods
    createReference,
    createEmbed,
    createRelation,
    createBacklinks,

    // Content-based linking
    findSimilarBlocks,
    extractMentions,
    processMentions,

    // Graph operations
    getConnectionGraph,

    // Utilities
    formatLinkDisplay
  }
}