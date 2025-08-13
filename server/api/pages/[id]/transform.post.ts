/**
 * POST /api/pages/[id]/transform
 * Transform a page to a different type (polymorphic transformation)
 */

import { PrismaClient } from '@prisma/client'
import { requireUserSession } from '~/utils/auth'

const prisma = new PrismaClient()

const PAGE_TYPE_PROPERTIES = {
  'DOCUMENT': {
    templateName: 'blank',
    allowComments: true,
    wordWrap: true
  },
  'DATABASE': {
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
  'WHITEBOARD': {
    canvas: {
      width: 5000,
      height: 5000,
      backgroundColor: '#ffffff',
      gridSize: 20,
      showGrid: true
    },
    tools: ['pen', 'shapes', 'text', 'sticky-notes', 'connectors']
  },
  'IDE': {
    language: 'javascript',
    theme: 'dark',
    fileExplorer: true,
    terminal: true,
    extensions: ['intellisense', 'git', 'debugger']
  },
  'KANBAN': {
    columns: [
      { id: 'todo', name: 'To Do', color: '#ff6b6b' },
      { id: 'progress', name: 'In Progress', color: '#4ecdc4' },
      { id: 'done', name: 'Done', color: '#95e1d3' }
    ],
    allowDragDrop: true,
    showCardNumbers: true
  },
  'CALENDAR': {
    defaultView: 'month',
    timeFormat: '24h',
    startOfWeek: 'monday',
    showWeekends: true,
    timezone: 'local'
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await requireUserSession(event)
    
    // Get page ID from route params
    const pageId = getRouterParam(event, 'id')
    if (!pageId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Page ID is required'
      })
    }

    // Get request body
    const body = await readBody(event)
    const { targetType, execute } = body

    if (!targetType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'targetType is required'
      })
    }

    // Verify user has access to the page
    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        workspace: {
          userId: session.user.id
        }
      },
      include: { blocks: true }
    })

    if (!page) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found or access denied'
      })
    }

    // If same type, no transformation needed
    if (page.type === targetType) {
      return {
        success: true,
        data: {
          page,
          message: 'Page is already the target type',
          currentType: page.type,
          targetType
        }
      }
    }

    // Create transformation plan
    const plan = {
      from: page.type,
      to: targetType,
      steps: [
        `Change page type from ${page.type} to ${targetType}`,
        `Update page properties for ${targetType} functionality`,
        `Preserve all existing blocks and links`
      ],
      preservedData: {
        blocks: page.blocks.length,
        title: page.title,
        links: 'All existing links will be preserved'
      }
    }

    // If not executing, return the plan
    if (!execute) {
      return {
        success: true,
        mode: 'preview',
        data: {
          plan,
          currentPage: {
            id: page.id,
            title: page.title,
            type: page.type,
            blockCount: page.blocks.length
          },
          targetType,
          note: 'Set execute: true to perform the transformation'
        }
      }
    }

    // Execute the transformation
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        type: targetType,
        properties: PAGE_TYPE_PROPERTIES[targetType] || {},
        icon: getPageIcon(targetType)
      },
      include: { blocks: true }
    })

    return {
      success: true,
      mode: 'executed',
      data: {
        page: updatedPage,
        plan,
        message: `Page successfully transformed from ${plan.from} to ${plan.to}`,
        transformation: {
          preservedBlocks: updatedPage.blocks.length,
          newProperties: Object.keys(updatedPage.properties || {}).length,
          newIcon: updatedPage.icon
        }
      }
    }

  } catch (error) {
    console.error('Error transforming page:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to transform page'
    })
  }
})

function getPageIcon(type: string): string {
  const icons = {
    'DOCUMENT': '📝',
    'DATABASE': '🗄️',
    'WHITEBOARD': '🎨',
    'IDE': '💻',
    'KANBAN': '📋',
    'CALENDAR': '📅'
  }
  return icons[type] || '📄'
}