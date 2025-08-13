import { ref, computed, watch, nextTick } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'

interface GlobalAiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context: {
    source: 'chat' | 'page' | 'document'
    documentId?: string
    documentTitle?: string
    blockIndex?: number
    aiContext?: string
  }
  metadata?: {
    model?: string
    sources?: string[]
    executedActions?: string[]
  }
}

interface DocumentContext {
  id: string
  title: string
  content: any[]
  activeBlockIndex?: number
  selectedText?: string
}

/**
 * Global AI System - The Lifeblood of the Application
 * 
 * This composable creates a unified AI experience that seamlessly integrates
 * chat interactions with page content. The AI can:
 * - Read and understand the current document
 * - Modify page content based on chat conversations
 * - Maintain context across chat and page interactions
 * - Execute actions like creating new blocks, editing text, etc.
 */
export const useGlobalAi = () => {
  const workspaceStore = useWorkspaceStore()

  // Global AI state
  const globalMessages = ref<GlobalAiMessage[]>([])
  const isAiThinking = ref(false)
  const currentContext = ref<DocumentContext | null>(null)
  const aiKnowsAbout = ref<string[]>([]) // What the AI knows about
  
  // Chat visibility and state
  const isChatVisible = ref(false)
  const chatInput = ref('')
  const lastAiAction = ref<string | null>(null)

  // Computed properties
  const activeDocument = computed(() => workspaceStore.activeDocument)
  const currentDocumentContext = computed(() => {
    if (!activeDocument.value) return null
    
    return {
      id: activeDocument.value.id,
      title: activeDocument.value.title,
      content: activeDocument.value.content || [],
      activeBlockIndex: 0, // Will be updated by page interactions
      selectedText: '' // Will be updated by page interactions
    }
  })

  const contextualPrompt = computed(() => {
    const doc = currentDocumentContext.value
    if (!doc) return ''

    return `
CURRENT CONTEXT:
Document: "${doc.title}"
Content Summary: ${doc.content.length} blocks
${doc.selectedText ? `Selected Text: "${doc.selectedText}"` : ''}

CAPABILITIES:
- I can read and modify the current document
- I can create new blocks, edit text, add headings, lists, etc.
- I can help with writing, research, brainstorming
- I can execute actions on the page based on our conversation

Recent context: ${aiKnowsAbout.value.slice(-5).join(', ')}
`
  })

  // Update context when active document changes
  watch(activeDocument, (newDoc) => {
    if (newDoc) {
      currentContext.value = currentDocumentContext.value
      addSystemMessage(`Now working on document: "${newDoc.title}"`)
      aiKnowsAbout.value.push(`document:${newDoc.title}`)
    }
  })

  /**
   * Add a system message to track AI context
   */
  const addSystemMessage = (content: string) => {
    const message: GlobalAiMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
      context: {
        source: 'document',
        documentId: currentContext.value?.id,
        documentTitle: currentContext.value?.title
      }
    }
    globalMessages.value.push(message)
  }

  /**
   * Send a message to the global AI system
   */
  const sendGlobalMessage = async (
    content: string, 
    source: 'chat' | 'page' | 'document' = 'chat',
    additionalContext: any = {}
  ) => {
    const userMessage: GlobalAiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      context: {
        source,
        documentId: currentContext.value?.id,
        documentTitle: currentContext.value?.title,
        ...additionalContext
      }
    }

    globalMessages.value.push(userMessage)
    isAiThinking.value = true

    try {
      // Build rich context for AI
      const fullContext = {
        ...additionalContext,
        documentContext: currentContext.value,
        conversationHistory: globalMessages.value.slice(-10), // Last 10 messages
        contextualPrompt: contextualPrompt.value,
        aiKnowledge: aiKnowsAbout.value
      }

      console.log('🧠 Global AI: Sending message with full context:', { content, fullContext })

      // Use direct API call for global AI
      const response = await $fetch('/api/ai/chat', {
        method: 'POST',
        body: {
          message: content,
          context: fullContext,
          source: source === 'chat' ? 'chat' : 'page',
          requestType: 'unified_ai_service'
        }
      })

      if (response.success && response.content) {
        const assistantMessage: GlobalAiMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          context: {
            source,
            documentId: currentContext.value?.id,
            documentTitle: currentContext.value?.title,
            ...additionalContext
          },
          metadata: {
            model: response.model,
            sources: response.sources
          }
        }

        globalMessages.value.push(assistantMessage)
        
        // Process AI response for actions
        await processAiActions(response.content, source)
        
        return response
      } else {
        throw new Error(response.error || 'AI request failed')
      }

    } catch (error) {
      console.error('❌ Global AI error:', error)
      
      const errorMessage: GlobalAiMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        context: { source }
      }
      
      globalMessages.value.push(errorMessage)
      throw error
      
    } finally {
      isAiThinking.value = false
    }
  }

  /**
   * Process AI responses for executable actions
   */
  const processAiActions = async (aiResponse: string, source: string) => {
    // Look for action patterns in AI response
    const actionPatterns = [
      { pattern: /\[CREATE_BLOCK\](.*?)\[\/CREATE_BLOCK\]/g, action: 'createBlock' },
      { pattern: /\[EDIT_BLOCK:(\d+)\](.*?)\[\/EDIT_BLOCK\]/g, action: 'editBlock' },
      { pattern: /\[INSERT_TEXT\](.*?)\[\/INSERT_TEXT\]/g, action: 'insertText' },
      { pattern: /\[ADD_HEADING\](.*?)\[\/ADD_HEADING\]/g, action: 'addHeading' }
    ]

    for (const { pattern, action } of actionPatterns) {
      const matches = aiResponse.matchAll(pattern)
      for (const match of matches) {
        await executeAiAction(action, match, source)
      }
    }
  }

  /**
   * Execute AI actions on the page
   */
  const executeAiAction = async (action: string, match: RegExpMatchArray, source: string) => {
    console.log('🎯 Executing AI action:', action, match)
    
    switch (action) {
      case 'createBlock':
        await createBlockFromAi(match[1])
        break
      case 'editBlock':
        await editBlockFromAi(parseInt(match[1]), match[2])
        break
      case 'insertText':
        await insertTextFromAi(match[1])
        break
      case 'addHeading':
        await addHeadingFromAi(match[1])
        break
    }
    
    lastAiAction.value = `${action}:${match[1]?.substring(0, 50)}`
  }

  /**
   * AI Actions - These interact with the page
   */
  const createBlockFromAi = async (content: string) => {
    // Emit event to page editor to create block
    const event = new CustomEvent('ai-create-block', {
      detail: { content, source: 'ai' },
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  const editBlockFromAi = async (blockIndex: number, content: string) => {
    const event = new CustomEvent('ai-edit-block', {
      detail: { blockIndex, content, source: 'ai' },
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  const insertTextFromAi = async (text: string) => {
    const event = new CustomEvent('ai-insert-text', {
      detail: { text, source: 'ai' },
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  const addHeadingFromAi = async (text: string) => {
    const event = new CustomEvent('ai-add-heading', {
      detail: { text, source: 'ai' },
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  /**
   * Update AI context when page changes
   */
  const updatePageContext = (data: {
    activeBlockIndex?: number
    selectedText?: string
    blockContent?: any[]
  }) => {
    if (currentContext.value) {
      currentContext.value = {
        ...currentContext.value,
        ...data
      }
    }
  }

  /**
   * Ask AI about the current document
   */
  const askAboutDocument = async (question: string) => {
    const contextualQuestion = `About the current document "${currentContext.value?.title}": ${question}`
    return await sendGlobalMessage(contextualQuestion, 'document')
  }

  /**
   * Get AI suggestions for current context
   */
  const getContextualSuggestions = () => {
    const doc = currentContext.value
    if (!doc) return []

    const suggestions = [
      `Summarize the content of "${doc.title}"`,
      'Help me improve this document',
      'Add a new section to this document',
      'Review and edit the current content',
      'Generate ideas related to this topic'
    ]

    return suggestions
  }

  /**
   * Toggle chat visibility
   */
  const toggleChat = () => {
    isChatVisible.value = !isChatVisible.value
    if (isChatVisible.value) {
      nextTick(() => {
        // Focus chat input when opened
        const chatInputEl = document.querySelector('.global-ai-chat-input')
        if (chatInputEl) (chatInputEl as HTMLElement).focus()
      })
    }
  }

  /**
   * Send chat message
   */
  const sendChatMessage = async () => {
    const message = chatInput.value.trim()
    if (!message || isAiThinking.value) return

    chatInput.value = ''
    await sendGlobalMessage(message, 'chat')
  }

  /**
   * Clear conversation
   */
  const clearConversation = () => {
    globalMessages.value = []
    aiKnowsAbout.value = []
  }

  /**
   * Get conversation for current document
   */
  const getDocumentConversation = computed(() => {
    return globalMessages.value.filter(msg => 
      msg.context.documentId === currentContext.value?.id
    )
  })

  return {
    // State
    globalMessages: readonly(globalMessages),
    isAiThinking: readonly(isAiThinking),
    currentContext: readonly(currentContext),
    isChatVisible,
    chatInput,
    lastAiAction: readonly(lastAiAction),

    // Computed
    activeDocument,
    currentDocumentContext,
    getDocumentConversation,

    // Core functions
    sendGlobalMessage,
    askAboutDocument,
    updatePageContext,
    
    // Chat functions
    toggleChat,
    sendChatMessage,
    clearConversation,

    // Utility functions
    getContextualSuggestions,
    
    // Status
    get isConnected() {
      return true // Always connected for global AI
    },
    get currentModel() {
      return 'Global AI'
    }
  }
}

// Global singleton instance
let globalAiInstance: ReturnType<typeof useGlobalAi> | null = null

export const getGlobalAi = () => {
  if (!globalAiInstance) {
    globalAiInstance = useGlobalAi()
  }
  return globalAiInstance
}