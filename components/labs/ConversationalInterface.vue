<template>
  <div class="conversational-interface h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
    <!-- Voice Status Indicator -->
    <div 
      v-if="isListening || isSpeaking"
      class="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-4 border-2"
      :class="isListening ? 'border-red-400 animate-pulse' : 'border-blue-400'"
    >
      <div class="flex items-center gap-3">
        <div class="relative">
          <UIcon 
            :name="isListening ? 'i-heroicons-microphone' : 'i-heroicons-speaker-wave'"
            class="w-6 h-6"
            :class="isListening ? 'text-red-500' : 'text-blue-500'"
          />
          <!-- Audio Visualization -->
          <div v-if="isListening" class="absolute -inset-2">
            <div 
              v-for="i in 3" 
              :key="i"
              class="absolute inset-0 border-2 border-red-400 rounded-full animate-ping"
              :style="{ animationDelay: `${i * 0.3}s`, animationDuration: '1.5s' }"
            />
          </div>
        </div>
        <div class="text-sm font-medium">
          {{ isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : '' }}
        </div>
      </div>
    </div>

    <!-- Conversation History -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center py-12">
        <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-10 h-10 text-white" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-3">Hello! I'm your AI assistant</h2>
        <p class="text-gray-600 mb-6 max-w-md mx-auto">
          You can speak to me naturally or type your questions. I can help you with documents, research, planning, and more.
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton 
            v-for="suggestion in quickSuggestions"
            :key="suggestion"
            variant="outline"
            size="sm"
            @click="sendMessage(suggestion)"
          >
            {{ suggestion }}
          </UButton>
        </div>
      </div>

      <!-- Messages -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="flex gap-4"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <!-- Avatar -->
        <div 
          v-if="message.role === 'assistant'"
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-white" />
        </div>

        <!-- Message Content -->
        <div 
          class="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl"
          :class="message.role === 'user' ? 'order-first' : ''"
        >
          <div
            class="rounded-2xl px-4 py-3"
            :class="message.role === 'user' 
              ? 'bg-blue-500 text-white ml-auto' 
              : 'bg-white border border-gray-200 shadow-sm'"
          >
            <!-- Voice Input Indicator -->
            <div 
              v-if="message.inputType === 'voice'"
              class="flex items-center gap-2 mb-2 text-xs opacity-60"
            >
              <UIcon name="i-heroicons-microphone" class="w-3 h-3" />
              <span>Voice input</span>
            </div>

            <!-- Message Text -->
            <div 
              class="prose prose-sm max-w-none"
              :class="message.role === 'user' ? 'prose-invert' : ''"
              v-html="renderMessage(message.content)"
            />

            <!-- Actions for Assistant Messages -->
            <div v-if="message.role === 'assistant' && message.actions" class="mt-3 flex flex-wrap gap-2">
              <UButton
                v-for="action in message.actions"
                :key="action.label"
                size="xs"
                variant="outline"
                @click="executeAction(action)"
              >
                <template #leading>
                  <UIcon :name="action.icon" />
                </template>
                {{ action.label }}
              </UButton>
            </div>

            <!-- Speaker Button for Assistant Messages -->
            <div v-if="message.role === 'assistant'" class="mt-2 flex justify-end">
              <UButton
                variant="ghost"
                size="xs"
                @click="speakMessage(message.content)"
                :loading="speakingMessageId === message.id"
              >
                <template #leading>
                  <UIcon name="i-heroicons-speaker-wave" />
                </template>
                Speak
              </UButton>
            </div>
          </div>

          <!-- Timestamp -->
          <div class="text-xs text-gray-500 mt-1 px-2">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>

        <!-- User Avatar -->
        <div 
          v-if="message.role === 'user'"
          class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="flex gap-4">
        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-white" />
        </div>
        <div class="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3">
          <div class="flex space-x-1">
            <div 
              v-for="i in 3" 
              :key="i"
              class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              :style="{ animationDelay: `${i * 0.15}s` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 p-4 bg-white">
      <!-- Context Indicators -->
      <div v-if="activeContext.length > 0" class="mb-3">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="context in activeContext"
            :key="context.id"
            class="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            <UIcon :name="getContextIcon(context.type)" class="w-3 h-3" />
            <span>{{ context.label }}</span>
            <button @click="removeContext(context.id)" class="hover:bg-blue-200 rounded-full p-0.5">
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Input Form -->
      <div class="flex gap-3 items-end">
        <!-- Voice Input Button -->
        <UButton
          :variant="isListening ? 'solid' : 'outline'"
          :color="isListening ? 'red' : 'gray'"
          @click="toggleVoiceInput"
          class="flex-shrink-0"
        >
          <template #leading>
            <UIcon 
              :name="isListening ? 'i-heroicons-stop' : 'i-heroicons-microphone'"
              class="w-4 h-4"
            />
          </template>
          {{ isListening ? 'Stop' : 'Voice' }}
        </UButton>

        <!-- Text Input -->
        <div class="flex-1 relative">
          <UTextarea
            v-model="inputMessage"
            placeholder="Type your message or use voice input..."
            :rows="1"
            :maxrows="4"
            @keydown.enter.exact.prevent="sendTextMessage"
            @keydown.shift.enter.exact="newLine"
            :disabled="isListening"
          />
          
          <!-- Voice Transcription Overlay -->
          <div
            v-if="isListening && voiceTranscription"
            class="absolute inset-0 bg-red-50 border border-red-200 rounded-md p-3 text-red-800"
          >
            {{ voiceTranscription }}
            <div class="text-xs text-red-600 mt-1">Listening... (speak now)</div>
          </div>
        </div>

        <!-- Send Button -->
        <UButton
          @click="sendTextMessage"
          :disabled="!inputMessage.trim() || isListening"
          :loading="isTyping"
        >
          <template #leading>
            <UIcon name="i-heroicons-paper-airplane" />
          </template>
          Send
        </UButton>
      </div>

      <!-- Quick Actions -->
      <div class="mt-3 flex flex-wrap gap-2">
        <UButton
          v-for="action in quickActions"
          :key="action.label"
          variant="ghost"
          size="xs"
          @click="executeQuickAction(action)"
        >
          <template #leading>
            <UIcon :name="action.icon" />
          </template>
          {{ action.label }}
        </UButton>
      </div>
    </div>

    <!-- Voice Permissions Modal -->
    <UModal v-model="showVoicePermissionModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Enable Voice Input</h3>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-600">
            To use voice input, please allow microphone access when prompted by your browser.
          </p>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 mt-0.5" />
              <div class="text-sm text-blue-800">
                <div class="font-medium mb-1">Privacy Notice</div>
                <div>Voice input is processed locally when possible. For advanced AI features, voice may be sent to our secure servers.</div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showVoicePermissionModal = false">
              Cancel
            </UButton>
            <UButton @click="requestVoicePermission">
              Enable Voice Input
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  inputType?: 'text' | 'voice'
  actions?: Array<{
    label: string
    icon: string
    action: string
    data?: any
  }>
}

interface Context {
  id: string
  type: 'document' | 'workspace' | 'search' | 'task'
  label: string
  data: any
}

interface QuickAction {
  label: string
  icon: string
  action: string
  prompt?: string
}

// Reactive state
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isListening = ref(false)
const isSpeaking = ref(false)
const isTyping = ref(false)
const voiceTranscription = ref('')
const speakingMessageId = ref<string | null>(null)
const showVoicePermissionModal = ref(false)
const activeContext = ref<Context[]>([])

// Voice recognition and synthesis
const recognition = ref<SpeechRecognition | null>(null)
const speechSynthesis = ref<SpeechSynthesis | null>(null)
const voices = ref<SpeechSynthesisVoice[]>([])

// Quick suggestions for new users
const quickSuggestions = [
  "What can you help me with?",
  "Create a new document",
  "Summarize my recent work",
  "What's on my schedule today?"
]

// Quick action buttons
const quickActions: QuickAction[] = [
  {
    label: 'Create Document',
    icon: 'i-heroicons-document-plus',
    action: 'create_document',
    prompt: 'Create a new document'
  },
  {
    label: 'Search Knowledge',
    icon: 'i-heroicons-magnifying-glass',
    action: 'search_knowledge',
    prompt: 'Search my knowledge base'
  },
  {
    label: 'Schedule Meeting',
    icon: 'i-heroicons-calendar-days',
    action: 'schedule_meeting',
    prompt: 'Help me schedule a meeting'
  },
  {
    label: 'Daily Summary',
    icon: 'i-heroicons-document-text',
    action: 'daily_summary',
    prompt: 'Give me a summary of today\'s activities'
  }
]

// Initialize
onMounted(() => {
  initializeVoiceFeatures()
  loadConversationHistory()
})

onUnmounted(() => {
  cleanup()
})

// Voice and Speech Initialization
const initializeVoiceFeatures = () => {
  // Initialize Speech Recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition.value = new SpeechRecognition()
    
    recognition.value.continuous = true
    recognition.value.interimResults = true
    recognition.value.lang = 'en-US'

    recognition.value.onresult = handleSpeechResult
    recognition.value.onend = handleSpeechEnd
    recognition.value.onerror = handleSpeechError
  }

  // Initialize Speech Synthesis
  if ('speechSynthesis' in window) {
    speechSynthesis.value = window.speechSynthesis
    
    // Load available voices
    const loadVoices = () => {
      voices.value = speechSynthesis.value!.getVoices()
    }
    
    speechSynthesis.value.onvoiceschanged = loadVoices
    loadVoices()
  }
}

const handleSpeechResult = (event: SpeechRecognitionEvent) => {
  let interimTranscript = ''
  let finalTranscript = ''

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript
    
    if (event.results[i].isFinal) {
      finalTranscript += transcript
    } else {
      interimTranscript += transcript
    }
  }

  voiceTranscription.value = finalTranscript + interimTranscript

  // Auto-send when speech is final and there's a pause
  if (finalTranscript) {
    setTimeout(() => {
      if (isListening.value && voiceTranscription.value.trim()) {
        sendVoiceMessage(voiceTranscription.value.trim())
      }
    }, 2000) // 2 second pause
  }
}

const handleSpeechEnd = () => {
  if (isListening.value && voiceTranscription.value.trim()) {
    sendVoiceMessage(voiceTranscription.value.trim())
  }
  
  isListening.value = false
  voiceTranscription.value = ''
}

const handleSpeechError = (event: SpeechRecognitionErrorEvent) => {
  console.error('Speech recognition error:', event.error)
  
  if (event.error === 'not-allowed') {
    showVoicePermissionModal.value = true
  }
  
  isListening.value = false
  voiceTranscription.value = ''
}

// Message Functions
const sendMessage = (content: string, inputType: 'text' | 'voice' = 'text') => {
  if (!content.trim()) return

  const userMessage: Message = {
    id: generateMessageId(),
    role: 'user',
    content: content.trim(),
    timestamp: new Date(),
    inputType
  }

  messages.value.push(userMessage)
  
  // Clear input
  if (inputType === 'text') {
    inputMessage.value = ''
  }

  // Show typing indicator
  isTyping.value = true

  // Simulate AI response
  setTimeout(async () => {
    const aiResponse = await generateAIResponse(content, activeContext.value)
    messages.value.push(aiResponse)
    isTyping.value = false

    // Auto-speak response if it was a voice input
    if (inputType === 'voice') {
      setTimeout(() => {
        speakMessage(aiResponse.content)
      }, 500)
    }
  }, Math.random() * 2000 + 1000) // 1-3 seconds
}

const sendTextMessage = () => {
  sendMessage(inputMessage.value, 'text')
}

const sendVoiceMessage = (content: string) => {
  sendMessage(content, 'voice')
  isListening.value = false
  voiceTranscription.value = ''
}

const generateAIResponse = async (userInput: string, context: Context[]): Promise<Message> => {
  // Simulate AI processing
  const responses = [
    {
      content: "I'd be happy to help you with that! Let me break this down into actionable steps.",
      actions: [
        { label: 'Create Plan', icon: 'i-heroicons-list-bullet', action: 'create_plan' },
        { label: 'Set Reminder', icon: 'i-heroicons-bell', action: 'set_reminder' }
      ]
    },
    {
      content: "Based on your knowledge base, I found several relevant documents. Would you like me to summarize them or create a new document?",
      actions: [
        { label: 'Summarize', icon: 'i-heroicons-document-text', action: 'summarize' },
        { label: 'Create New', icon: 'i-heroicons-document-plus', action: 'create_document' }
      ]
    },
    {
      content: "I've analyzed your request and here are my recommendations. This approach should help you achieve your goals efficiently.",
      actions: [
        { label: 'Save as Template', icon: 'i-heroicons-bookmark', action: 'save_template' },
        { label: 'Share with Team', icon: 'i-heroicons-users', action: 'share_team' }
      ]
    }
  ]

  const response = responses[Math.floor(Math.random() * responses.length)]

  return {
    id: generateMessageId(),
    role: 'assistant',
    content: response.content,
    timestamp: new Date(),
    actions: response.actions
  }
}

// Voice Control Functions
const toggleVoiceInput = async () => {
  if (!recognition.value) {
    showVoicePermissionModal.value = true
    return
  }

  if (isListening.value) {
    recognition.value.stop()
    isListening.value = false
    voiceTranscription.value = ''
  } else {
    try {
      voiceTranscription.value = ''
      recognition.value.start()
      isListening.value = true
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      showVoicePermissionModal.value = true
    }
  }
}

const requestVoicePermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    showVoicePermissionModal.value = false
    initializeVoiceFeatures()
  } catch (error) {
    console.error('Microphone permission denied:', error)
    alert('Microphone access is required for voice input. Please enable it in your browser settings.')
  }
}

const speakMessage = (content: string) => {
  if (!speechSynthesis.value) return

  // Stop any current speech
  speechSynthesis.value.cancel()

  const utterance = new SpeechSynthesisUtterance(content)
  
  // Use a more natural voice if available
  const preferredVoice = voices.value.find(voice => 
    voice.name.includes('Neural') || 
    voice.name.includes('Enhanced') ||
    voice.name.includes('Premium')
  ) || voices.value.find(voice => voice.lang.startsWith('en'))

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 0.8

  utterance.onstart = () => {
    isSpeaking.value = true
    speakingMessageId.value = content
  }

  utterance.onend = () => {
    isSpeaking.value = false
    speakingMessageId.value = null
  }

  utterance.onerror = () => {
    isSpeaking.value = false
    speakingMessageId.value = null
  }

  speechSynthesis.value.speak(utterance)
}

// Action Functions
const executeAction = (action: any) => {
  switch (action.action) {
    case 'create_plan':
      createPlan()
      break
    case 'set_reminder':
      setReminder()
      break
    case 'summarize':
      summarizeDocuments()
      break
    case 'create_document':
      createDocument()
      break
    case 'save_template':
      saveTemplate()
      break
    case 'share_team':
      shareWithTeam()
      break
    default:
      console.log('Action not implemented:', action.action)
  }
}

const executeQuickAction = (action: QuickAction) => {
  if (action.prompt) {
    sendMessage(action.prompt, 'text')
  }
}

const createPlan = () => {
  const event = new CustomEvent('create-plan')
  window.dispatchEvent(event)
}

const setReminder = () => {
  const event = new CustomEvent('set-reminder')
  window.dispatchEvent(event)
}

const summarizeDocuments = () => {
  const event = new CustomEvent('summarize-documents')
  window.dispatchEvent(event)
}

const createDocument = () => {
  const event = new CustomEvent('create-document')
  window.dispatchEvent(event)
}

const saveTemplate = () => {
  const event = new CustomEvent('save-template')
  window.dispatchEvent(event)
}

const shareWithTeam = () => {
  const event = new CustomEvent('share-team')
  window.dispatchEvent(event)
}

// Context Functions
const addContext = (context: Context) => {
  if (!activeContext.value.find(c => c.id === context.id)) {
    activeContext.value.push(context)
  }
}

const removeContext = (contextId: string) => {
  activeContext.value = activeContext.value.filter(c => c.id !== contextId)
}

const getContextIcon = (type: string): string => {
  const icons = {
    document: 'i-heroicons-document-text',
    workspace: 'i-heroicons-folder',
    search: 'i-heroicons-magnifying-glass',
    task: 'i-heroicons-check-circle'
  }
  return icons[type] || 'i-heroicons-information-circle'
}

// Utility Functions
const renderMessage = (content: string): string => {
  // Simple markdown-like rendering
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br>')
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const generateMessageId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

const newLine = () => {
  inputMessage.value += '\n'
}

const loadConversationHistory = () => {
  // Load from localStorage or API
  const saved = localStorage.getItem('athena-conversation')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      messages.value = parsed.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.error('Failed to load conversation history:', error)
    }
  }
}

const saveConversationHistory = () => {
  localStorage.setItem('athena-conversation', JSON.stringify(messages.value))
}

const cleanup = () => {
  if (recognition.value) {
    recognition.value.stop()
  }
  
  if (speechSynthesis.value) {
    speechSynthesis.value.cancel()
  }
  
  saveConversationHistory()
}

// Watch for messages changes to save history
watch(messages, () => {
  saveConversationHistory()
}, { deep: true })

// Expose methods for parent components
defineExpose({
  addContext,
  sendMessage,
  speakMessage
})
</script>

<style scoped>
.conversational-interface {
  font-family: 'Inter', sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Voice input animation */
@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

/* Message animations */
.message-enter-active {
  transition: all 0.3s ease-out;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>