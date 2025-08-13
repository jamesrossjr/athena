<template>
  <div v-if="isOpen" class="command-palette-overlay" @click="handleOverlayClick">
    <div class="command-palette-modal" @click.stop>
      <div class="command-palette-header">
        <div class="header-left">
          <h3>Command Palette</h3>
          <div v-if="namespaceBreadcrumb" class="namespace-breadcrumb">
            <span v-for="(part, index) in namespaceBreadcrumb" :key="index">
              <span class="breadcrumb-part" :class="{ 'breadcrumb-current': index === namespaceBreadcrumb.length - 1 }">
                {{ part }}
              </span>
              <span v-if="index < namespaceBreadcrumb.length - 1" class="breadcrumb-separator">›</span>
            </span>
          </div>
          <div v-else class="context-indicator">
            <span class="context-icon">{{ currentContext.icon }}</span>
            <span class="context-text">{{ currentContext.description }}</span>
          </div>
        </div>
        <div class="search-stats">
          <span v-if="aiProcessing" class="ai-status processing">
            🤖 Processing...
          </span>
          <span v-else-if="aiSequence" class="ai-status ready">
            🤖 AI Ready
          </span>
          <span v-else-if="currentNamespace">
            {{ filteredCommands.length || namespaceCommands.length }} {{ (filteredCommands.length || namespaceCommands.length) === 1 ? 'command' : 'commands' }}
          </span>
          <span v-else>
            {{ filteredCommands.length }} {{ filteredCommands.length === 1 ? 'command' : 'commands' }}
          </span>
        </div>
      </div>
      
      <div class="command-palette-content">
        <div class="search-container">
          <div class="search-icon">🔍</div>
          <input
            ref="searchInput"
            v-model="query"
            class="command-palette-input"
            :placeholder="searchPlaceholder"
            autofocus
            @keydown="handleKeydown"
            @input="handleQueryInput"
          />
          <div v-if="isExecuting || aiProcessing" class="search-spinner">⟳</div>
        </div>
        
        <!-- Workspace Creation Form -->
        <div v-if="isCreatingWorkspace" class="workspace-form">
          <div class="form-header">
            <span class="form-icon">📁</span>
            <span class="form-title">Create New Workspace</span>
          </div>
          
          <div class="form-content">
            <div class="input-group">
              <label for="workspace-name" class="input-label">Workspace Name</label>
              <input
                id="workspace-name"
                ref="workspaceNameInput"
                v-model="workspaceForm.name"
                class="workspace-input"
                placeholder="Enter workspace name..."
                @keydown="handleWorkspaceFormKeydown"
                autofocus
              />
            </div>
            
            <div class="input-group">
              <label for="workspace-icon" class="input-label">Icon (optional)</label>
              <input
                id="workspace-icon"
                v-model="workspaceForm.icon"
                class="workspace-input"
                placeholder="📁"
                maxlength="2"
                @keydown="handleWorkspaceFormKeydown"
              />
            </div>
            
            <div class="workspace-preview" v-if="workspaceForm.name">
              <span class="preview-icon">{{ workspaceForm.icon || '📁' }}</span>
              <span class="preview-name">{{ workspaceForm.name }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button @click="confirmCreateWorkspace" class="create-btn" :disabled="!workspaceForm.name.trim()">
              <span class="btn-icon">✓</span>
              <span>Create Workspace</span>
            </button>
            <button @click="cancelCreateWorkspace" class="cancel-btn">
              <span class="btn-icon">✕</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <!-- Page Creation Form -->
        <div v-if="isCreatingPage" class="page-form">
          <div class="form-header">
            <span class="form-icon">📄</span>
            <span class="form-title">Create New Page</span>
          </div>
          
          <div class="form-content">
            <div class="input-group">
              <label for="page-title" class="input-label">Page Title</label>
              <input
                id="page-title"
                ref="pageTitleInput"
                v-model="pageForm.title"
                class="workspace-input"
                placeholder="Enter page title..."
                @keydown="handlePageFormKeydown"
                autofocus
              />
            </div>
            
            <div class="input-group">
              <label for="page-icon" class="input-label">Icon (optional)</label>
              <input
                id="page-icon"
                v-model="pageForm.icon"
                class="workspace-input"
                placeholder="📄"
                maxlength="2"
                @keydown="handlePageFormKeydown"
              />
            </div>
            
            <div class="page-preview" v-if="pageForm.title">
              <span class="preview-icon">{{ pageForm.icon || '📄' }}</span>
              <span class="preview-name">{{ pageForm.title }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button @click="confirmCreatePage" class="create-btn" :disabled="!pageForm.title.trim()">
              <span class="btn-icon">✓</span>
              <span>Create Page</span>
            </button>
            <button @click="cancelCreatePage" class="cancel-btn">
              <span class="btn-icon">✕</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <!-- Page Rename Form -->
        <div v-if="isRenamingPage" class="page-form">
          <div class="form-header">
            <span class="form-icon">✏️</span>
            <span class="form-title">Rename Page</span>
          </div>
          
          <div class="form-content">
            <div class="input-group">
              <label for="rename-title" class="input-label">New Title</label>
              <input
                id="rename-title"
                ref="renameTitleInput"
                v-model="renameForm.newTitle"
                class="workspace-input"
                placeholder="Enter new page title..."
                @keydown="handleRenameFormKeydown"
                autofocus
              />
            </div>
            
            <div class="page-preview" v-if="renameForm.newTitle">
              <span class="preview-label">Current:</span>
              <span class="preview-name">{{ renameForm.originalTitle }}</span>
              <span class="preview-arrow">→</span>
              <span class="preview-name new">{{ renameForm.newTitle }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button @click="confirmRenamePage" class="create-btn" :disabled="!renameForm.newTitle.trim() || renameForm.newTitle === renameForm.originalTitle">
              <span class="btn-icon">✓</span>
              <span>Rename</span>
            </button>
            <button @click="cancelRenamePage" class="cancel-btn">
              <span class="btn-icon">✕</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <!-- Authentication Form -->
        <div v-if="isInAuthFlow" class="auth-form">
          <!-- Email Input Step -->
          <div v-if="authStep === 'email-input'" class="auth-step">
            <div class="form-header">
              <span class="form-icon">✉️</span>
              <span class="form-title">Sign In / Sign Up</span>
            </div>
            
            <div class="form-content">
              <div class="input-group">
                <label for="auth-email" class="input-label">Email Address</label>
                <input
                  id="auth-email"
                  ref="emailInput"
                  v-model="authEmail"
                  type="email"
                  class="workspace-input"
                  placeholder="Enter your email address..."
                  @keydown="handleAuthKeydown"
                  autofocus
                />
              </div>
              
              <div class="auth-description">
                <p>We'll send you a secure login link via email. No password required!</p>
              </div>
            </div>
            
            <div class="form-actions">
              <button @click="executeEmailAuth" class="create-btn" :disabled="!authEmail.trim() || isExecuting">
                <span v-if="isExecuting" class="btn-spinner">⟳</span>
                <span v-else class="btn-icon">✉️</span>
                <span>{{ isExecuting ? 'Sending...' : 'Send Magic Link' }}</span>
              </button>
              <button @click="cancelAuthFlow" class="cancel-btn">
                <span class="btn-icon">✕</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
          
          <!-- Confirmation Step -->
          <div v-if="authStep === 'confirmation'" class="auth-step">
            <div class="form-header">
              <span class="form-icon">📧</span>
              <span class="form-title">Check Your Email</span>
            </div>
            
            <div class="form-content">
              <div class="confirmation-message">
                <p>A secure login link has been sent to:</p>
                <p class="email-display">{{ authEmail }}</p>
                <p>Click the link in your email to sign in. This window will close automatically.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Command Confirmation Step -->
        <div v-if="aiSequence" class="ai-confirmation">
          <div class="confirmation-header">
            <span class="ai-icon">🤖</span>
            <span class="confirmation-title">{{ getConfirmationMessage }}</span>
            <div class="confirmation-confidence">
              <span class="confidence-label">Confidence:</span>
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: `${(aiSequence.overallConfidence * 100)}%` }"></div>
              </div>
              <span class="confidence-text">{{ Math.round(aiSequence.overallConfidence * 100) }}%</span>
            </div>
          </div>
          
          <div class="command-sequence">
            <div v-for="(cmd, index) in aiSequence.commands" :key="index" class="sequence-item">
              <span class="sequence-number">{{ index + 1 }}</span>
              <span class="sequence-action">{{ cmd.description }}</span>
              <span v-if="cmd.confidence" class="sequence-confidence">{{ Math.round(cmd.confidence * 100) }}%</span>
            </div>
          </div>
          
          <div class="confirmation-actions">
            <button @click="executeAISequence" class="confirm-btn">
              <span class="btn-icon">✓</span>
              <span>Confirm & Execute</span>
            </button>
            <button @click="cancelAISequence" class="cancel-btn">
              <span class="btn-icon">✕</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>
        
        <!-- Namespace Commands (when in namespace mode) -->
        <div v-if="currentNamespace && !query && !isCreatingWorkspace && !isCreatingPage && !isRenamingPage && !isInAuthFlow" class="namespace-commands">
          <div class="namespace-header">
            <span class="namespace-icon">📂</span>
            <span class="namespace-text">{{ currentNamespace }} Commands</span>
            <span class="namespace-hint">← Back • → Enter • Search</span>
          </div>
          <div class="namespace-list">
            <div
              v-for="(command, index) in namespaceCommands"
              :key="command.id"
              class="namespace-item"
              :class="{ 'namespace-item-selected': selectedIndex === index }"
              @click="selectCommand(command)"
              @mouseenter="selectedIndex = index"
            >
              <span class="namespace-item-icon">{{ getCommandIcon(command.icon) }}</span>
              <div class="namespace-item-info">
                <span class="namespace-item-label">{{ command.label }}</span>
                <span class="namespace-item-description">{{ command.description }}</span>
              </div>
              <span v-if="command.shortcut" class="namespace-item-shortcut">{{ command.shortcut }}</span>
            </div>
          </div>
        </div>
        
        <!-- Namespace Entry Points (when not in namespace and not searching) -->
        <div v-else-if="!currentNamespace && !query && !isCreatingWorkspace && !isCreatingPage && !isRenamingPage && !isInAuthFlow" class="namespace-entries">
          <div class="entries-header">
            <span class="entries-icon">🗂️</span>
            <span class="entries-text">Command Categories</span>
            <span class="entries-hint">Enter or → to explore</span>
          </div>
          <div class="entries-list">
            <div
              v-for="(namespace, index) in namespaceCommands"
              :key="namespace.id"
              class="entry-item"
              :class="{ 'entry-item-selected': selectedIndex === index }"
              @click="selectCommand(namespace)"
              @mouseenter="selectedIndex = index"
            >
              <span class="entry-item-icon">{{ getCommandIcon(namespace.icon) }}</span>
              <div class="entry-item-info">
                <span class="entry-item-label">{{ namespace.label }}</span>
                <span class="entry-item-description">{{ namespace.description }}</span>
              </div>
              <span class="entry-arrow">→</span>
            </div>
          </div>
        </div>
        
        <!-- Contextual Quick Actions -->
        <div v-else-if="!currentNamespace && query && !isCreatingWorkspace && !isCreatingPage && !isRenamingPage && contextualCommands.length > 0" class="quick-actions">
          <div class="quick-actions-header">
            <span class="quick-icon">⚡</span>
            <span class="quick-text">Quick Actions</span>
            <span class="quick-hint">Based on current context</span>
          </div>
          <div class="quick-commands">
            <div
              v-for="(command, index) in contextualCommands.slice(0, 3)"
              :key="`quick-${command.id}`"
              class="quick-command"
              :class="{ 'quick-command-selected': selectedIndex === index }"
              @click="selectCommand(command)"
              @mouseenter="selectedIndex = index"
            >
              <span class="quick-command-icon">{{ getCommandIcon(command.icon) }}</span>
              <span class="quick-command-label">{{ command.label }}</span>
              <span v-if="command.shortcut" class="quick-command-shortcut">{{ command.shortcut }}</span>
            </div>
          </div>
        </div>

        <!-- Recently & Frequently Used -->
        <div v-if="!query && !isCreatingWorkspace && !isCreatingPage && !isRenamingPage && recentCommands.length > 0" class="recent-section">
          <div class="recent-header">
            <span class="recent-icon">🕒</span>
            <span class="recent-text">Recent & Frequent</span>
            <span class="recent-hint">Your most used commands</span>
          </div>
          <div class="recent-commands">
            <div
              v-for="(command, index) in recentCommands.slice(0, 4)"
              :key="`recent-${command.id}`"
              class="recent-command"
              :class="{ 'recent-command-selected': selectedIndex === (contextualCommands.length + index) }"
              @click="selectCommand(command)"
              @mouseenter="selectedIndex = contextualCommands.length + index"
            >
              <span class="recent-command-icon">{{ getCommandIcon(command.icon) }}</span>
              <div class="recent-command-info">
                <span class="recent-command-label">{{ command.label }}</span>
                <span class="recent-command-usage">Used {{ command.usageCount }} times</span>
              </div>
              <div class="recent-command-meta">
                <span v-if="command.shortcut" class="recent-command-shortcut">{{ command.shortcut }}</span>
                <span class="recent-command-frequency">{{ getFrequencyIndicator(command.usageCount) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Search Results -->
        <div v-if="query && !isCreatingWorkspace && !isCreatingPage && !isRenamingPage && filteredCommands.length" class="command-list">
          <template v-for="(group, groupName) in groupedCommands" :key="groupName">
            <div v-if="group.length > 0" class="command-group">
              <div class="group-header">
                <span class="group-icon">{{ getGroupIcon(groupName) }}</span>
                <span class="group-name">{{ groupName }}</span>
                <span class="group-count">{{ group.length }}</span>
              </div>
              <div class="group-commands">
                <div
                  v-for="(command, index) in group"
                  :key="command.id"
                  class="command-item"
                  :class="{ 
                    'command-item-selected': selectedIndex === getGlobalSearchIndex(groupName, index),
                    'command-item-executing': executingCommand === command.id
                  }"
                  @click="selectCommand(command)"
                  @mouseenter="selectedIndex = getGlobalSearchIndex(groupName, index)"
                >
                  <div class="command-info">
                    <span class="command-icon">{{ getCommandIcon(command.icon) }}</span>
                    <div>
                      <p class="command-label" v-html="highlightMatch(command.label, query)"></p>
                      <p class="command-description" v-html="highlightMatch(command.description, query)"></p>
                    </div>
                  </div>
                  <div class="command-meta">
                    <span v-if="command.usageCount > 0" class="usage-indicator">{{ command.usageCount }}×</span>
                    <span v-if="command.shortcut" class="command-shortcut">{{ command.shortcut }}</span>
                    <div v-if="executingCommand === command.id" class="command-status">
                      <span class="status-spinner">⟳</span>
                    </div>
                    <div v-else-if="lastExecuted === command.id" class="command-status">
                      <span class="status-success">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <div v-else-if="query && !isCreatingWorkspace && !isCreatingPage" class="command-empty">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">No commands found for "{{ query }}"</div>
          <div class="empty-hint">Try {{ getSuggestions().join(', ') }}</div>
        </div>
        
        <div v-else-if="!isCreatingWorkspace && !isCreatingPage && !contextualCommands.length && !recentCommands.length" class="command-help">
          <div class="help-icon">⌨️</div>
          <div class="help-text">Start typing to search commands...</div>
          <div class="help-shortcuts">
            <span class="help-shortcut">↑↓</span> navigate
            <span class="help-shortcut">→</span> enter namespace
            <span class="help-shortcut">←</span> back
            <span class="help-shortcut">Enter</span> execute
            <span class="help-shortcut">Esc</span> close
          </div>
        </div>
        
        <!-- Command Preview -->
        <CommandPreview :selected-command="getSelectedCommand()" />
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
const { currentWorkspace } = useWorkspace()
const sessionStore = useSessionStore()
const { 
  signInWithMagicLink,
  signInWithGoogle, 
  continueAsGuest,
  signOut,
  isLoading: authLoading,
  error: authError
} = useAuth()
const { 
  isAIProcessing: aiProcessing, 
  aiCommandSequence: aiSequence, 
  showConfirmation: showAIConfirmation,
  getConfirmationMessage,
  processNaturalLanguage,
  executeAICommands,
  clearAIState,
  isNaturalLanguageQuery
} = useAiCommands()
const getCurrentWorkspace = () => currentWorkspace.value
const { findWorkflowByTrigger, executeWorkflow, loadWorkflows } = useWorkflows()
const route = useRoute()

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const query = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement>()
const workspaceNameInput = ref<HTMLInputElement>()
const pageTitleInput = ref<HTMLInputElement>()
const executingCommand = ref<string | null>(null)
const lastExecuted = ref<string | null>(null)
const isExecuting = ref(false)

// Hierarchical navigation state
const currentNamespace = ref<string | null>(null)
const navigationHistory = ref<string[]>([])
const isInNamespace = computed(() => currentNamespace.value !== null)

// Workspace creation state
const isCreatingWorkspace = ref(false)
const workspaceForm = ref({
  name: '',
  icon: ''
})

// Page creation state
const isCreatingPage = ref(false)
const pageForm = ref({
  title: 'Start',
  type: 'DOCUMENT',
  icon: '📄'
})

// Page rename state
const isRenamingPage = ref(false)
const renameForm = ref({
  newTitle: '',
  pageId: '',
  originalTitle: ''
})
const renameTitleInput = ref<HTMLInputElement | null>(null)

// Authentication state
const isInAuthFlow = ref(false)
const authStep = ref<'initial' | 'email-input' | 'confirmation'>('initial')
const authEmail = ref('')
const emailInput = ref<HTMLInputElement | null>(null)

// AI Processing State
interface AICommand {
  commandId: string
  description: string
  args?: string[]
  confidence: number
  reasoning?: string
}

const isAIProcessing = ref(false)
const aiCommandSequence = ref<AICommand[] | null>(null)
const aiConfidence = ref(0)
const aiProcessingTimeout = ref<NodeJS.Timeout | null>(null)

// Context Detection
const currentContext = computed(() => {
  const currentWorkspace = getCurrentWorkspace()
  const routePath = route.path
  const routeName = route.name as string

  // Detect page type
  if (routePath.includes('/page/')) {
    const pageTitle = route.params.title || 'Untitled Page'
    const workspaceName = currentWorkspace?.name || 'Unknown Workspace'
    return {
      type: 'page',
      icon: '📄',
      description: `Editing: ${pageTitle} in ${workspaceName}`,
      pageType: 'document'
    }
  }
  
  if (routePath.includes('/database/') || routeName === 'DatabasePage') {
    return {
      type: 'database',
      icon: '🗃️',
      description: 'Database View',
      pageType: 'database'
    }
  }

  if (routePath.includes('/table/') || routeName === 'TablePage') {
    return {
      type: 'table',
      icon: '📊',
      description: 'Table View',
      pageType: 'table'
    }
  }

  if (routePath.includes('/whiteboard/') || routeName === 'WhiteboardPage') {
    return {
      type: 'whiteboard',
      icon: '🎨',
      description: 'Whiteboard',
      pageType: 'whiteboard'
    }
  }

  if (routePath.includes('/calendar/') || routeName === 'CalendarPage') {
    return {
      type: 'calendar',
      icon: '📅',
      description: 'Calendar View',
      pageType: 'calendar'
    }
  }

  if (currentWorkspace) {
    return {
      type: 'workspace',
      icon: currentWorkspace.icon || '🏠',
      description: `Workspace: ${currentWorkspace.name}`,
      pageType: 'workspace'
    }
  } else {
    return {
      type: 'no-workspace',
      icon: '⚠️',
      description: 'No workspace selected - Select or create one',
      pageType: 'no-workspace'
    }
  }
})

// Breadcrumb for namespace navigation
const namespaceBreadcrumb = computed(() => {
  if (!currentNamespace.value) return null
  
  const parts = ['Commands']
  if (navigationHistory.value.length > 0) {
    parts.push(...navigationHistory.value.filter(Boolean))
  }
  if (currentNamespace.value) {
    parts.push(currentNamespace.value)
  }
  return parts
})

// Dynamic placeholder based on context
const searchPlaceholder = computed(() => {
  if (currentNamespace.value) {
    return `Search in ${currentNamespace.value}...`
  }
  
  const context = currentContext.value
  const workspace = getCurrentWorkspace()
  
  if (!workspace) {
    return 'Select or create a workspace to begin...'
  }
  
  switch (context.type) {
    case 'page':
      return 'Search commands or type namespace (Page, Format, etc)...'
    case 'database':
      return 'Search commands or filter, sort, create views...'
    case 'table':
      return 'Search commands or manage table data...'
    case 'whiteboard':
      return 'Search commands or add shapes, notes...'
    case 'calendar':
      return 'Search commands or create events...'
    default:
      return `Type a command or namespace in "${workspace.name}"...`
  }
})

// Usage tracking (stored in localStorage)
const usageStats = ref<Record<string, { count: number; lastUsed: number; frequency: number }>>({})

const loadUsageStats = () => {
  if (process.client) {
    const stored = localStorage.getItem('athena-command-usage')
    if (stored) {
      usageStats.value = JSON.parse(stored)
    }
  }
}

const saveUsageStats = () => {
  if (process.client) {
    localStorage.setItem('athena-command-usage', JSON.stringify(usageStats.value))
  }
}

const trackCommandUsage = (commandId: string) => {
  const now = Date.now()
  if (!usageStats.value[commandId]) {
    usageStats.value[commandId] = { count: 0, lastUsed: now, frequency: 0 }
  }
  
  const stats = usageStats.value[commandId]
  stats.count++
  stats.lastUsed = now
  
  // Calculate frequency based on usage over time
  const daysSinceFirst = Math.max(1, (now - (stats.lastUsed - (stats.count - 1) * 86400000)) / 86400000)
  stats.frequency = stats.count / daysSinceFirst
  
  saveUsageStats()
}

// Enhanced command structure with namespace support
interface Command {
  id: string
  label: string
  description: string
  icon: string
  category: string
  action?: () => void | Promise<void>
  namespace?: string  // Optional namespace for grouping
  isNamespace?: boolean  // Indicates this is a namespace entry point
  shortcut?: string
  keywords: string[]
  contexts: string[]
  priority: number
  usageCount?: number
  lastUsed?: number
  frequency?: number
}

// Define comprehensive command set
const allCommands = ref<Command[]>([
  // Authentication commands (shown when unauthenticated)
  {
    id: 'auth-magic-link',
    label: 'Log In / Sign Up',
    description: 'Sign in with your email address',
    icon: 'i-heroicons-envelope',
    category: 'Authentication',
    action: () => startAuthFlow(),
    keywords: ['login', 'signin', 'signup', 'register', 'email', 'auth'],
    contexts: ['unauthenticated'],
    priority: 25
  },
  {
    id: 'auth-google',
    label: 'Sign In with Google',
    description: 'Quick sign in with your Google account',
    icon: 'i-heroicons-globe-alt',
    category: 'Authentication',
    action: () => executeGoogleAuth(),
    keywords: ['google', 'oauth', 'signin', 'login'],
    contexts: ['unauthenticated'],
    priority: 24
  },
  {
    id: 'auth-guest',
    label: 'Continue as Guest',
    description: 'Try Athena without creating an account',
    icon: 'i-heroicons-user',
    category: 'Authentication',
    action: () => executeGuestMode(),
    keywords: ['guest', 'trial', 'demo', 'temporary'],
    contexts: ['unauthenticated'],
    priority: 23
  },
  
  // Log out command (shown when authenticated)
  {
    id: 'auth-logout',
    label: 'Log Out',
    description: 'Sign out of your account',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    category: 'Account',
    action: () => executeSignOut(),
    keywords: ['logout', 'signout', 'exit'],
    contexts: ['authenticated'],
    priority: 5
  },
  
  // Namespace entry points
  {
    id: 'namespace-page',
    label: 'Page',
    description: 'Page-related commands',
    icon: 'i-heroicons-document',
    category: 'Namespaces',
    isNamespace: true,
    keywords: ['page', 'document', 'content'],
    contexts: ['authenticated'],
    priority: 20
  },
  {
    id: 'namespace-workspace',
    label: 'Workspace',
    description: 'Workspace-related commands',
    icon: 'i-heroicons-folder',
    category: 'Namespaces',
    isNamespace: true,
    keywords: ['workspace', 'folder', 'project'],
    contexts: ['authenticated'],
    priority: 20
  },
  {
    id: 'namespace-format',
    label: 'Format',
    description: 'Text formatting commands',
    icon: 'i-heroicons-paint-brush',
    category: 'Namespaces',
    isNamespace: true,
    keywords: ['format', 'style', 'text'],
    contexts: ['authenticated'],
    priority: 18
  },
  {
    id: 'namespace-transform',
    label: 'Transform',
    description: 'Page transformation commands',
    icon: 'i-heroicons-arrow-path',
    category: 'Namespaces',
    isNamespace: true,
    keywords: ['transform', 'convert', 'change'],
    contexts: ['authenticated'],
    priority: 18
  },
  
  // Content Creation (contextual for pages)
  {
    id: 'heading',
    label: 'Add Heading',
    description: 'Insert a heading block',
    icon: 'i-heroicons-hashtag',
    category: 'Content',
    namespace: 'Page',
    action: () => executeContentCommand('heading'),
    shortcut: '/',
    keywords: ['heading', 'title', 'h1', 'header'],
    contexts: ['page', 'document'],
    priority: 10
  },
  {
    id: 'todo',
    label: 'Add Todo',
    description: 'Insert a todo list item',
    icon: 'i-heroicons-check',
    category: 'Content',
    namespace: 'Page',
    action: () => executeContentCommand('todo'),
    shortcut: '/-',
    keywords: ['todo', 'task', 'checkbox', 'list'],
    contexts: ['page', 'document'],
    priority: 10
  },
  {
    id: 'bullet-list',
    label: 'Add Bullet List',
    description: 'Insert a bullet list',
    icon: 'i-heroicons-list-bullet',
    category: 'Content',
    namespace: 'Page',
    action: () => executeContentCommand('bullet-list'),
    keywords: ['list', 'bullet', 'ul'],
    contexts: ['page', 'document'],
    priority: 8
  },

  // Text Actions (contextual for selected text)
  {
    id: 'summarize',
    label: 'Summarize Text',
    description: 'AI-powered text summarization',
    icon: 'i-heroicons-document-text',
    category: 'AI & Tools',
    action: () => executeAIAction('summarize'),
    keywords: ['summarize', 'summary', 'ai', 'condense'],
    contexts: ['text-selected'],
    priority: 15
  },
  {
    id: 'translate',
    label: 'Translate Text',
    description: 'Translate selected text',
    icon: 'i-heroicons-language',
    category: 'AI & Tools',
    action: () => executeAIAction('translate'),
    keywords: ['translate', 'language', 'ai'],
    contexts: ['text-selected'],
    priority: 15
  },
  {
    id: 'improve-writing',
    label: 'Improve Writing',
    description: 'Enhance text with AI',
    icon: 'i-heroicons-pencil-square',
    category: 'AI & Tools',
    action: () => executeAIAction('improve'),
    keywords: ['improve', 'enhance', 'writing', 'ai', 'rewrite'],
    contexts: ['text-selected'],
    priority: 15
  },

  // Database Actions
  {
    id: 'filter-data',
    label: 'Filter Data',
    description: 'Apply filters to database',
    icon: 'i-heroicons-funnel',
    category: 'Database',
    action: () => executeDatabaseCommand('filter'),
    shortcut: 'Ctrl+Shift+F',
    keywords: ['filter', 'search', 'query'],
    contexts: ['database', 'table'],
    priority: 12
  },
  {
    id: 'sort-data',
    label: 'Sort Data',
    description: 'Sort database records',
    icon: 'i-heroicons-bars-arrow-up',
    category: 'Database',
    action: () => executeDatabaseCommand('sort'),
    keywords: ['sort', 'order', 'arrange'],
    contexts: ['database', 'table'],
    priority: 12
  },
  {
    id: 'new-view',
    label: 'New View',
    description: 'Create a new database view',
    icon: 'i-heroicons-eye',
    category: 'Database',
    action: () => executeDatabaseCommand('view'),
    keywords: ['view', 'perspective', 'layout'],
    contexts: ['database'],
    priority: 10
  },

  // Workspace & Pages
  {
    id: 'new-workspace',
    label: 'New Workspace',
    description: 'Create a new workspace',
    icon: 'i-heroicons-folder-plus',
    category: 'Workspace',
    namespace: 'Workspace',
    action: () => createNewWorkspace(),
    shortcut: 'Ctrl+Shift+N',
    keywords: ['workspace', 'create', 'new', 'folder', 'ws'],
    contexts: ['authenticated'],
    priority: 10
  },
  {
    id: 'new-page',
    label: 'New Page',
    description: 'Create a new page in current workspace',
    icon: 'i-heroicons-document-plus',
    category: 'Workspace',
    namespace: 'Page',
    action: () => createNewPage(),
    shortcut: 'Ctrl+N',
    keywords: ['page', 'document', 'new', 'create', 'doc'],
    contexts: ['authenticated'],
    priority: 9
  },
  {
    id: 'rename-page',
    label: 'Rename Page',
    description: 'Rename the current page',
    icon: 'i-heroicons-pencil-square',
    category: 'Workspace',
    namespace: 'Page',
    action: () => renamePage(),
    shortcut: 'F2',
    keywords: ['rename', 'page', 'title', 'name', 'edit'],
    contexts: ['document', 'authenticated'],
    priority: 8
  },

  // Formatting
  {
    id: 'bold',
    label: 'Bold Text',
    description: 'Make text bold',
    icon: 'i-heroicons-bold',
    category: 'Formatting',
    namespace: 'Format',
    action: () => executeFormatting('bold'),
    shortcut: 'Ctrl+B',
    keywords: ['bold', 'strong', 'weight', 'bld', 'format'],
    contexts: ['page', 'text-selected'],
    priority: 8
  },
  {
    id: 'italic',
    label: 'Italic Text',
    description: 'Make text italic',
    icon: 'i-heroicons-italic',
    category: 'Formatting',
    namespace: 'Format',
    action: () => executeFormatting('italic'),
    shortcut: 'Ctrl+I',
    keywords: ['italic', 'slant', 'emphasis', 'itl', 'format'],
    contexts: ['page', 'text-selected'],
    priority: 8
  },

  // Navigation & Search
  {
    id: 'search-documents',
    label: 'Search Documents',
    description: 'Search through your documents',
    icon: 'i-heroicons-magnifying-glass',
    category: 'Navigation',
    action: () => executeSearch(),
    shortcut: 'Ctrl+F',
    keywords: ['search', 'find', 'documents', 'look', 'srch'],
    contexts: ['authenticated'],
    priority: 6
  },
  {
    id: 'ai-assistant',
    label: 'Open AI Assistant',
    description: 'Access AI assistant for help',
    icon: 'i-heroicons-cpu-chip',
    category: 'AI & Tools',
    action: () => openAIAssistant(),
    shortcut: 'Ctrl+J',
    keywords: ['ai', 'assistant', 'help', 'jarvis', 'chat', 'bot'],
    contexts: ['authenticated'],
    priority: 6
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open application settings',
    icon: 'i-heroicons-cog-6-tooth',
    category: 'Settings',
    action: () => openSettings(),
    shortcut: 'Ctrl+,',
    keywords: ['settings', 'preferences', 'config', 'options', 'prefs'],
    contexts: ['authenticated'],
    priority: 3
  },

  // Session Management
  {
    id: 'start-guest-session',
    label: 'Start Guest Mode',
    description: 'Begin working without an account (temporary data)',
    icon: 'i-heroicons-user',
    category: 'Session',
    action: () => startGuestMode(),
    keywords: ['guest', 'temporary', 'trial', 'demo', 'quick', 'start'],
    contexts: ['no-session'],
    priority: 9
  },
  {
    id: 'switch-to-logged-in',
    label: 'Sign Up / Log In',
    description: 'Create account or sign in for persistent data',
    icon: 'i-heroicons-user-plus',
    category: 'Session',
    action: () => switchToAccount(),
    keywords: ['signup', 'login', 'account', 'register', 'persistent', 'save'],
    contexts: ['guest-mode'],
    priority: 9
  },
  {
    id: 'session-info',
    label: 'Session Information',
    description: 'View current session mode and data status',
    icon: 'i-heroicons-information-circle',
    category: 'Session',
    action: () => showSessionInfo(),
    keywords: ['session', 'mode', 'info', 'status', 'account'],
    contexts: ['all'],
    priority: 3
  },

  // Polymorphic Transformations
  {
    id: 'transform-to-document',
    label: 'To Document',
    description: 'Convert current page to a document',
    icon: 'i-heroicons-document-text',
    category: 'Transform',
    namespace: 'Transform',
    action: () => transformCurrentPage('DOCUMENT'),
    keywords: ['transform', 'convert', 'document', 'text', 'doc'],
    contexts: ['page'],
    priority: 7
  },
  {
    id: 'transform-to-database',
    label: 'To Database',
    description: 'Convert current page to a database',
    icon: 'i-heroicons-table-cells',
    category: 'Transform',
    namespace: 'Transform',
    action: () => transformCurrentPage('DATABASE'),
    keywords: ['transform', 'convert', 'database', 'table', 'data'],
    contexts: ['page'],
    priority: 7
  },
  {
    id: 'transform-to-whiteboard',
    label: 'To Whiteboard',
    description: 'Convert current page to a visual whiteboard',
    icon: 'i-heroicons-paint-brush',
    category: 'Transform',
    namespace: 'Transform',
    action: () => transformCurrentPage('WHITEBOARD'),
    keywords: ['transform', 'convert', 'whiteboard', 'canvas', 'visual'],
    contexts: ['page'],
    priority: 7
  },
  {
    id: 'transform-to-kanban',
    label: 'To Kanban',
    description: 'Convert current page to a kanban board',
    icon: 'i-heroicons-view-columns',
    category: 'Transform',
    namespace: 'Transform',
    action: () => transformCurrentPage('KANBAN'),
    keywords: ['transform', 'convert', 'kanban', 'board', 'tasks'],
    contexts: ['page'],
    priority: 7
  },

  // Workflow Management
  {
    id: 'create-workflow',
    label: 'Create Workflow',
    description: 'Create a custom command workflow',
    icon: 'i-heroicons-cog',
    category: 'Workflows',
    action: () => createCustomWorkflow(),
    keywords: ['workflow', 'create', 'automation', 'custom', 'sequence'],
    contexts: ['all'],
    priority: 4
  },
  {
    id: 'manage-workflows',
    label: 'Manage Workflows',
    description: 'View and edit custom workflows',
    icon: 'i-heroicons-list-bullet',
    category: 'Workflows',
    action: () => manageWorkflows(),
    keywords: ['workflow', 'manage', 'edit', 'list', 'automation'],
    contexts: ['all'],
    priority: 4
  },

  // Theme Commands (for preview demonstration)
  {
    id: 'theme-dark',
    label: 'Dark Theme',
    description: 'Switch to dark theme',
    icon: 'i-heroicons-moon',
    category: 'Appearance',
    action: () => setTheme('dark'),
    keywords: ['theme', 'dark', 'night', 'black'],
    contexts: ['all'],
    priority: 3
  },
  {
    id: 'theme-light',
    label: 'Light Theme',
    description: 'Switch to light theme',
    icon: 'i-heroicons-sun',
    category: 'Appearance',
    action: () => setTheme('light'),
    keywords: ['theme', 'light', 'day', 'white'],
    contexts: ['all'],
    priority: 3
  }
])

// Enhanced commands with usage statistics
const commands = computed(() => {
  const hasWorkspace = !!currentWorkspace.value
  
  return allCommands.value.map(command => {
    // Update page command description based on workspace state
    if (command.id === 'new-page' && !hasWorkspace) {
      return {
        ...command,
        description: 'Create a new page (workspace required)',
        usageCount: usageStats.value[command.id]?.count || 0,
        lastUsed: usageStats.value[command.id]?.lastUsed || 0,
        frequency: usageStats.value[command.id]?.frequency || 0
      }
    }
    
    return {
      ...command,
      usageCount: usageStats.value[command.id]?.count || 0,
      lastUsed: usageStats.value[command.id]?.lastUsed || 0,
      frequency: usageStats.value[command.id]?.frequency || 0
    }
  })
})

// Namespace-aware commands (shown when not searching)
const namespaceCommands = computed(() => {
  if (currentNamespace.value) {
    // Show commands within the current namespace
    return commands.value
      .filter(cmd => cmd.namespace === currentNamespace.value && !cmd.isNamespace)
      .sort((a, b) => b.priority - a.priority)
  } else {
    // Show namespace entry points
    return commands.value
      .filter(cmd => cmd.isNamespace)
      .sort((a, b) => b.priority - a.priority)
  }
})

// Context-aware command filtering
const contextualCommands = computed(() => {
  const context = currentContext.value
  const isTextSelected = false // TODO: Implement text selection detection
  const hasWorkspace = !!currentWorkspace.value
  
  let relevantContexts = [context.type, context.pageType, 'all']
  if (isTextSelected) {
    relevantContexts.push('text-selected')
  }
  if (hasWorkspace) {
    relevantContexts.push('workspace-selected')
  }
  
  return commands.value
    .filter(command => 
      command.contexts.some(ctx => relevantContexts.includes(ctx))
    )
    .sort((a, b) => {
      // Prioritize by context relevance, then usage, then base priority
      const aContextScore = a.contexts.includes(context.type) ? 20 : 0
      const bContextScore = b.contexts.includes(context.type) ? 20 : 0
      const aUsageScore = a.frequency * 5
      const bUsageScore = b.frequency * 5
      
      return (bContextScore + bUsageScore + b.priority) - (aContextScore + aUsageScore + a.priority)
    })
})

// Recent & Frequent Commands
const recentCommands = computed(() => {
  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  
  return commands.value
    .filter(command => command.lastUsed > now - oneWeek)
    .sort((a, b) => {
      // Weight recent usage and frequency
      const aScore = (a.frequency * 10) + ((now - a.lastUsed) / oneWeek * -5)
      const bScore = (b.frequency * 10) + ((now - b.lastUsed) / oneWeek * -5)
      return bScore - aScore
    })
})

// Suggestions for empty search
const getSuggestions = () => {
  const context = currentContext.value
  switch (context.type) {
    case 'database':
      return ['"filter"', '"sort"', '"view"']
    case 'page':
      return ['"heading"', '"todo"', '"bold"']
    default:
      return ['"new"', '"search"', '"ai"']
  }
}

// Group icons and command icons (reusing previous implementation)
const getGroupIcon = (groupName: string) => {
  const groupIcons: Record<string, string> = {
    'Content': '📝',
    'Workspace': '📁',
    'Navigation': '🧭',
    'AI & Tools': '🤖',
    'Formatting': '✨',
    'Database': '🗃️',
    'Settings': '⚙️',
    'Session': '🔐',
    'Transform': '🔄',
    'Workflows': '🔄',
    'Appearance': '🎨'
  }
  return groupIcons[groupName] || '📋'
}

const getCommandIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'i-heroicons-folder-plus': '📁',
    'i-heroicons-folder': '📂',
    'i-heroicons-document-plus': '📄',
    'i-heroicons-document': '📄',
    'i-heroicons-magnifying-glass': '🔍',
    'i-heroicons-cpu-chip': '🤖',
    'i-heroicons-cog-6-tooth': '⚙️',
    'i-heroicons-cog': '🔧',
    'i-heroicons-bold': '𝐁',
    'i-heroicons-italic': '𝐼',
    'i-heroicons-hashtag': '#',
    'i-heroicons-check': '✓',
    'i-heroicons-list-bullet': '•',
    'i-heroicons-document-text': '📄',
    'i-heroicons-language': '🌐',
    'i-heroicons-pencil-square': '✏️',
    'i-heroicons-funnel': '🔽',
    'i-heroicons-bars-arrow-up': '↕️',
    'i-heroicons-eye': '👁️',
    'i-heroicons-moon': '🌙',
    'i-heroicons-sun': '☀️',
    'i-heroicons-paint-brush': '🎨',
    'i-heroicons-arrow-path': '🔄',
    'i-heroicons-table-cells': '🗊',
    'i-heroicons-view-columns': '🗊',
    'i-heroicons-envelope': '✉️',
    'i-heroicons-globe-alt': '🌐',
    'i-heroicons-user': '👤',
    'i-heroicons-arrow-right-on-rectangle': '🚪'
  }
  return iconMap[iconName] || '•'
}

const getFrequencyIndicator = (count: number) => {
  if (count > 20) return '🔥'
  if (count > 10) return '⭐'
  if (count > 5) return '👍'
  return ''
}

// Namespace navigation functions
const enterNamespace = (namespace: string) => {
  navigationHistory.value.push(currentNamespace.value || '')
  currentNamespace.value = namespace
  query.value = ''
  selectedIndex.value = 0
}

const exitNamespace = () => {
  if (navigationHistory.value.length > 0) {
    currentNamespace.value = navigationHistory.value.pop() || null
  } else {
    currentNamespace.value = null
  }
  query.value = ''
  selectedIndex.value = 0
}

const resetNamespace = () => {
  currentNamespace.value = null
  navigationHistory.value = []
  query.value = ''
  selectedIndex.value = 0
}

// Search implementation (reusing fuzzy search logic)
const fuzzyMatch = (text: string, query: string): { score: number; matches: number[] } => {
  if (!query) return { score: 1, matches: [] }
  
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  if (textLower.includes(queryLower)) {
    const index = textLower.indexOf(queryLower)
    return { 
      score: 1000 - index, 
      matches: Array.from({ length: queryLower.length }, (_, i) => index + i)
    }
  }
  
  let score = 0
  let matches: number[] = []
  let queryIndex = 0
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matches.push(i)
      score += 10 - queryIndex
      queryIndex++
    }
  }
  
  let consecutiveBonus = 0
  for (let i = 1; i < matches.length; i++) {
    if (matches[i] === matches[i-1] + 1) {
      consecutiveBonus += 5
    }
  }
  
  return queryIndex === queryLower.length ? { score: score + consecutiveBonus, matches } : { score: 0, matches: [] }
}

const filteredCommands = computed(() => {
  if (!query.value && !currentNamespace.value) return []
  
  let commandsToFilter = commands.value
  
  // Filter by namespace if in namespace mode
  if (currentNamespace.value) {
    commandsToFilter = commands.value.filter(cmd => 
      cmd.namespace === currentNamespace.value && !cmd.isNamespace
    )
  }
  
  // If no query, show all commands in namespace or namespace entries
  if (!query.value) {
    if (currentNamespace.value) {
      return commandsToFilter
    } else {
      // Show namespace entries when not in a namespace
      return commands.value.filter(cmd => cmd.isNamespace)
    }
  }
  
  const queryLower = query.value.toLowerCase()
  const results: any[] = []
  
  commandsToFilter.forEach(command => {
    const labelMatch = fuzzyMatch(command.label, queryLower)
    const descMatch = fuzzyMatch(command.description, queryLower)
    const keywordMatch = command.keywords.reduce((best: { score: number; matches: number[] }, keyword: string) => {
      const match = fuzzyMatch(keyword, queryLower)
      return match.score > best.score ? match : best
    }, { score: 0, matches: [] })
    
    const bestMatch = [labelMatch, descMatch, keywordMatch]
      .sort((a, b) => b.score - a.score)[0]
    
    if (bestMatch.score > 0) {
      // Boost score for frequently used commands
      const usageBoost = (command.frequency || 0) * 50
      results.push({
        ...command,
        searchScore: bestMatch.score + usageBoost,
        searchMatches: bestMatch.matches
      })
    }
  })
  
  return results.sort((a, b) => b.searchScore - a.searchScore)
})

const groupedCommands = computed(() => {
  const groups: Record<string, any[]> = {}
  
  filteredCommands.value.forEach(command => {
    if (!groups[command.category]) {
      groups[command.category] = []
    }
    groups[command.category].push(command)
  })
  
  return groups
})

const highlightMatch = (text: string, query: string): string => {
  if (!query) return text
  
  const match = fuzzyMatch(text, query)
  if (match.score === 0) return text
  
  let result = ''
  for (let i = 0; i < text.length; i++) {
    if (match.matches.includes(i)) {
      result += `<mark class="search-highlight">${text[i]}</mark>`
    } else {
      result += text[i]
    }
  }
  
  return result
}

// Navigation logic
const getTotalItemsBeforeSearch = () => {
  return contextualCommands.value.length + recentCommands.value.length
}

const getGlobalSearchIndex = (groupName: string, localIndex: number): number => {
  const itemsBeforeSearch = getTotalItemsBeforeSearch()
  let globalIndex = itemsBeforeSearch
  
  for (const [gName, group] of Object.entries(groupedCommands.value)) {
    if (gName === groupName) {
      return globalIndex + localIndex
    }
    globalIndex += group.length
  }
  
  return globalIndex
}

const getCommandByGlobalIndex = (globalIndex: number): any => {
  // In namespace mode or showing namespace entries
  if (currentNamespace.value || (!query.value && !isCreatingWorkspace.value && !isCreatingPage.value)) {
    const commands = query.value ? filteredCommands.value : namespaceCommands.value
    return commands[globalIndex] || null
  }
  
  // Check contextual commands first
  if (globalIndex < contextualCommands.value.length) {
    return contextualCommands.value[globalIndex]
  }
  
  // Check recent commands
  const recentStartIndex = contextualCommands.value.length
  if (globalIndex < recentStartIndex + recentCommands.value.length) {
    return recentCommands.value[globalIndex - recentStartIndex]
  }
  
  // Check search results
  const searchStartIndex = recentStartIndex + recentCommands.value.length
  let currentIndex = searchStartIndex
  
  for (const group of Object.values(groupedCommands.value)) {
    if (globalIndex < currentIndex + group.length) {
      return group[globalIndex - currentIndex]
    }
    currentIndex += group.length
  }
  
  return null
}

const getTotalCommands = () => {
  if (currentNamespace.value) {
    return query.value ? filteredCommands.value.length : namespaceCommands.value.length
  }
  if (query.value) {
    return filteredCommands.value.length
  }
  return namespaceCommands.value.length
}

const getSelectedCommand = () => {
  const command = getCommandByGlobalIndex(selectedIndex.value)
  return command || null
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, getTotalCommands() - 1)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
      
    case 'ArrowRight':
      event.preventDefault()
      // Enter namespace if selected command is a namespace
      const selectedCmd = getCommandByGlobalIndex(selectedIndex.value)
      if (selectedCmd?.isNamespace) {
        enterNamespace(selectedCmd.label)
      }
      break
      
    case 'ArrowLeft':
    case 'Backspace':
      // Exit namespace on backspace with empty query
      if (event.key === 'Backspace' && query.value) {
        return // Let normal backspace work
      }
      event.preventDefault()
      if (currentNamespace.value) {
        exitNamespace()
      }
      break
      
    case 'Enter':
      event.preventDefault()
      const cmd = getCommandByGlobalIndex(selectedIndex.value)
      if (cmd?.isNamespace) {
        enterNamespace(cmd.label)
      } else {
        executeCommand()
      }
      break
      
    case 'Escape':
      event.preventDefault()
      if (currentNamespace.value) {
        resetNamespace()
      } else {
        emit('close')
      }
      break
      
    case 'Home':
      event.preventDefault()
      selectedIndex.value = 0
      break
      
    case 'End':
      event.preventDefault()
      selectedIndex.value = getTotalCommands() - 1
      break
  }
}

const executeCommand = async () => {
  const command = getCommandByGlobalIndex(selectedIndex.value)
  if (!command) return
  
  await selectCommand(command)
}

const selectCommand = async (command: any) => {
  // Handle namespace navigation
  if (command.isNamespace) {
    enterNamespace(command.label)
    return
  }
  
  try {
    executingCommand.value = command.id
    isExecuting.value = true
    
    // Track usage before execution
    trackCommandUsage(command.id)
    
    if (command.action) {
      await command.action()
    }
    
    lastExecuted.value = command.id
    setTimeout(() => {
      lastExecuted.value = null
    }, 2000)
    
    // Only close if we're not in workspace creation mode
    if (!isCreatingWorkspace.value) {
      emit('close')
    }
  } catch (error) {
    console.error('Command execution failed:', error)
  } finally {
    executingCommand.value = null
    isExecuting.value = false
  }
}

// Command implementations
const createNewWorkspace = async () => {
  // Show the workspace creation form instead of using prompt
  isCreatingWorkspace.value = true
  workspaceForm.value.name = ''
  workspaceForm.value.icon = ''
  
  // Focus the name input after the next DOM update
  await nextTick()
  workspaceNameInput.value?.focus()
}

const confirmCreateWorkspace = async () => {
  const workspaceName = workspaceForm.value.name.trim()
  if (!workspaceName) return
  
  try {
    isExecuting.value = true
    
    const { createWorkspace, setCurrentWorkspace } = useWorkspace()
    
    const newWorkspace = await createWorkspace({
      name: workspaceName,
      icon: workspaceForm.value.icon || '📁',
      color: '#3b82f6'
    })
    
    // Set as current workspace
    setCurrentWorkspace(newWorkspace)
    
    console.log('New workspace created and selected:', newWorkspace)
    
    // Reset workspace form but stay in Command Palette
    isCreatingWorkspace.value = false
    workspaceForm.value.name = ''
    workspaceForm.value.icon = ''
    
    // Clear search and reset to show page creation options
    query.value = ''
    selectedIndex.value = 0
    
    // Automatically show page creation form with "Start" as default
    isCreatingPage.value = true
    pageForm.value.title = 'Start'
    pageForm.value.icon = '📄'
    
    // Focus the page title input after the next DOM update
    await nextTick()
    pageTitleInput.value?.focus()
    
  } catch (error) {
    console.error('Error creating workspace:', error)
    alert('Failed to create workspace. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const cancelCreateWorkspace = () => {
  isCreatingWorkspace.value = false
  workspaceForm.value.name = ''
  workspaceForm.value.icon = ''
}

// AI Command Execution
const executeAISequence = async () => {
  try {
    await executeAICommands(allCommands.value)
    emit('close')
  } catch (error) {
    console.error('Failed to execute AI command sequence:', error)
    alert('Failed to execute commands. Please try again.')
  }
}

const cancelAISequence = () => {
  clearAIState()
  query.value = ''
}

// Page creation functions
const createNewPage = async () => {
  // Show the page creation form
  isCreatingPage.value = true
  pageForm.value.title = 'Start'
  pageForm.value.icon = '📄'
  
  // Focus the page title input after the next DOM update
  await nextTick()
  pageTitleInput.value?.focus()
}

const confirmCreatePage = async () => {
  const pageTitle = pageForm.value.title.trim()
  if (!pageTitle) return
  
  try {
    isExecuting.value = true
    
    const { createPage } = useWorkspace()
    
    const newPage = await createPage({
      title: pageTitle,
      type: pageForm.value.type,
      icon: pageForm.value.icon || '📄'
    })
    
    console.log('New page created:', newPage)
    
    // Navigate to the new page
    await navigateTo(`/page/${newPage.id}`)
    
    // Reset form and close palette
    isCreatingPage.value = false
    pageForm.value.title = 'Start'
    pageForm.value.icon = '📄'
    
    emit('close')
    
  } catch (error) {
    console.error('Error creating page:', error)
    alert('Failed to create page. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const cancelCreatePage = () => {
  isCreatingPage.value = false
  pageForm.value.title = 'Start'
  pageForm.value.icon = '📄'
}

const handlePageFormKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (pageForm.value.title.trim()) {
      confirmCreatePage()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelCreatePage()
  }
}

// Page rename functions
const renamePage = async () => {
  const route = useRoute()
  const { currentPage } = useWorkspace()
  
  // Get the current page from route or workspace context
  const page = currentPage.value || (route.params.id ? { id: route.params.id, title: 'Current Page' } : null)
  
  if (!page) {
    alert('No page selected to rename')
    return
  }
  
  // Show the rename form
  isRenamingPage.value = true
  renameForm.value.pageId = page.id as string
  renameForm.value.originalTitle = page.title || 'Untitled'
  renameForm.value.newTitle = page.title || ''
  
  // Focus the rename input after the next DOM update
  await nextTick()
  renameTitleInput.value?.focus()
  renameTitleInput.value?.select()
}

const confirmRenamePage = async () => {
  const newTitle = renameForm.value.newTitle.trim()
  if (!newTitle || newTitle === renameForm.value.originalTitle) return
  
  try {
    isExecuting.value = true
    
    const { updatePage } = useWorkspace()
    
    await updatePage(renameForm.value.pageId, {
      title: newTitle
    })
    
    console.log('Page renamed successfully')
    
    // Reset form and close palette
    isRenamingPage.value = false
    renameForm.value.newTitle = ''
    renameForm.value.pageId = ''
    renameForm.value.originalTitle = ''
    
    emit('close')
    
  } catch (error) {
    console.error('Error renaming page:', error)
    alert('Failed to rename page. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const cancelRenamePage = () => {
  isRenamingPage.value = false
  renameForm.value.newTitle = ''
  renameForm.value.pageId = ''
  renameForm.value.originalTitle = ''
}

const handleRenameFormKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (renameForm.value.newTitle.trim() && renameForm.value.newTitle !== renameForm.value.originalTitle) {
      confirmRenamePage()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRenamePage()
  }
}

const handleWorkspaceFormKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (workspaceForm.value.name.trim()) {
      confirmCreateWorkspace()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelCreateWorkspace()
  }
}


const executeContentCommand = async (type: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  console.log(`Inserting ${type} block...`)
}

const executeAIAction = async (type: string) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  console.log(`AI ${type} action executed...`)
}


const executeDatabaseCommand = async (type: string) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log(`Database ${type} command executed...`)
}

const executeSearch = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('Opening search...')
}

const openAIAssistant = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  console.log('Opening AI Assistant...')
}

const executeFormatting = async (type: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  console.log(`Applying ${type} formatting...`)
}

const openSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('Opening settings...')
}

const createCustomWorkflow = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  // TODO: Open workflow creation modal
  console.log('Opening workflow creation modal...')
}

// Session Mode Commands
const startGuestMode = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  try {
    const { startGuestSession } = useSessionMode()
    
    const result = await startGuestSession()
    
    console.log('Guest session started:', result)
    
    alert(`Guest Mode activated!\n\nYour data is temporary and will be lost when you close the browser.\n\nSession ID: ${result?.sessionId || 'unknown'}`)
    
    // Refresh the page to update the UI
    if (process.client) {
      window.location.reload()
    }
  } catch (error) {
    console.error('Failed to start guest session:', error)
    alert('Failed to start guest session. Please try again.')
  }
}

const switchToAccount = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const { switchToLoggedIn } = useSessionMode()
  
  const result = await switchToLoggedIn()
  
  console.log('Account switch requested:', result)
  
  alert(`Sign Up / Log In\n\n${result.message}\n\nBenefits:\n• ${result.benefits.join('\n• ')}`)
}

const showSessionInfo = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  try {
    const response = await fetch('/api/session/mode')
    const data = await response.json()
    
    if (data.success) {
      const session = data.data
      let info = `Session Information\n\n`
      info += `Mode: ${session.mode}\n`
      
      if (session.mode === 'GUEST') {
        info += `Session ID: ${session.sessionId}\n`
        info += `Expires: ${new Date(session.expiresAt).toLocaleString()}\n`
        info += `\nData Count:\n`
        info += `• Workspaces: ${session.dataCount.workspaces}\n`
        info += `• Pages: ${session.dataCount.pages}\n`
        info += `• Blocks: ${session.dataCount.blocks}\n`
        info += `• Links: ${session.dataCount.links}\n`
        info += `\n⚠️ All data is temporary and will be lost when browser is closed`
      } else if (session.mode === 'LOGGED_IN') {
        info += `Status: Authenticated\n`
        info += `\nFeatures:\n`
        info += `• Persistent data storage\n`
        info += `• Cloud synchronization\n`
        info += `• Collaboration features\n`
        info += `• Full feature access`
      } else {
        info += `No active session\n\nUse "Start Guest Mode" or "Sign Up / Log In" to begin`
      }
      
      alert(info)
    }
  } catch (error) {
    console.error('Failed to get session info:', error)
    alert('Failed to get session information')
  }
}

// Polymorphic Transformation Commands
const transformCurrentPage = async (targetType: string) => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // For demo purposes, use the known page ID
  const currentPageId = 'cme8xcmf70006dg84dk9pksxo' // TODO: Get from current page context
  
  try {
    // Preview the transformation first
    const previewResponse = await fetch(`/api/pages/${currentPageId}/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType })
    })
    
    if (!previewResponse.ok) {
      throw new Error('Failed to preview transformation')
    }
    
    const preview = await previewResponse.json()
    
    if (preview.success) {
      const plan = preview.data.plan
      const confirmMessage = `Transform Page: ${plan.from} → ${plan.to}\n\n` +
        `Steps:\n${plan.steps.join('\n')}\n\n` +
        `Preserved data:\n• ${plan.preservedData.blocks} blocks\n• Title: "${plan.preservedData.title}"\n• ${plan.preservedData.links}\n\n` +
        `Do you want to proceed with this transformation?`
      
      if (confirm(confirmMessage)) {
        // Execute the transformation
        const executeResponse = await fetch(`/api/pages/${currentPageId}/transform`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, execute: true })
        })
        
        if (executeResponse.ok) {
          const result = await executeResponse.json()
          if (result.success) {
            alert(`Success!\n\n${result.data.message}\n\nBlocks preserved: ${result.data.transformation.preservedBlocks}\nNew properties: ${result.data.transformation.newProperties}\nNew icon: ${result.data.transformation.newIcon}`)
          }
        } else {
          throw new Error('Failed to execute transformation')
        }
      }
    }
  } catch (error: any) {
    console.error('Transformation failed:', error)
    alert(`Transformation failed: ${error?.message || 'Unknown error'}`)
  }
}

const manageWorkflows = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  // TODO: Open workflow management interface
  console.log('Opening workflow management...')
}

const setTheme = async (theme: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  console.log(`Setting theme to ${theme}...`)
  // TODO: Integrate with actual theme system
}

// Authentication functions
const startAuthFlow = () => {
  isInAuthFlow.value = true
  authStep.value = 'email-input'
  authEmail.value = ''
  
  nextTick(() => {
    emailInput.value?.focus()
  })
}

const executeEmailAuth = async () => {
  if (!authEmail.value.trim()) return
  
  try {
    isExecuting.value = true
    const result = await signInWithMagicLink(authEmail.value.trim())
    
    if (result.success) {
      authStep.value = 'confirmation'
      // Auto-close after showing confirmation
      setTimeout(() => {
        emit('close')
      }, 3000)
    } else {
      alert(result.error || 'Failed to send magic link')
    }
  } catch (error) {
    console.error('Email auth error:', error)
    alert('Failed to send magic link. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const executeGoogleAuth = async () => {
  try {
    isExecuting.value = true
    const result = await signInWithGoogle()
    
    if (!result.success) {
      alert(result.error || 'Failed to sign in with Google')
    }
    // Google auth will redirect, so we don't need to close here
  } catch (error) {
    console.error('Google auth error:', error)
    alert('Failed to sign in with Google. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const executeGuestMode = async () => {
  try {
    isExecuting.value = true
    const result = await continueAsGuest()
    
    if (result.success) {
      emit('close')
    } else {
      alert(result.error || 'Failed to start guest session')
    }
  } catch (error) {
    console.error('Guest mode error:', error)
    alert('Failed to start guest session. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const executeSignOut = async () => {
  try {
    isExecuting.value = true
    const result = await signOut()
    
    if (result.success) {
      emit('close')
    } else {
      alert(result.error || 'Failed to sign out')
    }
  } catch (error) {
    console.error('Sign out error:', error)
    alert('Failed to sign out. Please try again.')
  } finally {
    isExecuting.value = false
  }
}

const cancelAuthFlow = () => {
  isInAuthFlow.value = false
  authStep.value = 'initial'
  authEmail.value = ''
}

const handleAuthKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (authEmail.value.trim()) {
      executeEmailAuth()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelAuthFlow()
  }
}


// Note: isNaturalLanguageQuery is imported from useAiCommands composable

const processCustomWorkflow = async (query: string) => {
  const workflow = findWorkflowByTrigger(query.trim())
  if (!workflow) return null
  
  // Convert workflow steps to AI command format
  const commands = workflow.steps.map(step => ({
    commandId: step.commandId,
    description: step.description,
    args: step.args || [],
    confidence: 1.0, // Custom workflows have perfect confidence
    reasoning: 'Custom workflow step'
  }))
  
  return {
    commands,
    confidence: 1.0,
    isWorkflow: true,
    workflowId: workflow.id,
    workflowName: workflow.name
  }
}

const processAIQuery = async (query: string) => {
  if (isAIProcessing.value) return
  
  try {
    isAIProcessing.value = true
    
    // Clear any existing timeout
    if (aiProcessingTimeout.value) {
      clearTimeout(aiProcessingTimeout.value)
    }
    
    // Check for custom workflow triggers first
    if (query.startsWith('/') && query.length > 1) {
      const workflowResult = await processCustomWorkflow(query)
      if (workflowResult) {
        aiCommandSequence.value = workflowResult.commands
        aiConfidence.value = workflowResult.confidence
        return
      }
    }
    
    // Build context payload
    const contextPayload = buildContextPayload()
    
    // Send to AI parsing endpoint
    const response = await $fetch('/api/ai/parse', {
      method: 'POST',
      body: {
        query,
        pageContext: contextPayload.pageContext,
        selectionContext: contextPayload.selectionContext,
        systemContext: contextPayload.systemContext
      },
      timeout: 12000 // 12 second timeout
    })
    
    if (response.success && response.commands?.length > 0) {
      aiCommandSequence.value = response.commands
      aiConfidence.value = response.confidence || 0
    } else if ('fallback' in response && response.fallback?.length > 0) {
      // Show fallback suggestions
      console.log('Fallback suggestions:', response.fallback)
      aiCommandSequence.value = null
      aiConfidence.value = 0
    } else {
      // No AI commands found
      aiCommandSequence.value = null
      aiConfidence.value = 0
    }
    
  } catch (error) {
    console.error('AI processing failed:', error)
    aiCommandSequence.value = null
    aiConfidence.value = 0
  } finally {
    isAIProcessing.value = false
  }
}

const buildContextPayload = () => {
  const currentWorkspace = getCurrentWorkspace()
  // TODO: Implement text selection detection
  const selection: { text: string } | null = null
  
  return {
    pageContext: {
      pageTitle: route.params.title || 'Untitled',
      pageType: currentContext.value.pageType,
      workspaceName: currentWorkspace?.name || 'Unknown',
      currentRoute: route.path
    },
    selectionContext: {
      hasSelection: !!selection?.text,
      selectedText: selection?.text || '',
      selectionLength: selection?.text?.length || 0
    },
    systemContext: {
      availableCommands: JSON.stringify(
        commands.value.map(cmd => ({
          id: cmd.id,
          label: cmd.label,
          description: cmd.description,
          category: cmd.category,
          keywords: cmd.keywords
        }))
      ),
      recentCommands: JSON.stringify(
        recentCommands.value.slice(0, 5).map(cmd => ({
          id: cmd.id,
          label: cmd.label,
          usageCount: cmd.usageCount
        }))
      )
    }
  }
}

const getTextSelection = () => {
  // TODO: Implement text selection detection for current page
  // This would integrate with the TipTap editor or other content areas
  return null
}

// executeAISequence is defined earlier in the file

const executeAICommand = async (aiCommand: any) => {
  // Find matching command from our command set  
  const command = commands.value.find(cmd => cmd.id === aiCommand.commandId)
  
  if (command) {
    // Track usage and execute
    trackCommandUsage(command.id)
    if (command.action) {
      await command.action()
    }
  } else {
    console.warn(`Command not found: ${aiCommand.commandId}`)
  }
}

// cancelAISequence is defined earlier in the file

// Enhanced query input handler
const handleQueryInput = () => {
  const currentQuery = query.value.trim()
  selectedIndex.value = 0
  
  // Clear existing AI state when query changes
  clearAIState()
  
  // Check if this looks like a natural language query
  if (currentQuery.length > 3 && isNaturalLanguageQuery(currentQuery)) {
    // Debounce AI processing
    setTimeout(async () => {
      if (query.value.trim() === currentQuery) { // Only process if query hasn't changed
        await processCurrentQuery()
      }
    }, 800) // Wait 800ms after user stops typing
  }
}

// Process current query with AI
const processCurrentQuery = async () => {
  const currentQuery = query.value.trim()
  if (!currentQuery || currentQuery.length < 3) return
  
  try {
    const context = {
      pageId: route.params.pageId as string,
      pageTitle: 'Current Page', // Could be enhanced to get actual title
      pageType: 'document',
      workspaceId: currentWorkspace.value?.id,
      selectedText: getSelectedText(),
      availableCommands: allCommands.value
    }
    
    await processNaturalLanguage(currentQuery, context)
  } catch (error) {
    console.error('Failed to process natural language query:', error)
  }
}

// Helper to get selected text from the page
const getSelectedText = (): string => {
  if (typeof window !== 'undefined') {
    return window.getSelection()?.toString() || ''
  }
  return ''
}

const handleOverlayClick = () => {
  emit('close')
}

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    query.value = ''
    selectedIndex.value = 0
    // Reset namespace navigation
    resetNamespace()
    // Don't reset creation states - let them persist when palette opens
    // Only reset forms if we're not currently creating anything
    if (!isCreatingWorkspace.value) {
      workspaceForm.value.name = ''
      workspaceForm.value.icon = ''
    }
    if (!isCreatingPage.value) {
      pageForm.value.title = 'Start'
      pageForm.value.icon = '📄'
    }
    nextTick(() => {
      // Focus appropriate input based on current mode
      if (isCreatingWorkspace.value) {
        workspaceNameInput.value?.focus()
      } else if (isCreatingPage.value) {
        pageTitleInput.value?.focus()
      } else {
        searchInput.value?.focus()
      }
    })
  } else {
    // Reset all states when palette closes
    resetNamespace()
    isCreatingWorkspace.value = false
    workspaceForm.value.name = ''
    workspaceForm.value.icon = ''
    isCreatingPage.value = false
    pageForm.value.title = 'Start'
    pageForm.value.icon = '📄'
  }
})

watch(query, () => {
  selectedIndex.value = 0
})

onMounted(() => {
  loadUsageStats()
  loadWorkflows()
})
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.command-palette-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 10px 10px -5px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 680px;
  max-height: 520px;
  overflow: hidden;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.command-palette-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.context-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.context-icon {
  font-size: 14px;
}

/* Namespace Breadcrumb */
.namespace-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.breadcrumb-part {
  color: #6b7280;
  transition: color 0.15s ease;
}

.breadcrumb-current {
  color: #3b82f6;
  font-weight: 600;
}

.breadcrumb-separator {
  color: #9ca3af;
  margin: 0 4px;
}

.search-stats {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.command-palette-content {
  padding: 0 0 16px 0;
  max-height: 440px;
  overflow-y: auto;
}

.search-container {
  position: relative;
  padding: 0 24px 16px;
}

.search-icon {
  position: absolute;
  left: 36px;
  top: 14px;
  font-size: 16px;
  color: #9ca3af;
}

.command-palette-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: all 0.15s ease;
}

.command-palette-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-spinner {
  position: absolute;
  right: 36px;
  top: 14px;
  font-size: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Quick Actions */
.quick-actions {
  padding: 0 16px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.quick-actions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.quick-icon {
  font-size: 14px;
}

.quick-hint {
  margin-left: auto;
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}

.quick-commands {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.quick-command {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
  border: 2px solid transparent;
}

.quick-command:hover {
  background: #f8fafc;
}

.quick-command-selected {
  background: #eff6ff;
  border-color: #dbeafe;
}

.quick-command-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.quick-command-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.quick-command-shortcut {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

/* Recent Section */
.recent-section {
  padding: 0 16px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.recent-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.recent-icon {
  font-size: 14px;
}

.recent-hint {
  margin-left: auto;
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}

.recent-commands {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-command {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
  border: 2px solid transparent;
}

.recent-command:hover {
  background: #f8fafc;
}

.recent-command-selected {
  background: #eff6ff;
  border-color: #dbeafe;
}

.recent-command-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.recent-command-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-command-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.recent-command-usage {
  font-size: 12px;
  color: #9ca3af;
}

.recent-command-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-command-shortcut {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.recent-command-frequency {
  font-size: 14px;
}

/* Search Results */
.command-list {
  padding: 0 8px;
}

.command-group {
  margin-bottom: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 6px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.group-icon {
  font-size: 14px;
}

.group-count {
  margin-left: auto;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
}

.group-commands {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.command-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 0 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
  border: 2px solid transparent;
}

.command-item:hover {
  background: #f8fafc;
}

.command-item-selected {
  background: #eff6ff;
  border-color: #dbeafe;
}

.command-item-executing {
  background: #fef3c7;
  border-color: #fde68a;
}

.command-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.command-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.command-label {
  margin: 0 0 2px 0;
  font-weight: 500;
  color: #111827;
  font-size: 14px;
}

.command-description {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.command-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-indicator {
  background: #e0f2fe;
  color: #0277bd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.command-shortcut {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
  font-weight: 500;
}

.command-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.status-spinner {
  animation: spin 1s linear infinite;
  font-size: 14px;
  color: #f59e0b;
}

.status-success {
  font-size: 14px;
  color: #10b981;
}

.search-highlight {
  background: #fef3c7;
  color: #92400e;
  padding: 1px 2px;
  border-radius: 3px;
  font-weight: 600;
}

.command-empty, .command-help {
  text-align: center;
  padding: 40px 24px;
  color: #6b7280;
}

.empty-icon, .help-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-text, .help-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.empty-hint {
  font-size: 14px;
  color: #9ca3af;
}

.help-shortcuts {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.help-shortcut {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 500;
  color: #6b7280;
}

/* Namespace Navigation Styles */
.namespace-entries,
.namespace-commands {
  padding: 0 16px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.entries-header,
.namespace-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.entries-icon,
.namespace-icon {
  font-size: 14px;
}

.entries-hint,
.namespace-hint {
  margin-left: auto;
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
}

.entries-list,
.namespace-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-item,
.namespace-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
  border: 2px solid transparent;
}

.entry-item:hover,
.namespace-item:hover {
  background: #f8fafc;
}

.entry-item-selected,
.namespace-item-selected {
  background: #eff6ff;
  border-color: #dbeafe;
}

.entry-item-icon,
.namespace-item-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.entry-item-info,
.namespace-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.entry-item-label,
.namespace-item-label {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.entry-item-description,
.namespace-item-description {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-arrow {
  font-size: 16px;
  color: #9ca3af;
  font-weight: 600;
  transition: transform 0.15s ease;
}

.entry-item:hover .entry-arrow {
  transform: translateX(2px);
  color: #6b7280;
}

.namespace-item-shortcut {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

/* AI Status and Processing */
.ai-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.ai-status.processing {
  background: #fef3c7;
  color: #92400e;
  animation: pulse 1.5s ease-in-out infinite;
}

.ai-status.ready {
  background: #d1fae5;
  color: #065f46;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* AI Confirmation UI */
.ai-confirmation {
  margin: 0 16px 16px;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.confirmation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.ai-icon {
  font-size: 16px;
}

.confirmation-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  flex: 1;
  min-width: 200px;
}

.confirmation-confidence {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.confidence-label {
  color: #6b7280;
  font-weight: 500;
}

.confidence-bar {
  width: 60px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  transition: width 0.3s ease;
  border-radius: 3px;
}

.confidence-text {
  color: #374151;
  font-weight: 600;
  min-width: 35px;
}

.command-sequence {
  margin-bottom: 16px;
}

.sequence-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.sequence-item:last-child {
  border-bottom: none;
}

.sequence-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.sequence-action {
  flex: 1;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.sequence-confidence {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
}

.confirmation-actions {
  display: flex;
  gap: 8px;
}

.confirm-btn, .cancel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.confirm-btn {
  background: #10b981;
  color: white;
}

.confirm-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-icon {
  font-size: 12px;
}

/* Workspace Creation Form */
.workspace-form {
  margin: 0 16px 16px;
  padding: 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.form-icon {
  font-size: 20px;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.form-content {
  margin-bottom: 16px;
}

.input-group {
  margin-bottom: 12px;
}

.input-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.workspace-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.15s ease;
  outline: none;
}

.workspace-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.workspace-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-top: 8px;
}

.preview-icon {
  font-size: 16px;
}

.preview-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.preview-label {
  font-size: 12px;
  color: #6b7280;
  margin-right: 8px;
}

.preview-arrow {
  margin: 0 12px;
  color: #9ca3af;
}

.preview-name.new {
  color: #10b981;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: #3b82f6;
  color: white;
}

.create-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Authentication Form */
.auth-form {
  margin: 0 16px 16px;
  padding: 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.auth-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-description {
  text-align: center;
  margin-top: 8px;
}

.auth-description p {
  color: #6b7280;
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
}

.confirmation-message {
  text-align: center;
  padding: 16px 0;
}

.confirmation-message p {
  color: #374151;
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
}

.email-display {
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  border: 1px solid #dbeafe;
}

.btn-spinner {
  animation: spin 1s linear infinite;
  font-size: 14px;
}
</style>