<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">AI Dashboard</h1>
        <p class="text-gray-600">
          Your proactive AI assistant is working behind the scenes to help you stay organized and productive.
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-sparkles" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.activeSuggestions }}</p>
              <p class="text-sm text-gray-600">Active Suggestions</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.automationRules }}</p>
              <p class="text-sm text-gray-600">Automation Rules</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 rounded-lg">
              <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.automationExecutions }}</p>
              <p class="text-sm text-gray-600">This Week</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-orange-100 rounded-lg">
              <UIcon name="i-heroicons-clock" class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.timeSaved }}</p>
              <p class="text-sm text-gray-600">Hours Saved</p>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Smart Suggestions -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold">Smart Suggestions</h2>
                <UButton @click="refreshSuggestions" size="sm" variant="outline" :loading="loadingSuggestions">
                  Refresh
                </UButton>
              </div>
            </template>

            <div v-if="loadingSuggestions" class="space-y-4">
              <div v-for="i in 3" :key="i" class="p-4 border border-gray-200 rounded-lg">
                <div class="loading-skeleton h-5 w-3/4 mb-2"></div>
                <div class="loading-skeleton h-4 w-full mb-3"></div>
                <div class="loading-skeleton h-8 w-24"></div>
              </div>
            </div>

            <div v-else-if="suggestions.length === 0" class="text-center py-8">
              <div class="text-4xl mb-4">🤖</div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p class="text-gray-600">No new suggestions at the moment. Keep working and I'll find ways to help.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900 mb-1">{{ suggestion.title }}</h3>
                    <p class="text-sm text-gray-600">{{ suggestion.description }}</p>
                  </div>
                  <UBadge :color="getConfidenceColor(suggestion.confidence)" variant="soft">
                    {{ Math.round(suggestion.confidence * 100) }}% confident
                  </UBadge>
                </div>
                
                <div class="flex gap-2">
                  <UButton
                    v-for="action in suggestion.actions.filter(a => a.type !== 'dismiss')"
                    :key="action.id"
                    size="sm"
                    @click="executeSuggestionAction(suggestion, action)"
                  >
                    {{ action.label }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    @click="dismissSuggestion(suggestion.id)"
                  >
                    Dismiss
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Automation Rules -->
        <div>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Automation Rules</h2>
                <UButton @click="showCreateRuleModal = true" size="sm">
                  Create Rule
                </UButton>
              </div>
            </template>

            <div v-if="loadingRules" class="space-y-3">
              <div v-for="i in 3" :key="i" class="p-3 border border-gray-200 rounded">
                <div class="loading-skeleton h-4 w-3/4 mb-2"></div>
                <div class="loading-skeleton h-3 w-1/2"></div>
              </div>
            </div>

            <div v-else-if="automationRules.length === 0" class="text-center py-6">
              <div class="text-3xl mb-3">⚙️</div>
              <p class="text-sm text-gray-600 mb-3">No automation rules yet</p>
              <UButton @click="showCreateRuleModal = true" size="sm">
                Create Your First Rule
              </UButton>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="rule in automationRules"
                :key="rule.id"
                class="p-3 border border-gray-200 rounded hover:border-blue-300 transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-sm">{{ rule.name }}</h3>
                  <UToggle v-model="rule.enabled" @change="toggleRule(rule)" />
                </div>
                <p class="text-xs text-gray-600 mb-2">{{ rule.description }}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{{ rule.executionCount }} executions</span>
                  <span v-if="rule.lastExecutedAt">
                    {{ formatRelativeTime(rule.lastExecutedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Daily Briefing Preview -->
          <UCard class="mt-6">
            <template #header>
              <h3 class="text-lg font-semibold">Today's Briefing</h3>
            </template>

            <div v-if="dailyBriefing" class="space-y-3">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="text-center p-2 bg-blue-50 rounded">
                  <div class="font-medium text-blue-900">{{ dailyBriefing.metrics.documentsUpdated }}</div>
                  <div class="text-blue-600">Documents</div>
                </div>
                <div class="text-center p-2 bg-green-50 rounded">
                  <div class="font-medium text-green-900">{{ dailyBriefing.metrics.aiInteractions }}</div>
                  <div class="text-green-600">AI Actions</div>
                </div>
              </div>
              
              <UButton @click="navigateTo('/ai/briefing')" block variant="outline" size="sm">
                View Full Briefing
              </UButton>
            </div>

            <div v-else class="text-center py-4">
              <p class="text-sm text-gray-600 mb-3">Generating your daily briefing...</p>
              <UButton @click="loadDailyBriefing" size="sm" variant="outline">
                Generate Now
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Create Automation Rule Modal -->
      <UModal v-model="showCreateRuleModal">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Create Automation Rule</h3>
          </template>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <UInput v-model="newRule.name" placeholder="e.g. Auto-tag meeting notes" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
              <USelect
                v-model="newRule.trigger"
                :options="triggerOptions"
                placeholder="When should this rule run?"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <USelect
                v-model="newRule.action"
                :options="actionOptions"
                placeholder="What should happen?"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <UTextarea v-model="newRule.description" placeholder="Describe what this rule does..." :rows="3" />
            </div>
          </div>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showCreateRuleModal = false">Cancel</UButton>
              <UButton @click="createAutomationRule" :loading="creatingRule">Create Rule</UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'AI Dashboard - Athena'
})

// Reactive data
const stats = ref({
  activeSuggestions: 4,
  automationRules: 2,
  automationExecutions: 12,
  timeSaved: 3.5
})

const suggestions = ref([])
const automationRules = ref([])
const dailyBriefing = ref(null)

const loadingSuggestions = ref(true)
const loadingRules = ref(true)
const showCreateRuleModal = ref(false)
const creatingRule = ref(false)

// New rule form
const newRule = ref({
  name: '',
  trigger: '',
  action: '',
  description: ''
})

const triggerOptions = [
  { label: 'Document Created', value: 'document_created' },
  { label: 'Document Updated', value: 'document_updated' },
  { label: 'Document Tagged', value: 'document_tagged' },
  { label: 'Daily Schedule', value: 'schedule' }
]

const actionOptions = [
  { label: 'AI Summarize', value: 'ai_summarize' },
  { label: 'Extract Tasks', value: 'ai_extract_tasks' },
  { label: 'Add Tag', value: 'add_tag' },
  { label: 'Send Notification', value: 'send_notification' }
]

onMounted(() => {
  loadData()
})

async function loadData() {
  await Promise.all([
    loadSuggestions(),
    loadAutomationRules(),
    loadDailyBriefing()
  ])
}

async function loadSuggestions() {
  try {
    loadingSuggestions.value = true
    
    // Mock data for demo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    suggestions.value = [
      {
        id: '1',
        type: 'organize_documents',
        title: 'Organize "meeting" documents',
        description: 'You have 5 documents related to "meeting". Consider creating a dedicated workspace.',
        confidence: 0.85,
        actions: [
          { id: 'create-workspace', label: 'Create Workspace', type: 'primary' },
          { id: 'dismiss', label: 'Not Now', type: 'dismiss' }
        ]
      },
      {
        id: '2',
        type: 'improve_content',
        title: 'Expand document content',
        description: '"Project Ideas" could benefit from additional content. Let AI help you expand it.',
        confidence: 0.72,
        actions: [
          { id: 'ai-expand', label: 'Expand with AI', type: 'primary' },
          { id: 'dismiss', label: 'Leave As Is', type: 'dismiss' }
        ]
      }
    ]
  } catch (error) {
    console.error('Failed to load suggestions:', error)
  } finally {
    loadingSuggestions.value = false
  }
}

async function loadAutomationRules() {
  try {
    loadingRules.value = true
    
    // Mock data for demo
    await new Promise(resolve => setTimeout(resolve, 800))
    
    automationRules.value = [
      {
        id: '1',
        name: 'Auto-tag meeting notes',
        description: 'Automatically tag documents containing "meeting" or "agenda"',
        enabled: true,
        executionCount: 8,
        lastExecutedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        name: 'Daily summary',
        description: 'Generate daily summary of document activity',
        enabled: false,
        executionCount: 0,
        lastExecutedAt: null
      }
    ]
  } catch (error) {
    console.error('Failed to load automation rules:', error)
  } finally {
    loadingRules.value = false
  }
}

async function loadDailyBriefing() {
  try {
    // Mock data for demo
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    dailyBriefing.value = {
      metrics: {
        documentsUpdated: 7,
        documentsCreated: 2,
        aiInteractions: 5,
        collaborationEvents: 3
      }
    }
  } catch (error) {
    console.error('Failed to load daily briefing:', error)
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return 'green'
  if (confidence >= 0.6) return 'blue'
  return 'orange'
}

function formatRelativeTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
}

async function refreshSuggestions() {
  await loadSuggestions()
  
  const toast = useToast()
  toast.add({
    title: 'Suggestions Refreshed',
    description: 'AI suggestions have been updated based on your latest activity.',
    color: 'green'
  })
}

async function executeSuggestionAction(suggestion: any, action: any) {
  const toast = useToast()
  toast.add({
    title: 'Action Executed',
    description: `Executed "${action.label}" for suggestion "${suggestion.title}"`,
    color: 'blue'
  })
  
  // Remove suggestion from list
  suggestions.value = suggestions.value.filter((s: any) => s.id !== suggestion.id)
}

async function dismissSuggestion(suggestionId: string) {
  suggestions.value = suggestions.value.filter((s: any) => s.id !== suggestionId)
  
  const toast = useToast()
  toast.add({
    title: 'Suggestion Dismissed',
    description: 'This suggestion has been dismissed.',
    color: 'gray'
  })
}

async function toggleRule(rule: any) {
  const toast = useToast()
  toast.add({
    title: rule.enabled ? 'Rule Enabled' : 'Rule Disabled',
    description: `"${rule.name}" has been ${rule.enabled ? 'enabled' : 'disabled'}.`,
    color: rule.enabled ? 'green' : 'gray'
  })
}

async function createAutomationRule() {
  if (!newRule.value.name || !newRule.value.trigger || !newRule.value.action) {
    const toast = useToast()
    toast.add({
      title: 'Missing Information',
      description: 'Please fill in all required fields.',
      color: 'red'
    })
    return
  }
  
  creatingRule.value = true
  
  try {
    // Mock creation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const rule = {
      id: Date.now().toString(),
      name: newRule.value.name,
      description: newRule.value.description,
      enabled: true,
      executionCount: 0,
      lastExecutedAt: null
    }
    
    automationRules.value.push(rule)
    
    // Reset form
    newRule.value = { name: '', trigger: '', action: '', description: '' }
    showCreateRuleModal.value = false
    
    const toast = useToast()
    toast.add({
      title: 'Rule Created',
      description: `"${rule.name}" automation rule has been created.`,
      color: 'green'
    })
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: 'Creation Failed',
      description: 'Failed to create automation rule. Please try again.',
      color: 'red'
    })
  } finally {
    creatingRule.value = false
  }
}
</script>