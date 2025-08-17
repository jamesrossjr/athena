<script setup lang="ts">
interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Props {
  documentContext?: string
  documentId?: string
}

const props = defineProps<Props>()

const isOpen = ref(false)
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isLoading = ref(false)

// Initialize with a welcome message
onMounted(() => {
  messages.value = [{
    id: '1',
    content: `Hello! I'm your AI assistant. I can help you with:

• Summarizing content
• Finding related documents  
• Improving your writing
• Answering questions about your workspace

${props.documentContext ? 'I can see you\'re working on a document. How can I help?' : 'What would you like to do today?'}`,
    role: 'assistant',
    timestamp: new Date()
  }]
})

async function sendMessage() {
  if (!currentMessage.value.trim() || isLoading.value) return
  
  const userMessage: Message = {
    id: Date.now().toString(),
    content: currentMessage.value,
    role: 'user',
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  const messageToSend = currentMessage.value
  currentMessage.value = ''
  isLoading.value = true
  
  try {
    // For demo purposes, we'll create mock responses
    // In production, this would call your AI API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: generateMockResponse(messageToSend),
      role: 'assistant',
      timestamp: new Date()
    }
    
    messages.value.push(assistantMessage)
  } catch (error) {
    console.error('Failed to send message:', error)
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Sorry, I encountered an error. Please try again.',
      role: 'assistant',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
  }
  
  // Scroll to bottom
  nextTick(() => {
    const chatContainer = document.querySelector('.chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
}

function generateMockResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()
  
  if (message.includes('summarize') || message.includes('summary')) {
    return "I'd be happy to help summarize your content! If you're working on a document, I can analyze it and provide key points and takeaways. Would you like me to summarize the current document you're viewing?"
  }
  
  if (message.includes('improve') || message.includes('better')) {
    return "Great! I can help improve your writing in several ways:\n\n• Make text clearer and more engaging\n• Fix grammar and spelling\n• Adjust tone and style\n• Simplify complex language\n\nJust select some text and use the AI commands in the command palette (Ctrl+K)!"
  }
  
  if (message.includes('search') || message.includes('find')) {
    return "I can help you find related documents using semantic search! This means I'll look for documents with similar meanings, not just matching keywords. Try the 'AI: Find Related Documents' command from the command palette."
  }
  
  if (message.includes('collaborate') || message.includes('sharing')) {
    return "Athena supports real-time collaboration! Multiple users can edit the same document simultaneously with live cursors and presence indicators. Changes are synchronized instantly using conflict-free technology."
  }
  
  return `Thanks for your message! I'm here to help with various tasks:

• Document analysis and summarization
• Writing improvement and editing
• Finding related content
• Collaboration features
• General workspace assistance

Feel free to ask me anything specific about your work!`
}

function toggleChat() {
  isOpen.value = !isOpen.value
}

defineExpose({ toggleChat })
</script>

<template>
  <div>
    <!-- Chat Toggle Button -->
    <UButton
      icon="i-heroicons-chat-bubble-left-ellipsis"
      size="xl"
      color="primary"
      variant="solid"
      class="fixed bottom-6 right-6 z-50 shadow-lg"
      :class="{ 'opacity-50': isOpen }"
      @click="toggleChat"
    >
      AI Assistant
    </UButton>

    <!-- Chat Panel -->
    <div
      v-if="isOpen"
      class="fixed bottom-24 right-6 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-40 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
          <span class="font-medium">AI Assistant</span>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          size="sm"
          variant="ghost"
          @click="toggleChat"
        />
      </div>

      <!-- Messages -->
      <div class="chat-messages flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-xs px-3 py-2 rounded-lg whitespace-pre-wrap"
            :class="
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            "
          >
            {{ message.content }}
          </div>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="isLoading" class="flex justify-start">
          <div class="bg-gray-100 px-3 py-2 rounded-lg">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="p-4 border-t border-gray-200">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <UInput
            v-model="currentMessage"
            placeholder="Ask me anything..."
            class="flex-1"
            :disabled="isLoading"
            @keydown.enter.prevent="sendMessage"
          />
          <UButton
            type="submit"
            icon="i-heroicons-paper-airplane"
            :disabled="!currentMessage.trim() || isLoading"
            :loading="isLoading"
          />
        </form>
      </div>
    </div>
  </div>
</template>