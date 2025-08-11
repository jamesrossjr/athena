<template>
  <div class="ai-assistant" :class="{ 'ai-assistant--dark': isDarkMode }">
    <!-- AI Assistant Toggle Button -->
    <button 
      @click="toggleAssistant"
      class="ai-toggle-btn"
      :class="{ 'ai-toggle-btn--active': isVisible }"
      title="AI Assistant (Ctrl+J)"
    >
      <div class="ai-avatar">
        <div 
          class="ai-avatar-ring"
          :class="{ 
            'ai-avatar-ring--listening': aiAgent.voice.isListening,
            'ai-avatar-ring--speaking': aiAgent.voice.isSpeaking,
            'ai-avatar-ring--thinking': aiAgent.isThinking
          }"
        ></div>
        <svg class="ai-avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      </div>
    </button>

    <!-- AI Assistant Panel -->
    <Transition name="slide-up">
      <div v-if="isVisible" class="ai-panel">
        <!-- Header -->
        <div class="ai-header">
          <div class="ai-header-left">
            <div class="ai-status">
              <div 
                class="status-indicator" 
                :class="{ 
                  'status-indicator--connected': aiAgent.isConnected,
                  'status-indicator--error': aiAgent.lastError
                }"
              ></div>
              <span class="ai-name">{{ aiAgent.personality.name }}</span>
            </div>
          </div>
          
          <div class="ai-header-right">
            <!-- Voice Toggle -->
            <button
              @click="toggleVoice"
              class="header-btn"
              :class="{ 'header-btn--active': aiAgent.voice.isEnabled }"
              :title="aiAgent.voice.isEnabled ? 'Disable Voice' : 'Enable Voice'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path v-if="aiAgent.voice.isEnabled" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path v-if="aiAgent.voice.isEnabled" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line v-if="aiAgent.voice.isEnabled" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" y1="19" x2="12" y2="23"/>
                <line v-if="aiAgent.voice.isEnabled" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" y1="23" x2="16" y2="23"/>
                <g v-else>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.54 14.54a7.5 7.5 0 0 1-15.08 0"/>
                  <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="1" y1="1" x2="23" y2="23"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 9 3-3v8a3 3 0 0 0 5.12 2.12"/>
                </g>
              </svg>
            </button>

            <!-- Settings -->
            <button
              @click="showSettings = !showSettings"
              class="header-btn"
              :class="{ 'header-btn--active': showSettings }"
              title="AI Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle stroke-linecap="round" stroke-linejoin="round" stroke-width="2" cx="12" cy="12" r="3"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 1 2.09 6.26L22 9l-5.74 3.74L18 21l-6-3-6 3 1.74-8.26L2 9l7.91-1.74L12 1z"/>
              </svg>
            </button>

            <!-- Minimize -->
            <button @click="toggleAssistant" class="header-btn" title="Minimize">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="19" y1="12" x2="5" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="ai-messages" ref="messagesContainer">
          <div
            v-for="message in displayMessages"
            :key="message.id"
            class="ai-message"
            :class="`ai-message--${message.role}`"
          >
            <div class="message-avatar">
              <div v-if="message.role === 'assistant'" class="assistant-avatar">J</div>
              <div v-else class="user-avatar">{{ getUserInitial() }}</div>
            </div>
            
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span v-if="message.type === 'voice'" class="message-type">🎤</span>
                <span v-if="message.sources?.length" class="message-sources">
                  📚 {{ message.sources.length }} sources
                </span>
              </div>
            </div>
          </div>
          
          <!-- Thinking Indicator -->
          <div v-if="aiAgent.isThinking" class="ai-message ai-message--thinking">
            <div class="message-avatar">
              <div class="assistant-avatar thinking">J</div>
            </div>
            <div class="message-content">
              <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Proactive Suggestions -->
        <div v-if="pendingTasks.length > 0" class="proactive-suggestions">
          <div class="suggestions-header">💡 Suggestions</div>
          <div
            v-for="task in pendingTasks.slice(0, 2)"
            :key="task.id"
            class="suggestion-item"
            @click="handleProactiveTask(task)"
          >
            {{ task.description }}
          </div>
        </div>

        <!-- Input Area -->
        <div class="ai-input-area">
          <!-- Push-to-Talk Button -->
          <button
            v-if="aiAgent.voice.isEnabled"
            @mousedown="startPTT"
            @mouseup="stopPTT"
            @mouseleave="stopPTT"
            class="ptt-btn"
            :class="{
              'ptt-btn--active': isVoicePressed || aiAgent.voice.isListening,
              'ptt-btn--disabled': !canUseVoice
            }"
            :title="canUseVoice ? 'Hold to speak' : 'Voice not available'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </button>

          <!-- Text Input -->
          <input
            v-model="inputText"
            @keyup.enter="sendMessage"
            @keyup.ctrl.enter="sendMessage"
            type="text"
            placeholder="Ask me anything... (or press and hold voice button)"
            class="ai-input"
            :disabled="aiAgent.isThinking"
          />

          <!-- Send Button -->
          <button
            @click="sendMessage"
            class="send-btn"
            :disabled="!inputText.trim() || aiAgent.isThinking"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="22" y1="2" x2="11" y2="13"/>
              <polygon stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="22,2 15,22 11,13 2,9 22,2"/>
            </svg>
          </button>
        </div>

        <!-- Settings Panel -->
        <Transition name="slide-down">
          <div v-if="showSettings" class="ai-settings">
            <!-- Settings Tabs -->
            <div class="settings-tabs">
              <button 
                @click="activeSettingsTab = 'personality'"
                class="settings-tab"
                :class="{ 'settings-tab--active': activeSettingsTab === 'personality' }"
              >
                Personality
              </button>
              <button 
                @click="activeSettingsTab = 'model'"
                class="settings-tab"
                :class="{ 'settings-tab--active': activeSettingsTab === 'model' }"
              >
                AI Model
              </button>
              <button 
                @click="activeSettingsTab = 'voice'"
                class="settings-tab"
                :class="{ 'settings-tab--active': activeSettingsTab === 'voice' }"
              >
                Voice
              </button>
              <button 
                @click="activeSettingsTab = 'advanced'"
                class="settings-tab"
                :class="{ 'settings-tab--active': activeSettingsTab === 'advanced' }"
              >
                Advanced
              </button>
            </div>

            <div class="settings-content">
              <!-- Personality Settings -->
              <div v-if="activeSettingsTab === 'personality'" class="settings-section">
                <div class="setting-item">
                  <label>Assistant Name</label>
                  <input 
                    v-model="aiAgent.personality.name" 
                    @change="saveSettings"
                    type="text" 
                    class="setting-input"
                    placeholder="e.g., Jarvis, Athena, Ada"
                  />
                </div>
                
                <div class="setting-item">
                  <label>Communication Style</label>
                  <select 
                    v-model="aiAgent.personality.style" 
                    @change="saveSettings"
                    class="setting-select"
                  >
                    <option value="professional">Professional - Formal and business-focused</option>
                    <option value="friendly">Friendly - Warm and approachable</option>
                    <option value="casual">Casual - Relaxed and conversational</option>
                    <option value="technical">Technical - Precise and detail-oriented</option>
                  </select>
                </div>
                
                <div class="setting-item">
                  <label>Proactiveness Level</label>
                  <select 
                    v-model="aiAgent.personality.proactiveness" 
                    @change="saveSettings"
                    class="setting-select"
                  >
                    <option value="low">Low - Only responds when asked</option>
                    <option value="medium">Medium - Occasional helpful suggestions</option>
                    <option value="high">High - Frequently suggests optimizations</option>
                  </select>
                </div>
                
                <div class="setting-item">
                  <label>Response Length</label>
                  <select 
                    v-model="aiAgent.personality.verbosity" 
                    @change="saveSettings"
                    class="setting-select"
                  >
                    <option value="concise">Concise - Brief and to the point</option>
                    <option value="balanced">Balanced - Moderate detail level</option>
                    <option value="detailed">Detailed - Comprehensive explanations</option>
                  </select>
                </div>
              </div>

              <!-- Model Settings -->
              <div v-if="activeSettingsTab === 'model'" class="settings-section">
                <div class="setting-item">
                  <label>Current AI Model</label>
                  <div class="model-selector">
                    <select 
                      v-model="selectedModel" 
                      @change="handleModelChange"
                      class="setting-select"
                      :disabled="isChangingModel"
                    >
                      <option 
                        v-for="model in aiAgent.modelConfig.availableModels" 
                        :key="model.name"
                        :value="model.name"
                      >
                        {{ model.name }} ({{ formatModelSize(model.size) }})
                      </option>
                    </select>
                    <button 
                      @click="loadModels" 
                      class="refresh-models-btn"
                      :disabled="isLoadingModels"
                      title="Refresh available models"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </button>
                  </div>
                  <p class="setting-description">
                    Currently using: {{ aiAgent.modelConfig.currentModel }}
                  </p>
                </div>

                <div class="setting-item">
                  <label>Creativity (Temperature: {{ aiAgent.modelConfig.temperature }})</label>
                  <input 
                    v-model.number="aiAgent.modelConfig.temperature" 
                    @input="saveSettings"
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    class="setting-slider"
                  />
                  <p class="setting-description">Higher = more creative, Lower = more focused</p>
                </div>

                <div class="setting-item">
                  <label>Response Diversity (Top P: {{ aiAgent.modelConfig.topP }})</label>
                  <input 
                    v-model.number="aiAgent.modelConfig.topP" 
                    @input="saveSettings"
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    class="setting-slider"
                  />
                  <p class="setting-description">Controls response variety</p>
                </div>

                <div class="setting-item">
                  <label>Focus (Top K: {{ aiAgent.modelConfig.topK }})</label>
                  <input 
                    v-model.number="aiAgent.modelConfig.topK" 
                    @input="saveSettings"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    class="setting-slider"
                  />
                  <p class="setting-description">Lower = more focused responses</p>
                </div>
              </div>

              <!-- Voice Settings -->
              <div v-if="activeSettingsTab === 'voice'" class="settings-section">
                <div class="setting-item">
                  <label>Voice Recognition</label>
                  <div class="toggle-switch">
                    <input 
                      id="voice-enabled"
                      type="checkbox" 
                      v-model="aiAgent.voice.isEnabled" 
                      @change="saveSettings"
                    />
                    <label for="voice-enabled" class="toggle-label">
                      {{ aiAgent.voice.isEnabled ? 'Enabled' : 'Disabled' }}
                    </label>
                  </div>
                </div>

                <div class="setting-item">
                  <label>Language</label>
                  <select 
                    v-model="aiAgent.voice.language" 
                    @change="saveSettings"
                    class="setting-select"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="en-AU">English (Australia)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="es-MX">Spanish (Mexico)</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese (Brazil)</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                  </select>
                </div>

                <div class="setting-item" v-if="availableVoices.length > 0">
                  <label>Voice</label>
                  <select 
                    v-model="aiAgent.voice.voice" 
                    @change="saveSettings"
                    class="setting-select"
                  >
                    <option value="default">Default System Voice</option>
                    <option 
                      v-for="voice in availableVoices" 
                      :key="voice.name"
                      :value="voice.name"
                    >
                      {{ voice.name }} ({{ voice.lang }})
                    </option>
                  </select>
                </div>

                <div class="setting-item">
                  <button @click="testVoice" class="settings-btn settings-btn--secondary">
                    Test Voice
                  </button>
                </div>
              </div>

              <!-- Advanced Settings -->
              <div v-if="activeSettingsTab === 'advanced'" class="settings-section">
                <div class="setting-item">
                  <label>Monitoring & Proactive Features</label>
                  <div class="toggle-switch">
                    <input 
                      id="monitoring-enabled"
                      type="checkbox" 
                      v-model="aiAgent.monitoringEnabled" 
                      @change="saveSettings"
                    />
                    <label for="monitoring-enabled" class="toggle-label">
                      {{ aiAgent.monitoringEnabled ? 'Enabled' : 'Disabled' }}
                    </label>
                  </div>
                  <p class="setting-description">Allow AI to monitor workspace and suggest actions</p>
                </div>

                <div class="setting-item">
                  <label>Memory & Learning</label>
                  <div class="memory-info">
                    <p>Conversations stored: {{ aiAgent.messages.length }}</p>
                    <p>Memory entries: {{ aiAgent.memoryContext.size }}</p>
                    <p>Proactive tasks: {{ aiAgent.proactiveTasks.length }}</p>
                  </div>
                  <button @click="clearAllMemory" class="settings-btn settings-btn--danger">
                    Clear All Memory
                  </button>
                </div>

                <div class="setting-item">
                  <label>Connection Status</label>
                  <div class="connection-status">
                    <div class="status-item">
                      <span class="status-label">Ollama:</span>
                      <span class="status-value" :class="aiAgent.isConnected ? 'status-ok' : 'status-error'">
                        {{ aiAgent.isConnected ? 'Connected' : 'Disconnected' }}
                      </span>
                    </div>
                    <div class="status-item">
                      <span class="status-label">Voice:</span>
                      <span class="status-value" :class="voice?.isSupported ? 'status-ok' : 'status-error'">
                        {{ voice?.isSupported ? 'Available' : 'Not Available' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="setting-item">
                  <label>Reset Settings</label>
                  <button @click="resetToDefaults" class="settings-btn settings-btn--warning">
                    Reset to Defaults
                  </button>
                  <p class="setting-description">This will reset all AI settings to their default values</p>
                </div>
              </div>
            </div>

            <div class="settings-actions">
              <button @click="clearConversation" class="settings-btn settings-btn--danger">
                Clear Conversation
              </button>
              <button @click="exportSettings" class="settings-btn settings-btn--secondary">
                Export Settings
              </button>
              <button @click="showSettings = false" class="settings-btn settings-btn--primary">
                Done
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAiAgentStore } from '~/stores/aiAgent'
import { useVoiceInterface } from '~/composables/useVoiceInterface'

// Props
defineProps<{
  isDarkMode?: boolean
}>()

// State
const aiAgent = useAiAgentStore()
const voice = process.client ? useVoiceInterface() : null
const isVisible = ref(false)
const showSettings = ref(false)
const inputText = ref('')
const messagesContainer = ref<HTMLElement>()
const availableModels = ref<any[]>([])
const isLoadingModels = ref(false)
const activeSettingsTab = ref('personality')
const selectedModel = ref('')
const isChangingModel = ref(false)
const availableVoices = ref<any[]>([])

// Computed
const displayMessages = computed(() => aiAgent.messages.slice(-20)) // Show last 20 messages
const pendingTasks = computed(() => aiAgent.proactiveTasks.filter(t => !t.action))
const canUseVoice = computed(() => voice?.canListen || false)
const isVoicePressed = computed(() => false) // PTT state handled within startPTT method

// Methods
const toggleAssistant = () => {
  isVisible.value = !isVisible.value
  if (isVisible.value && !aiAgent.isConnected) {
    aiAgent.initialize()
  }
}

const toggleVoice = () => {
  aiAgent.toggleVoice()
}

const sendMessage = async () => {
  if (!inputText.value.trim() || aiAgent.isThinking) return
  
  const message = inputText.value.trim()
  inputText.value = ''
  
  await aiAgent.sendMessage(message, 'text')
  scrollToBottom()
}

const startPTT = async () => {
  if (!voice?.canListen) return
  
  try {
    const ptt = voice.usePushToTalk()
    const transcript = await ptt.startPTT()
    
    if (transcript && transcript.trim()) {
      await aiAgent.sendMessage(transcript, 'voice')
      scrollToBottom()
    }
  } catch (error) {
    console.error('Voice input error:', error)
  }
}

const stopPTT = () => {
  if (!voice) return
  const ptt = voice.usePushToTalk()
  ptt.stopPTT()
}

const handleProactiveTask = (task: any) => {
  // Execute the proactive task
  aiAgent.sendMessage(`Please help me with: ${task.description}`, 'command')
  
  // Remove the task from pending
  const index = aiAgent.proactiveTasks.indexOf(task)
  if (index > -1) {
    aiAgent.proactiveTasks.splice(index, 1)
  }
}

const formatMessage = (content: string) => {
  // Simple markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getUserInitial = () => {
  // Get user initial from auth store or default to 'U'
  return 'U' // This could come from user store
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const saveSettings = () => {
  aiAgent.saveConfiguration()
}

const loadModels = async () => {
  isLoadingModels.value = true
  try {
    const models = await aiAgent.loadAvailableModels()
    availableModels.value = models
  } finally {
    isLoadingModels.value = false
  }
}

const handleModelChange = async () => {
  if (selectedModel.value === aiAgent.modelConfig.currentModel) return
  
  isChangingModel.value = true
  try {
    const result = await aiAgent.changeModel(selectedModel.value)
    if (result.success) {
      // Show success message to user
      await aiAgent.sendMessage(`✅ ${result.message}`, 'command')
    } else {
      // Revert selection on failure
      selectedModel.value = aiAgent.modelConfig.currentModel
      await aiAgent.sendMessage(`❌ ${result.message}`, 'command')
    }
  } catch (error) {
    selectedModel.value = aiAgent.modelConfig.currentModel
    console.error('Model change error:', error)
  } finally {
    isChangingModel.value = false
  }
}

const formatModelSize = (size: number) => {
  if (!size) return 'Unknown size'
  
  const sizeInGB = size / (1024 * 1024 * 1024)
  if (sizeInGB >= 1) {
    return `${sizeInGB.toFixed(1)}GB`
  }
  
  const sizeInMB = size / (1024 * 1024)
  return `${sizeInMB.toFixed(0)}MB`
}

const loadAvailableVoices = () => {
  if (voice?.getVoices) {
    availableVoices.value = voice.getVoices()
  }
}

const testVoice = async () => {
  if (voice?.speak) {
    try {
      await voice.speak(`Hello, I'm ${aiAgent.personality.name}. This is how I sound.`)
    } catch (error) {
      console.error('Voice test failed:', error)
    }
  }
}

const clearAllMemory = async () => {
  if (confirm('This will clear all conversation history and memory. Are you sure?')) {
    aiAgent.clearConversation()
    aiAgent.memoryContext.clear()
    aiAgent.proactiveTasks.splice(0)
    aiAgent.recentActions.splice(0)
    
    await aiAgent.sendMessage('🧹 All memory and conversation history cleared.', 'command')
  }
}

const resetToDefaults = async () => {
  if (confirm('This will reset all AI settings to their default values. Are you sure?')) {
    await aiAgent.resetToDefaults()
    selectedModel.value = aiAgent.modelConfig.currentModel
    activeSettingsTab.value = 'personality'
    
    await aiAgent.sendMessage('🔄 All settings have been reset to defaults.', 'command')
  }
}

const exportSettings = () => {
  const settings = {
    personality: aiAgent.personality,
    modelConfig: {
      ...aiAgent.modelConfig,
      availableModels: [] // Don't export model list
    },
    voice: {
      language: aiAgent.voice.language,
      isEnabled: aiAgent.voice.isEnabled
    },
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `athena-ai-settings-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearConversation = () => {
  aiAgent.clearConversation()
  showSettings.value = false
}

// Setup keyboard shortcut
const handleKeyboard = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'j') {
    event.preventDefault()
    toggleAssistant()
  }
}

// Watch for new messages to scroll
watch(() => aiAgent.messages.length, scrollToBottom)

// Initialize
onMounted(() => {
  document.addEventListener('keydown', handleKeyboard)
  
  // Auto-initialize if not connected
  if (!aiAgent.isConnected) {
    aiAgent.initialize()
  }
  
  // Set initial selected model
  selectedModel.value = aiAgent.modelConfig.currentModel
  
  // Load available voices for TTS
  if (voice) {
    loadAvailableVoices()
    
    // Listen for voices loaded event (some browsers load them asynchronously)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadAvailableVoices
    }
  }
})
</script>

<style scoped>
/* AI Assistant Toggle Button */
.ai-toggle-btn {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.ai-toggle-btn--active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.ai-avatar {
  position: relative;
  width: 32px;
  height: 32px;
}

.ai-avatar-ring {
  position: absolute;
  inset: -8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.ai-avatar-ring--listening {
  border-color: #10b981;
  animation: pulse-green 1.5s infinite;
}

.ai-avatar-ring--speaking {
  border-color: #3b82f6;
  animation: pulse-blue 1s infinite;
}

.ai-avatar-ring--thinking {
  border-color: #f59e0b;
  animation: pulse-yellow 2s infinite;
}

.ai-avatar-icon {
  width: 24px;
  height: 24px;
  color: white;
}

/* AI Panel */
.ai-panel {
  position: fixed;
  bottom: 150px;
  right: 24px;
  width: 380px;
  max-height: 600px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-assistant--dark .ai-panel {
  background: #1a1f2e;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

/* Header */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ai-assistant--dark .ai-header {
  background: #242936;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
  transition: all 0.3s ease;
}

.status-indicator--connected {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.status-indicator--error {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.ai-name {
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
}

.ai-assistant--dark .ai-name {
  color: #f9fafb;
}

.ai-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:hover,
.header-btn--active {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.header-btn svg {
  width: 18px;
  height: 18px;
}

/* Messages */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 200px;
  max-height: 300px;
}

.ai-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.assistant-avatar,
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.assistant-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.assistant-avatar.thinking {
  animation: pulse 2s infinite;
}

.user-avatar {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
  word-wrap: break-word;
}

.ai-message--user .message-text {
  background: #3b82f6;
  color: white;
}

.ai-assistant--dark .message-text {
  background: #374151;
  color: #e5e7eb;
}

.ai-assistant--dark .ai-message--user .message-text {
  background: #1d4ed8;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-left: 16px;
  font-size: 12px;
  color: #6b7280;
}

/* Thinking Animation */
.thinking-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 18px;
}

.ai-assistant--dark .thinking-dots {
  background: #374151;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: thinking 1.4s ease-in-out infinite both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

/* Proactive Suggestions */
.proactive-suggestions {
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
  background: #fef3c7;
}

.ai-assistant--dark .proactive-suggestions {
  background: #451a03;
  border-top-color: rgba(255, 255, 255, 0.1);
}

.suggestions-header {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.ai-assistant--dark .suggestions-header {
  color: #fbbf24;
}

.suggestion-item {
  padding: 8px 12px;
  background: #fbbf24;
  border-radius: 8px;
  font-size: 13px;
  color: #78350f;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.suggestion-item:hover {
  background: #f59e0b;
  color: white;
}

.suggestion-item:last-child {
  margin-bottom: 0;
}

/* Input Area */
.ai-input-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.ai-assistant--dark .ai-input-area {
  background: #1a1f2e;
  border-top-color: rgba(255, 255, 255, 0.1);
}

.ptt-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ptt-btn:hover,
.ptt-btn--active {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

.ptt-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ptt-btn svg {
  width: 20px;
  height: 20px;
}

.ai-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 24px;
  font-size: 14px;
  background: #ffffff;
  color: #374151;
  outline: none;
  transition: all 0.2s ease;
}

.ai-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ai-assistant--dark .ai-input {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  border: none;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

/* Settings */
.ai-settings {
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  background: #f9fafb;
  max-height: 300px;
  overflow-y: auto;
}

.ai-assistant--dark .ai-settings {
  background: #242936;
  border-top-color: rgba(255, 255, 255, 0.1);
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.ai-assistant--dark .settings-section h4 {
  color: #e5e7eb;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #374151;
}

.ai-assistant--dark .setting-input,
.ai-assistant--dark .setting-select {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

.settings-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.ai-assistant--dark .settings-actions {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.settings-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn--primary {
  background: #3b82f6;
  color: white;
}

.settings-btn--primary:hover {
  background: #1d4ed8;
}

.settings-btn--danger {
  background: #ef4444;
  color: white;
}

.settings-btn--danger:hover {
  background: #dc2626;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

@keyframes pulse-green {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.7;
  }
}

@keyframes pulse-blue {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes pulse-yellow {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.02);
    opacity: 0.9;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes thinking {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* Settings Tabs */
.settings-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.ai-assistant--dark .settings-tabs {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.settings-tab {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.settings-tab:hover {
  color: #374151;
}

.settings-tab--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.ai-assistant--dark .settings-tab {
  color: #9ca3af;
}

.ai-assistant--dark .settings-tab:hover {
  color: #e5e7eb;
}

.ai-assistant--dark .settings-tab--active {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}

/* Settings Content */
.settings-content {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

/* Model Selector */
.model-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.model-selector .setting-select {
  flex: 1;
}

.refresh-models-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.refresh-models-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.refresh-models-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-models-btn svg {
  width: 16px;
  height: 16px;
}

.ai-assistant--dark .refresh-models-btn {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

/* Setting Items */
.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.ai-assistant--dark .setting-item label {
  color: #e5e7eb;
}

.setting-description {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
  margin-bottom: 0;
}

.ai-assistant--dark .setting-description {
  color: #9ca3af;
}

/* Sliders */
.setting-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #d1d5db;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.setting-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

/* Toggle Switches */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-switch input[type="checkbox"] {
  display: none;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-switch input:checked + .toggle-label {
  background: #3b82f6;
}

.toggle-switch input:checked + .toggle-label::after {
  transform: translateX(20px);
}

/* Memory Info */
.memory-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
}

.memory-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #6b7280;
}

.ai-assistant--dark .memory-info {
  background: #374151;
  border-color: #4b5563;
}

.ai-assistant--dark .memory-info p {
  color: #9ca3af;
}

/* Connection Status */
.connection-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  font-size: 13px;
  color: #6b7280;
}

.status-value {
  font-size: 13px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-ok {
  color: #059669;
  background: #d1fae5;
}

.status-error {
  color: #dc2626;
  background: #fee2e2;
}

.ai-assistant--dark .status-label {
  color: #9ca3af;
}

.ai-assistant--dark .status-ok {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.ai-assistant--dark .status-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

/* Settings Buttons */
.settings-btn--secondary {
  background: #f3f4f6;
  color: #374151;
}

.settings-btn--secondary:hover {
  background: #e5e7eb;
}

.settings-btn--warning {
  background: #f59e0b;
  color: white;
}

.settings-btn--warning:hover {
  background: #d97706;
}

.ai-assistant--dark .settings-btn--secondary {
  background: #4b5563;
  color: #e5e7eb;
}

.ai-assistant--dark .settings-btn--secondary:hover {
  background: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .ai-panel {
    right: 12px;
    left: 12px;
    width: auto;
    bottom: 120px;
  }
  
  .ai-toggle-btn {
    right: 16px;
    bottom: 70px;
  }
  
  .settings-tabs {
    flex-wrap: wrap;
  }
  
  .settings-tab {
    font-size: 12px;
    padding: 10px 6px;
  }
  
  .model-selector {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>