<template>
  <div class="digital-twin p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-cpu-chip" class="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900">Your AI Digital Twin</h3>
          <p class="text-sm text-gray-600">Personalized cognitive assistant</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <UBadge 
          :label="`${Math.round(cognitiveProfile?.modelConfidence * 100)}% learned`"
          :color="getConfidenceColor(cognitiveProfile?.modelConfidence)"
          variant="subtle"
        />
        <UButton variant="ghost" icon="i-heroicons-cog-6-tooth" @click="showSettings = true" />
      </div>
    </div>

    <!-- Cognitive Profile Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg p-4 border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-puzzle-piece" class="w-4 h-4 text-purple-500" />
          <span class="text-sm font-medium text-gray-700">Organization</span>
        </div>
        <div class="text-lg font-bold text-gray-900 capitalize">
          {{ cognitiveProfile?.organizationStyle || 'Learning...' }}
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-blue-500" />
          <span class="text-sm font-medium text-gray-700">Writing Style</span>
        </div>
        <div class="text-lg font-bold text-gray-900 capitalize">
          {{ cognitiveProfile?.writingStyle?.tone || 'Learning...' }}
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-brain" class="w-4 h-4 text-green-500" />
          <span class="text-sm font-medium text-gray-700">Thinking</span>
        </div>
        <div class="text-lg font-bold text-gray-900 capitalize">
          {{ cognitiveProfile?.thinkingPatterns?.problemSolving || 'Learning...' }}
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-100">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-orange-500" />
          <span class="text-sm font-medium text-gray-700">Peak Hours</span>
        </div>
        <div class="text-lg font-bold text-gray-900">
          {{ getPeakHoursText(cognitiveProfile?.workPatterns?.peakProductivityHours) }}
        </div>
      </div>
    </div>

    <!-- AI Ghostwriting -->
    <div class="bg-white rounded-lg p-6 mb-6 border border-gray-100">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-purple-500" />
        <h4 class="text-lg font-semibold text-gray-900">AI Ghostwriting</h4>
        <UBadge label="Beta" color="purple" variant="subtle" size="sm" />
      </div>
      
      <div class="space-y-4">
        <UTextarea
          v-model="ghostwritePrompt"
          placeholder="Describe what you'd like me to write in your style..."
          :rows="3"
        />
        
        <div class="flex gap-3">
          <USelectMenu
            v-model="ghostwriteType"
            :options="ghostwriteOptions"
            class="w-40"
          />
          <USelectMenu
            v-model="ghostwriteLength"
            :options="lengthOptions"
            class="w-32"
          />
          <UButton 
            @click="generateContent"
            :loading="generatingContent"
            :disabled="!ghostwritePrompt.trim()"
          >
            <template #leading>
              <UIcon name="i-heroicons-cpu-chip" />
            </template>
            Generate
          </UButton>
        </div>
      </div>

      <!-- Generated Content -->
      <div v-if="generatedContent" class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">Generated Content</span>
          <div class="flex gap-2">
            <UButton variant="ghost" size="xs" @click="copyContent">
              <template #leading>
                <UIcon name="i-heroicons-clipboard" />
              </template>
              Copy
            </UButton>
            <UButton variant="ghost" size="xs" @click="insertContent">
              <template #leading>
                <UIcon name="i-heroicons-plus" />
              </template>
              Insert
            </UButton>
          </div>
        </div>
        <div class="prose prose-sm max-w-none text-gray-800" v-html="formattedContent" />
      </div>
    </div>

    <!-- Predictive Knowledge Discovery -->
    <div class="bg-white rounded-lg p-6 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-yellow-500" />
          <h4 class="text-lg font-semibold text-gray-900">Knowledge Predictions</h4>
        </div>
        <UButton variant="ghost" size="sm" @click="refreshPredictions" :loading="loadingPredictions">
          <template #leading>
            <UIcon name="i-heroicons-arrow-path" />
          </template>
          Refresh
        </UButton>
      </div>

      <div v-if="loadingPredictions" class="space-y-3">
        <div v-for="n in 3" :key="n" class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="predictions.length === 0" class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Building your knowledge predictions...</p>
        <p class="text-sm">Use Athena more to see personalized suggestions</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="prediction in predictions.slice(0, 5)"
          :key="prediction.title"
          class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          @click="handlePredictionClick(prediction)"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <UIcon 
                :name="getPredictionIcon(prediction.type)" 
                class="w-4 h-4 flex-shrink-0"
                :class="getPredictionIconColor(prediction.type)"
              />
              <h5 class="font-medium text-gray-900">{{ prediction.title }}</h5>
            </div>
            <div class="flex items-center gap-2">
              <UBadge 
                :label="prediction.urgency" 
                :color="getUrgencyColor(prediction.urgency)"
                size="xs"
              />
              <span class="text-xs text-gray-500">{{ prediction.estimatedTimeToRead }}</span>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 mb-3">{{ prediction.description }}</p>
          
          <div class="flex gap-2">
            <UButton
              v-for="action in prediction.actions.slice(0, 2)"
              :key="action.action"
              :variant="action.primary ? 'solid' : 'ghost'"
              size="xs"
              @click.stop="handleActionClick(prediction, action)"
            >
              <template #leading>
                <UIcon :name="action.icon" />
              </template>
              {{ action.label }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <UModal v-model="showSettings">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">AI Digital Twin Settings</h3>
        </template>

        <div class="space-y-6">
          <!-- Learning Preferences -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Learning Preferences</h4>
            <div class="space-y-3">
              <UToggle v-model="settings.enableLearning" label="Enable cognitive learning" />
              <UToggle v-model="settings.enablePredictions" label="Enable knowledge predictions" />
              <UToggle v-model="settings.enableGhostwriting" label="Enable AI ghostwriting" />
            </div>
          </div>

          <!-- Privacy Controls -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Privacy Controls</h4>
            <div class="space-y-3">
              <UToggle v-model="settings.shareAnonymizedData" label="Share anonymized learning data" />
              <UToggle v-model="settings.crossDocumentLearning" label="Learn across all documents" />
              <UToggle v-model="settings.externalDataSources" label="Connect to external data sources" />
            </div>
          </div>

          <!-- Data Management -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Data Management</h4>
            <div class="space-y-3">
              <UButton variant="outline" @click="exportCognitiveProfile">
                <template #leading>
                  <UIcon name="i-heroicons-arrow-down-tray" />
                </template>
                Export Cognitive Profile
              </UButton>
              <UButton variant="outline" color="red" @click="resetCognitiveProfile">
                <template #leading>
                  <UIcon name="i-heroicons-trash" />
                </template>
                Reset Learning Data
              </UButton>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showSettings = false">
              Cancel
            </UButton>
            <UButton @click="saveSettings">
              Save Settings
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface CognitiveProfile {
  userId: string
  organizationStyle: string
  writingStyle: {
    tone: string
    sentenceLength: string
    vocabularyLevel: string
    commonPhrases: string[]
  }
  thinkingPatterns: {
    decisionMaking: string
    problemSolving: string
    informationProcessing: string
    planningStyle: string
  }
  workPatterns: {
    peakProductivityHours: number[]
    averageSessionLength: number
    focusAreas: string[]
  }
  modelConfidence: number
  lastUpdated: string
}

interface Prediction {
  type: string
  title: string
  description: string
  relevanceScore: number
  urgency: string
  estimatedTimeToRead: string
  actions: Array<{
    label: string
    action: string
    icon: string
    primary?: boolean
  }>
}

// Reactive state
const cognitiveProfile = ref<CognitiveProfile | null>(null)
const predictions = ref<Prediction[]>([])
const loadingPredictions = ref(false)
const showSettings = ref(false)
const ghostwritePrompt = ref('')
const ghostwriteType = ref('document')
const ghostwriteLength = ref('medium')
const generatingContent = ref(false)
const generatedContent = ref('')

// Settings
const settings = ref({
  enableLearning: true,
  enablePredictions: true,
  enableGhostwriting: true,
  shareAnonymizedData: false,
  crossDocumentLearning: true,
  externalDataSources: false
})

// Options
const ghostwriteOptions = [
  { label: 'Document', value: 'document' },
  { label: 'Email', value: 'email' },
  { label: 'Summary', value: 'summary' },
  { label: 'Plan', value: 'plan' },
  { label: 'Notes', value: 'notes' },
  { label: 'Proposal', value: 'proposal' }
]

const lengthOptions = [
  { label: 'Short', value: 'short' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' }
]

// Computed
const formattedContent = computed(() => {
  return generatedContent.value.replace(/\n/g, '<br>')
})

// Load cognitive profile and predictions
onMounted(async () => {
  await loadCognitiveProfile()
  await loadPredictions()
})

// Methods
const loadCognitiveProfile = async () => {
  try {
    const response = await $fetch('/api/ai/cognitive-profile')
    cognitiveProfile.value = response.profile
  } catch (error) {
    console.error('Failed to load cognitive profile:', error)
  }
}

const loadPredictions = async () => {
  loadingPredictions.value = true
  try {
    const response = await $fetch('/api/ai/predict-needs?limit=10')
    predictions.value = response.predictions
  } catch (error) {
    console.error('Failed to load predictions:', error)
  } finally {
    loadingPredictions.value = false
  }
}

const refreshPredictions = async () => {
  await loadPredictions()
}

const generateContent = async () => {
  if (!ghostwritePrompt.value.trim()) return

  generatingContent.value = true
  try {
    const response = await $fetch('/api/ai/ghostwrite', {
      method: 'POST',
      body: {
        prompt: ghostwritePrompt.value,
        contentType: ghostwriteType.value,
        length: ghostwriteLength.value
      }
    })
    
    generatedContent.value = response.content
  } catch (error) {
    console.error('Failed to generate content:', error)
    const toast = useToast()
    toast.add({
      title: 'Generation Failed',
      description: 'Failed to generate content. Please try again.',
      color: 'red'
    })
  } finally {
    generatingContent.value = false
  }
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(generatedContent.value)
    const toast = useToast()
    toast.add({
      title: 'Copied!',
      description: 'Content copied to clipboard'
    })
  } catch (error) {
    console.error('Failed to copy content:', error)
  }
}

const insertContent = () => {
  // Emit event for parent component to handle insertion
  const event = new CustomEvent('insert-content', {
    detail: { content: generatedContent.value }
  })
  window.dispatchEvent(event)
  
  const toast = useToast()
  toast.add({
    title: 'Content Inserted',
    description: 'Generated content has been inserted'
  })
}

const handlePredictionClick = (prediction: Prediction) => {
  // Handle prediction click - could open in new tab, create document, etc.
  console.log('Prediction clicked:', prediction)
}

const handleActionClick = (prediction: Prediction, action: any) => {
  // Handle specific action click
  console.log('Action clicked:', action, prediction)
  
  const toast = useToast()
  toast.add({
    title: `${action.label} Started`,
    description: `Processing "${prediction.title}"`
  })
}

const saveSettings = () => {
  // Save settings to backend
  console.log('Saving settings:', settings.value)
  showSettings.value = false
  
  const toast = useToast()
  toast.add({
    title: 'Settings Saved',
    description: 'Your AI preferences have been updated'
  })
}

const exportCognitiveProfile = () => {
  if (!cognitiveProfile.value) return
  
  const data = JSON.stringify(cognitiveProfile.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = 'cognitive-profile.json'
  link.click()
  
  URL.revokeObjectURL(url)
}

const resetCognitiveProfile = () => {
  if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
    // Call API to reset profile
    console.log('Resetting cognitive profile')
    
    const toast = useToast()
    toast.add({
      title: 'Profile Reset',
      description: 'Your AI will start learning from scratch'
    })
  }
}

// Helper functions
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'green'
  if (confidence >= 0.6) return 'yellow'
  if (confidence >= 0.3) return 'orange'
  return 'red'
}

const getPeakHoursText = (hours: number[]): string => {
  if (!hours || hours.length === 0) return 'Learning...'
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }
  
  if (hours.length <= 2) {
    return hours.map(formatHour).join(', ')
  }
  
  return `${formatHour(hours[0])} - ${formatHour(hours[hours.length - 1])}`
}

const getPredictionIcon = (type: string): string => {
  const icons = {
    research_paper: 'i-heroicons-academic-cap',
    news_article: 'i-heroicons-newspaper',
    tool: 'i-heroicons-wrench',
    connection: 'i-heroicons-user-plus',
    insight: 'i-heroicons-light-bulb'
  }
  return icons[type] || 'i-heroicons-information-circle'
}

const getPredictionIconColor = (type: string): string => {
  const colors = {
    research_paper: 'text-blue-500',
    news_article: 'text-green-500',
    tool: 'text-purple-500',
    connection: 'text-orange-500',
    insight: 'text-yellow-500'
  }
  return colors[type] || 'text-gray-500'
}

const getUrgencyColor = (urgency: string): string => {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'gray'
  }
  return colors[urgency] || 'gray'
}
</script>

<style scoped>
.digital-twin {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.05) 0%, 
    rgba(59, 130, 246, 0.05) 100%);
}
</style>