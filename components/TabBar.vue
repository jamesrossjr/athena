<template>
  <div 
    class="tab-bar"
    :class="[
      `tab-bar--${layout}`,
      { 'tab-bar--with-groups': enableGroups }
    ]"
  >
    <!-- Tab Groups (Two-Level Stacking) -->
    <div v-if="enableGroups && groups.length > 0" class="tab-groups">
      <div
        v-for="group in groups"
        :key="group.id"
        class="tab-group"
        :class="{ 'tab-group--collapsed': group.isCollapsed }"
        :style="{ '--group-color': group.color }"
      >
        <!-- Group Header -->
        <div 
          class="tab-group__header"
          @click="toggleGroup(group.id)"
        >
          <button class="tab-group__toggle">
            <svg 
              class="w-3 h-3 transition-transform"
              :class="{ 'rotate-90': !group.isCollapsed }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span class="tab-group__name">{{ group.name }}</span>
          <span class="tab-group__count">{{ group.tabs.length }}</span>
        </div>
        
        <!-- Group Tabs -->
        <div v-if="!group.isCollapsed" class="tab-group__tabs">
          <Tab
            v-for="tab in getGroupTabs(group)"
            :key="tab.id"
            :tab="tab"
            :document="getDocument(tab.documentId)"
            :isActive="tab.id === activeTabId"
            :layout="layout"
            @click="selectTab(tab.id)"
            @close="closeTab(tab.id)"
            @dragstart="handleDragStart(tab, $event)"
            @dragover="handleDragOver"
            @drop="handleDrop(tab, $event)"
            @contextmenu="showTabMenu(tab, $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- Ungrouped Tabs -->
    <div class="tabs" :class="`tabs--${layout}`">
      <!-- Pinned Tabs -->
      <div v-if="pinnedTabs.length > 0" class="tabs__pinned">
        <Tab
          v-for="tab in pinnedTabs"
          :key="tab.id"
          :tab="tab"
          :document="getDocument(tab.documentId)"
          :isActive="tab.id === activeTabId"
          :isPinned="true"
          :layout="layout"
          @click="selectTab(tab.id)"
          @close="unpinTab(tab.id)"
          @dragstart="handleDragStart(tab, $event)"
          @dragover="handleDragOver"
          @drop="handleDrop(tab, $event)"
          @contextmenu="showTabMenu(tab, $event)"
        />
      </div>
      
      <!-- Regular Tabs -->
      <div class="tabs__regular" ref="tabsContainer">
        <TransitionGroup name="tab-list">
          <Tab
            v-for="tab in regularTabs"
            :key="tab.id"
            :tab="tab"
            :document="getDocument(tab.documentId)"
            :isActive="tab.id === activeTabId"
            :layout="layout"
            @click="selectTab(tab.id)"
            @close="closeTab(tab.id)"
            @dragstart="handleDragStart(tab, $event)"
            @dragover="handleDragOver"
            @drop="handleDrop(tab, $event)"
            @contextmenu="showTabMenu(tab, $event)"
          />
        </TransitionGroup>
      </div>
      
      <!-- Add Tab Button -->
      <button 
        class="tab-add"
        @click="$emit('add-tab')"
        title="Add new document"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
    
    <!-- Tab Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu"
        :style="{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`
        }"
        @click.stop
      >
        <button @click="pinTabFromMenu" class="tab-context-menu__item">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {{ contextMenu.tab?.isPinned ? 'Unpin Tab' : 'Pin Tab' }}
        </button>
        
        <button @click="duplicateTab" class="tab-context-menu__item">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate Tab
        </button>
        
        <button @click="moveToNewGroup" class="tab-context-menu__item">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Move to New Group
        </button>
        
        <div class="tab-context-menu__divider"></div>
        
        <button @click="closeOtherTabs" class="tab-context-menu__item">
          Close Other Tabs
        </button>
        
        <button @click="closeTabsToRight" class="tab-context-menu__item">
          Close Tabs to the Right
        </button>
        
        <button @click="closeAllTabs" class="tab-context-menu__item tab-context-menu__item--danger">
          Close All Tabs
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Tab as TabType, TabGroup, Document } from '~/stores/workspace'
import Tab from './Tab.vue'

const props = defineProps<{
  tabs: TabType[]
  groups: TabGroup[]
  documents: Document[]
  activeTabId?: string
  layout: 'horizontal' | 'vertical'
  enableGroups: boolean
}>()

const emit = defineEmits<{
  'select-tab': [tabId: string]
  'close-tab': [tabId: string]
  'move-tab': [tabId: string, newOrder: number, groupId?: string]
  'pin-tab': [tabId: string, isPinned: boolean]
  'toggle-group': [groupId: string]
  'create-group': [name: string, tabIds: string[]]
  'add-tab': []
}>()

// Tab filtering
const pinnedTabs = computed(() => 
  props.tabs.filter(t => t.isPinned && !t.groupId).sort((a, b) => a.order - b.order)
)

const regularTabs = computed(() => 
  props.tabs.filter(t => !t.isPinned && !t.groupId).sort((a, b) => a.order - b.order)
)

// Context menu
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  tab: null as TabType | null
})

// Drag and drop
const draggedTab = ref<TabType | null>(null)

// Methods
function getDocument(documentId: string): Document | undefined {
  return props.documents.find(d => d.id === documentId)
}

function getGroupTabs(group: TabGroup): TabType[] {
  return group.tabs.sort((a, b) => a.order - b.order)
}

function selectTab(tabId: string) {
  emit('select-tab', tabId)
}

function closeTab(tabId: string) {
  emit('close-tab', tabId)
}

function unpinTab(tabId: string) {
  emit('pin-tab', tabId, false)
}

function toggleGroup(groupId: string) {
  emit('toggle-group', groupId)
}

// Drag and drop handlers
function handleDragStart(tab: TabType, event: DragEvent) {
  draggedTab.value = tab
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', tab.id)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

function handleDrop(targetTab: TabType, event: DragEvent) {
  event.preventDefault()
  
  if (!draggedTab.value || draggedTab.value.id === targetTab.id) return
  
  emit('move-tab', draggedTab.value.id, targetTab.order, targetTab.groupId)
  draggedTab.value = null
}

// Context menu handlers
function showTabMenu(tab: TabType, event: MouseEvent) {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    tab
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

function pinTabFromMenu() {
  if (contextMenu.value.tab) {
    emit('pin-tab', contextMenu.value.tab.id, !contextMenu.value.tab.isPinned)
  }
  hideContextMenu()
}

function duplicateTab() {
  if (contextMenu.value.tab) {
    // Emit event to duplicate the tab
    emit('add-tab')
  }
  hideContextMenu()
}

function moveToNewGroup() {
  if (contextMenu.value.tab) {
    const groupName = prompt('Enter group name:')
    if (groupName) {
      emit('create-group', groupName, [contextMenu.value.tab.id])
    }
  }
  hideContextMenu()
}

function closeOtherTabs() {
  if (contextMenu.value.tab) {
    props.tabs
      .filter(t => t.id !== contextMenu.value.tab?.id)
      .forEach(t => emit('close-tab', t.id))
  }
  hideContextMenu()
}

function closeTabsToRight() {
  if (contextMenu.value.tab) {
    const currentOrder = contextMenu.value.tab.order
    props.tabs
      .filter(t => t.order > currentOrder)
      .forEach(t => emit('close-tab', t.id))
  }
  hideContextMenu()
}

function closeAllTabs() {
  props.tabs.forEach(t => emit('close-tab', t.id))
  hideContextMenu()
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
.tab-bar {
  background-color: white;
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .tab-bar {
  background-color: rgb(31 41 55);
  border-bottom-color: rgb(55 65 81);
}

.tab-bar--horizontal {
  display: flex;
  flex-direction: column;
}

.tab-bar--vertical {
  display: flex;
  flex-direction: row;
  height: 100%;
}

/* Tab Groups */
.tab-groups {
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .tab-groups {
  border-bottom-color: rgb(55 65 81);
}

.tab-group {
  border-left: 2px solid var(--group-color, #3b82f6);
}

.tab-group__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-group__header:hover {
  background-color: rgb(249 250 251);
}

.dark .tab-group__header:hover {
  background-color: rgb(55 65 81);
}

.tab-group__toggle {
  padding: 0;
}

.tab-group__name {
  flex: 1 1 0%;
  font-size: 0.875rem;
  font-weight: 500;
}

.tab-group__count {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.dark .tab-group__count {
  color: rgb(156 163 175);
  background-color: rgb(75 85 99);
}

.tab-group--collapsed .tab-group__tabs {
  display: none;
}

.tab-group__tabs {
  padding-left: 1.5rem;
}

/* Tabs Container */
.tabs {
  display: flex;
  align-items: center;
}

.tabs--horizontal {
  flex-direction: row;
  overflow-x: auto;
}

.tabs--vertical {
  flex-direction: column;
  overflow-y: auto;
  width: 12rem;
}

.tabs__pinned {
  display: flex;
  border-right: 1px solid rgb(229 231 235);
  padding-right: 0.5rem;
  margin-right: 0.5rem;
}

.dark .tabs__pinned {
  border-right-color: rgb(55 65 81);
}

.tabs--vertical .tabs__pinned {
  flex-direction: column;
  border-right: 0;
  border-bottom: 1px solid rgb(229 231 235);
  padding-right: 0;
  margin-right: 0;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.dark .tabs--vertical .tabs__pinned {
  border-bottom-color: rgb(55 65 81);
}

.tabs__regular {
  display: flex;
  flex: 1 1 0%;
}

.tabs--vertical .tabs__regular {
  flex-direction: column;
}

/* Add Tab Button */
.tab-add {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-add:hover {
  background-color: rgb(243 244 246);
}

.dark .tab-add:hover {
  background-color: rgb(55 65 81);
}

/* Context Menu */
.tab-context-menu {
  position: fixed;
  z-index: 50;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgb(229 231 235);
  padding: 0.25rem 0;
  min-width: 200px;
}

.dark .tab-context-menu {
  background-color: rgb(31 41 55);
  border-color: rgb(55 65 81);
}

.tab-context-menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.tab-context-menu__item:hover {
  background-color: rgb(243 244 246);
}

.dark .tab-context-menu__item:hover {
  background-color: rgb(55 65 81);
}

.tab-context-menu__item--danger {
  color: rgb(220 38 38);
}

.dark .tab-context-menu__item--danger {
  color: rgb(248 113 113);
}

.tab-context-menu__item--danger:hover {
  background-color: rgb(254 226 226);
}

.dark .tab-context-menu__item--danger:hover {
  background-color: rgba(127, 29, 29, 0.2);
}

.tab-context-menu__divider {
  margin: 0.25rem 0;
  border-top: 1px solid rgb(229 231 235);
}

.dark .tab-context-menu__divider {
  border-top-color: rgb(55 65 81);
}

/* Transitions */
.tab-list-move,
.tab-list-enter-active,
.tab-list-leave-active {
  transition: all 0.3s ease;
}

.tab-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.tab-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.tab-list-leave-active {
  position: absolute;
}
</style>