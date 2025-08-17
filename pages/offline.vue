<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-8">
    <div class="text-center max-w-md">
      <!-- Offline Icon -->
      <div class="text-6xl mb-6">🔌</div>
      
      <!-- Heading -->
      <h1 class="text-2xl font-bold text-gray-900 mb-4">You're Offline</h1>
      
      <!-- Description -->
      <p class="text-gray-600 mb-8">
        It looks like you've lost your internet connection. Don't worry - you can still access your recently viewed content and create new documents locally.
      </p>
      
      <!-- Offline Features -->
      <div class="space-y-4 mb-8">
        <div class="flex items-center gap-3 text-left">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-600" />
          </div>
          <span class="text-sm text-gray-700">View cached documents</span>
        </div>
        
        <div class="flex items-center gap-3 text-left">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-600" />
          </div>
          <span class="text-sm text-gray-700">Create new documents locally</span>
        </div>
        
        <div class="flex items-center gap-3 text-left">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-600" />
          </div>
          <span class="text-sm text-gray-700">Changes sync when reconnected</span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="space-y-3">
        <UButton @click="checkConnection" :loading="checkingConnection" block>
          <template #leading>
            <UIcon name="i-heroicons-arrow-path" />
          </template>
          Check Connection
        </UButton>
        
        <UButton @click="navigateTo('/')" variant="outline" block>
          <template #leading>
            <UIcon name="i-heroicons-home" />
          </template>
          Go to Home (Cached)
        </UButton>
        
        <UButton @click="navigateTo('/demo')" variant="outline" block>
          <template #leading>
            <UIcon name="i-heroicons-document-plus" />
          </template>
          Create Document
        </UButton>
      </div>
      
      <!-- Connection Status -->
      <div class="mt-8 p-4 bg-yellow-50 rounded-lg">
        <div class="flex items-center gap-2 text-yellow-800">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
          <span class="text-sm font-medium">Offline Mode Active</span>
        </div>
        <p class="text-xs text-yellow-700 mt-1">
          Your changes will be saved locally and synced when you reconnect.
        </p>
      </div>
      
      <!-- Help -->
      <div class="mt-6">
        <details class="text-left">
          <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
            Troubleshooting Tips
          </summary>
          <div class="mt-3 text-xs text-gray-600 space-y-2">
            <p>• Check your Wi-Fi or mobile data connection</p>
            <p>• Try refreshing the page</p>
            <p>• Clear your browser cache if problems persist</p>
            <p>• Contact support if you continue having issues</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Offline - Athena'
})

const checkingConnection = ref(false)

async function checkConnection() {
  checkingConnection.value = true
  
  try {
    // Try to fetch a small resource from the server
    const response = await fetch('/favicon.ico', { 
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (response.ok) {
      // Connection restored
      const toast = useToast()
      toast.add({
        title: 'Connection Restored!',
        description: 'You\'re back online. Redirecting to home...',
        color: 'green'
      })
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigateTo('/')
      }, 1500)
    } else {
      throw new Error('Network response was not ok')
    }
  } catch (error) {
    // Still offline
    const toast = useToast()
    toast.add({
      title: 'Still Offline',
      description: 'Unable to connect to the internet. Please check your connection.',
      color: 'red'
    })
  } finally {
    checkingConnection.value = false
  }
}

// Check connection status periodically
onMounted(() => {
  // Listen for online/offline events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Initial connection check
  if (navigator.onLine) {
    // Browser thinks we're online, but verify with server
    checkConnection()
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

function handleOnline() {
  const toast = useToast()
  toast.add({
    title: 'Connection Restored',
    description: 'You\'re back online!',
    color: 'green'
  })
  
  // Redirect to home
  setTimeout(() => {
    navigateTo('/')
  }, 1000)
}

function handleOffline() {
  console.log('Connection lost')
}
</script>