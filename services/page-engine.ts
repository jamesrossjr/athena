/**
 * Polymorphic Page Engine
 * 
 * This service enables dynamic transformation of pages between different types
 * (Document, Database, Whiteboard, IDE) while preserving their core identity
 * and all their connections in the knowledge graph.
 */

import { PrismaClient } from '@prisma/client'
import { PageType } from '~/types/unified-data-layer'

export interface PageTypeDefinition {
  type: PageType
  name: string
  icon: string
  description: string
  defaultProperties: Record<string, any>
  requiredBlockTypes: string[]
  supportedOperations: string[]
}

export const PAGE_TYPE_DEFINITIONS: Record<string, PageTypeDefinition> = {
  'DOCUMENT': {
    type: 'DOCUMENT' as PageType,
    name: 'Document',
    icon: '📝',
    description: 'Rich text document with blocks, headings, and media',
    defaultProperties: {
      templateName: 'blank',
      allowComments: true,
      wordWrap: true
    },
    requiredBlockTypes: ['TEXT', 'HEADING'],
    supportedOperations: ['write', 'format', 'embed', 'link', 'export']
  },
  
  'DATABASE': {
    type: 'DATABASE' as PageType,
    name: 'Database',
    icon: '🗄️',
    description: 'Structured data with schema, views, and queries',
    defaultProperties: {
      schema: {
        columns: [
          { id: 'title', name: 'Title', type: 'text', required: true },
          { id: 'status', name: 'Status', type: 'select', options: ['Active', 'Inactive'] }
        ]
      },
      views: [
        { id: 'default', name: 'All Items', filter: {}, sort: { column: 'title', direction: 'asc' } }
      ]
    },
    requiredBlockTypes: ['DATABASE_ROW', 'DATABASE_COLUMN'],
    supportedOperations: ['query', 'filter', 'sort', 'aggregate', 'schema', 'export']
  },
  
  [PageType.WHITEBOARD]: {
    type: PageType.WHITEBOARD,
    name: 'Whiteboard',
    icon: '🎨',
    description: 'Visual canvas for diagrams, sketches, and spatial thinking',
    defaultProperties: {
      canvas: {
        width: 5000,
        height: 5000,
        backgroundColor: '#ffffff',
        gridSize: 20,
        showGrid: true
      },
      tools: ['pen', 'shapes', 'text', 'sticky-notes', 'connectors']
    },
    requiredBlockTypes: ['SHAPE', 'STICKY_NOTE', 'CONNECTOR'],
    supportedOperations: ['draw', 'move', 'resize', 'connect', 'group', 'export']
  },
  
  [PageType.IDE]: {
    type: PageType.IDE,
    name: 'IDE',
    icon: '💻',
    description: 'Integrated development environment for code and projects',
    defaultProperties: {
      language: 'javascript',
      theme: 'dark',
      fileExplorer: true,
      terminal: true,
      extensions: ['intellisense', 'git', 'debugger']
    },
    requiredBlockTypes: ['CODE', 'FILE'],
    supportedOperations: ['edit', 'run', 'debug', 'git', 'terminal', 'extensions']
  },
  
  [PageType.KANBAN]: {
    type: PageType.KANBAN,
    name: 'Kanban Board',
    icon: '📋',
    description: 'Task management with columns and cards',
    defaultProperties: {
      columns: [
        { id: 'todo', name: 'To Do', color: '#ff6b6b' },
        { id: 'progress', name: 'In Progress', color: '#4ecdc4' },
        { id: 'done', name: 'Done', color: '#95e1d3' }
      ],
      allowDragDrop: true,
      showCardNumbers: true
    },
    requiredBlockTypes: ['KANBAN_CARD', 'KANBAN_COLUMN'],
    supportedOperations: ['drag', 'create_card', 'move_card', 'archive', 'export']
  },
  
  [PageType.CALENDAR]: {
    type: PageType.CALENDAR,
    name: 'Calendar',
    icon: '📅',
    description: 'Time-based organization with events and scheduling',
    defaultProperties: {
      defaultView: 'month',
      timeFormat: '24h',
      startOfWeek: 'monday',
      showWeekends: true,
      timezone: 'local'
    },
    requiredBlockTypes: ['EVENT', 'TIME_BLOCK'],
    supportedOperations: ['schedule', 'reschedule', 'recurring', 'remind', 'export']
  }
}

export interface TransformationPlan {
  from: PageType
  to: PageType
  steps: Array<{
    action: 'preserve' | 'convert' | 'create' | 'remove'
    description: string
    blockIds?: string[]
    newBlockType?: string
    preserveContent?: boolean
  }>
  warnings: string[]
  dataLoss: boolean
}

export class PolymorphicPageEngine {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Get all available page types and their definitions
   */
  getPageTypeDefinitions(): Record<PageType, PageTypeDefinition> {
    return PAGE_TYPE_DEFINITIONS
  }

  /**
   * Plan the transformation between two page types
   */
  async planTransformation(pageId: string, targetType: PageType): Promise<TransformationPlan> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { blocks: true }
    })

    if (!page) {
      throw new Error('Page not found')
    }

    const currentType = page.type as PageType
    const currentDef = PAGE_TYPE_DEFINITIONS[currentType]
    const targetDef = PAGE_TYPE_DEFINITIONS[targetType]

    const plan: TransformationPlan = {
      from: currentType,
      to: targetType,
      steps: [],
      warnings: [],
      dataLoss: false
    }

    // If same type, no transformation needed
    if (currentType === targetType) {
      plan.steps.push({
        action: 'preserve',
        description: 'No transformation needed - already the target type'
      })
      return plan
    }

    // Analyze existing blocks for compatibility
    const blocksByType = page.blocks.reduce((acc, block) => {
      if (!acc[block.type]) acc[block.type] = []
      acc[block.type].push(block)
      return acc
    }, {} as Record<string, any[]>)

    // Plan preservation of compatible blocks
    for (const blockType of targetDef.requiredBlockTypes) {
      if (blocksByType[blockType]) {
        plan.steps.push({
          action: 'preserve',
          description: `Keep existing ${blockType} blocks`,
          blockIds: blocksByType[blockType].map(b => b.id)
        })
      } else {
        plan.steps.push({
          action: 'create',
          description: `Create default ${blockType} block`,
          newBlockType: blockType
        })
      }
    }

    // Plan conversion of incompatible blocks
    for (const [blockType, blocks] of Object.entries(blocksByType)) {
      if (!targetDef.requiredBlockTypes.includes(blockType)) {
        if (this.canConvertBlock(blockType, targetType)) {
          const newType = this.getConversionTarget(blockType, targetType)
          plan.steps.push({
            action: 'convert',
            description: `Convert ${blockType} blocks to ${newType}`,
            blockIds: blocks.map(b => b.id),
            newBlockType: newType,
            preserveContent: true
          })
        } else {
          plan.steps.push({
            action: 'remove',
            description: `Remove incompatible ${blockType} blocks`,
            blockIds: blocks.map(b => b.id)
          })
          plan.warnings.push(`${blockType} blocks cannot be converted and will be removed`)
          plan.dataLoss = true
        }
      }
    }

    return plan
  }

  /**
   * Execute the transformation of a page to a different type
   */
  async transformPage(pageId: string, targetType: PageType, plan?: TransformationPlan): Promise<void> {
    if (!plan) {
      plan = await this.planTransformation(pageId, targetType)
    }

    // Validate the plan
    if (plan.dataLoss) {
      console.warn('Transformation will result in data loss:', plan.warnings)
    }

    const targetDef = PAGE_TYPE_DEFINITIONS[targetType]

    // Execute transformation steps
    for (const step of plan.steps) {
      await this.executeTransformationStep(pageId, step)
    }

    // Update page type and properties
    await this.prisma.page.update({
      where: { id: pageId },
      data: {
        type: targetType,
        properties: targetDef.defaultProperties
      }
    })
  }

  /**
   * Get pages that can be transformed to a specific type
   */
  async getTransformablePagesFor(targetType: PageType, workspaceId?: string): Promise<Array<{
    page: any
    compatibility: 'full' | 'partial' | 'minimal'
    estimatedDataLoss: number
  }>> {
    const whereClause: any = {}
    if (workspaceId) whereClause.workspaceId = workspaceId

    const pages = await this.prisma.page.findMany({
      where: whereClause,
      include: { blocks: true }
    })

    const results = []

    for (const page of pages) {
      if (page.type === targetType) continue // Skip same type

      const plan = await this.planTransformation(page.id, targetType)
      const preserveSteps = plan.steps.filter(s => s.action === 'preserve').length
      const totalSteps = plan.steps.length
      const preserveRatio = preserveSteps / totalSteps

      let compatibility: 'full' | 'partial' | 'minimal'
      if (preserveRatio > 0.8) compatibility = 'full'
      else if (preserveRatio > 0.4) compatibility = 'partial'
      else compatibility = 'minimal'

      const removedBlocks = plan.steps.filter(s => s.action === 'remove').length
      const totalBlocks = page.blocks.length
      const estimatedDataLoss = totalBlocks > 0 ? (removedBlocks / totalBlocks) * 100 : 0

      results.push({
        page,
        compatibility,
        estimatedDataLoss
      })
    }

    return results.sort((a, b) => a.estimatedDataLoss - b.estimatedDataLoss)
  }

  private async executeTransformationStep(pageId: string, step: TransformationPlan['steps'][0]): Promise<void> {
    switch (step.action) {
      case 'preserve':
        // Nothing to do - blocks already exist
        break

      case 'create':
        if (step.newBlockType) {
          await this.createDefaultBlock(pageId, step.newBlockType)
        }
        break

      case 'convert':
        if (step.blockIds && step.newBlockType) {
          for (const blockId of step.blockIds) {
            await this.convertBlock(blockId, step.newBlockType, step.preserveContent || false)
          }
        }
        break

      case 'remove':
        if (step.blockIds) {
          await this.prisma.block.deleteMany({
            where: { id: { in: step.blockIds } }
          })
        }
        break
    }
  }

  private async createDefaultBlock(pageId: string, blockType: string): Promise<void> {
    const position = await this.getNextBlockPosition(pageId)
    const defaultContent = this.getDefaultBlockContent(blockType)

    await this.prisma.block.create({
      data: {
        pageId,
        type: blockType,
        content: defaultContent,
        position
      }
    })
  }

  private async convertBlock(blockId: string, newType: string, preserveContent: boolean): Promise<void> {
    const block = await this.prisma.block.findUnique({ where: { id: blockId } })
    if (!block) return

    let newContent = preserveContent ? block.content : this.getDefaultBlockContent(newType)

    // Smart content conversion
    if (preserveContent) {
      newContent = this.convertBlockContent(block.content, block.type, newType)
    }

    await this.prisma.block.update({
      where: { id: blockId },
      data: {
        type: newType,
        content: newContent
      }
    })
  }

  private convertBlockContent(content: any, fromType: string, toType: string): any {
    // Smart content conversion logic
    if (fromType === 'TEXT' && toType === 'HEADING') {
      return {
        text: content.text || '',
        level: 2
      }
    }

    if (fromType === 'HEADING' && toType === 'TEXT') {
      return {
        text: content.text || ''
      }
    }

    // Add more conversion rules as needed
    return content
  }

  private canConvertBlock(blockType: string, targetPageType: PageType): boolean {
    const conversions: Record<string, PageType[]> = {
      'TEXT': [PageType.DOCUMENT, PageType.DATABASE],
      'HEADING': [PageType.DOCUMENT, PageType.DATABASE],
      'LIST_ITEM': [PageType.DOCUMENT, PageType.KANBAN],
      'CODE': [PageType.IDE, PageType.DOCUMENT],
      'IMAGE': Object.values(PageType), // Images can go anywhere
    }

    return conversions[blockType]?.includes(targetPageType) || false
  }

  private getConversionTarget(blockType: string, targetPageType: PageType): string {
    const targetDef = PAGE_TYPE_DEFINITIONS[targetPageType]
    
    // Return the first compatible required block type
    if (targetDef.requiredBlockTypes.includes(blockType)) {
      return blockType
    }

    // Smart mapping
    const mapping: Record<string, Partial<Record<PageType, string>>> = {
      'TEXT': {
        [PageType.DATABASE]: 'DATABASE_ROW',
        [PageType.KANBAN]: 'KANBAN_CARD'
      },
      'HEADING': {
        [PageType.DATABASE]: 'DATABASE_COLUMN',
        [PageType.KANBAN]: 'KANBAN_COLUMN'
      }
    }

    return mapping[blockType]?.[targetPageType] || targetDef.requiredBlockTypes[0]
  }

  private getDefaultBlockContent(blockType: string): any {
    const defaults: Record<string, any> = {
      'TEXT': { text: '' },
      'HEADING': { text: 'New Section', level: 2 },
      'DATABASE_ROW': { data: {} },
      'DATABASE_COLUMN': { name: 'New Column', type: 'text' },
      'SHAPE': { type: 'rectangle', x: 100, y: 100, width: 100, height: 50 },
      'STICKY_NOTE': { text: 'New Note', color: '#ffeb3b' },
      'KANBAN_CARD': { title: 'New Task', description: '' },
      'KANBAN_COLUMN': { name: 'New Column', color: '#2196f3' },
      'EVENT': { title: 'New Event', start: new Date(), end: new Date() },
      'CODE': { language: 'javascript', code: '// New code block' }
    }

    return defaults[blockType] || {}
  }

  private async getNextBlockPosition(pageId: string): Promise<number> {
    const lastBlock = await this.prisma.block.findFirst({
      where: { pageId },
      orderBy: { position: 'desc' }
    })

    return (lastBlock?.position || 0) + 1
  }
}

// Factory function
export function createPolymorphicPageEngine(prisma: PrismaClient): PolymorphicPageEngine {
  return new PolymorphicPageEngine(prisma)
}