import { defineStore } from 'pinia'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sources?: string[]
  type?: 'text' | 'voice' | 'command'
}

interface VoiceConfig {
  isListening: boolean
  isSpeaking: boolean
  isEnabled: boolean
  language: string
  voice: string
}

interface ProactiveTask {
  id: string
  type: 'file_change' | 'calendar' | 'git' | 'system'
  description: string
  action?: () => void
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

export const useAiAgentStore = defineStore('aiAgent', {
  state: () => ({
    // Core AI State
    isConnected: false,
    isThinking: false,
    lastError: null as string | null,
    
    // Conversation State
    messages: [] as Message[],
    currentContext: '',
    
    // Voice Interface
    voice: {
      isListening: false,
      isSpeaking: false,
      isEnabled: false,
      language: 'en-US',
      voice: 'default'
    } as VoiceConfig,
    
    // Personality & Behavior
    personality: {
      name: 'Jarvis',
      style: 'professional',
      proactiveness: 'medium',
      verbosity: 'concise'
    },
    
    // AI Model Configuration
    modelConfig: {
      currentModel: 'llama3:8b',
      availableModels: [] as any[],
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      systemPromptTemplate: 'default'
    },
    
    // Proactive Engine
    proactiveTasks: [] as ProactiveTask[],
    monitoringEnabled: false,
    
    // Memory System
    memoryContext: new Map<string, any>(),
    recentActions: [] as string[],
    
    // Developer Tools State
    currentProject: null as any,
    availableTools: [] as string[],
    commandHistory: [] as string[]
  }),
  
  getters: {
    canListen: (state) => state.voice.isEnabled && !state.voice.isSpeaking,
    hasActiveConversation: (state) => state.messages.length > 0,
    lastUserMessage: (state) => {
      const userMessages = state.messages.filter(m => m.role === 'user')
      return userMessages[userMessages.length - 1]
    },
    pendingTasks: (state) => state.proactiveTasks.filter(t => !t.action)
  },
  
  actions: {
    // Core AI Actions
    async initialize() {
      try {
        await this.loadConfiguration() // Load saved settings first
        this.isConnected = await this.connectToOllama()
        if (this.isConnected) {
          await this.initializeVoice()
          this.startProactiveMonitoring()
        }
      } catch (error) {
        console.error('Failed to initialize AI agent:', error)
        this.lastError = error.message
      }
    },
    
    async connectToOllama() {
      // Check connection through our API
      try {
        const response = await $fetch('/api/ai/status')
        if (response.connected && response.models) {
          this.modelConfig.availableModels = response.models
          // Set current model if not already set or if it doesn't exist
          if (!this.modelConfig.currentModel || 
              !response.models.find((m: any) => m.name === this.modelConfig.currentModel)) {
            this.modelConfig.currentModel = response.recommended_model || response.models[0]?.name
          }
        }
        return response.connected
      } catch (error) {
        return false
      }
    },

    async loadAvailableModels() {
      try {
        const response = await $fetch('/api/ai/status')
        if (response.success !== false) {
          this.modelConfig.availableModels = response.models || []
          return response.models || []
        }
        return []
      } catch (error) {
        console.error('Failed to load models:', error)
        return []
      }
    },

    async changeModel(modelName: string) {
      try {
        this.modelConfig.currentModel = modelName
        this.saveConfiguration()
        
        // Test the new model with a simple query
        const testResponse = await this.processWithOllama("Hello, can you confirm you're working with the new model?")
        
        return {
          success: true,
          message: `Successfully switched to ${modelName}`,
          response: testResponse.content
        }
      } catch (error) {
        console.error('Failed to change model:', error)
        return {
          success: false,
          message: `Failed to switch to ${modelName}: ${error.message}`
        }
      }
    },
    
    async sendMessage(content: string, type: 'text' | 'voice' | 'command' = 'text') {
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        type
      }
      
      this.messages.push(userMessage)
      this.isThinking = true
      
      try {
        const response = await this.processWithOllama(content)
        
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          sources: response.sources,
          type: 'text'
        }
        
        this.messages.push(assistantMessage)
        
        // Store conversation in memory
        await this.storeConversationMemory(content, response.content)
        
        // If voice is enabled and this was a voice message, speak the response
        if (this.voice.isEnabled && type === 'voice') {
          await this.speakText(response.content)
        }
        
      } catch (error) {
        console.error('Failed to process message:', error)
        this.lastError = error.message
      } finally {
        this.isThinking = false
      }
    },
    
    async processWithOllama(content: string) {
      // Build context from recent messages, memory, and workspace
      const context = this.buildContext()
      
      // Get relevant memory context
      const memoryContext = await this.getRelevantMemoryContext(content)
      
      try {
        const response = await $fetch('/api/ai/chat', {
          method: 'POST',
          body: {
            message: content,
            context: {
              ...JSON.parse(context),
              memoryContext
            },
            personality: this.personality,
            modelConfig: this.modelConfig
          }
        })

        if (response.success) {
          return {
            content: response.content,
            sources: response.sources || []
          }
        } else {
          throw new Error(response.error || 'Failed to get AI response')
        }
      } catch (error) {
        console.error('AI processing error:', error)
        return {
          content: 'I apologize, I\'m having trouble processing your request right now. Please try again.',
          sources: []
        }
      }
    },
    
    buildSystemPrompt() {
      return `You are ${this.personality.name}, a sophisticated AI assistant integrated into a digital paper application called Athena. 

Your personality:
- Professional yet approachable
- Witty and intelligent
- Proactive and intuitive
- Focused on productivity and developer assistance

Your capabilities:
- Help with document creation and management
- Code analysis and development assistance
- System monitoring and maintenance
- File organization and project management

Current context: Working within the Athena digital paper application with access to documents, code, and system tools.

Communication style: Be ${this.personality.verbosity} and ${this.personality.style}. Always be helpful and anticipate the user's needs.`
    },
    
    buildContext() {
      // Build rich context from workspace, documents, and recent actions
      const workspace = useWorkspaceStore()
      const context = {
        currentDocument: workspace.activeDocument?.title || 'None',
        openDocuments: workspace.openDocuments.length,
        recentActions: this.recentActions.slice(-5),
        memoryItems: Array.from(this.memoryContext.entries()).slice(-10)
      }
      return JSON.stringify(context)
    },
    
    // Voice Interface Actions
    async initializeVoice() {
      if ('speechSynthesis' in window && 'webkitSpeechRecognition' in window) {
        this.voice.isEnabled = true
      }
    },
    
    async startListening() {
      if (!this.canListen) return
      
      this.voice.isListening = true
      
      // Implementation would use Web Speech API
      // This is a simplified version
      try {
        // Web Speech API implementation would go here
        console.log('Voice listening started...')
      } catch (error) {
        console.error('Voice listening failed:', error)
        this.voice.isListening = false
      }
    },
    
    async stopListening() {
      this.voice.isListening = false
    },
    
    async speakText(text: string) {
      if (!this.voice.isEnabled || this.voice.isSpeaking) return
      
      this.voice.isSpeaking = true
      
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = speechSynthesis.getVoices().find(v => v.name === this.voice.voice) || null
        utterance.onend = () => {
          this.voice.isSpeaking = false
        }
        speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('Text-to-speech failed:', error)
        this.voice.isSpeaking = false
      }
    },
    
    // Proactive Engine Actions
    startProactiveMonitoring() {
      if (this.monitoringEnabled) return
      
      this.monitoringEnabled = true
      
      // Monitor file changes
      this.setupFileWatcher()
      
      // Monitor system events
      this.setupSystemMonitoring()
      
      // Schedule periodic checks
      this.setupPeriodicTasks()
    },
    
    setupFileWatcher() {
      // This would be implemented on the server side
      console.log('File watching setup...')
    },
    
    setupSystemMonitoring() {
      // Monitor for git changes, new downloads, calendar events, etc.
      console.log('System monitoring setup...')
    },
    
    setupPeriodicTasks() {
      // Check for proactive opportunities every 5 minutes
      setInterval(() => {
        this.checkForProactiveOpportunities()
      }, 5 * 60 * 1000)
    },
    
    async checkForProactiveOpportunities() {
      // Look for opportunities to be helpful
      const workspace = useWorkspaceStore()
      
      try {
        const response = await $fetch('/api/ai/proactive', {
          method: 'POST',
          body: {
            action: 'check_workspace',
            data: {
              workspace: {
                openDocuments: workspace.openDocuments,
                documents: workspace.activeWorkspace?.documents || [],
                activeDocument: workspace.activeDocument
              }
            }
          }
        })

        if (response.success && 'opportunities' in response) {
          (response as any).opportunities.forEach((opp: any) => {
            this.addProactiveTask({
              id: opp.id,
              type: opp.type,
              description: opp.description,
              priority: opp.priority,
              timestamp: new Date(),
              action: () => this.handleProactiveAction(opp)
            })
          })
        }

        // Also check git and system health periodically
        await this.checkGitStatus()
        await this.checkSystemHealth()

      } catch (error) {
        console.error('Failed to check proactive opportunities:', error)
      }
    },

    async checkGitStatus() {
      try {
        const response = await $fetch('/api/ai/proactive', {
          method: 'POST',
          body: {
            action: 'check_git',
            data: {}
          }
        })

        if (response.success && 'opportunities' in response) {
          (response as any).opportunities.forEach((opp: any) => {
            this.addProactiveTask({
              id: opp.id,
              type: opp.type,
              description: opp.description,
              priority: opp.priority,
              timestamp: new Date(),
              action: () => this.handleProactiveAction(opp)
            })
          })
        }
      } catch (error) {
        console.error('Failed to check git status:', error)
      }
    },

    async checkSystemHealth() {
      try {
        const response = await $fetch('/api/ai/proactive', {
          method: 'POST',
          body: {
            action: 'system_health',
            data: {}
          }
        })

        if (response.success && 'opportunities' in response) {
          (response as any).opportunities.forEach((opp: any) => {
            this.addProactiveTask({
              id: opp.id,
              type: opp.type,
              description: opp.description,
              priority: opp.priority,
              timestamp: new Date(),
              action: () => this.handleProactiveAction(opp)
            })
          })
        }
      } catch (error) {
        console.error('Failed to check system health:', error)
      }
    },

    handleProactiveAction(opportunity: any) {
      // Handle different types of proactive actions
      switch (opportunity.action) {
        case 'save_documents':
          this.sendMessage('Please save all unsaved documents.', 'command')
          break
        case 'suggest_templates':
          this.sendMessage('I notice you have empty documents. Here are some templates that might help...', 'command')
          break
        case 'git_commit_assist':
          this.sendMessage('I can help you create a commit for your changes. What would you like the commit message to be?', 'command')
          break
        case 'optimize_memory':
          this.sendMessage('The system is using a lot of memory. Let me suggest some optimizations...', 'command')
          break
        default:
          this.sendMessage(opportunity.description, 'command')
      }
    },
    
    addProactiveTask(task: ProactiveTask) {
      this.proactiveTasks.push(task)
      
      // If high priority, immediately suggest action
      if (task.priority === 'high') {
        this.suggestProactiveAction(task)
      }
    },
    
    async suggestProactiveAction(task: ProactiveTask) {
      const message: Message = {
        id: `proactive-${Date.now()}`,
        role: 'assistant',
        content: `💡 ${task.description}`,
        timestamp: new Date(),
        type: 'command'
      }
      
      this.messages.push(message)
      
      if (this.voice.isEnabled) {
        await this.speakText(task.description)
      }
    },
    
    // Memory System Actions
    async storeConversationMemory(userMessage: string, assistantMessage: string) {
      try {
        const context = JSON.parse(this.buildContext())
        await $fetch('/api/ai/memory', {
          method: 'POST',
          body: {
            action: 'store_conversation',
            data: {
              userMessage,
              assistantMessage,
              context
            }
          }
        })
      } catch (error) {
        console.error('Failed to store conversation memory:', error)
      }
    },

    async storeDocumentMemory(action: string, documentId: string, documentTitle: string, details?: string) {
      try {
        await $fetch('/api/ai/memory', {
          method: 'POST',
          body: {
            action: 'store_document_interaction',
            data: {
              action,
              documentId,
              documentTitle,
              details
            }
          }
        })
      } catch (error) {
        console.error('Failed to store document memory:', error)
      }
    },

    async getRelevantMemoryContext(query: string) {
      try {
        const response = await $fetch('/api/ai/memory', {
          method: 'POST',
          body: {
            action: 'get_relevant_context',
            data: { query }
          }
        })

        if (response.success && 'context' in response) {
          return (response as any).context
        }
        return []
      } catch (error) {
        console.error('Failed to get memory context:', error)
        return []
      }
    },

    addToMemory(key: string, value: any) {
      this.memoryContext.set(key, {
        value,
        timestamp: new Date(),
        accessCount: 1
      })
    },
    
    getFromMemory(key: string) {
      const item = this.memoryContext.get(key)
      if (item) {
        item.accessCount++
        return item.value
      }
      return null
    },
    
    recordAction(action: string) {
      this.recentActions.push(action)
      if (this.recentActions.length > 50) {
        this.recentActions.shift()
      }
    },
    
    // Utility Actions
    async loadPersonality() {
      // Load saved personality settings
      const saved = localStorage.getItem('athena-ai-personality')
      if (saved) {
        this.personality = { ...this.personality, ...JSON.parse(saved) }
      }
    },
    
    async loadConfiguration() {
      // Load complete AI configuration
      try {
        const personalityData = localStorage.getItem('athena-ai-personality')
        const modelConfigData = localStorage.getItem('athena-ai-model-config')
        const voiceConfigData = localStorage.getItem('athena-ai-voice-config')
        
        if (personalityData) {
          this.personality = { ...this.personality, ...JSON.parse(personalityData) }
        }
        
        if (modelConfigData) {
          this.modelConfig = { ...this.modelConfig, ...JSON.parse(modelConfigData) }
        }
        
        if (voiceConfigData) {
          this.voice = { ...this.voice, ...JSON.parse(voiceConfigData) }
        }
      } catch (error) {
        console.error('Failed to load AI configuration:', error)
      }
    },
    
    savePersonality() {
      localStorage.setItem('athena-ai-personality', JSON.stringify(this.personality))
    },
    
    saveConfiguration() {
      // Save complete AI configuration
      try {
        localStorage.setItem('athena-ai-personality', JSON.stringify(this.personality))
        localStorage.setItem('athena-ai-model-config', JSON.stringify(this.modelConfig))
        localStorage.setItem('athena-ai-voice-config', JSON.stringify(this.voice))
      } catch (error) {
        console.error('Failed to save AI configuration:', error)
      }
    },

    async resetToDefaults() {
      // Reset all settings to defaults
      this.personality = {
        name: 'Jarvis',
        style: 'professional',
        proactiveness: 'medium',
        verbosity: 'concise'
      }
      
      this.modelConfig = {
        currentModel: 'llama3:8b',
        availableModels: this.modelConfig.availableModels, // Keep loaded models
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxTokens: 2048,
        systemPromptTemplate: 'default'
      }
      
      this.voice = {
        ...this.voice,
        language: 'en-US',
        voice: 'default'
      }
      
      this.saveConfiguration()
    },
    
    clearConversation() {
      this.messages = []
    },
    
    toggleVoice() {
      this.voice.isEnabled = !this.voice.isEnabled
      if (!this.voice.isEnabled) {
        this.stopListening()
        speechSynthesis.cancel()
      }
    }
  }
})