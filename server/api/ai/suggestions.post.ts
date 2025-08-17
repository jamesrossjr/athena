export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { context, type = 'general' } = body

    // Check if OpenAI API key is configured
    const config = useRuntimeConfig()
    const apiKey = config.openaiApiKey
    
    if (apiKey && apiKey !== 'your-api-key-here') {
      try {
        const systemPrompt = getSuggestionsPrompt(type)
        
        const response = await $fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: context || 'Generate helpful suggestions for improving productivity in a collaborative workspace.'
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          }
        })
        
        const suggestions = parseAISuggestions(response.choices[0]?.message?.content || '')
        
        return {
          success: true,
          suggestions,
          provider: 'openai',
          type
        }
      } catch (openaiError) {
        console.warn('OpenAI API error, falling back to local suggestions:', openaiError)
      }
    }

    // Fallback to local suggestions
    const localSuggestions = generateLocalSuggestions(context, type)
    
    return {
      success: true,
      suggestions: localSuggestions,
      provider: 'local',
      type
    }
  } catch (error) {
    console.error('Suggestions error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate suggestions'
    })
  }
})

function getSuggestionsPrompt(type: string): string {
  switch (type) {
    case 'document':
      return 'Provide 3-5 helpful suggestions for improving document organization, content structure, or collaboration workflows.'
    case 'workspace':
      return 'Provide 3-5 suggestions for optimizing workspace organization, team collaboration, and productivity.'
    case 'content':
      return 'Provide 3-5 suggestions for improving content quality, readability, and engagement.'
    case 'productivity':
      return 'Provide 3-5 actionable suggestions for improving productivity and workflow efficiency.'
    default:
      return 'Provide 3-5 helpful suggestions for improving collaboration and productivity in a digital workspace.'
  }
}

function parseAISuggestions(aiResponse: string): Array<{ title: string; description: string; action?: string }> {
  // Simple parsing of AI response into structured suggestions
  const lines = aiResponse.split('\n').filter(line => line.trim())
  const suggestions = []
  
  for (const line of lines) {
    if (line.match(/^\d+\.|^[-*]/)) {
      const cleanLine = line.replace(/^\d+\.|^[-*]\s*/, '').trim()
      if (cleanLine.length > 10) {
        const [title, ...descParts] = cleanLine.split(':')
        suggestions.push({
          title: title.trim(),
          description: descParts.join(':').trim() || title.trim()
        })
      }
    }
  }
  
  return suggestions.slice(0, 5)
}

function generateLocalSuggestions(context: string, type: string): Array<{ title: string; description: string; action?: string }> {
  const baseSuggestions = {
    document: [
      {
        title: 'Add Table of Contents',
        description: 'Create a table of contents to help readers navigate long documents more easily.',
        action: 'add-toc'
      },
      {
        title: 'Use Headings Consistently',
        description: 'Structure your document with clear headings to improve readability and organization.',
        action: 'format-headings'
      },
      {
        title: 'Add Collaborative Comments',
        description: 'Enable comments on sections that need team input or review.',
        action: 'enable-comments'
      },
      {
        title: 'Create Templates',
        description: 'Save this document structure as a template for future use.',
        action: 'save-template'
      }
    ],
    workspace: [
      {
        title: 'Organize by Projects',
        description: 'Group related documents into project folders for better organization.',
        action: 'create-folders'
      },
      {
        title: 'Set Up Team Permissions',
        description: 'Configure access levels to ensure the right people can edit sensitive documents.',
        action: 'manage-permissions'
      },
      {
        title: 'Create Shared Templates',
        description: 'Build a library of templates for common document types your team uses.',
        action: 'create-templates'
      },
      {
        title: 'Enable Real-time Notifications',
        description: 'Stay updated on document changes and team collaboration activities.',
        action: 'setup-notifications'
      }
    ],
    content: [
      {
        title: 'Add Visual Elements',
        description: 'Include images, charts, or diagrams to make your content more engaging.',
        action: 'add-media'
      },
      {
        title: 'Break Up Long Paragraphs',
        description: 'Use shorter paragraphs and bullet points for better readability.',
        action: 'format-text'
      },
      {
        title: 'Include Action Items',
        description: 'Add clear next steps or action items at the end of your content.',
        action: 'add-tasks'
      },
      {
        title: 'Cross-reference Related Content',
        description: 'Link to related documents to create a knowledge network.',
        action: 'add-links'
      }
    ],
    productivity: [
      {
        title: 'Use Keyboard Shortcuts',
        description: 'Learn Athena\'s keyboard shortcuts to speed up your workflow.',
        action: 'show-shortcuts'
      },
      {
        title: 'Set Up Daily Templates',
        description: 'Create templates for recurring meetings or daily standups.',
        action: 'create-daily-template'
      },
      {
        title: 'Enable Auto-save',
        description: 'Ensure your work is automatically saved to prevent data loss.',
        action: 'enable-autosave'
      },
      {
        title: 'Use Command Palette',
        description: 'Access any feature quickly with Ctrl+K or Cmd+K.',
        action: 'open-command-palette'
      }
    ]
  }
  
  const suggestions = baseSuggestions[type as keyof typeof baseSuggestions] || baseSuggestions.general || []
  
  // Add context-specific suggestions if context is provided
  if (context) {
    const contextLower = context.toLowerCase()
    if (contextLower.includes('meeting')) {
      suggestions.unshift({
        title: 'Create Meeting Template',
        description: 'Set up a standard template for meeting notes with agenda and action items.',
        action: 'create-meeting-template'
      })
    }
    if (contextLower.includes('project')) {
      suggestions.unshift({
        title: 'Set Up Project Dashboard',
        description: 'Create a central dashboard to track project progress and documents.',
        action: 'create-project-dashboard'
      })
    }
  }
  
  return suggestions.slice(0, 5)
}