<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join Athena and start organizing your thoughts.
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

      <form @submit="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- First Name -->
          <UFormGroup label="First name">
            <UInput
              v-model="formData.firstName"
              placeholder="First name"
              :disabled="isLoading"
            />
          </UFormGroup>

          <!-- Last Name -->
          <UFormGroup label="Last name">
            <UInput
              v-model="formData.lastName"
              placeholder="Last name"
              :disabled="isLoading"
            />
          </UFormGroup>
        </div>

        <!-- Email Field -->
        <UFormGroup label="Email address" required>
          <UInput
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="isLoading"
            size="lg"
          />
        </UFormGroup>

        <!-- Password Field -->
        <UFormGroup label="Password" required>
          <UInput
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Create a password"
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
        <UFormGroup label="Confirm password" required>
          <UInput
            v-model="formData.passwordConfirmation"
            :type="showPasswordConfirm ? 'text' : 'password'"
            placeholder="Confirm your password"
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
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </UButton>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <!-- Google Sign Up -->
        <UButton
          @click="signUpWithGoogle"
          :loading="isGoogleLoading"
          :disabled="isLoading || isGoogleLoading"
          variant="outline"
          block
          size="lg"
        >
          <template #leading>
            <Icon name="logos:google-icon" class="w-5 h-5" />
          </template>
          {{ isGoogleLoading ? 'Signing up with Google...' : 'Sign up with Google' }}
        </UButton>

        <!-- Sign In Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <NuxtLink
              to="/auth/login"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Sign in
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
const showPasswordConfirm = ref(false)
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const error = ref(null)

const formData = reactive({
  email: '',
  password: '',
  passwordConfirmation: '',
  firstName: '',
  lastName: ''
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
    formData.email &&
    formData.password &&
    formData.passwordConfirmation &&
    passwordChecks.value.length &&
    passwordChecks.value.uppercase &&
    passwordChecks.value.lowercase &&
    passwordChecks.value.number &&
    passwordChecks.value.special &&
    passwordsMatch.value
  )
})

const handleSubmit = async (event) => {
  event.preventDefault()
  
  if (isLoading.value || !isFormValid.value) return

  isLoading.value = true
  error.value = null
  
  try {
    await authStore.register(formData)
    await navigateTo('/')
  } catch (err) {
    console.error('Registration error:', err)
    if (err.data && Array.isArray(err.data)) {
      // Handle validation errors
      error.value = err.data.map(e => e.message).join(', ')
    } else {
      error.value = err.data?.statusMessage || err.message || 'Registration failed'
    }
  } finally {
    isLoading.value = false
  }
}

const signUpWithGoogle = async () => {
  if (isGoogleLoading.value || isLoading.value) return

  isGoogleLoading.value = true
  error.value = null

  try {
    // Note: This would require Google Sign-In JavaScript SDK
    // For now, show a placeholder message
    error.value = 'Google Sign-In requires additional setup. Please use email/password or contact administrator.'
  } catch (err) {
    error.value = err.data?.statusMessage || err.message || 'Google sign-up failed'
  } finally {
    isGoogleLoading.value = false
  }
}
</script>