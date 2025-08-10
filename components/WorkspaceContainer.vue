<template>
  <div class="workspace-container">
    <!-- Workspace Sidebar -->
    <aside 
      class="workspace-sidebar"
      :class="{ 'workspace-sidebar--collapsed': sidebarCollapsed }"
    >
      <!-- Workspace Switcher -->
      <div class="workspace-switcher">
        <button
          @click="toggleSidebar"
          class="workspace-sidebar__toggle"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'" />
          </svg>
        </button>
        
        <div v-if="!sidebarCollapsed" class="workspace-switcher__content">
          <h2 class="workspace-switcher__title">Workspaces</h2>
          
          <div class="workspace-list">
            <button
              v-for="workspace in workspaces"
              :key="workspace.id"
              @click="switchWorkspace(workspace.id)"
              class="workspace-item"
              :class="{ 'workspace-item--active': workspace.id === activeWorkspaceId }"
            >
              <span class="workspace-item__icon">{{ workspace.icon || '📁' }}</span>
              <span class="workspace-item__name">{{ workspace.name }}</span>
              <span class="workspace-item__count">{{ workspace.documents.length }}</span>
            </button>
          </div>
          
          <button @click="createNewWorkspace" class="workspace-add">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Workspace</span>
          </button>
        </div>
        
        <div v-else class="workspace-switcher__collapsed">
          <button
            v-for="workspace in workspaces"
            :key="workspace.id"
            @click="switchWorkspace(workspace.id)"
            class="workspace-item--collapsed"
            :class="{ 'workspace-item--active': workspace.id === activeWorkspaceId }"
            :title="workspace.name"
          >
            {{ workspace.icon || '📁' }}
          </button>
          
          <button @click="createNewWorkspace" class="workspace-add--collapsed" title="New Workspace">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Document List (when not collapsed) -->
      <div v-if="!sidebarCollapsed && activeWorkspace" class="document-list">
        <h3 class="document-list__title">Documents</h3>
        
        <!-- Search -->
        <div class="document-search">
          <input
            v-model="documentSearch"
            type="text"
            placeholder="Search documents..."
            class="document-search__input"
          />
        </div>
        
        <!-- Document Items -->
        <div class="document-items">
          <div
            v-for="doc in filteredDocuments"
            :key="doc.id"
            @click="openDocument(doc)"
            class="document-item"
            :class="{ 
              'document-item--active': doc.id === activeDocument?.id,
              'document-item--hibernated': doc.isHibernated
            }"
          >
            <span class="document-item__icon">{{ getDocumentIcon(doc) }}</span>
            <div class="document-item__content">
              <span class="document-item__title">{{ doc.title }}</span>
              <span class="document-item__meta">
                {{ formatDate(doc.lastModified) }}
                <span v-if="doc.isHibernated" class="document-item__hibernated-badge">💤</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- Main Content Area -->
    <main class="workspace-main">
      <!-- Tab Bar -->
      <div v-if="activeWorkspace && !activeWorkspace.settings.enableTiling" class="workspace-tabs">
        <TabBar
          :tabs="activeWorkspace.tabs"
          :groups="activeWorkspace.tabGroups"
          :documents="activeWorkspace.documents"
          :activeTabId="activeWorkspace.activeTabId"
          :layout="activeWorkspace.settings.tabLayout"
          :enableGroups="activeWorkspace.settings.enableTabGroups"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @pin-tab="pinTab"
          @toggle-group="toggleGroup"
          @create-group="createGroup"
          @add-tab="showDocumentPicker"
        />
      </div>
      
      <!-- Content Area -->
      <div class="workspace-content">
        <!-- Tiled Layout -->
        <TileLayout
          v-if="activeWorkspace?.settings.enableTiling && activeWorkspace.tileLayout"
          :layout="activeWorkspace.tileLayout"
          :documents="activeWorkspace.documents"
          @change-layout="changeLayout"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTabToPane"
        />
        
        <!-- Single Document View -->
        <div v-else-if="activeDocument" class="document-view">
          <DocumentRenderer
            :document="activeDocument"
            @update="updateDocument"
          />
        </div>
        
        <!-- Empty State -->
        <div v-else class="workspace-empty">
          <div class="workspace-empty__content">
            <svg class="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 class="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Welcome to {{ activeWorkspace?.name || 'Your Workspace' }}
            </h2>
            <p class="text-gray-500 dark:text-gray-500 mb-6">
              Open a document from the sidebar or create a new one to get started
            </p>
            <button
              @click="showDocumentPicker"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Document
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Settings Panel -->
    <aside 
      v-if="showSettings"
      class="workspace-settings"
    >
      <div class="workspace-settings__header">
        <h3 class="text-lg font-semibold">Workspace Settings</h3>
        <button @click="showSettings = false" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="workspace-settings__content">
        <!-- Tab Layout -->
        <div class="setting-group">
          <label class="setting-label">Tab Layout</label>
          <select
            v-model="activeWorkspace.settings.tabLayout"
            class="setting-select"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
        
        <!-- Enable Features -->
        <div class="setting-group">
          <label class="setting-checkbox">
            <input
              type="checkbox"
              v-model="activeWorkspace.settings.enableTabStacking"
            />
            <span>Enable Tab Stacking</span>
          </label>
          
          <label class="setting-checkbox">
            <input
              type="checkbox"
              v-model="activeWorkspace.settings.enableTabGroups"
            />
            <span>Enable Tab Groups</span>
          </label>
          
          <label class="setting-checkbox">
            <input
              type="checkbox"
              v-model="activeWorkspace.settings.enableTiling"
            />
            <span>Enable Tab Tiling</span>
          </label>
        </div>
        
        <!-- Hibernation Settings -->
        <div class="setting-group">
          <label class="setting-label">Document Hibernation</label>
          
          <label class="setting-checkbox">
            <input
              type="checkbox"
              v-model="activeWorkspace.settings.autoHibernate"
            />
            <span>Auto-hibernate inactive documents</span>
          </label>
          
          <label class="setting-label">
            Hibernate after (minutes)
            <input
              type="number"
              v-model.number="activeWorkspace.settings.hibernateAfterMinutes"
              min="5"
              max="120"
              class="setting-input"
            />
          </label>
        </div>
        
        <!-- Theme -->
        <div class="setting-group">
          <label class="setting-label">Theme</label>
          <select
            v-model="activeWorkspace.settings.theme"
            class="setting-select"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </aside>
    
    <!-- Document Type Menu -->
    <Teleport to="body">
      <div
        v-if="showDocumentTypeMenu"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click="showDocumentTypeMenu = false"
      >
        <div
          @click.stop
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4"
        >
          <h3 class="text-lg font-semibold mb-4">Create New Document</h3>
          
          <div class="space-y-2">
            <button
              @click="createNewDocument('page')"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <span class="text-2xl">📝</span>
              <div>
                <div class="font-medium">Page</div>
                <div class="text-sm text-gray-500">Rich text document with markdown support</div>
              </div>
            </button>
            
            <button
              @click="createNewDocument('table')"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <span class="text-2xl">📊</span>
              <div>
                <div class="font-medium">Table</div>
                <div class="text-sm text-gray-500">Spreadsheet-like data organization</div>
              </div>
            </button>
            
            <button
              @click="createNewDocument('whiteboard')"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <span class="text-2xl">🎨</span>
              <div>
                <div class="font-medium">Whiteboard</div>
                <div class="text-sm text-gray-500">Infinite canvas for visual thinking</div>
              </div>
            </button>
            
            <button
              @click="createNewDocument('database')"
              class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <span class="text-2xl">🗃️</span>
              <div>
                <div class="font-medium">Database</div>
                <div class="text-sm text-gray-500">Structured data with relations</div>
              </div>
            </button>
            
            <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <PdfImporter @imported="handlePdfImport" />
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import TabBar from './TabBar.vue'
import TileLayout from './TileLayout.vue'
import DocumentRenderer from './DocumentRenderer.vue'
import PdfImporter from './PdfImporter.vue'

const workspaceStore = useWorkspaceStore()

// State
const sidebarCollapsed = ref(false)
const showSettings = ref(false)
const documentSearch = ref('')

// Computed
const workspaces = computed(() => workspaceStore.workspaces)
const activeWorkspaceId = computed(() => workspaceStore.activeWorkspaceId)
const activeWorkspace = computed(() => workspaceStore.activeWorkspace)
const activeDocument = computed(() => workspaceStore.activeDocument)
const openDocuments = computed(() => workspaceStore.openDocuments)
const hibernatedDocuments = computed(() => workspaceStore.hibernatedDocuments)

const filteredDocuments = computed(() => {
  if (!activeWorkspace.value) return []
  
  const searchTerm = documentSearch.value.toLowerCase()
  return activeWorkspace.value.documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm)
  )
})

// Methods
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function switchWorkspace(workspaceId: string) {
  workspaceStore.switchWorkspace(workspaceId)
}

function createNewWorkspace() {
  const name = prompt('Enter workspace name:')
  if (name) {
    const workspace = workspaceStore.createWorkspace(name)
    workspaceStore.switchWorkspace(workspace.id)
  }
}

function openDocument(doc: any) {
  if (doc.isHibernated) {
    workspaceStore.restoreDocument(activeWorkspaceId.value, doc.id)
  }
  
  // Find or create tab for document
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

function moveTab(tabId: string, newOrder: number, groupId?: string) {
  workspaceStore.moveTab(activeWorkspaceId.value, tabId, newOrder, groupId)
}

function moveTabToPane(tabId: string, paneId: string) {
  workspaceStore.moveToPanee(activeWorkspaceId.value, tabId, paneId)
}

function pinTab(tabId: string, isPinned: boolean) {
  workspaceStore.pinTab(activeWorkspaceId.value, tabId, isPinned)
}

function toggleGroup(groupId: string) {
  workspaceStore.toggleTabGroup(activeWorkspaceId.value, groupId)
}

function createGroup(name: string, tabIds: string[]) {
  const group = workspaceStore.createTabGroup(activeWorkspaceId.value, name)
  tabIds.forEach(tabId => {
    workspaceStore.moveTab(activeWorkspaceId.value, tabId, 0, group.id)
  })
}

function changeLayout(layoutType: any) {
  workspaceStore.setTileLayout(activeWorkspaceId.value, layoutType)
}

function updateDocument(updatedDoc: any) {
  // Update document in store
  if (activeDocument.value) {
    Object.assign(activeDocument.value, updatedDoc)
    activeDocument.value.lastModified = new Date()
  }
}

function showDocumentPicker() {
  showDocumentTypeMenu.value = true
}

const showDocumentTypeMenu = ref(false)
const { createDocument } = useDocuments()

function createNewDocument(type: 'page' | 'table' | 'whiteboard' | 'database') {
  try {
    createDocument(type)
    showDocumentTypeMenu.value = false
  } catch (error) {
    console.error('Failed to create document:', error)
  }
}

function handlePdfImport(document: any) {
  showDocumentTypeMenu.value = false
  // The PDF is already added to the workspace by the useDocuments composable
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

// Auto-save
watch(activeWorkspace, () => {
  if (activeWorkspace.value) {
    workspaceStore.saveToLocalStorage()
  }
}, { deep: true })

// Initialize
onMounted(() => {
  workspaceStore.initialize()
  
  // Set up auto-hibernation check
  setInterval(() => {
    if (activeWorkspace.value) {
      workspaceStore.checkAndHibernateDocuments(activeWorkspace.value)
    }
  }, 60000) // Check every minute
})
</script>

<style scoped>
.workspace-container {
  display: flex;
  height: 100vh;
  background-color: rgb(249 250 251);
}

.dark .workspace-container {
  background-color: rgb(17 24 39);
}

/* Sidebar */
.workspace-sidebar {
  display: flex;
  flex-direction: column;
  width: 16rem;
  background-color: white;
  border-right: 1px solid rgb(229 231 235);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .workspace-sidebar {
  background-color: rgb(31 41 55);
  border-right-color: rgb(55 65 81);
}

.workspace-sidebar--collapsed {
  width: 4rem;
}

.workspace-sidebar__toggle {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.workspace-sidebar__toggle:hover {
  background-color: rgb(243 244 246);
}

.dark .workspace-sidebar__toggle:hover {
  background-color: rgb(55 65 81);
}

/* Workspace Switcher */
.workspace-switcher {
  border-bottom: 1px solid rgb(229 231 235);
  padding: 1rem;
}

.dark .workspace-switcher {
  border-bottom-color: rgb(55 65 81);
}

.workspace-switcher__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(75 85 99);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.75rem;
}

.dark .workspace-switcher__title {
  color: rgb(156 163 175);
}

.workspace-list {
  margin-bottom: 0.75rem;
}

.workspace-list > * + * {
  margin-top: 0.25rem;
}

.workspace-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.workspace-item:hover {
  background-color: rgb(243 244 246);
}

.dark .workspace-item:hover {
  background-color: rgb(55 65 81);
}

.workspace-item--active {
  background-color: rgb(239 246 255);
  color: rgb(37 99 235);
}

.dark .workspace-item--active {
  background-color: rgba(30, 58, 138, 0.3);
  color: rgb(96 165 250);
}

.workspace-item--collapsed {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.workspace-item--collapsed:hover {
  background-color: rgb(243 244 246);
}

.dark .workspace-item--collapsed:hover {
  background-color: rgb(55 65 81);
}

.workspace-item__icon {
  font-size: 1.125rem;
}

.workspace-item__name {
  flex: 1 1 0%;
  font-size: 0.875rem;
  font-weight: 500;
}

.workspace-item__count {
  font-size: 0.75rem;
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.dark .workspace-item__count {
  background-color: rgb(55 65 81);
}

.workspace-add {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(75 85 99);
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .workspace-add {
  color: rgb(156 163 175);
}

.workspace-add:hover {
  background-color: rgb(243 244 246);
}

.dark .workspace-add:hover {
  background-color: rgb(55 65 81);
}

.workspace-add--collapsed {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(75 85 99);
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .workspace-add--collapsed {
  color: rgb(156 163 175);
}

.workspace-add--collapsed:hover {
  background-color: rgb(243 244 246);
}

.dark .workspace-add--collapsed:hover {
  background-color: rgb(55 65 81);
}

/* Document List */
.document-list {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.document-list__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(75 85 99);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.75rem;
}

.dark .document-list__title {
  color: rgb(156 163 175);
}

.document-search {
  margin-bottom: 0.75rem;
}

.document-search__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.25rem;
  background-color: white;
}

.document-search__input:focus {
  outline: none;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59 130 246);
}

.dark .document-search__input {
  border-color: rgb(55 65 81);
  background-color: rgb(17 24 39);
}

.document-items {
  flex: 1 1 0%;
  overflow-y: auto;
}

.document-items > * + * {
  margin-top: 0.25rem;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.document-item:hover {
  background-color: rgb(243 244 246);
}

.dark .document-item:hover {
  background-color: rgb(55 65 81);
}

.document-item--active {
  background-color: rgb(239 246 255);
}

.dark .document-item--active {
  background-color: rgba(30, 58, 138, 0.3);
}

.document-item--hibernated {
  opacity: 0.6;
}

.document-item__icon {
  font-size: 0.875rem;
}

.document-item__content {
  flex: 1 1 0%;
  min-width: 0;
}

.document-item__title {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-item__meta {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dark .document-item__meta {
  color: rgb(156 163 175);
}

.document-item__hibernated-badge {
  margin-left: 0.25rem;
}

/* Main Content */
.workspace-main {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-tabs {
  flex-shrink: 0;
}

.workspace-content {
  flex: 1 1 0%;
  overflow: hidden;
}

.document-view {
  height: 100%;
}

.workspace-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-empty__content {
  text-align: center;
}

/* Settings Panel */
.workspace-settings {
  width: 20rem;
  background-color: white;
  border-left: 1px solid rgb(229 231 235);
  display: flex;
  flex-direction: column;
}

.dark .workspace-settings {
  background-color: rgb(31 41 55);
  border-left-color: rgb(55 65 81);
}

.workspace-settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .workspace-settings__header {
  border-bottom-color: rgb(55 65 81);
}

.workspace-settings__content {
  flex: 1 1 0%;
  overflow-y: auto;
  padding: 1rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
  margin-bottom: 0.5rem;
}

.dark .setting-label {
  color: rgb(209 213 219);
}

.setting-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.25rem;
  background-color: white;
}

.setting-select:focus {
  outline: none;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59 130 246);
}

.dark .setting-select {
  border-color: rgb(55 65 81);
  background-color: rgb(17 24 39);
}

.setting-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.25rem;
  background-color: white;
}

.setting-input:focus {
  outline: none;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59 130 246);
}

.dark .setting-input {
  border-color: rgb(55 65 81);
  background-color: rgb(17 24 39);
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgb(55 65 81);
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.dark .setting-checkbox {
  color: rgb(209 213 219);
}
</style>