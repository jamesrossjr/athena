<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Forgot your password?
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <!-- Error Message -->
      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="subtle"
        :title="error"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
        @close="error = null"
      />

      <!-- Success Message -->
      <UAlert
        v-if="success"
        icon="i-heroicons-check-circle"
        color="green"
        variant="subtle"
        :title="success"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
        @close="success = null"
      />

      <form @submit="handleSubmit" class="space-y-6">
        <!-- Email Field -->
        <UFormGroup label="Email address" required>
          <UInput
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="isLoading"
            size="lg"
          />
        </UFormGroup>

        <!-- Submit Button -->
        <UButton
          type="submit"
          :loading="isLoading"
          :disabled="isLoading || !email"
          block
          size="lg"
        >
          {{ isLoading ? 'Sending...' : 'Send reset instructions' }}
        </UButton>

        <!-- Back to Sign In -->
        <div class="text-center">
          <NuxtLink
            to="/auth/login"
            class="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center justify-center gap-2"
          >
            <Icon name="i-heroicons-arrow-left" class="w-4 h-4" />
            Back to sign in
          </NuxtLink>
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
const email = ref('')
const isLoading = ref(false)
const error = ref(null)
const success = ref(null)

const handleSubmit = async (event) => {
  event.preventDefault()
  
  if (isLoading.value || !email.value) return

  isLoading.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await authStore.requestPasswordReset(email.value)
    success.value = response.message
    email.value = '' // Clear the form
  } catch (err) {
    error.value = err.data?.statusMessage || err.message || 'Failed to send reset instructions'
  } finally {
    isLoading.value = false
  }
}
</script>