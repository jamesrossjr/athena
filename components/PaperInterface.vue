<template>
  <div 
    class="app-layout" 
    :class="{ 'app-layout--dark': isDarkMode }"
  >
    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Single Document View (Full Page) -->
      <div v-if="activeDocument" class="paper-document">
        <DocumentRenderer
          :document="activeDocument"
          @update="updateDocument"
          @slash-command="handleSlashCommand"
          ref="documentRenderer"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else class="paper-empty">
        <div class="paper-empty__content">
          <div class="paper-empty__icon">✨</div>
          <h2 class="paper-empty__title">Start with a blank page</h2>
          <p class="paper-empty__description">
            Create a new document or open one from your workspace
          </p>
          <div class="paper-empty__actions">
            <button @click="createNewDocument('page')" class="paper-button paper-button--primary">
              New Page
            </button>
            <button @click="showDocumentPicker" class="paper-button">
              More Options
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Ribbon -->
    <div class="navigation-ribbon">
      <!-- Left Section - Workspace Menu -->
      <div class="ribbon-section ribbon-left">
        <button 
          @click="showWorkspaceMenu = !showWorkspaceMenu"
          class="workspace-btn"
          :class="{ 'workspace-btn--active': showWorkspaceMenu }"
        >
          <svg class="workspace-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0l2 2m-2-2l-2 2"/>
          </svg>
          {{ activeWorkspace?.name || 'Main Workspace' }}
          <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        
        <!-- Workspace Menu -->
        <div v-if="showWorkspaceMenu" class="workspace-menu">
          <div class="workspace-menu__header">
            <span>Workspaces</span>
            <div @click="createNewWorkspace" class="workspace-add-btn">+</div>
          </div>
          <div class="workspace-list">
            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              @click="switchWorkspace(workspace.id)"
              class="workspace-item"
              :class="{ 'workspace-item--active': workspace.id === activeWorkspaceId }"
            >
              {{ workspace.name }}
              <span class="document-count">{{ workspace.documents.length }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Center Section - Tab Bar -->
      <div class="ribbon-section ribbon-center">
        <div class="tab-bar" ref="tabBar">
          <div class="tab-scroll-container">
            <button
              v-for="doc in openDocuments"
              :key="doc.id"
              @click="openDocument(doc)"
              @mousedown.middle="closeDocument(doc.id)"
              @contextmenu.prevent="showDocumentTypeChanger(doc, $event)"
              class="vivaldi-tab"
              :class="{ 
                'vivaldi-tab--active': doc.id === activeDocument?.id,
                'vivaldi-tab--modified': doc.modified 
              }"
            >
              <span class="tab-icon">{{ getDocumentIcon(doc) }}</span>
              <span class="tab-title">{{ doc.title || 'Untitled' }}</span>
              <button 
                @click.stop="closeDocument(doc.id)"
                class="tab-close"
                :class="{ 'tab-close--visible': doc.id === activeDocument?.id || doc.modified }"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </button>
            
            <!-- Add New Tab Button -->
            <button 
              @click="showNewDocumentMenu = !showNewDocumentMenu"
              class="new-tab-btn"
              :class="{ 'new-tab-btn--active': showNewDocumentMenu }"
              title="Create new document"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
            
            <!-- New Document Menu -->
            <div v-if="showNewDocumentMenu" class="new-document-menu">
              <div class="new-document-item" @click="createNewDocument('page')">
                <span class="new-doc-icon">📝</span>
                <span class="new-doc-label">Page</span>
              </div>
              <div class="new-document-item" @click="createNewDocument('table')">
                <span class="new-doc-icon">📊</span>
                <span class="new-doc-label">Table</span>
              </div>
              <div class="new-document-item" @click="createNewDocument('whiteboard')">
                <span class="new-doc-icon">🎨</span>
                <span class="new-doc-label">Whiteboard</span>
              </div>
              <div class="new-document-item" @click="createNewDocument('database')">
                <span class="new-doc-icon">🗃️</span>
                <span class="new-doc-label">Database</span>
              </div>
            </div>
          </div>
          
          <!-- Tab Scroll Buttons -->
          <ClientOnly>
            <button 
              v-if="canScrollLeft" 
              @click="scrollTabs('left')"
              class="tab-scroll-btn tab-scroll-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </ClientOnly>
          <ClientOnly>
            <button 
              v-if="canScrollRight" 
              @click="scrollTabs('right')"
              class="tab-scroll-btn tab-scroll-right"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </ClientOnly>
        </div>
      </div>
      
      <!-- Right Section - Application Menu -->
      <div class="ribbon-section ribbon-right">
        <div 
          @click="showAppMenu = !showAppMenu"
          class="paper-logo"
          :class="{ 'paper-logo--active': showAppMenu }"
        >
          Paper
        </div>
        
        <!-- Application Menu -->
        <div v-if="showAppMenu" class="app-menu">
          <div @click="openLogin" class="app-menu-item">
            Login
          </div>
          <div class="app-menu-divider"></div>
          <div @click="openSettings" class="app-menu-item">
            Settings
          </div>
          <div @click="openHelp" class="app-menu-item">
            Help & Commands
          </div>
          <div class="app-menu-divider"></div>
          <div @click="toggleTheme" class="app-menu-item">
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
          </div>
          <div @click="showAbout" class="app-menu-item">
            About
          </div>
        </div>
      </div>
    </div>
    
    <!-- All Documents Modal -->
    <div
      v-if="showAllDocuments"
      class="documents-modal-overlay"
      @click="showAllDocuments = false"
    >
      <div class="documents-modal" @click.stop>
        <div class="documents-modal__header">
          <h3>All Documents</h3>
          <button @click="showAllDocuments = false">×</button>
        </div>
        <div class="documents-modal__list">
          <button
            v-for="doc in activeWorkspace?.documents || []"
            :key="doc.id"
            @click="openDocument(doc); showAllDocuments = false"
            class="document-modal-item"
          >
            <span class="doc-icon">{{ getDocumentIcon(doc) }}</span>
            <span class="doc-title">{{ doc.title }}</span>
            <span class="doc-date">{{ formatDate(doc.lastModified) }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Document Type Picker -->
    <div
      v-if="showDocumentTypeMenu"
      class="document-picker-overlay"
      @click="showDocumentTypeMenu = false"
    >
      <div class="document-picker" @click.stop>
        <h3 class="picker-title">Create New Document</h3>
        <div class="picker-grid">
          <button @click="createNewDocument('page')" class="picker-item">
            <div class="picker-icon">📝</div>
            <div class="picker-label">Page</div>
          </button>
          <button @click="createNewDocument('table')" class="picker-item">
            <div class="picker-icon">📊</div>
            <div class="picker-label">Table</div>
          </button>
          <button @click="createNewDocument('whiteboard')" class="picker-item">
            <div class="picker-icon">🎨</div>
            <div class="picker-label">Whiteboard</div>
          </button>
          <button @click="createNewDocument('database')" class="picker-item">
            <div class="picker-icon">🗃️</div>
            <div class="picker-label">Database</div>
          </button>
          <div class="picker-divider"></div>
          <PdfImporter @imported="handlePdfImport" class="picker-pdf" />
        </div>
      </div>
    </div>
    
    <!-- Slash Command Menu -->
    <div
      v-if="showSlashCommand"
      class="slash-command-overlay"
      @click="closeSlashCommand"
    >
      <div 
        class="slash-command-menu" 
        @click.stop
        :style="{ 
          left: slashCommandPosition.x + 'px', 
          top: slashCommandPosition.y + 'px' 
        }"
      >
        <div class="slash-command-header">
          <span>{{ getSlashCommandTitle() }}</span>
        </div>
        <div class="slash-command-list">
          <button
            v-for="(command, index) in filteredSlashCommands"
            :key="command.id"
            @click="executeSlashCommand(command)"
            class="slash-command-item"
            :class="{ 'slash-command-item--selected': index === selectedCommandIndex }"
          >
            <span class="command-icon">{{ command.icon }}</span>
            <div class="command-info">
              <span class="command-title">{{ command.title }}</span>
              <span class="command-description">{{ command.description }}</span>
            </div>
            <span v-if="command.shortcut" class="command-shortcut">{{ command.shortcut }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Document Type Changer -->
    <div
      v-if="showTypeChanger"
      class="type-changer-overlay"
      @click="closeTypeChanger"
    >
      <div 
        class="type-changer-menu"
        @click.stop
        :style="{ 
          left: typeChangerPosition.x + 'px', 
          top: typeChangerPosition.y + 'px' 
        }"
      >
        <div class="type-changer-header">
          <span>Change Document Type</span>
        </div>
        <div class="type-changer-list">
          <div
            v-for="docType in documentTypes"
            :key="docType.type"
            @click="changeDocumentType(docType.type)"
            class="type-changer-item"
            :class="{ 'type-changer-item--active': selectedDocument?.type === docType.type }"
          >
            <span class="type-icon">{{ docType.icon }}</span>
            <div class="type-info">
              <span class="type-title">{{ docType.title }}</span>
              <span class="type-description">{{ docType.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Click outside overlay -->
    <div v-if="showWorkspaceMenu || showAppMenu || showNewDocumentMenu" class="overlay" @click="closeOverlays"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import TileLayout from './TileLayout.vue'
import DocumentRenderer from './DocumentRenderer.vue'
import PdfImporter from './PdfImporter.vue'

const workspaceStore = useWorkspaceStore()

// State
const isDarkMode = ref(false)
const showWorkspaceMenu = ref(false)
const showDocumentTypeMenu = ref(false)
const showAllDocuments = ref(false)
const showAppMenu = ref(false)
const showNewDocumentMenu = ref(false)
const showSlashCommand = ref(false)
const slashCommandPosition = ref({ x: 0, y: 0 })
const selectedCommandIndex = ref(0)
const slashCommandQuery = ref('')
const activeBlockIndex = ref(0)
const documentRenderer = ref(null)
const showTypeChanger = ref(false)
const typeChangerPosition = ref({ x: 0, y: 0 })
const selectedDocument = ref<any>(null)

// Tab scrolling
const tabBar = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Computed
const workspaces = computed(() => workspaceStore.workspaces)
const activeWorkspaceId = computed(() => workspaceStore.activeWorkspaceId)
const activeWorkspace = computed(() => workspaceStore.activeWorkspace)
const activeDocument = computed(() => workspaceStore.activeDocument)
const openDocuments = computed(() => workspaceStore.openDocuments)
const hibernatedDocuments = computed(() => workspaceStore.hibernatedDocuments)

const openTabs = computed(() => activeWorkspace.value?.tabs || [])
const activeTabId = computed(() => activeWorkspace.value?.activeTabId)
const tileLayout = computed(() => activeWorkspace.value?.tileLayout)

// Slash command system
const slashCommands = computed(() => {
  const documentType = activeDocument.value?.type || 'page'
  
  const baseCommands = [
    { id: 'undo', title: 'Undo', description: 'Undo last action', icon: '↶', shortcut: 'Ctrl+Z' },
    { id: 'redo', title: 'Redo', description: 'Redo last action', icon: '↷', shortcut: 'Ctrl+Y' },
  ]
  
  switch (documentType) {
    case 'page':
      return [
        ...baseCommands,
        { id: 'heading1', title: 'Heading 1', description: 'Large section heading', icon: 'H₁' },
        { id: 'heading2', title: 'Heading 2', description: 'Medium section heading', icon: 'H₂' },
        { id: 'heading3', title: 'Heading 3', description: 'Small section heading', icon: 'H₃' },
        { id: 'bullet-list', title: 'Bulleted List', description: 'Create a bulleted list', icon: '•' },
        { id: 'number-list', title: 'Numbered List', description: 'Create a numbered list', icon: '1.' },
        { id: 'quote', title: 'Quote', description: 'Capture a quote', icon: '"' },
        { id: 'code', title: 'Code', description: 'Insert code block', icon: '</>' },
        { id: 'divider', title: 'Divider', description: 'Visual divider', icon: '―' },
        { id: 'image', title: 'Insert Image', description: 'Upload or embed an image', icon: '🖼️' },
        { id: 'link', title: 'Insert Link', description: 'Add a link', icon: '🔗' },
      ]
    case 'table':
      return [
        ...baseCommands,
        { id: 'insert-row-above', title: 'Insert row above', description: 'Add new row above current', icon: '⬆️' },
        { id: 'insert-row-below', title: 'Insert row below', description: 'Add new row below current', icon: '⬇️' },
        { id: 'insert-column-left', title: 'Insert column left', description: 'Add new column to the left', icon: '⬅️' },
        { id: 'insert-column-right', title: 'Insert column right', description: 'Add new column to the right', icon: '➡️' },
        { id: 'delete-row', title: 'Delete row', description: 'Remove current row', icon: '🗑️' },
        { id: 'delete-column', title: 'Delete column', description: 'Remove current column', icon: '🗑️' },
        { id: 'sort-asc', title: 'Sort A-Z', description: 'Sort column ascending', icon: '↑' },
        { id: 'sort-desc', title: 'Sort Z-A', description: 'Sort column descending', icon: '↓' },
        { id: 'column-type', title: 'Change column type', description: 'Set data type for column', icon: '📊' },
      ]
    case 'database':
      return [
        ...baseCommands,
        { id: 'new-entry', title: 'Add new entry', description: 'Create new database record', icon: '➕' },
        { id: 'new-view', title: 'Create new view', description: 'Add custom view', icon: '👁️' },
        { id: 'filter', title: 'Filter by property', description: 'Filter database entries', icon: '🔍' },
        { id: 'sort-property', title: 'Sort by property', description: 'Sort database entries', icon: '📋' },
        { id: 'group-by', title: 'Group by property', description: 'Group entries by property', icon: '📂' },
        { id: 'new-property', title: 'Add property', description: 'Create new property/field', icon: '🏷️' },
      ]
    case 'whiteboard':
      return [
        ...baseCommands,
        { id: 'insert-shape', title: 'Insert shape', description: 'Add geometric shape', icon: '🔲' },
        { id: 'text-note', title: 'Add text note', description: 'Insert text annotation', icon: '📝' },
        { id: 'draw-arrow', title: 'Draw arrow', description: 'Connect elements with arrow', icon: '↗️' },
        { id: 'insert-image', title: 'Insert image', description: 'Add image to canvas', icon: '🖼️' },
        { id: 'draw-line', title: 'Draw line', description: 'Free-form line drawing', icon: '✏️' },
        { id: 'select-tool', title: 'Select tool', description: 'Selection and move tool', icon: '🖱️' },
      ]
    default:
      return baseCommands
  }
})

const filteredSlashCommands = computed(() => {
  if (!slashCommandQuery.value) return slashCommands.value
  const query = slashCommandQuery.value.toLowerCase()
  return slashCommands.value.filter(cmd => 
    cmd.title.toLowerCase().includes(query) || 
    cmd.description.toLowerCase().includes(query)
  )
})

// Document types for type changer
const documentTypes = computed(() => [
  { type: 'page', title: 'Page', description: 'Rich text document with markdown', icon: '📝' },
  { type: 'table', title: 'Table', description: 'Spreadsheet-like data organization', icon: '📊' },
  { type: 'database', title: 'Database', description: 'Structured data with relations', icon: '🗃️' },
  { type: 'whiteboard', title: 'Whiteboard', description: 'Infinite canvas for visual thinking', icon: '🎨' },
])

// Methods
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
}

function createNewWorkspace() {
  const name = prompt('Enter workspace name:')
  if (name) {
    const workspace = workspaceStore.createWorkspace(name)
    workspaceStore.switchWorkspace(workspace.id)
  }
  showWorkspaceMenu.value = false
}

function switchWorkspace(workspaceId: string) {
  workspaceStore.switchWorkspace(workspaceId)
  showWorkspaceMenu.value = false
}

function createNewDocument(type: 'page' | 'table' | 'whiteboard' | 'database') {
  const { createDocument } = useDocuments()
  createDocument(type)
  showDocumentTypeMenu.value = false
  showNewDocumentMenu.value = false
}

function showDocumentPicker() {
  showDocumentTypeMenu.value = true
}

function openDocument(doc: any) {
  if (doc.isHibernated) {
    workspaceStore.restoreDocument(activeWorkspaceId.value, doc.id)
  }
  
  const tab = activeWorkspace.value?.tabs.find(t => t.documentId === doc.id)
  if (tab) {
    workspaceStore.setActiveTab(activeWorkspaceId.value, tab.id)
  } else {
    const newTab = workspaceStore.createTab(activeWorkspaceId.value, doc.id)
    workspaceStore.setActiveTab(activeWorkspaceId.value, newTab.id)
  }
}

function selectTab(tabId: string) {
  workspaceStore.setActiveTab(activeWorkspaceId.value, tabId)
}

function closeTab(tabId: string) {
  const tab = activeWorkspace.value?.tabs.find(t => t.id === tabId)
  if (tab) {
    workspaceStore.closeDocument(activeWorkspaceId.value, tab.documentId)
  }
}

function moveTabToPane(tabId: string, paneId: string) {
  workspaceStore.moveToPanee(activeWorkspaceId.value, tabId, paneId)
}

function updateDocument(updatedDoc: any) {
  if (activeDocument.value) {
    Object.assign(activeDocument.value, updatedDoc)
    activeDocument.value.lastModified = new Date()
  }
}

function getDocument(documentId: string) {
  return activeWorkspace.value?.documents.find(d => d.id === documentId)
}

function getDocumentIcon(doc: any): string {
  switch (doc.type) {
    case 'pdf': return '📄'
    case 'table': return '📊'
    case 'whiteboard': return '🎨'
    case 'database': return '🗃️'
    case 'page': return '📝'
    default: return '📄'
  }
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return new Date(date).toLocaleDateString()
}

function handlePdfImport(document: any) {
  showDocumentTypeMenu.value = false
}

// Slash command methods
function handleSlashCommand(event: any) {
  const { position, query, blockIndex } = event
  slashCommandPosition.value = position
  slashCommandQuery.value = query || ''
  activeBlockIndex.value = blockIndex || 0
  selectedCommandIndex.value = 0
  showSlashCommand.value = true
}

function executeSlashCommand(command: any) {
  if (activeDocument.value && documentRenderer.value) {
    // Get the PageEditor component reference
    const pageEditor = documentRenderer.value.$refs?.pageEditor || documentRenderer.value
    
    // Execute slash command on the PageEditor
    if (pageEditor && typeof pageEditor.executeSlashCommand === 'function') {
      pageEditor.executeSlashCommand(command.id, activeBlockIndex.value)
    }
  }
  closeSlashCommand()
}

function closeSlashCommand() {
  showSlashCommand.value = false
  slashCommandQuery.value = ''
  selectedCommandIndex.value = 0
}

function getSlashCommandTitle() {
  const docType = activeDocument.value?.type || 'page'
  return `${docType.charAt(0).toUpperCase() + docType.slice(1)} Commands`
}

// Tab management methods
function closeDocument(documentId: string) {
  const tab = activeWorkspace.value?.tabs.find(t => t.documentId === documentId)
  if (tab) {
    workspaceStore.closeDocument(activeWorkspaceId.value, documentId)
  }
}

function scrollTabs(direction: 'left' | 'right') {
  if (!tabBar.value) return
  const container = tabBar.value.querySelector('.tab-scroll-container') as HTMLElement
  if (!container) return
  
  const scrollAmount = 200
  const newScrollLeft = direction === 'left' 
    ? container.scrollLeft - scrollAmount
    : container.scrollLeft + scrollAmount
    
  container.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
  updateScrollButtons()
}

function updateScrollButtons() {
  if (!tabBar.value) return
  const container = tabBar.value.querySelector('.tab-scroll-container') as HTMLElement
  if (!container) return
  
  canScrollLeft.value = container.scrollLeft > 0
  canScrollRight.value = container.scrollLeft < (container.scrollWidth - container.clientWidth)
}

// App menu methods
function openLogin() {
  showAppMenu.value = false
  // Navigate to login page
  navigateTo('/auth/login')
}

function openSettings() {
  showAppMenu.value = false
  // TODO: Implement settings modal
  console.log('Opening settings...')
}

function openHelp() {
  showAppMenu.value = false
  // TODO: Implement help modal
  console.log('Opening help...')
}

function showAbout() {
  showAppMenu.value = false
  // TODO: Implement about modal
  console.log('Showing about...')
}

// Document type changer methods
function showDocumentTypeChanger(document: any, event: MouseEvent) {
  selectedDocument.value = document
  typeChangerPosition.value = { x: event.clientX, y: event.clientY - 10 }
  showTypeChanger.value = true
}

function changeDocumentType(newType: string) {
  if (selectedDocument.value) {
    // Update document type in workspace store
    const workspaceId = activeWorkspaceId.value
    if (workspaceId) {
      const document = activeWorkspace.value?.documents.find(d => d.id === selectedDocument.value.id)
      if (document) {
        document.type = newType
        // Mark as modified
        document.modified = true
        document.lastModified = new Date()
      }
    }
  }
  closeTypeChanger()
}

function closeTypeChanger() {
  showTypeChanger.value = false
  selectedDocument.value = null
}

function closeOverlays() {
  showWorkspaceMenu.value = false
  showAppMenu.value = false
  showNewDocumentMenu.value = false
  closeTypeChanger()
}

// Initialize workspace store immediately to ensure consistent SSR/client rendering
workspaceStore.initialize()

// Initialize
onMounted(() => {
  // Re-initialize on client to load localStorage data
  if (process.client) {
    workspaceStore.initialize()
  }
  
  // Create default untitled document if no documents exist
  nextTick(() => {
    if (activeWorkspace.value && activeWorkspace.value.documents.length === 0) {
      const defaultDoc = {
        id: generateId(),
        title: 'Untitled',
        type: 'page',
        content: '',
        lastModified: new Date(),
        created: new Date(),
        modified: false
      }
      
      // Add document to workspace
      activeWorkspace.value.documents.push(defaultDoc)
      
      // Create and activate tab
      const tab = workspaceStore.createTab(activeWorkspace.value.id, defaultDoc.id)
      workspaceStore.setActiveTab(activeWorkspace.value.id, tab.id)
    }
  })
})

// Utility function to generate IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>
/* Main Layout - Two-region design */
.app-layout {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  color: #1a202c;
  transition: all 0.3s ease;
  margin: 0;
  padding: 0;
  position: relative;
}

.app-layout--dark {
  background: #1a202c;
  color: #e2e8f0;
}

/* Content Area */
.content-area {
  flex: 1;
  background: #ffffff;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 0; /* Force flex item to respect container height */
}

.app-layout--dark .content-area {
  background: #2d3748;
}

/* Navigation Ribbon */
.navigation-ribbon {
  height: 60px;
  width: 100%;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
  z-index: 50;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  margin: 0;
  box-sizing: border-box;
}

.app-layout--dark .navigation-ribbon {
  background: #1a202c;
  border-top-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}

/* Ribbon Sections */
.ribbon-section {
  display: flex;
  align-items: center;
}

.ribbon-left {
  flex: 0 0 auto;
  margin-right: 24px;
}

.ribbon-center {
  flex: 1;
  min-width: 0;
}

.ribbon-right {
  flex: 0 0 auto;
}

/* Left Section - Workspace Button */
.workspace-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.workspace-btn:hover,
.workspace-btn--active {
  background: rgba(74, 85, 104, 0.08);
  border-color: rgba(74, 85, 104, 0.12);
}

.app-layout--dark .workspace-btn {
  color: #e2e8f0;
}

.app-layout--dark .workspace-btn:hover,
.app-layout--dark .workspace-btn--active {
  background: rgba(226, 232, 240, 0.08);
  border-color: rgba(226, 232, 240, 0.12);
}

.workspace-icon {
  width: 16px;
  height: 16px;
}

.dropdown-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

/* Paper Logo */
.paper-logo {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
}

.paper-logo:hover {
  color: #1a202c;
  transform: translateY(-1px);
}

.paper-logo--active {
  color: #2b6cb0;
}

.app-layout--dark .paper-logo {
  color: #e2e8f0;
}

.app-layout--dark .paper-logo:hover {
  color: #ffffff;
}

.app-layout--dark .paper-logo--active {
  color: #63b3ed;
}

/* Application Menu */
.app-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.app-layout--dark .app-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.app-menu-item {
  display: block;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.15s ease;
  user-select: none;
  white-space: nowrap;
  background: transparent;
  border: none;
  text-align: left;
}

.app-menu-item:hover {
  color: #374151;
  background: rgba(0, 0, 0, 0.04);
}

.app-layout--dark .app-menu-item {
  color: #9ca3af;
}

.app-layout--dark .app-menu-item:hover {
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.08);
}

.app-menu-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 4px 0;
}

.app-layout--dark .app-menu-divider {
  background: rgba(255, 255, 255, 0.08);
}

/* Workspace Menu */
.workspace-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.app-layout--dark .workspace-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.workspace-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.app-layout--dark .workspace-menu__header {
  color: #9ca3af;
}

.workspace-add-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-add-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.app-layout--dark .workspace-add-btn {
  color: #9ca3af;
}

.app-layout--dark .workspace-add-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.workspace-list {
  max-height: 200px;
  overflow-y: auto;
}

.workspace-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: left;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.workspace-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.workspace-item--active {
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
}

.app-layout--dark .workspace-item {
  color: #9ca3af;
}

.app-layout--dark .workspace-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.app-layout--dark .workspace-item--active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.document-count {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.08);
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 12px;
}

.app-layout--dark .document-count {
  background: rgba(255, 255, 255, 0.08);
  color: #9ca3af;
}

/* Document Type Changer */
.type-changer-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 200;
  pointer-events: none;
}

.type-changer-menu {
  position: absolute;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
  min-width: 240px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: all;
}

.app-layout--dark .type-changer-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.type-changer-header {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 4px;
}

.app-layout--dark .type-changer-header {
  color: #9ca3af;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.type-changer-list {
  max-height: 300px;
  overflow-y: auto;
}

.type-changer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-changer-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.type-changer-item--active {
  background: rgba(59, 130, 246, 0.08);
}

.app-layout--dark .type-changer-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.app-layout--dark .type-changer-item--active {
  background: rgba(59, 130, 246, 0.15);
}

.type-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.type-description {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.app-layout--dark .type-title {
  color: #e5e7eb;
}

.app-layout--dark .type-description {
  color: #9ca3af;
}

/* Pages Menu Button */
.pages-btn {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #cbd5e0;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.pages-btn:hover,
.pages-btn--active {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Pages Menu Dropdown */
.pages-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  min-width: 280px;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.dark .pages-menu {
  background: #2d2d2d;
}

.pages-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.close-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  color: #666;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.pages-menu__list {
  max-height: 300px;
  overflow-y: auto;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-item:hover {
  background: rgba(59, 130, 246, 0.05);
}

.page-item--active {
  background: rgba(59, 130, 246, 0.1);
}

.page-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.page-title {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-indicator {
  color: #3b82f6;
  font-size: 12px;
  flex-shrink: 0;
}

.no-documents {
  padding: 20px 16px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.pages-menu__actions {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
}

.action-btn {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

/* Current Document Title */
.current-doc-title {
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* New Document Button */
.new-doc-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: #3b82f6;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-doc-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Documents Modal */
.documents-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.documents-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.documents-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.documents-modal__header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.documents-modal__header button {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: #666;
}

.documents-modal__list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.document-modal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.document-modal-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.doc-icon {
  font-size: 16px;
}

.doc-title {
  flex: 1;
  font-weight: 500;
}

.doc-date {
  font-size: 12px;
  color: #666;
}

/* Paper Document Styling */
.paper-document {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: visible;
}

@media (max-width: 768px) {
  .paper-document {
    padding: 0;
  }
}

/* Empty State */
.paper-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paper-empty__content {
  text-align: center;
  max-width: 400px;
}

.paper-empty__icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.paper-empty__title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(55, 53, 47, 0.9);
}

.dark .paper-empty__title {
  color: rgba(255, 255, 255, 0.9);
}

.paper-empty__description {
  font-size: 16px;
  color: rgba(55, 53, 47, 0.65);
  margin-bottom: 24px;
}

.dark .paper-empty__description {
  color: rgba(255, 255, 255, 0.65);
}

.paper-empty__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.paper-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
  border: 1px solid rgba(55, 53, 47, 0.16);
  background: transparent;
}

.paper-button--primary {
  background: rgba(55, 53, 47, 0.9);
  color: white;
  border-color: transparent;
}

.paper-button:hover {
  background: rgba(55, 53, 47, 0.08);
}

.paper-button--primary:hover {
  background: rgba(55, 53, 47, 1);
}

/* Sidebar */
.paper-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background: white;
  border-right: 1px solid rgba(55, 53, 47, 0.16);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.dark .paper-sidebar {
  background: #2d2d2d;
  border-right-color: rgba(255, 255, 255, 0.13);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(55, 53, 47, 0.16);
}

.dark .sidebar-header {
  border-bottom-color: rgba(255, 255, 255, 0.13);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
}

.sidebar-search {
  padding: 16px;
  border-bottom: 1px solid rgba(55, 53, 47, 0.16);
}

.dark .sidebar-search {
  border-bottom-color: rgba(255, 255, 255, 0.13);
}

.sidebar-documents {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 3px;
  cursor: pointer;
}

.document-item--active {
  background: rgba(46, 170, 220, 0.2);
}

.document-icon {
  font-size: 16px;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  display: block;
  font-size: 12px;
  color: rgba(55, 53, 47, 0.65);
  margin-top: 2px;
}

.dark .document-meta {
  color: rgba(255, 255, 255, 0.65);
}

.hibernated-indicator {
  font-size: 12px;
  opacity: 0.7;
}

/* FAB */
.paper-fab {
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  color: rgba(55, 53, 47, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  transition: all 0.15s ease;
}

.paper-fab:hover {
  transform: translateY(-2px);
}

.dark .paper-fab {
  background: #2d2d2d;
  color: rgba(255, 255, 255, 0.9);
}

/* Document Picker */
.document-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.document-picker {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.dark .document-picker {
  background: #2d2d2d;
}

.picker-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.picker-item:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.picker-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.picker-label {
  font-size: 14px;
  font-weight: 500;
}

.picker-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 12px 0;
}

.picker-pdf {
  grid-column: 1 / -1;
}

/* Overlays */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
}

/* Tiling Clean */
.tile-layout-clean {
  height: 100%;
}

/* Animations */
.slide-in {
  animation: slideIn 0.2s ease-out;
}

.slide-in-left {
  animation: slideInLeft 0.2s ease-out;
}

.fade-in {
  animation: fadeIn 0.15s ease-out;
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0; 
    transform: translateX(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Tab Bar Styling */
.tab-bar {
  display: flex;
  align-items: center;
  position: relative;
}

.tab-scroll-container {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  max-width: 100%;
  flex: 1;
}

.tab-scroll-container::-webkit-scrollbar {
  display: none;
}

/* Vivaldi-style Tabs */
.vivaldi-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px 8px 0 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: all 0.15s ease;
  min-width: 0;
  max-width: 200px;
  position: relative;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}

.vivaldi-tab:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.vivaldi-tab--active {
  background: #ffffff;
  color: #1f2937;
  border-bottom-color: #3b82f6;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.app-layout--dark .vivaldi-tab {
  color: #9ca3af;
}

.app-layout--dark .vivaldi-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.app-layout--dark .vivaldi-tab--active {
  background: #2d3748;
  color: #f7fafc;
  border-bottom-color: #60a5fa;
}

.tab-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.tab-close {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-close svg {
  width: 12px;
  height: 12px;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab-close--visible,
.vivaldi-tab:hover .tab-close {
  opacity: 1;
}

.app-layout--dark .tab-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* New Tab Button */
.new-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-left: 4px;
  position: relative;
}

.new-tab-btn:hover,
.new-tab-btn--active {
  background: rgba(0, 0, 0, 0.06);
  color: #374151;
}

.app-layout--dark .new-tab-btn {
  color: #9ca3af;
}

.app-layout--dark .new-tab-btn:hover,
.app-layout--dark .new-tab-btn--active {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.new-tab-btn svg {
  width: 14px;
  height: 14px;
}

/* New Document Menu */
.new-document-menu {
  position: absolute;
  bottom: calc(100% + 24px);
  left: 6px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.app-layout--dark .new-document-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.new-document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: left;
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.new-document-item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.app-layout--dark .new-document-item {
  color: #9ca3af;
}

.app-layout--dark .new-document-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.new-doc-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.new-doc-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
}

/* Tab Scroll Buttons */
.tab-scroll-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 10;
}

.tab-scroll-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #374151;
}

.tab-scroll-left {
  left: -28px;
}

.tab-scroll-right {
  right: -28px;
}

.tab-scroll-btn svg {
  width: 12px;
  height: 12px;
}

.app-layout--dark .tab-scroll-btn {
  color: #9ca3af;
}

.app-layout--dark .tab-scroll-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

/* Slash Command Menu */
.slash-command-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 200;
  pointer-events: none;
}

.slash-command-menu {
  position: absolute;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 8px;
  min-width: 280px;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: all;
  max-height: 400px;
  overflow-y: auto;
}

.app-layout--dark .slash-command-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.slash-command-header {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 4px;
}

.app-layout--dark .slash-command-header {
  color: #9ca3af;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.slash-command-list {
  max-height: 300px;
  overflow-y: auto;
}

.slash-command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
  text-align: left;
}

.slash-command-item:hover,
.slash-command-item--selected {
  background: rgba(59, 130, 246, 0.08);
}

.app-layout--dark .slash-command-item:hover,
.app-layout--dark .slash-command-item--selected {
  background: rgba(59, 130, 246, 0.15);
}

.command-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.command-info {
  flex: 1;
  min-width: 0;
}

.command-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.command-description {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.command-shortcut {
  font-size: 11px;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.app-layout--dark .command-title {
  color: #e5e7eb;
}

.app-layout--dark .command-description {
  color: #9ca3af;
}

.app-layout--dark .command-shortcut {
  color: #6b7280;
  background: rgba(255, 255, 255, 0.08);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .paper-document {
    padding: 20px;
  }
  
  .paper-sidebar {
    width: 280px;
  }
  
  .advanced-controls {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .tab-scroll-container {
    gap: 2px;
  }
  
  .vivaldi-tab {
    max-width: 150px;
    font-size: 12px;
  }
  
  .navigation-ribbon {
    height: 56px;
    padding: 0 12px;
  }
}
</style>