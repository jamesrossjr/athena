/**
 * GET /api/pages/types
 * Get available page types and transformation information
 */

import { requireUserSession } from '~/utils/auth'

const PAGE_TYPES = {
  'DOCUMENT': {
    type: 'DOCUMENT',
    name: 'Document',
    icon: '📝',
    description: 'Rich text document with blocks, headings, and media',
    defaultProperties: {
      templateName: 'blank',
      allowComments: true,
      wordWrap: true
    }
  },
  'DATABASE': {
    type: 'DATABASE',
    name: 'Database',
    icon: '🗄️',
    description: 'Structured data with schema, views, and queries',
    defaultProperties: {
      schema: {
        columns: [
          { id: 'title', name: 'Title', type: 'text', required: true }
        ]
      }
    }
  },
  'WHITEBOARD': {
    type: 'WHITEBOARD',
    name: 'Whiteboard',
    icon: '🎨',
    description: 'Visual canvas for diagrams, sketches, and spatial thinking',
    defaultProperties: {
      canvas: {
        width: 5000,
        height: 5000,
        backgroundColor: '#ffffff'
      }
    }
  },
  'IDE': {
    type: 'IDE',
    name: 'IDE',
    icon: '💻',
    description: 'Integrated development environment for code and projects',
    defaultProperties: {
      language: 'javascript',
      theme: 'dark'
    }
  },
  'KANBAN': {
    type: 'KANBAN',
    name: 'Kanban Board',
    icon: '📋',
    description: 'Task management with columns and cards',
    defaultProperties: {
      columns: [
        { id: 'todo', name: 'To Do', color: '#ff6b6b' },
        { id: 'progress', name: 'In Progress', color: '#4ecdc4' },
        { id: 'done', name: 'Done', color: '#95e1d3' }
      ]
    }
  },
  'CALENDAR': {
    type: 'CALENDAR',
    name: 'Calendar',
    icon: '📅',
    description: 'Time-based organization with events and scheduling',
    defaultProperties: {
      defaultView: 'month',
      timeFormat: '24h'
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    await requireUserSession(event)
    
    return {
      success: true,
      data: {
        types: PAGE_TYPES
      }
    }

  } catch (error) {
    console.error('Error getting page types:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get page types'
    })
  }
})