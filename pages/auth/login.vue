<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Welcome Title - Top of Page -->
    <div v-if="showWelcome" class="text-center pt-16 pb-8">
      <h1 class="text-4xl font-bold text-foreground">
        <span class="typewriter-text">{{ typedWelcome.replace('.', '') }}</span>
        <span class="typewriter-text"> to Paper</span>
        <span v-if="!welcomeComplete" class="typewriter-cursor">▋</span>
      </h1>
    </div>

    <!-- Main Container - Center of Page -->
    <div class="flex items-center justify-center px-6" style="min-height: calc(100vh - 200px);">
      <div class="w-full">
        <!-- Error Message -->
        <div 
          v-if="error" 
          class="mb-8 max-w-md mx-auto p-4 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm flex items-center gap-3"
        >
          <svg class="h-5 w-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{{ error }}</span>
        </div>
        
        <!-- Success Message -->
        <div 
          v-if="success" 
          class="mb-8 max-w-md mx-auto p-4 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm flex items-center gap-3"
        >
          <svg class="h-5 w-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>{{ success }}</span>
        </div>

        <!-- Login Form Container -->
        <div style="max-width: 500px; margin-left: auto; margin-right: auto; background-color: #F9F9F9; padding: 30px; border-radius: 8px;">
          <!-- Login Label -->
          <div v-if="showLogin" class="mb-2 transition-opacity duration-1000" :class="{ 'opacity-100': loginComplete, 'opacity-0': !loginComplete }">
            <span class="typewriter-text text-xl">login:</span>
          </div>
          
          <!-- Login Input -->
          <div v-if="showLogin" class="mb-6 transition-opacity duration-1000" :class="{ 'opacity-100': loginComplete, 'opacity-0': !loginComplete }">
            <input
              id="login"
              ref="loginInput"
              v-model="state.email"
              type="email"
              required
              :disabled="isLoading"
              aria-label="Enter your username or email"
              :class="[
                'w-full px-3 py-3 bg-white border-0 focus:outline-none focus:border-2 transition-all duration-300 text-lg rounded-md',
                validationErrors.email ? 'focus:border-red-500 border-2 border-red-500' : 'focus:border-blue-500'
              ]"
              placeholder=""
              @blur="validateForm"
            />
            <div v-if="validationErrors.email" class="mt-1 text-sm text-red-600">
              {{ validationErrors.email }}
            </div>
          </div>

          <!-- Password Label -->
          <div v-if="showPasswordPrompt" class="mb-2 transition-opacity duration-1000" :class="{ 'opacity-100': passwordPromptComplete, 'opacity-0': !passwordPromptComplete }">
            <span class="typewriter-text text-xl">password:</span>
          </div>

          <!-- Password Input -->
          <div v-if="showPasswordPrompt" class="mb-8 transition-opacity duration-1000" :class="{ 'opacity-100': passwordPromptComplete, 'opacity-0': !passwordPromptComplete }">
            <input
              id="password"
              ref="passwordInput"
              v-model="state.password"
              type="password"
              required
              :disabled="isLoading"
              aria-label="Enter your password"
              :class="[
                'w-full px-3 py-3 bg-white border-0 focus:outline-none focus:border-2 transition-all duration-300 text-lg rounded-md',
                validationErrors.password ? 'focus:border-red-500 border-2 border-red-500' : 'focus:border-blue-500'
              ]"
              placeholder=""
              @keyup.enter="onSubmit"
              @blur="validateForm"
            />
            <div v-if="validationErrors.password" class="mt-1 text-sm text-red-600">
              {{ validationErrors.password }}
            </div>
          </div>

          <!-- Remember Me and Forgot Password -->
          <div v-if="showFields" class="flex justify-between items-center mb-8 transition-opacity duration-1000" :class="{ 'opacity-100': showFields, 'opacity-0': !showFields }">
            <!-- Remember Me Checkbox -->
            <label class="flex items-center cursor-pointer">
              <input
                v-model="state.remember"
                type="checkbox"
                class="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-600">Remember me</span>
            </label>
            
            <!-- Forgot Password Link -->
            <a href="#" class="text-sm text-gray-600 hover:text-gray-800 no-underline transition-colors duration-200">
              Forgot password?
            </a>
          </div>

          <!-- Separator -->
          <div v-if="showFields" class="mb-8 transition-opacity duration-1000" :class="{ 'opacity-100': showFields, 'opacity-0': !showFields }">
            <hr class="border-t border-gray-300" />
          </div>

          <!-- Primary Login Button -->
          <div v-if="showFields" class="mb-8 transition-opacity duration-1000" :class="{ 'opacity-100': showFields, 'opacity-0': !showFields }">
            <button
              type="button"
              @click="onSubmit"
              :disabled="isLoading || !state.email || !state.password"
              aria-label="Sign in to your account"
              class="w-full py-4 bg-black hover:bg-gray-900 focus:bg-gray-900 border-0 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300 text-lg shadow-lg"
            >
              <span v-if="!isLoading">Login</span>
              <span v-else>Authenticating...</span>
            </button>
          </div>

          <!-- Social Login -->
          <div v-if="showFields" class="mb-8 text-center transition-opacity duration-1000" :class="{ 'opacity-100': showFields, 'opacity-0': !showFields }">
            <p class="text-sm text-gray-600 mb-4">Sign in with</p>
            <div class="flex justify-center gap-6">
              <!-- Google -->
              <button @click="signInWithGoogle" :class="['bg-transparent border-0 outline-none focus:outline-none p-2 transition-transform', shakeGoogle ? 'animate-shake' : '']">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-gray-500">
                  <path fill="currentColor" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
                </svg>
              </button>
              
              <!-- GitHub -->
              <button class="bg-transparent border-0 outline-none focus:outline-none p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-gray-500">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              
              <!-- Microsoft -->
              <button class="bg-transparent border-0 outline-none focus:outline-none p-2">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-gray-500">
                  <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, nextTick } from 'vue'
import { loginSchema, type LoginInput } from '~/utils/validation'

definePageMeta({
  middleware: 'guest',
  layout: false
})

const authStore = useAuthStore()
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})
const shakeGoogle = ref(false)

// Animation state
const showWelcome = ref(false)
const showLogin = ref(false)
const showPasswordPrompt = ref(false)
const showFields = ref(false)
const typedWelcome = ref('')
const typedLogin = ref('')
const typedPasswordPrompt = ref('')
const welcomeComplete = ref(false)
const loginComplete = ref(false)
const passwordPromptComplete = ref(false)
const animationComplete = ref(false)

// Color mode
const colorMode = useColorMode()

// Refs for inputs
const loginInput = ref<HTMLInputElement>()
const passwordInput = ref<HTMLInputElement>()

// Form state
const state = reactive({
  email: '',
  password: '',
  remember: false
})

// Get success message from route query
onMounted(() => {
  const route = useRoute()
  if (route.query.message) {
    success.value = String(route.query.message)
  }
  
  // Start typewriter animation
  startTypewriterAnimation()
})

// Animation sequence
async function startTypewriterAnimation() {
  // Start with blank screen, then show welcome
  showWelcome.value = true
  
  // Type "Welcome." with proper timing (90ms per character as per PRD)
  await typeText('Welcome.', typedWelcome, 90)
  welcomeComplete.value = true
  
  // Pause 750ms after "Welcome." as per PRD
  await new Promise(resolve => setTimeout(resolve, 750))
  
  // Show login form with fade-in
  showLogin.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  loginComplete.value = true
  
  // Pause 500ms then show password
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Show password form with fade-in
  showPasswordPrompt.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  passwordPromptComplete.value = true
  
  // Show form fields and button with fade-in
  await new Promise(resolve => setTimeout(resolve, 600))
  showFields.value = true
  animationComplete.value = true
  
  await nextTick()
  if (loginInput.value) {
    loginInput.value.focus()
  }
}

async function typeText(text: string, target: Ref<string>, delay: number = 90) {
  for (let i = 0; i <= text.length; i++) {
    target.value = text.substring(0, i)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Color mode toggle
function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Validate form data
function validateForm(): boolean {
  validationErrors.value = {}
  
  try {
    const formData: LoginInput = {
      email: state.email,
      password: state.password,
      rememberMe: state.remember
    }
    
    loginSchema.parse(formData)
    return true
  } catch (err: any) {
    if (err.errors) {
      for (const error of err.errors) {
        validationErrors.value[error.path[0]] = error.message
      }
    }
    return false
  }
}

// Handle form submission
async function onSubmit() {
  if (isLoading.value) return

  // Clear previous errors
  error.value = null
  success.value = null
  
  // Validate form
  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const formData = {
      email: state.email,
      password: state.password,
      rememberMe: state.remember
    }
    
    await authStore.login(formData)
    
    // Success feedback
    success.value = 'Login successful! Redirecting...'
    
    // Redirect after short delay to show success message
    setTimeout(() => {
      navigateTo('/')
    }, 1500)
  } catch (err: any) {
    console.error('Login error:', err)
    
    // Handle different types of errors
    if (err.statusCode === 401) {
      error.value = 'Invalid email or password. Please check your credentials and try again.'
    } else if (err.statusCode === 400) {
      error.value = 'Please check your input and try again.'
    } else if (err.statusCode === 429) {
      error.value = 'Too many login attempts. Please try again later.'
    } else if (err.statusCode >= 500) {
      error.value = 'Server error. Please try again later.'
    } else {
      error.value = err.data?.statusMessage || err.message || 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

// Handle Google sign in
async function signInWithGoogle() {
  if (isGoogleLoading.value || isLoading.value) return

  isGoogleLoading.value = true

  try {
    // TODO: Implement Google Sign-In
    // This is a placeholder - actual Google OAuth implementation needed
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    // For now, just shake the button to indicate it's not implemented
    triggerShake()
  } catch (err: any) {
    triggerShake()
  } finally {
    isGoogleLoading.value = false
  }
}

// Trigger shake animation
function triggerShake() {
  shakeGoogle.value = true
  setTimeout(() => {
    shakeGoogle.value = false
  }, 500)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@400;500;600&display=swap');

/* Color scheme variables */
:root {
  --bg-light: #fdfdfd;
  --bg-dark: #111111;
  --text-light: #222222;
  --text-dark: #eaeaea;
  --accent: #3b82f6;
  --accent-foreground: #ffffff;
  --border-light: #e5e7eb;
  --border-dark: #374151;
  --muted-light: #f3f4f6;
  --muted-dark: #1f2937;
  --muted-foreground-light: #6b7280;
  --muted-foreground-dark: #9ca3af;
}

/* Light mode */
.bg-background {
  background-color: var(--bg-light);
}

.text-foreground {
  color: var(--text-light);
}

.border-border {
  border-color: var(--border-light);
}

.bg-accent {
  background-color: var(--accent);
}

.text-accent-foreground {
  color: var(--accent-foreground);
}

.bg-muted {
  background-color: var(--muted-light);
}

.text-muted-foreground {
  color: var(--muted-foreground-light);
}

.focus\:ring-accent:focus {
  --tw-ring-color: var(--accent);
}

/* Dark mode */
:global(.dark) .bg-background {
  background-color: var(--bg-dark);
}

:global(.dark) .text-foreground {
  color: var(--text-dark);
}

:global(.dark) .border-border {
  border-color: var(--border-dark);
}

:global(.dark) .bg-muted {
  background-color: var(--muted-dark);
}

:global(.dark) .text-muted-foreground {
  color: var(--muted-foreground-dark);
}

/* Typography */
.typewriter-text {
  font-family: 'IBM Plex Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-weight: 400;
  letter-spacing: -0.025em;
}

/* Typewriter cursor animation */
.typewriter-cursor {
  font-family: 'IBM Plex Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  animation: blink 600ms infinite step-end;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .typewriter-cursor {
    animation: none;
  }
  
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-background {
    background-color: #ffffff;
  }
  
  .text-foreground {
    color: #000000;
  }
  
  :global(.dark) .bg-background {
    background-color: #000000;
  }
  
  :global(.dark) .text-foreground {
    color: #ffffff;
  }
}

/* Hide any browser-injected icons */
input::-ms-reveal,
input::-ms-clear,
input::-webkit-credentials-auto-fill-button,
input::-webkit-strong-password-auto-fill-button {
  display: none !important;
}

/* Hide any potential shield/security icons */
svg[data-testid*="shield"],
svg[class*="shield"],
.shield-icon,
[class*="security-icon"] {
  display: none !important;
}

/* Shake animation for failed social login */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>