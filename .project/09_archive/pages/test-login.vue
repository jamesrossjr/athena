<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Test Sign in to Athena
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
      >
        <span class="block sm:inline">{{ error }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" @click="error = null">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>

      <!-- Success Message -->
      <div
        v-if="success"
        class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative"
      >
        <span class="block sm:inline">{{ success }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" @click="success = null">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>

      <form @submit="handleSubmit" class="space-y-6">
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address *
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              :disabled="isLoading"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password *
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                required
                :disabled="isLoading"
                class="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <!-- Remember Me -->
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="formData.rememberMe"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <!-- Forgot Password Link -->
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Forgot password?
          </NuxtLink>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || !formData.email || !formData.password"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>

        <!-- Sign Up Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink
              to="/auth/register"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </NuxtLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'guest',
  layout: false
})

const authStore = useAuthStore()
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref(null)
const success = ref(null)

// Get success message from route query
onMounted(() => {
  const route = useRoute()
  if (route.query.message) {
    success.value = String(route.query.message)
  }
})

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async (event) => {
  event.preventDefault()
  
  if (isLoading.value) return

  isLoading.value = true
  error.value = null
  
  try {
    await authStore.login(formData)
    await navigateTo('/')
  } catch (err) {
    error.value = err.data?.statusMessage || err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>