<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Chat with your personal AI trained on your knowledge vault
        </p>
      </div>
      
      <UButton variant="outline" @click="clearChat">
        Clear Chat
      </UButton>
    </div>
    
    <ChatInterface class="flex-1" />
  </div>
</template>

<script setup>
const clearChat = () => {
  // TODO: Clear chat history
  console.log('Clearing chat')
}
</script>