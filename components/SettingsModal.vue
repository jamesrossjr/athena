<template>
  <div v-if="isOpen" class="settings-modal-overlay" @click.self="closeModal">
    <div class="settings-modal">
      <div class="settings-header">
        <h2 class="settings-title">Settings</h2>
        <button @click="closeModal" class="settings-close">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="settings-content">
        <div class="settings-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <div class="settings-panel">
          <!-- AI Assistant Tab -->
          <div v-if="activeTab === 'ai'" class="settings-section">
            <div class="section-header">
              <h3 class="section-title">🧠 Global AI Assistant</h3>
              <p class="section-description">Your AI assistant is powered by the global AI system</p>
            </div>

            <div class="ai-status">
              <div class="status-indicator success">
                <div class="status-dot"></div>
                <span class="status-text">Global AI Assistant is active and ready!</span>
              </div>
            </div>

            <div class="setting-group">
              <h4 class="group-title">Model Configuration</h4>
              <div class="setting-item">
                <label class="setting-label">Current Model:</label>
                <div class="setting-value">
                  <span class="model-name">Global AI Assistant</span>
                  <span class="model-description">Unified AI experience across all features</span>
                </div>
              </div>
            </div>

            <div class="setting-group">
              <h4 class="group-title">Features</h4>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">💬</span>
                  <div class="feature-info">
                    <span class="feature-name">Global Chat</span>
                    <span class="feature-description">AI assistance available from the ribbon</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📄</span>
                  <div class="feature-info">
                    <span class="feature-name">Document Context</span>
                    <span class="feature-description">AI understands your current document</span>
                  </div>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔄</span>
                  <div class="feature-info">
                    <span class="feature-name">Unified Experience</span>
                    <span class="feature-description">Consistent AI across all interactions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- App Settings Tab -->
          <div v-if="activeTab === 'app'" class="settings-section">
            <div class="section-header">
              <h3 class="section-title">⚙️ Application Settings</h3>
              <p class="section-description">Configure your application preferences</p>
            </div>

            <div class="setting-group">
              <h4 class="group-title">Appearance</h4>
              <div class="setting-item">
                <label class="setting-label">Theme:</label>
                <select v-model="appSettings.theme" class="setting-select">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>

            <div class="setting-group">
              <h4 class="group-title">Auto-save</h4>
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" v-model="appSettings.autoSave" class="setting-checkbox">
                  Enable auto-save
                </label>
              </div>
              <div v-if="appSettings.autoSave" class="setting-item">
                <label class="setting-label">Auto-save interval (seconds):</label>
                <input type="number" v-model="appSettings.autoSaveInterval" min="10" max="300" class="setting-input">
              </div>
            </div>
          </div>

          <!-- About Tab -->
          <div v-if="activeTab === 'about'" class="settings-section">
            <div class="section-header">
              <h3 class="section-title">ℹ️ About Athena</h3>
              <p class="section-description">Information about your digital paper application</p>
            </div>

            <div class="about-info">
              <div class="app-info">
                <h4>Athena Digital Paper</h4>
                <p>Version 1.0.0</p>
                <p>A modern digital workspace for knowledge management</p>
              </div>

              <div class="features-info">
                <h5>Key Features:</h5>
                <ul>
                  <li>🧠 Global AI Assistant</li>
                  <li>📝 Rich document editing</li>
                  <li>🏗️ Flexible workspace organization</li>
                  <li>🔗 Smart page linking</li>
                  <li>⚡ Real-time collaboration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  close: []
  'ai-mode-changed': [enabled: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('ai')

const tabs = [
  { id: 'ai', label: 'AI Assistant', icon: '🤖' },
  { id: 'app', label: 'App Settings', icon: '⚙️' },
  { id: 'about', label: 'About', icon: 'ℹ️' }
]

// App Settings
const appSettings = ref({
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 30
})

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.settings-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.settings-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.settings-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-tabs {
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 16px 0;
  min-width: 200px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-button.active {
  background: #e0e7ff;
  color: #3730a3;
  border-right: 3px solid #4f46e5;
}

.tab-icon {
  font-size: 18px;
}

.tab-label {
  font-weight: 500;
}

.settings-panel {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.settings-section {
  max-width: 100%;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.section-description {
  color: #6b7280;
  margin: 0;
}

.ai-status {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator.success {
  color: #166534;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #16a34a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-weight: 500;
}

.setting-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-label {
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.model-name {
  font-weight: 600;
  color: #111827;
}

.model-description {
  font-size: 14px;
  color: #6b7280;
}

.setting-select, .setting-input {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  min-width: 120px;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.feature-icon {
  font-size: 20px;
}

.feature-info {
  display: flex;
  flex-direction: column;
}

.feature-name {
  font-weight: 600;
  color: #111827;
}

.feature-description {
  font-size: 14px;
  color: #6b7280;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-info h4 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.app-info p {
  color: #6b7280;
  margin: 4px 0;
}

.features-info h5 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.features-info ul {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
}

.features-info li {
  margin-bottom: 4px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .settings-modal {
    background: #1f2937;
    color: white;
  }
  
  .settings-header {
    background: #374151;
    border-bottom-color: #4b5563;
  }
  
  .settings-title {
    color: white;
  }
  
  .settings-tabs {
    background: #374151;
    border-right-color: #4b5563;
  }
  
  .tab-button {
    color: #9ca3af;
  }
  
  .tab-button:hover {
    background: #4b5563;
    color: #e5e7eb;
  }
  
  .tab-button.active {
    background: #1e40af;
    color: #dbeafe;
  }
  
  .ai-status {
    background: #064e3b;
    border-color: #047857;
  }
  
  .setting-select, .setting-input {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }
  
  .feature-item {
    background: #374151;
  }
}
</style>