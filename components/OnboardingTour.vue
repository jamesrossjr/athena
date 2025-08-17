<script setup lang="ts">
interface TourStep {
  id: string
  title: string
  content: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

const isActive = ref(false)
const currentStep = ref(0)
const isCompleted = ref(false)

const steps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Athena! 🎉',
    content: 'Athena is your intelligent collaborative workspace. Let\'s take a quick tour to get you started.',
    target: 'body',
    position: 'bottom'
  },
  {
    id: 'command-palette',
    title: 'Command Palette ⚡',
    content: 'Press Ctrl+K (⌘K on Mac) to open the command palette. It\'s your gateway to everything in Athena.',
    target: 'body',
    position: 'bottom',
    action: () => {
      const store = useCommandPaletteStore()
      store.open()
    }
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant 🤖',
    content: 'Your AI assistant is always ready to help. Click the floating button to get context-aware assistance.',
    target: '[data-tour="ai-assistant"]',
    position: 'left'
  },
  {
    id: 'create-document',
    title: 'Create Your First Document 📝',
    content: 'Ready to create your first document? Try the demo or use one of our templates to get started quickly.',
    target: 'body',
    position: 'bottom'
  }
]

onMounted(() => {
  // Check if user has completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('athena-onboarding-completed')
  if (!hasCompletedOnboarding) {
    setTimeout(() => {
      startTour()
    }, 1000) // Delay to ensure page is loaded
  }
})

function startTour() {
  isActive.value = true
  currentStep.value = 0
  isCompleted.value = false
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    executeStepAction()
  } else {
    completeTour()
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function skipTour() {
  completeTour()
}

function completeTour() {
  isActive.value = false
  isCompleted.value = true
  localStorage.setItem('athena-onboarding-completed', 'true')
  
  const toast = useToast()
  toast.add({
    title: 'Welcome aboard! 🚀',
    description: 'You\'re all set! Start creating amazing documents.',
    color: 'green'
  })
}

function executeStepAction() {
  const step = steps[currentStep.value]
  if (step.action) {
    step.action()
  }
}

const currentStepData = computed(() => steps[currentStep.value])

// Reset onboarding (for development)
function resetOnboarding() {
  localStorage.removeItem('athena-onboarding-completed')
  startTour()
}

defineExpose({ startTour, resetOnboarding })
</script>

<template>
  <div v-if="isActive" class="fixed inset-0 z-50 pointer-events-none">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto" @click="skipTour"></div>
    
    <!-- Tour Step -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
      <UCard class="max-w-md">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ currentStepData.title }}</h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="skipTour"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-600">{{ currentStepData.content }}</p>
          
          <!-- Progress indicator -->
          <div class="flex items-center gap-2">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="w-2 h-2 rounded-full transition-colors"
              :class="index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'"
            ></div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              Step {{ currentStep + 1 }} of {{ steps.length }}
            </div>
            
            <div class="flex gap-2">
              <UButton
                v-if="currentStep > 0"
                variant="ghost"
                size="sm"
                @click="previousStep"
              >
                Previous
              </UButton>
              
              <UButton
                variant="ghost"
                size="sm"
                @click="skipTour"
              >
                Skip Tour
              </UButton>
              
              <UButton
                size="sm"
                @click="nextStep"
              >
                {{ currentStep === steps.length - 1 ? 'Finish' : 'Next' }}
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>