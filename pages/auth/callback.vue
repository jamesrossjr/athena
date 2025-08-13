<template>
  <div class="auth-callback">
    <div class="callback-container">
      <div class="callback-content">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <h2>Signing you in...</h2>
          <p>Please wait while we complete your authentication.</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h2>Authentication Failed</h2>
          <p>{{ error }}</p>
          <button @click="handleRetry" class="retry-btn">
            Try Again
          </button>
        </div>
        
        <div v-else class="success-state">
          <div class="success-icon">✅</div>
          <h2>Welcome to Athena!</h2>
          <p>You've been successfully signed in. Redirecting to your workspace...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const { handleAuthCallback } = useAuth()
const sessionStore = useSessionStore()

const isLoading = ref(true)
const error = ref<string | null>(null)

const handleAuthProcess = async () => {
  try {
    isLoading.value = true
    error.value = null

    const result = await handleAuthCallback()
    
    if (result.success) {
      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect based on user status
      if (sessionStore.isFirstTimeUser) {
        // New user - go to their new workspace
        await navigateTo('/workspace')
      } else {
        // Returning user - go to their last workspace or home
        await navigateTo('/')
      }
    } else {
      error.value = result.error || 'Authentication failed'
    }
  } catch (err: any) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleRetry = () => {
  error.value = null
  handleAuthProcess()
}

onMounted(() => {
  handleAuthProcess()
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.callback-content h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #111827;
}

.callback-content p {
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.5;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon,
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state {
  color: #dc2626;
}

.success-state {
  color: #059669;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.retry-btn:hover {
  background: #2563eb;
}
</style>