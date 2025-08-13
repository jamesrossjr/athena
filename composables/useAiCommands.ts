/**
 * AI Command Processing Composable
 * Handles natural language command parsing and execution with confirmation flow
 */

export interface AICommand {
  commandId: string
  description: string
  args: string[]
  confidence: number
  reasoning: string
  dependencies?: string[]
}

export interface AICommandSequence {
  commands: AICommand[]
  overallConfidence: number
  interpretation: string
  contextUsed: string[]
  alternatives?: Array<{
    commandId: string
    description: string
    confidence: number
  }>
}

export const useAiCommands = () => {
  const isAIProcessing = ref(false)
  const aiCommandSequence = ref<AICommandSequence | null>(null)
  const showConfirmation = ref(false)
  const processingError = ref<string | null>(null)

  /**
   * Process natural language query and get command sequence
   */
  const processNaturalLanguage = async (
    userQuery: string,
    context: {
      pageId?: string
      pageTitle?: string
      pageType?: string
      workspaceId?: string
      selectedText?: string
      availableCommands?: any[]
    }
  ) => {
    if (isAIProcessing.value) return

    try {
      isAIProcessing.value = true
      processingError.value = null

      // Build context payload for AI
      const contextPayload = {
        query: userQuery,
        pageContext: {
          pageId: context.pageId,
          pageTitle: context.pageTitle || 'Untitled',
          pageType: context.pageType || 'document',
          workspaceId: context.workspaceId,
          currentRoute: useRoute().path,
          lastModified: new Date().toISOString(),
          blockCount: 0 // Could be enhanced to get actual block count
        },
        selectionContext: {
          hasSelection: !!context.selectedText,
          selectedText: context.selectedText || '',
          selectionLength: context.selectedText?.length || 0,
          selectionType: context.selectedText ? 'text' : 'none',
          cursorPosition: 'end'
        },
        systemContext: {
          availableCommands: JSON.stringify(context.availableCommands || []),
          recentCommands: JSON.stringify([]), // Could be enhanced
          customWorkflows: JSON.stringify([]),
          userPreferences: JSON.stringify({})
        }
      }

      // Call AI parsing endpoint
      const response = await $fetch('/api/ai/parse', {
        method: 'POST',
        body: contextPayload
      })

      if (response.success && response.commands) {
        // Transform response to our expected format
        aiCommandSequence.value = {
          commands: response.commands.map((cmd: any) => ({
            commandId: cmd.commandId,
            description: cmd.description,
            args: cmd.args || [],
            confidence: cmd.confidence || 0.8,
            reasoning: cmd.reasoning || 'AI selected this command',
            dependencies: cmd.dependencies
          })),
          overallConfidence: response.confidence || 0.8,
          interpretation: response.interpretation || `Process: ${userQuery}`,
          contextUsed: ['pageType', 'selection', 'workspace']
        }

        showConfirmation.value = true
        return aiCommandSequence.value
      } else {
        throw new Error('Invalid response from AI service')
      }
    } catch (error: any) {
      console.error('AI processing error:', error)
      processingError.value = error.message || 'Failed to process command'
      
      // Try fallback processing
      const fallback = generateSimpleFallback(userQuery, context)
      if (fallback) {
        aiCommandSequence.value = fallback
        showConfirmation.value = true
        return fallback
      }
      
      throw error
    } finally {
      isAIProcessing.value = false
    }
  }

  /**
   * Execute the confirmed AI command sequence
   */
  const executeAICommands = async (availableCommands: any[]) => {
    if (!aiCommandSequence.value) return

    try {
      const commandMap = new Map(availableCommands.map(cmd => [cmd.id, cmd]))
      
      for (const aiCommand of aiCommandSequence.value.commands) {
        const executableCommand = commandMap.get(aiCommand.commandId)
        
        if (executableCommand) {
          console.log(`Executing: ${aiCommand.description}`)
          
          // Execute the command with any provided arguments
          if (aiCommand.args.length > 0) {
            await executableCommand.action(...aiCommand.args)
          } else {
            await executableCommand.action()
          }
          
          // Small delay between commands for better UX
          await new Promise(resolve => setTimeout(resolve, 200))
        } else {
          console.warn(`Command not found: ${aiCommand.commandId}`)
        }
      }
      
      // Clear state after successful execution
      clearAIState()
      
    } catch (error) {
      console.error('Error executing AI commands:', error)
      processingError.value = 'Failed to execute commands'
      throw error
    }
  }

  /**
   * Generate a simple fallback response for common patterns
   */
  const generateSimpleFallback = (
    query: string, 
    context: any
  ): AICommandSequence | null => {
    const lowerQuery = query.toLowerCase()
    const commands: AICommand[] = []

    // Common patterns
    if (lowerQuery.includes('bold') && context.selectedText) {
      commands.push({
        commandId: 'bold',
        description: 'Make selected text bold',
        args: [],
        confidence: 0.9,
        reasoning: 'User has text selected and mentioned bold'
      })
    }

    if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
      commands.push({
        commandId: 'ai-summarize',
        description: context.selectedText ? 'Summarize selected text' : 'Summarize page content',
        args: context.selectedText ? ['selection'] : ['page'],
        confidence: 0.85,
        reasoning: 'User wants to summarize content'
      })
    }

    if (lowerQuery.includes('new') && lowerQuery.includes('page')) {
      const titleMatch = query.match(/page.*["']([^"']+)["']|["']([^"']+)["'].*page/)
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : ''
      
      commands.push({
        commandId: 'new-page',
        description: title ? `Create new page "${title}"` : 'Create new page',
        args: title ? [title] : [],
        confidence: 0.8,
        reasoning: 'User wants to create a new page'
      })
    }

    if (commands.length === 0) return null

    return {
      commands,
      overallConfidence: commands.reduce((sum, cmd) => sum + cmd.confidence, 0) / commands.length,
      interpretation: `Fallback interpretation: ${commands.map(c => c.description).join(', ')}`,
      contextUsed: ['fallback']
    }
  }

  /**
   * Clear AI state
   */
  const clearAIState = () => {
    aiCommandSequence.value = null
    showConfirmation.value = false
    processingError.value = null
    isAIProcessing.value = false
  }

  /**
   * Get confirmation message for display
   */
  const getConfirmationMessage = computed(() => {
    if (!aiCommandSequence.value) return ''
    
    const sequence = aiCommandSequence.value
    const commandCount = sequence.commands.length
    
    if (commandCount === 1) {
      return `I will ${sequence.commands[0].description.toLowerCase()}. Confirm to proceed?`
    } else {
      return `I will perform ${commandCount} actions: ${sequence.commands.map(c => c.description.toLowerCase()).join(', ')}. Confirm to proceed?`
    }
  })

  /**
   * Check if a query looks like natural language vs a search term
   */
  const isNaturalLanguageQuery = (query: string): boolean => {
    const naturalLanguageIndicators = [
      /^(make|create|add|remove|delete|find|search|open|close|save|export|import)/i,
      /\s(this|that|the|my|our|all|some)\s/i,
      /(please|can you|could you|would you|help me)/i,
      /\s(and|or|then|after|before|while)\s/i,
      /(summarize|explain|analyze|format|organize)/i
    ]
    
    return naturalLanguageIndicators.some(pattern => pattern.test(query)) || 
           query.split(' ').length > 2
  }

  return {
    // State
    isAIProcessing: readonly(isAIProcessing),
    aiCommandSequence: readonly(aiCommandSequence),
    showConfirmation: readonly(showConfirmation),
    processingError: readonly(processingError),
    
    // Computed
    getConfirmationMessage,
    
    // Methods
    processNaturalLanguage,
    executeAICommands,
    clearAIState,
    isNaturalLanguageQuery
  }
}