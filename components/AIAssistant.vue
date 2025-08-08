<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- AI Assistant Toggle Button -->
    <button
      v-if="!isOpen"
      @click="toggleAssistant"
      class="ai-toggle-btn"
    >
      <div class="relative">
        <Icon name="heroicons:sparkles" class="h-6 w-6" />
        <div class="pulse-ring"></div>
      </div>
      <span class="ml-2 hidden lg:inline">AI Assistant</span>
    </button>

    <!-- AI Assistant Panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <div v-if="isOpen" class="ai-assistant-panel">
        <!-- Header -->
        <div class="ai-panel-header">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse-glow">
              <Icon name="heroicons:cpu-chip" class="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 class="font-bold text-cyan-400">ATHENA</h3>
              <p class="text-xs text-gray-400">Neural Assistant</p>
            </div>
          </div>
          <button @click="toggleAssistant" class="ai-close-btn">
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </button>
        </div>

        <!-- Chat Messages -->
        <div class="ai-chat-area custom-scrollbar" ref="chatArea">
          <!-- Initial message -->
          <div class="flex items-start space-x-3 mb-4" v-if="!messages.length">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:sparkles" class="h-4 w-4 text-white" />
            </div>
            <div class="ai-message-bubble">
              <p class="text-sm">{{ currentPageHelp }}</p>
            </div>
          </div>

          <!-- Messages -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex items-start space-x-3 mb-4"
            :class="message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="message.type === 'user' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600'"
            >
              <Icon
                :name="message.type === 'user' ? 'heroicons:user' : 'heroicons:sparkles'"
                class="h-4 w-4 text-white"
              />
            </div>
            <div
              class="message-bubble text-sm"
              :class="message.type === 'user' ? 'user-message-bubble' : 'ai-message-bubble'"
            >
              <p>{{ message.content }}</p>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="ai-input-area">
          <div class="relative">
            <input
              v-model="userInput"
              @keypress.enter="sendMessage"
              type="text"
              :placeholder="`Ask about ${currentPageContext}...`"
              class="ai-input-small"
            />
            <button
              @click="sendMessage"
              :disabled="!userInput.trim()"
              class="ai-send-btn"
            >
              <Icon name="heroicons:paper-airplane" class="h-4 w-4" />
            </button>
          </div>
          
          <!-- Quick Actions -->
          <div class="flex flex-wrap gap-2 mt-3">
            <button
              v-for="action in quickActions"
              :key="action.id"
              @click="handleQuickAction(action)"
              class="ai-quick-action"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const isOpen = ref(false)
const userInput = ref('')
const messages = ref([])
const chatArea = ref(null)
const route = useRoute()

// Context-aware help based on current page
const currentPageContext = computed(() => {
  const path = route.path
  if (path === '/') return 'the dashboard'
  if (path.startsWith('/vault')) return 'your knowledge base'
  if (path.startsWith('/chat')) return 'conversations'
  if (path.startsWith('/projects')) return 'project management'
  if (path.startsWith('/briefings')) return 'briefings and reports'
  return 'this page'
})

const currentPageHelp = computed(() => {
  const path = route.path
  if (path === '/') return 'Welcome! I can help you navigate your dashboard, analyze your data, or assist with any tasks.'
  if (path.startsWith('/vault')) return 'I can help you organize your knowledge base, find connections between notes, or create new content.'
  if (path.startsWith('/chat')) return 'I\'m here to engage in meaningful conversations and help you explore ideas.'
  if (path.startsWith('/projects')) return 'Let me assist with project planning, task management, and tracking progress.'
  if (path.startsWith('/briefings')) return 'I can help analyze reports, generate summaries, or create new briefings.'
  return 'How can I assist you on this page?'
})

// Context-aware quick actions
const quickActions = computed(() => {
  const path = route.path
  if (path === '/') return [
    { id: 1, label: 'System Status' },
    { id: 2, label: 'Quick Analysis' },
    { id: 3, label: 'Schedule Review' }
  ]
  if (path.startsWith('/vault')) return [
    { id: 1, label: 'Search Notes' },
    { id: 2, label: 'Create Note' },
    { id: 3, label: 'Find Connections' }
  ]
  if (path.startsWith('/projects')) return [
    { id: 1, label: 'Task Summary' },
    { id: 2, label: 'Add Task' },
    { id: 3, label: 'Progress Report' }
  ]
  return [
    { id: 1, label: 'Help' },
    { id: 2, label: 'Guide Me' },
    { id: 3, label: 'Explain' }
  ]
})

const toggleAssistant = () => {
  isOpen.value = !isOpen.value
}

const sendMessage = async () => {
  if (!userInput.value.trim()) return

  // Add user message
  messages.value.push({
    id: Date.now(),
    type: 'user',
    content: userInput.value
  })

  const input = userInput.value
  userInput.value = ''

  // Simulate AI response
  setTimeout(() => {
    messages.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: getContextualResponse(input)
    })
    
    // Scroll to bottom
    nextTick(() => {
      if (chatArea.value) {
        chatArea.value.scrollTop = chatArea.value.scrollHeight
      }
    })
  }, 1000)
}

const getContextualResponse = (input) => {
  const lowerInput = input.toLowerCase()
  const path = route.path

  // Context-aware responses
  if (path === '/' && lowerInput.includes('status')) {
    return 'Your systems are running optimally. AI processing at 87%, neural networks active, and all modules operational.'
  }
  if (path.startsWith('/vault') && (lowerInput.includes('note') || lowerInput.includes('knowledge'))) {
    return 'I can help you organize your knowledge base efficiently. Would you like me to suggest ways to categorize your notes or find related content?'
  }
  if (path.startsWith('/projects') && lowerInput.includes('task')) {
    return 'I\'ll analyze your current tasks and suggest optimizations for better productivity. Let me review your project timeline.'
  }
  
  // General responses
  if (lowerInput.includes('help')) {
    return `I'm here to help you with ${currentPageContext.value}. What specific assistance do you need?`
  }
  
  return `I understand you're asking about "${input}". Based on your current context, I recommend exploring the relevant features or let me know how I can assist you further.`
}

const handleQuickAction = (action) => {
  userInput.value = action.label
  sendMessage()
}

// Auto-close when navigating
watch(() => route.path, () => {
  isOpen.value = false
})
</script>

<style scoped>
/* AI Assistant Styles */
.ai-toggle-btn {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(15, 15, 35, 0.9);
  border: 1px solid var(--cyber-blue);
  color: var(--cyber-blue);
  border-radius: 2rem;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
  backdrop-filter: blur(20px);
}

.ai-toggle-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
}

.pulse-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--cyber-blue);
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}

.ai-assistant-panel {
  width: 380px;
  height: 500px;
  background: rgba(15, 15, 35, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 1.5rem;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.2);
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.ai-close-btn {
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s;
}

.ai-close-btn:hover {
  color: var(--cyber-blue);
}

.ai-chat-area {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.ai-message-bubble, .user-message-bubble {
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 85%;
  word-wrap: break-word;
}

.ai-message-bubble {
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: white;
}

.user-message-bubble {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
}

.ai-input-area {
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
}

.ai-input-small {
  width: 100%;
  background: rgba(15, 15, 35, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: white;
  padding: 0.75rem 3rem 0.75rem 1rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.3s ease;
}

.ai-input-small:focus {
  border-color: var(--cyber-blue);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

.ai-input-small::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.ai-send-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem;
  background: linear-gradient(45deg, var(--cyber-blue), var(--cyber-purple));
  border-radius: 1rem;
  color: white;
  transition: all 0.2s ease;
}

.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-send-btn:not(:disabled):hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.ai-quick-action {
  padding: 0.5rem 0.75rem;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: var(--cyber-blue);
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.ai-quick-action:hover {
  background: rgba(0, 212, 255, 0.2);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .ai-assistant-panel {
    width: calc(100vw - 2rem);
    height: 400px;
  }
}
</style>