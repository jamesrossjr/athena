/**
 * AI Natural Language Processing Endpoint
 * Converts natural language queries into structured command sequences
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { query, pageContext, selectionContext, systemContext } = body

    // Validate input
    if (!query || typeof query !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Query is required'
      })
    }

    // Build comprehensive prompt for AI
    const prompt = buildAIPrompt(query, pageContext, selectionContext, systemContext)
    
    // Send to Ollama instance (or fallback to mock for development)
    let aiResponse
    try {
      aiResponse = await $fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: {
          model: 'llama3.1:8b',
          prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1, // Low temperature for consistent parsing
            top_p: 0.9,
            num_predict: 500
          }
        },
        timeout: 10000 // 10 second timeout
      })
    } catch (ollamaError) {
      console.warn('Ollama not available, using fallback parsing:', ollamaError)
      // Fallback to rule-based parsing when Ollama is not available
      aiResponse = { response: generateFallbackResponse(query, pageContext, selectionContext, systemContext) }
    }

    // Parse AI response
    const commands = parseAIResponse(aiResponse.response)
    
    // Validate commands against available commands
    const validatedCommands = validateCommands(commands, systemContext)
    
    return {
      success: true,
      commands: validatedCommands,
      originalQuery: query,
      confidence: calculateConfidence(validatedCommands),
      timestamp: Date.now(),
      usedFallback: !aiResponse.response.includes('llama') // Simple check
    }
  } catch (error) {
    console.error('AI parsing error:', error)
    
    // Return fallback suggestions
    const fallbackCommands = suggestFallbackCommands(body?.query || '')
    
    return {
      success: false,
      error: 'Failed to process AI command',
      fallback: fallbackCommands,
      originalQuery: body?.query || ''
    }
  }
})

function buildAIPrompt(query: string, pageContext: any, selectionContext: any, systemContext: any): string {
  return `You are an intelligent command parser for Athena, a productivity application. Your role is to interpret natural language queries and convert them into precise, executable command sequences.

CURRENT CONTEXT:
- Page: "${pageContext?.pageTitle || 'Unknown'}" (ID: ${pageContext?.pageId || 'none'})
- Page Type: ${pageContext?.pageType || 'unknown'} (document, database, whiteboard, calendar, table)
- Workspace: "${pageContext?.workspaceName || 'Unknown'}" (ID: ${pageContext?.workspaceId || 'none'})
- Current Route: ${pageContext?.currentRoute || '/'}
- Last Modified: ${pageContext?.lastModified || 'unknown'}
- Block Count: ${pageContext?.blockCount || 0}

SELECTION CONTEXT:
- Has Selection: ${selectionContext?.hasSelection ? 'Yes' : 'No'}
- Selected Text: "${selectionContext?.selectedText || 'none'}"
- Selection Length: ${selectionContext?.selectionLength || 0} characters
- Selection Type: ${selectionContext?.selectionType || 'none'}
- Cursor Position: ${selectionContext?.cursorPosition || 'none'}

AVAILABLE COMMANDS:
${systemContext?.availableCommands || '[]'}

RECENT USAGE PATTERNS:
${systemContext?.recentCommands || '[]'}

CUSTOM WORKFLOWS:
${systemContext?.customWorkflows || '[]'}

USER PREFERENCES:
${systemContext?.userPreferences || '{}'}

USER QUERY: "${query}"

ADVANCED PARSING RULES:
1. Context Awareness: Prioritize commands that make sense for the current page type
2. Selection Intelligence: If text is selected, prioritize formatting/editing commands
3. Workspace Scope: Consider workspace-level vs page-level operations
4. Command Chaining: Break complex requests into logical command sequences
5. Argument Inference: Infer arguments from context when not explicitly stated
6. Confidence Scoring: Be conservative - lower confidence for ambiguous requests

RESPONSE FORMAT (JSON only, no additional text):
{
  "commands": [
    {
      "commandId": "exact-command-id-from-available-list",
      "description": "Clear description of what this step will do",
      "args": ["argument1", "argument2"],
      "confidence": 0.95,
      "reasoning": "Why this command was chosen given the context",
      "dependencies": ["previous-command-id"] // if this depends on prior commands
    }
  ],
  "overallConfidence": 0.90,
  "interpretation": "Brief summary of what the user wants to accomplish",
  "contextUsed": ["pageType", "selection", "workspace"], // which context factors influenced the decision
  "alternatives": [
    {
      "commandId": "alternative-command-id",
      "description": "Alternative interpretation",
      "confidence": 0.75
    }
  ]
}

EXAMPLES:

Query: "rename this page to Final Report"
Response: {
  "commands": [
    {
      "commandId": "rename-page",
      "description": "Rename current page to 'Final Report'",
      "args": ["Final Report"],
      "confidence": 0.98,
      "reasoning": "User explicitly wants to rename the current page"
    }
  ],
  "overallConfidence": 0.98,
  "interpretation": "User wants to rename the current page"
}

Query: "make this bold and add a heading"
Response: {
  "commands": [
    {
      "commandId": "bold",
      "description": "Make selected text bold",
      "args": [],
      "confidence": 0.95,
      "reasoning": "User has text selected and wants bold formatting"
    },
    {
      "commandId": "heading",
      "description": "Add a heading block",
      "args": [],
      "confidence": 0.90,
      "reasoning": "User wants to add a heading element"
    }
  ],
  "overallConfidence": 0.92,
  "interpretation": "User wants to format selected text and add a heading"
}

Query: "create a new workspace for my project"
Response: {
  "commands": [
    {
      "commandId": "new-workspace",
      "description": "Create a new workspace",
      "args": [],
      "confidence": 0.95,
      "reasoning": "User explicitly wants to create a new workspace"
    }
  ],
  "overallConfidence": 0.95,
  "interpretation": "User wants to create a new workspace for their project"
}

Now process the user query and return ONLY the JSON response (no additional text):`
}

function generateFallbackResponse(query: string, pageContext: any, selectionContext: any, systemContext: any): string {
  // Rule-based fallback parsing
  const lowerQuery = query.toLowerCase()
  const commands = []
  
  // Parse available commands
  let availableCommands = []
  try {
    availableCommands = JSON.parse(systemContext?.availableCommands || '[]')
  } catch (e) {
    console.error('Failed to parse available commands')
  }
  
  // Simple keyword matching
  if (lowerQuery.includes('rename') && lowerQuery.includes('page')) {
    // Extract potential new name
    const nameMatch = query.match(/(?:rename.*(?:to|as)\s+)["']?([^"']+)["']?/i)
    const newName = nameMatch ? nameMatch[1].trim() : ''
    
    commands.push({
      commandId: 'rename-page',
      description: `Rename current page${newName ? ` to '${newName}'` : ''}`,
      args: newName ? [newName] : [],
      confidence: 0.85,
      reasoning: 'Detected rename page intent'
    })
  }
  
  if (lowerQuery.includes('new') && (lowerQuery.includes('page') || lowerQuery.includes('document'))) {
    commands.push({
      commandId: 'new-page',
      description: 'Create a new page',
      args: [],
      confidence: 0.90,
      reasoning: 'Detected new page creation intent'
    })
  }
  
  if (lowerQuery.includes('new') && lowerQuery.includes('workspace')) {
    commands.push({
      commandId: 'new-workspace',
      description: 'Create a new workspace',
      args: [],
      confidence: 0.90,
      reasoning: 'Detected new workspace creation intent'
    })
  }
  
  if (lowerQuery.includes('bold') && selectionContext?.hasSelection) {
    commands.push({
      commandId: 'bold',
      description: 'Make selected text bold',
      args: [],
      confidence: 0.95,
      reasoning: 'User has text selected and mentioned bold'
    })
  }
  
  if (lowerQuery.includes('italic') && selectionContext?.hasSelection) {
    commands.push({
      commandId: 'italic',
      description: 'Make selected text italic',
      args: [],
      confidence: 0.95,
      reasoning: 'User has text selected and mentioned italic'
    })
  }
  
  if (lowerQuery.includes('heading') || lowerQuery.includes('title')) {
    commands.push({
      commandId: 'heading',
      description: 'Add a heading block',
      args: [],
      confidence: 0.85,
      reasoning: 'Detected heading creation intent'
    })
  }
  
  if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
    commands.push({
      commandId: 'search-documents',
      description: 'Search through documents',
      args: [],
      confidence: 0.80,
      reasoning: 'Detected search intent'
    })
  }
  
  const overallConfidence = commands.length > 0 
    ? commands.reduce((sum, cmd) => sum + cmd.confidence, 0) / commands.length 
    : 0
  
  return JSON.stringify({
    commands,
    overallConfidence,
    interpretation: `Fallback parsing interpreted: ${commands.map(c => c.description).join(', ') || 'No clear intent detected'}`
  })
}

function parseAIResponse(response: string): any[] {
  try {
    // Clean response - sometimes AI returns text before/after JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : response
    
    const parsed = JSON.parse(jsonStr)
    return parsed.commands || []
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    console.log('Raw response:', response)
    return []
  }
}

function validateCommands(commands: any[], systemContext: any): any[] {
  if (!commands || !Array.isArray(commands)) return []
  
  let availableCommands = []
  try {
    availableCommands = JSON.parse(systemContext?.availableCommands || '[]')
  } catch (e) {
    console.error('Failed to parse available commands for validation')
    return commands // Return as-is if we can't validate
  }
  
  const availableIds = new Set(availableCommands.map((cmd: any) => cmd.id))
  
  return commands.filter(command => {
    if (!command.commandId || !availableIds.has(command.commandId)) {
      console.warn(`Invalid command ID: ${command.commandId}`)
      return false
    }
    return true
  })
}

function calculateConfidence(commands: any[]): number {
  if (!commands || commands.length === 0) return 0
  
  const totalConfidence = commands.reduce((sum, cmd) => sum + (cmd.confidence || 0), 0)
  return totalConfidence / commands.length
}

function suggestFallbackCommands(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const suggestions = []
  
  if (lowerQuery.includes('page') || lowerQuery.includes('document')) {
    suggestions.push('new-page')
  }
  if (lowerQuery.includes('workspace') || lowerQuery.includes('folder')) {
    suggestions.push('new-workspace')
  }
  if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
    suggestions.push('search-documents')
  }
  if (lowerQuery.includes('bold') || lowerQuery.includes('format')) {
    suggestions.push('bold')
  }
  if (lowerQuery.includes('ai') || lowerQuery.includes('assistant')) {
    suggestions.push('ai-assistant')
  }
  
  return suggestions
}