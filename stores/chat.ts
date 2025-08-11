import { defineStore } from 'pinia'

interface Message {
  id: number
  role: string
  content: string
  timestamp: Date
  sources: string[]
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as Message[],
    isTyping: false,
    currentThread: null
  }),
  
  actions: {
    async sendMessage(content: any) {
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date(),
        sources: []
      }
      
      this.messages.push(userMessage)
      this.isTyping = true
      
      try {
        // TODO: Integrate with local LLM or API
        const response = await this.processMessage(content)
        
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          sources: response.sources || []
        }
        
        this.messages.push(aiMessage)
      } catch (error) {
        console.error('Failed to get AI response:', error)
      } finally {
        this.isTyping = false
      }
    },
    
    async processMessage(content: any) {
      // Mock AI processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return {
        content: `I understand you're asking about "${content}". Based on your knowledge vault, here's what I found...`,
        sources: ['Example Note 1', 'Example Note 2']
      }
    },
    
    clearMessages() {
      this.messages = []
    }
  }
})