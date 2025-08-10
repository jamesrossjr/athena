<template>
  <div 
    class="tile-pane-container"
    :class="{ 'tile-pane--active': isActive }"
    @click="$emit('focus')"
  >
    <!-- Pane Header with Tabs -->
    <div class="tile-pane__header">
      <div class="tile-pane__tabs">
        <button
          v-for="tab in pane.tabs"
          :key="tab.id"
          class="tile-pane__tab"
          :class="{ 'tile-pane__tab--active': tab.id === pane.activeTabId }"
          @click="selectTab(tab.id)"
          @mousedown="handleTabMouseDown(tab, $event)"
        >
          <span class="tile-pane__tab-icon">
            {{ getDocumentIcon(getDocument(tab.documentId)) }}
          </span>
          <span class="tile-pane__tab-title">
            {{ getDocument(tab.documentId)?.title || 'Untitled' }}
          </span>
          <button
            class="tile-pane__tab-close"
            @click.stop="$emit('close-tab', tab.id)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </button>
      </div>
      
      <!-- Pane Actions -->
      <div class="tile-pane__actions">
        <button
          @click="maximizePane"
          class="tile-pane__action"
          title="Maximize"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        
        <button
          @click="splitPane('horizontal')"
          class="tile-pane__action"
          title="Split Horizontal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-width="2" d="M12 4v16M4 4h16v16H4z"/>
          </svg>
        </button>
        
        <button
          @click="splitPane('vertical')"
          class="tile-pane__action"
          title="Split Vertical"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-width="2" d="M4 12h16M4 4h16v16H4z"/>
          </svg>
        </button>
        
        <button
          @click="closePane"
          class="tile-pane__action tile-pane__action--danger"
          title="Close Pane"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Pane Content -->
    <div class="tile-pane__content">
      <div v-if="activeDocument" class="h-full">
        <DocumentRenderer
          :document="activeDocument"
          @update="updateDocument"
        />
      </div>
      <div v-else class="tile-pane__empty">
        <div class="text-center text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No document open</p>
          <p class="text-sm mt-2">Select a tab or drag a document here</p>
        </div>
      </div>
    </div>
    
    <!-- Drop Zone Overlay -->
    <div
      v-if="isDragOver"
      class="tile-pane__dropzone"
      @dragover.prevent
      @drop="handleDrop"
      @dragleave="isDragOver = false"
    >
      <div class="tile-pane__dropzone-content">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="mt-2 text-sm">Drop tab here</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TilePane, Document, Tab } from '~/stores/workspace'
import DocumentRenderer from './DocumentRenderer.vue'

const props = defineProps<{
  pane: TilePane
  documents: Document[]
  isActive: boolean
}>()

const emit = defineEmits<{
  'select-tab': [tabId: string]
  'close-tab': [tabId: string]
  'move-tab': [tabId: string, toPaneId: string]
  'focus': []
}>()

const isDragOver = ref(false)
const draggedTab = ref<Tab | null>(null)

const activeDocument = computed(() => {
  if (!props.pane.activeTabId) return null
  const activeTab = props.pane.tabs.find(t => t.id === props.pane.activeTabId)
  if (!activeTab) return null
  return props.documents.find(d => d.id === activeTab.documentId)
})

function getDocument(documentId: string): Document | undefined {
  return props.documents.find(d => d.id === documentId)
}

function getDocumentIcon(document?: Document): string {
  if (!document) return '📄'
  switch (document.type) {
    case 'pdf': return '📄'
    case 'table': return '📊'
    case 'whiteboard': return '🎨'
    case 'database': return '🗃️'
    case 'page': return '📝'
    default: return '📄'
  }
}

function selectTab(tabId: string) {
  props.pane.activeTabId = tabId
  emit('select-tab', tabId)
}

function updateDocument(updatedDocument: any) {
  // Handle document updates
  const doc = props.documents.find(d => d.id === activeDocument.value?.id)
  if (doc) {
    Object.assign(doc, updatedDocument)
  }
}

function maximizePane() {
  // Emit event to maximize this pane
  console.log('Maximize pane')
}

function splitPane(direction: 'horizontal' | 'vertical') {
  // Emit event to split this pane
  console.log('Split pane', direction)
}

function closePane() {
  // Emit event to close this pane
  console.log('Close pane')
}

function handleTabMouseDown(tab: Tab, event: MouseEvent) {
  if (event.button === 0) { // Left click
    draggedTab.value = tab
    
    // Setup drag
    const dragImage = new Image()
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
}

function handleMouseMove(event: MouseEvent) {
  // Check if we're over a different pane
  const element = document.elementFromPoint(event.clientX, event.clientY)
  const paneElement = element?.closest('.tile-pane-container')
  
  if (paneElement && paneElement !== event.currentTarget) {
    isDragOver.value = true
  }
}

function handleMouseUp() {
  draggedTab.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  
  const tabId = event.dataTransfer?.getData('text/plain')
  if (tabId) {
    emit('move-tab', tabId, props.pane.id)
  }
}
</script>

<style scoped>
.tile-pane-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  overflow: hidden;
}

.dark .tile-pane-container {
  background-color: rgb(17 24 39);
  border-color: rgb(55 65 81);
}

.tile-pane--active {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
  --tw-ring-color: rgb(59 130 246);
}

.tile-pane__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgb(249 250 251);
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .tile-pane__header {
  background-color: rgb(31 41 55);
  border-bottom-color: rgb(55 65 81);
}

.tile-pane__tabs {
  display: flex;
  flex: 1 1 0%;
  overflow-x: auto;
}

.tile-pane__tab {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tile-pane__tab:hover {
  background-color: rgb(243 244 246);
}

.dark .tile-pane__tab:hover {
  background-color: rgb(55 65 81);
}

.tile-pane__tab--active {
  background-color: white;
  border-bottom: 2px solid rgb(59 130 246);
}

.dark .tile-pane__tab--active {
  background-color: rgb(17 24 39);
}

.tile-pane__tab-icon {
  font-size: 0.75rem;
  line-height: 1rem;
}

.tile-pane__tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.tile-pane__tab-close {
  opacity: 0;
  margin-left: 0.25rem;
  padding: 0.125rem;
  border-radius: 0.25rem;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tile-pane__tab:hover .tile-pane__tab-close {
  opacity: 1;
}

.tile-pane__tab-close:hover {
  background-color: rgb(229 231 235);
}

.dark .tile-pane__tab-close:hover {
  background-color: rgb(75 85 99);
}

.tile-pane__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
}

.tile-pane__action {
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tile-pane__action:hover {
  background-color: rgb(229 231 235);
}

.dark .tile-pane__action:hover {
  background-color: rgb(55 65 81);
}

.tile-pane__action--danger:hover {
  background-color: rgb(254 226 226);
  color: rgb(220 38 38);
}

.dark .tile-pane__action--danger:hover {
  background-color: rgba(127, 29, 29, 0.3);
  color: rgb(248 113 113);
}

.tile-pane__content {
  flex: 1 1 0%;
  overflow: auto;
}

.tile-pane__empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tile-pane__dropzone {
  position: absolute;
  inset: 0;
  background-color: rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.tile-pane__dropzone-content {
  text-align: center;
  color: rgb(37 99 235);
}

.dark .tile-pane__dropzone-content {
  color: rgb(96 165 250);
}
</style>