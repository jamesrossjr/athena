<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Reset your password
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below.
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

      <form @submit="handleSubmit" class="space-y-6" v-if="!success">
        <!-- Password Field -->
        <UFormGroup label="New password" required>
          <UInput
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter new password"
            required
            :disabled="isLoading"
            size="lg"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                variant="link"
                color="gray"
                @click="showPassword = !showPassword"
                :padded="false"
              />
            </template>
          </UInput>
          <template #help>
            <div class="text-xs text-gray-500 space-y-1 mt-1">
              <div class="grid grid-cols-1 gap-1">
                <span :class="passwordChecks.length ? 'text-green-600' : 'text-gray-400'">
                  ✓ At least 12 characters
                </span>
                <span :class="passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'">
                  ✓ One uppercase letter
                </span>
                <span :class="passwordChecks.lowercase ? 'text-green-600' : 'text-gray-400'">
                  ✓ One lowercase letter
                </span>
                <span :class="passwordChecks.number ? 'text-green-600' : 'text-gray-400'">
                  ✓ One number
                </span>
                <span :class="passwordChecks.special ? 'text-green-600' : 'text-gray-400'">
                  ✓ One special character
                </span>
              </div>
            </div>
          </template>
        </UFormGroup>

        <!-- Confirm Password Field -->
        <UFormGroup label="Confirm new password" required>
          <UInput
            v-model="formData.passwordConfirmation"
            :type="showPasswordConfirm ? 'text' : 'password'"
            placeholder="Confirm new password"
            required
            :disabled="isLoading"
            size="lg"
          >
            <template #trailing>
              <UButton
                :icon="showPasswordConfirm ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                variant="link"
                color="gray"
                @click="showPasswordConfirm = !showPasswordConfirm"
                :padded="false"
              />
            </template>
          </UInput>
          <template #help v-if="formData.passwordConfirmation && !passwordsMatch">
            <span class="text-xs text-red-500">Passwords don't match</span>
          </template>
        </UFormGroup>

        <!-- Submit Button -->
        <UButton
          type="submit"
          :loading="isLoading"
          :disabled="isLoading || !isFormValid"
          block
          size="lg"
        >
          {{ isLoading ? 'Resetting password...' : 'Reset password' }}
        </UButton>
      </form>

      <!-- Success State -->
      <div v-if="success" class="text-center space-y-4">
        <UButton
          to="/auth/login"
          block
          size="lg"
        >
          Continue to sign in
        </UButton>
      </div>

      <!-- Back to Sign In -->
      <div class="text-center" v-if="!success">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center justify-center gap-2"
        >
          <Icon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to sign in
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'guest',
  layout: false
})

const route = useRoute()
const authStore = useAuthStore()
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const isLoading = ref(false)
const error = ref(null)
const success = ref(null)

const token = computed(() => String(route.query.token || ''))

// Check if token is provided
onMounted(() => {
  if (!token.value) {
    error.value = 'Invalid or missing reset token'
  }
})

const formData = reactive({
  password: '',
  passwordConfirmation: ''
})

const passwordChecks = computed(() => ({
  length: formData.password.length >= 12,
  uppercase: /[A-Z]/.test(formData.password),
  lowercase: /[a-z]/.test(formData.password),
  number: /\d/.test(formData.password),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
}))

const passwordsMatch = computed(() => {
  return formData.password === formData.passwordConfirmation
})

const isFormValid = computed(() => {
  return (
    formData.password &&
    formData.passwordConfirmation &&
    passwordChecks.value.length &&
    passwordChecks.value.uppercase &&
    passwordChecks.value.lowercase &&
    passwordChecks.value.number &&
    passwordChecks.value.special &&
    passwordsMatch.value &&
    token.value
  )
})

const handleSubmit = async (event) => {
  event.preventDefault()
  
  if (isLoading.value || !isFormValid.value) return

  isLoading.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await authStore.confirmPasswordReset(
      token.value,
      formData.password,
      formData.passwordConfirmation
    )
    success.value = response.message
  } catch (err) {
    console.error('Password reset error:', err)
    if (err.data && Array.isArray(err.data)) {
      // Handle validation errors
      error.value = err.data.map(e => e.message).join(', ')
    } else {
      error.value = err.data?.statusMessage || err.message || 'Failed to reset password'
    }
  } finally {
    isLoading.value = false
  }
}
</script>