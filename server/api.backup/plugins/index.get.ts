import { z } from 'zod'
import type { PluginManifest } from '~/types/plugin'

// Mock plugin registry - in production this would come from a database
const mockPlugins: PluginManifest[] = [
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    version: '1.0.0',
    description: 'Create and manage daily journal entries with templates and prompts',
    author: 'Athena Team',
    icon: '📔',
    keywords: ['journal', 'daily', 'notes', 'template'],
    capabilities: {
      documentTypes: ['JOURNAL'],
      commands: [
        {
          id: 'create-daily-entry',
          label: 'Create Daily Journal Entry',
          description: 'Create a new journal entry for today',
          icon: 'i-heroicons-pencil-square',
          context: 'global'
        }
      ]
    },
    runtime: {
      athena: '>=1.0.0',
      nuxt: '>=3.0.0'
    },
    permissions: ['read:documents', 'write:documents']
  },
  {
    id: 'github-tracker',
    name: 'GitHub Issue Tracker',
    version: '1.2.0',
    description: 'Track and manage GitHub issues directly in your workspace',
    author: 'Community',
    icon: '🐙',
    homepage: 'https://github.com/example/athena-github-plugin',
    keywords: ['github', 'issues', 'tracking', 'integration'],
    capabilities: {
      documentTypes: ['GITHUB_ISSUES'],
      commands: [
        {
          id: 'sync-github-issues',
          label: 'Sync GitHub Issues',
          description: 'Sync issues from a GitHub repository',
          icon: 'i-heroicons-arrow-path',
          context: 'global'
        }
      ],
      panels: [
        {
          id: 'github-issues-panel',
          name: 'GitHub Issues',
          position: 'sidebar',
          component: 'GitHubIssuesPanel'
        }
      ]
    },
    runtime: {
      athena: '>=1.0.0',
      nuxt: '>=3.0.0'
    },
    permissions: ['read:documents', 'write:documents', 'network:external']
  },
  {
    id: 'calendar-view',
    name: 'Calendar View',
    version: '2.1.0',
    description: 'Visualize documents with dates in a beautiful calendar interface',
    author: 'Athena Team',
    icon: '📅',
    keywords: ['calendar', 'dates', 'scheduling', 'timeline'],
    capabilities: {
      documentTypes: ['CALENDAR'],
      commands: [
        {
          id: 'open-calendar',
          label: 'Open Calendar View',
          description: 'View documents in calendar format',
          icon: 'i-heroicons-calendar',
          context: 'global'
        }
      ],
      editors: [
        {
          id: 'calendar-editor',
          name: 'Calendar Editor',
          fileTypes: ['calendar', 'schedule'],
          component: 'CalendarEditor'
        }
      ]
    },
    runtime: {
      athena: '>=1.0.0',
      nuxt: '>=3.0.0'
    },
    permissions: ['read:documents', 'read:workspace']
  },
  {
    id: 'dark-theme-pro',
    name: 'Dark Theme Pro',
    version: '1.0.0',
    description: 'Professional dark theme with multiple color variants',
    author: 'Theme Studio',
    icon: '🌙',
    keywords: ['theme', 'dark', 'ui', 'colors'],
    capabilities: {
      themes: [
        {
          id: 'dark-pro',
          name: 'Dark Pro',
          colors: {
            primary: '#3b82f6',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f8fafc'
          }
        }
      ]
    },
    runtime: {
      athena: '>=1.0.0'
    },
    permissions: []
  }
]

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const search = query.search as string
    const category = query.category as string
    
    let filteredPlugins = mockPlugins
    
    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPlugins = filteredPlugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchLower) ||
        plugin.description.toLowerCase().includes(searchLower) ||
        plugin.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    }
    
    // Filter by category
    if (category) {
      filteredPlugins = filteredPlugins.filter(plugin =>
        plugin.keywords.includes(category)
      )
    }
    
    return {
      plugins: filteredPlugins,
      total: filteredPlugins.length,
      categories: ['journal', 'integration', 'theme', 'calendar', 'ai']
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch plugins'
    })
  }
})