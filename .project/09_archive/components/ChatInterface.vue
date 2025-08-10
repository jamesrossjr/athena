<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">AI Assistant</h3>
        <UBadge color="green" size="xs">Online</UBadge>
      </div>
    </template>
    
    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="message in messages"
        :key="message.id"
        class="chat-message"
        :class="message.role"
      >
        <div class="flex items-start space-x-3">
          <UAvatar
            :src="message.role === 'user' ? 'https://avatars.githubusercontent.com/u/1?v=4' : null"
            :icon="message.role === 'assistant' ? 'i-heroicons-cpu-chip' : null"
            size="sm"
          />
          <div class="flex-1">
            <div class="font-medium mb-1">
              {{ message.role === 'user' ? 'You' : 'Athena' }}
            </div>
            <div class="prose prose-sm dark:prose-invert">
              {{ message.content }}
            </div>
            <div v-if="message.sources" class="mt-2">
              <div class="text-xs text-gray-500 mb-1">Sources:</div>
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="source in message.sources"
                  :key="source"
                  variant="outline"
                  size="xs"
                >
                  {{ source }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="isTyping" class="chat-message assistant">
        <div class="flex items-center space-x-2">
          <UAvatar icon="i-heroicons-cpu-chip" size="sm" />
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Input -->
    <template #footer>
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <UInput
          v-model="newMessage"
          placeholder="Ask about your knowledge..."
          size="lg"
          class="flex-1"
          :disabled="isTyping"
        />
        <UButton
          type="submit"
          icon="i-heroicons-paper-airplane"
          size="lg"
          :loading="isTyping"
        />
      </form>
    </template>
  </UCard>
</template>

<script setup>
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I\'m Athena, your personal AI assistant. I have access to your knowledge vault and can help you find information, generate insights, and answer questions based on your notes and data.',
    sources: []
  }
])

const newMessage = ref('')
const isTyping = ref(false)

const sendMessage = async () => {
  if (!newMessage.value.trim() || isTyping.value) return
  
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: newMessage.value,
    sources: []
  }
  
  messages.value.push(userMessage)
  newMessage.value = ''
  isTyping.value = true
  
  // Simulate AI response
  setTimeout(() => {
    const aiResponse = {
      id: Date.now(),
      role: 'assistant',
      content: 'Based on your knowledge vault, here\'s what I found...',
      sources: ['Note: Project Planning', 'Task: AI Implementation']
    }
    
    messages.value.push(aiResponse)
    isTyping.value = false
  }, 2000)
}
</script>