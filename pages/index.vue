<template>
  <!-- Blank Canvas - Clean Digital Paper -->
  <div 
    class="h-screen relative overflow-hidden transition-colors duration-300" 
    :style="{ backgroundColor: isDarkMode ? '#f3f4f6' : '#ffffff' }"
    @click="handleCanvasClick"
  >
    
    <!-- Dynamic Elements Container -->
    <div class="canvas-elements h-full pb-12 overflow-auto">
      <div
        v-for="element in elements"
        :key="element.id"
        :data-element-id="element.id"
        :data-placeholder="''"
        @click.stop="selectElement(element.id)"
        :class="[
          'element-item',
          { 'selected': selectedElementId === element.id },
          element.styles.className
        ]"
        :style="{
          position: 'absolute',
          left: element.position.x + 'px',
          top: element.position.y + 'px',
          width: element.styles.width || 'auto',
          height: element.styles.height || 'auto',
          color: element.styles.color || 'inherit',
          backgroundColor: element.styles.backgroundColor || 'transparent',
          fontSize: element.styles.fontSize || 'inherit',
          fontWeight: element.styles.fontWeight || 'inherit',
          lineHeight: element.styles.lineHeight || 'inherit',
          padding: element.styles.padding || '0',
          margin: element.styles.margin || '0',
          borderRadius: element.styles.borderRadius || '0',
          border: element.styles.border || 'none',
          boxShadow: element.styles.boxShadow || 'none'
        }"
        contenteditable="true"
        @input="updateElementContent(element.id, $event.target.textContent)"
        @keydown="handleElementKeydown($event, element.id)"
        v-html="element.content"
      >
      </div>
    </div>
    
    <!-- Clean Typing Cursor -->
    <div 
      v-if="isTyping"
      class="fixed pointer-events-none z-50 text-gray-900 dark:text-white"
      :style="{ left: typingPosition.x + 'px', top: typingPosition.y + 'px' }"
    >
      <span class="text-base">{{ typingContent }}</span><span class="animate-pulse text-blue-500 font-normal">|</span>
    </div>
    
    <!-- Command Menu -->
    <div
      v-if="showCommandMenu"
      class="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2"
      :style="{ left: commandMenuPosition.x + 'px', top: commandMenuPosition.y + 'px' }"
    >
      <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wide">
        Commands
      </div>
      <div class="text-xs text-gray-400 dark:text-gray-500 px-2 pb-2">
        Try: /h1, /bullet, /quote, /table, /summarize... (Option+M to toggle)
      </div>
      <div v-for="category in commandCategories" :key="category" class="mb-2">
        <div v-if="commandsByCategory[category].length > 0" class="text-xs font-medium text-gray-600 dark:text-gray-300 px-2 py-1 border-t border-gray-100 dark:border-gray-600">
          {{ category }}
        </div>
        <button
          v-for="cmd in commandsByCategory[category]"
          :key="cmd.id"
          @click="executeCommand(cmd)"
          class="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-left"
        >
          <div class="text-lg">{{ cmd.emoji }}</div>
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-white text-sm">/{{ cmd.id }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ cmd.description }}</div>
          </div>
        </button>
      </div>
    </div>
    
    <!-- Style Panel -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div v-if="showStylePanel && selectedElement" class="fixed right-4 top-1/2 transform -translate-y-1/2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Style Element</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Option+S to toggle</p>
            </div>
            <button @click="showStylePanel = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Icon name="heroicons:x-mark" class="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div class="p-4 space-y-4 max-h-96 overflow-y-auto">
          <!-- Typography -->
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Font Size</label>
            <input
              v-model="selectedElement.styles.fontSize"
              type="text"
              placeholder="16px"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color</label>
            <input
              v-model="selectedElement.styles.color"
              type="text"
              placeholder="#000000"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Background</label>
            <input
              v-model="selectedElement.styles.backgroundColor"
              type="text"
              placeholder="transparent"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Padding</label>
            <input
              v-model="selectedElement.styles.padding"
              type="text"
              placeholder="8px"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Border Radius</label>
            <input
              v-model="selectedElement.styles.borderRadius"
              type="text"
              placeholder="0px"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Border</label>
            <input
              v-model="selectedElement.styles.border"
              type="text"
              placeholder="1px solid #ccc"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Box Shadow</label>
            <input
              v-model="selectedElement.styles.boxShadow"
              type="text"
              placeholder="0 2px 4px rgba(0,0,0,0.1)"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            @click="deleteElement(selectedElement.id)"
            class="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Delete Element
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Bottom Ribbon - Simplified -->
    <div 
      :style="{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        height: '48px',
        background: isDarkMode ? '#1f2937' : '#ffffff',
        borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        transition: 'all 0.3s'
      }"
    >
      <!-- Left Side -->
      <div style="display: flex; align-items: center; gap: 16px;">
        <!-- Workspaces -->
        <button 
          @click="showWorkspaces = !showWorkspaces"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDarkMode ? '#d1d5db' : '#374151',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }"
        >
          {{ currentWorkspace?.name || 'Workspaces' }} <span style="margin-left: 4px;">↑</span>
        </button>
        
        <!-- Tabs -->
        <div style="display: flex; align-items: center; gap: 4px;">
          <div
            v-for="page in pages"
            :key="page.id"
            :style="{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '20px',
              transition: 'all 0.2s',
              backgroundColor: currentPageId === page.id ? (isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') : 'transparent',
              color: currentPageId === page.id ? (isDarkMode ? '#f3f4f6' : '#1f2937') : (isDarkMode ? '#d1d5db' : '#6b7280'),
              fontWeight: currentPageId === page.id ? '500' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }"
            @mouseover="handleTabHover($event, page.id)"
            @mouseout="handleTabLeave($event, page.id)"
          >
            <input
              v-if="editingTabId === page.id"
              v-model="editingTabTitle"
              @keydown.enter="saveTabTitle(page.id)"
              @keydown.esc="cancelEditingTab"
              @blur="saveTabTitle(page.id)"
              style="background: none; border: none; outline: none; color: inherit; font-size: inherit; font-weight: inherit; width: 100%;"
              autofocus
            />
            <span
              v-else
              @click="switchToPage(page.id)"
              @dblclick="startEditingTab(page.id, page.title)"
              style="width: 100%;"
            >
              {{ page.title }}
            </span>
          </div>
          
          <!-- Add Page -->
          <button
            @click="addNewPage"
            :style="{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#d1d5db' : '#4b5563',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }"
            title="Add new page"
          >
            +
          </button>
        </div>
      </div>
      
      <!-- Right Side - Paper Menu -->
      <button
        @click="showPaperMenu = !showPaperMenu"
        :style="{
          color: isDarkMode ? '#d1d5db' : '#374151',
          background: 'none',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          letterSpacing: '0.1em',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }"
      >
        Paper
      </button>
    </div>
    
    <!-- Workspaces Dropdown -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="showWorkspaces" :style="{
        position: 'fixed',
        bottom: '48px',
        left: '16px',
        background: isDarkMode ? '#1f2937' : '#ffffff',
        borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        zIndex: '10000',
        minWidth: '200px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        transition: 'all 0.3s'
      }">
        
        <!-- Available Workspaces -->
        <div v-for="workspace in workspaces" :key="workspace.id">
          <button 
            @click="switchToWorkspace(workspace.id)"
            :style="{
              width: '100%',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: currentWorkspaceId === workspace.id ? '#1f2937' : '#6b7280',
              backgroundColor: currentWorkspaceId === workspace.id ? 'rgba(0,0,0,0.05)' : 'transparent',
              border: 'none',
              textAlign: 'left',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }"
          >
            <span>{{ workspace.name }}</span>
            <span v-if="currentWorkspaceId === workspace.id" style="font-size: 12px;">✓</span>
          </button>
        </div>
        
        <!-- Create New Workspace -->
        <div v-if="showCreateWorkspace" style="border-top: 1px solid #e5e7eb; padding: 8px;">
          <input
            v-model="newWorkspaceName"
            @keydown.enter="createWorkspace"
            @keydown.esc="showCreateWorkspace = false; newWorkspaceName = ''"
            type="text"
            placeholder="Workspace name..."
            style="width: 100%; padding: 6px 8px; font-size: 14px; border: 1px solid #e5e7eb; border-radius: 4px; outline: none;"
            autofocus
          />
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button 
              @click="createWorkspace"
              style="padding: 4px 8px; background: #374151; color: white; font-size: 12px; border: none; border-radius: 4px; cursor: pointer;"
            >
              Create
            </button>
            <button 
              @click="showCreateWorkspace = false; newWorkspaceName = ''"
              style="padding: 4px 8px; background: #f3f4f6; color: #374151; font-size: 12px; border: none; border-radius: 4px; cursor: pointer;"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <!-- Add Workspace Button -->
        <div v-else style="border-top: 1px solid #e5e7eb;">
          <button 
            @click="showCreateWorkspace = true"
            style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; gap: 8px;"
          >
            <span>+</span>
            <span>New Workspace</span>
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Paper Menu Dropdown -->
    <div v-if="showPaperMenu" :style="{
      position: 'fixed',
      bottom: '48px',
      right: '16px',
      background: isDarkMode ? '#1f2937' : '#ffffff',
      borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
      zIndex: '10000',
      minWidth: '180px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      transition: 'all 0.3s'
    }">
      
      <!-- Settings -->
      <button 
        style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; gap: 8px;"
      >
        <span>⚙️</span>
        <span>Settings</span>
      </button>
      
      <!-- Dark Mode -->
      <button 
        @click="toggleDarkMode"
        style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; justifyContent: space-between;"
      >
        <div style="display: flex; alignItems: center; gap: 8px;">
          <span>{{ isDarkMode ? '☀️' : '🌙' }}</span>
          <span>{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</span>
        </div>
        <span v-if="isDarkMode" style="fontSize: 12px;">✓</span>
      </button>
      
      <!-- User Section -->
      <div v-if="authStore.isAuthenticated && authStore.user">
        <!-- User Info -->
        <div style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; display: flex; alignItems: center; gap: 8px;">
          <div style="width: 24px; height: 24px; borderRadius: 50%; backgroundColor: #3b82f6; color: white; display: flex; alignItems: center; justifyContent: center; fontSize: 12px; fontWeight: bold;">
            {{ authStore.initials }}
          </div>
          <div style="flex: 1; minWidth: 0;">
            <div style="fontSize: 14px; fontWeight: 500; color: #1f2937; truncate;">
              {{ authStore.fullName || authStore.user.email }}
            </div>
            <div style="fontSize: 12px; color: #6b7280; truncate;">
              {{ authStore.user.email }}
            </div>
          </div>
        </div>
        
        <!-- Sign Out -->
        <button 
          @click="handleSignOut"
          style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; gap: 8px;"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
      
      <!-- Sign In (for non-authenticated users) -->
      <div v-else>
        <button 
          @click="navigateToAuth"
          style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; gap: 8px;"
        >
          <span>👤</span>
          <span>Sign In</span>
        </button>
      </div>
      
      <!-- Divider -->
      <div style="border-top: 1px solid #e5e7eb;"></div>
      
      <!-- About Paper -->
      <button 
        style="width: 100%; padding: 8px 16px; fontSize: 14px; fontWeight: 500; color: #6b7280; backgroundColor: transparent; border: none; textAlign: left; transition: all 0.2s; cursor: pointer; display: flex; alignItems: center; gap: 8px;"
      >
        <span>ℹ️</span>
        <span>About Paper</span>
      </button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

// Authentication
const authStore = useAuthStore()

// Core Canvas State
const isTyping = ref(false)
const typingContent = ref('')
const typingPosition = ref({ x: 50, y: 50 })
const showCommandMenu = ref(false)
const commandMenuPosition = ref({ x: 400, y: 340 })
const showStylePanel = ref(false)
const selectedElementId = ref(null)
const elements = ref([])

// Page Management State
const currentPageId = ref(1)
const showWorkspaces = ref(false)
const showPaperMenu = ref(false)
const isDarkMode = ref(false)

// Workspace Management State
const workspaces = ref([
  { id: 1, name: 'My Workspace', pages: [{ id: 1, title: 'Untitled', elements: [] }] }
])
const currentWorkspaceId = ref(1)
const showCreateWorkspace = ref(false)
const newWorkspaceName = ref('')
const editingTabId = ref(null)
const editingTabTitle = ref('')

// Computed properties for workspace management
const currentWorkspace = computed(() => {
  return workspaces.value.find(w => w.id === currentWorkspaceId.value)
})

const pages = computed(() => {
  return currentWorkspace.value?.pages || []
})

// Element Management
const selectedElement = computed(() => {
  return elements.value.find(el => el.id === selectedElementId.value)
})

// Command Categories for Menu Grouping
const commandCategories = computed(() => {
  const categories = [...new Set(availableCommands.value.map(cmd => cmd.category || 'Other'))]
  return categories.sort()
})

const commandsByCategory = computed(() => {
  const grouped = {}
  commandCategories.value.forEach(category => {
    grouped[category] = availableCommands.value.filter(cmd => (cmd.category || 'Other') === category)
  })
  return grouped
})

// Comprehensive Command Registry with Categories & Aliases
const availableCommands = ref([
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large heading (H1)',
    category: 'Content Blocks',
    emoji: '📝',
    aliases: ['header1', 'heading1', 'header'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.2'
    }
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium heading (H2)',
    emoji: '📄',
    defaultContent: '',
    defaultStyles: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.3'
    }
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small heading (H3)',
    emoji: '📃',
    defaultContent: '',
    defaultStyles: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.4'
    }
  },
  {
    id: 'h4',
    label: 'Heading 4',
    description: 'Smaller heading (H4)',
    emoji: '📄',
    defaultContent: '',
    defaultStyles: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.4'
    }
  },
  {
    id: 'h5',
    label: 'Heading 5',
    description: 'Smallest heading (H5)',
    emoji: '📝',
    defaultContent: '',
    defaultStyles: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.5'
    }
  },
  {
    id: 'text',
    label: 'Text Block',
    description: 'Add paragraphs and content',
    emoji: '📄',
    defaultContent: 'Your text here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#4a4a4a',
      padding: '8px',
      maxWidth: '600px'
    }
  },
  {
    id: 'button',
    label: 'Button',
    description: 'Interactive button element',
    emoji: '🔘',
    defaultContent: 'Click me',
    defaultStyles: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer'
    }
  },
  {
    id: 'menu',
    label: 'Menu',
    description: 'Navigation menu',
    emoji: '📋',
    defaultContent: 'Home | About | Contact',
    defaultStyles: {
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      fontWeight: '500'
    }
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Content card container',
    emoji: '🃏',
    defaultContent: 'Card content...',
    defaultStyles: {
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      minWidth: '300px',
      minHeight: '200px'
    }
  },
  {
    id: 'footer',
    label: 'Footer',
    description: 'Page footer section',
    emoji: '🦶',
    defaultContent: '© 2024 Your Company',
    defaultStyles: {
      padding: '32px',
      backgroundColor: '#1f2937',
      color: 'white',
      width: '100%',
      textAlign: 'center'
    }
  },
  {
    id: 'chart',
    label: 'Chart Placeholder',
    description: 'Data visualization area',
    emoji: '📊',
    defaultContent: '[Chart Data Visualization]',
    defaultStyles: {
      padding: '40px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      textAlign: 'center',
      minWidth: '400px',
      minHeight: '300px'
    }
  },
  {
    id: 'grid',
    label: 'Grid Layout',
    description: 'Responsive grid container',
    emoji: '⚏',
    defaultContent: 'Grid Item 1 | Grid Item 2 | Grid Item 3',
    defaultStyles: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      minWidth: '600px'
    }
  },
  
  // Content Blocks - Additional
  {
    id: 'bullet',
    label: 'Bulleted List',
    description: 'Bulleted list item',
    category: 'Content Blocks',
    emoji: '•',
    aliases: ['ul', 'list'],
    defaultContent: '• ',
    defaultStyles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#333333',
      padding: '4px 8px',
      paddingLeft: '24px',
      lineHeight: '1.6'
    }
  },
  {
    id: 'number',
    label: 'Numbered List',
    description: 'Numbered list item',
    category: 'Content Blocks',
    emoji: '1️⃣',
    aliases: ['ol', 'ordered'],
    defaultContent: '1. ',
    defaultStyles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#333333',
      padding: '4px 8px',
      paddingLeft: '24px',
      lineHeight: '1.6'
    }
  },
  {
    id: 'quote',
    label: 'Quote Block',
    description: 'Highlighted quote or callout',
    category: 'Content Blocks',
    emoji: '💬',
    aliases: ['blockquote'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '18px',
      fontWeight: 'normal',
      color: '#4b5563',
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderLeft: '4px solid #3b82f6',
      fontStyle: 'italic',
      lineHeight: '1.6'
    }
  },
  {
    id: 'code',
    label: 'Code Block',
    description: 'Syntax highlighted code',
    category: 'Content Blocks',
    emoji: '💻',
    aliases: ['codeblock'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '14px',
      fontFamily: 'Monaco, "Lucida Console", monospace',
      color: '#e5e7eb',
      backgroundColor: '#1f2937',
      padding: '16px',
      borderRadius: '8px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap'
    }
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal line separator',
    category: 'Content Blocks',
    emoji: '➖',
    aliases: ['hr', 'line'],
    defaultContent: '',
    defaultStyles: {
      width: '100%',
      height: '1px',
      backgroundColor: '#d1d5db',
      margin: '20px 0',
      border: 'none'
    }
  },

  // Structured Data
  {
    id: 'table',
    label: 'Table',
    description: 'Insert an inline table',
    category: 'Structured Data',
    emoji: '📊',
    aliases: ['grid'],
    defaultContent: 'Header 1 | Header 2\n--- | ---\nCell 1 | Cell 2',
    defaultStyles: {
      fontSize: '14px',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '12px',
      backgroundColor: '#ffffff',
      fontFamily: 'monospace',
      whiteSpace: 'pre'
    }
  },
  {
    id: 'kanban',
    label: 'Kanban Board',
    description: 'Project board with columns',
    category: 'Structured Data',
    emoji: '📋',
    aliases: ['board'],
    defaultContent: '📋 Kanban Board\n\nTo Do | In Progress | Done',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      width: '100%',
      minHeight: '300px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }
  },

  // AI Actions
  {
    id: 'summarize',
    label: 'AI Summarize',
    description: 'Summarize selected content',
    category: 'AI Actions',
    emoji: '🤖',
    aliases: ['summary'],
    defaultContent: '🤖 AI Summary will appear here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#ecfdf5',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #10b981'
    }
  },
  {
    id: 'ask',
    label: 'Ask AI',
    description: 'Ask AI a question in context',
    category: 'AI Actions',
    emoji: '❓',
    aliases: ['question'],
    defaultContent: '❓ What would you like to know?',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#eff6ff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #3b82f6'
    }
  },
  {
    id: 'brainstorm',
    label: 'AI Brainstorm',
    description: 'Generate ideas based on current selection',
    category: 'AI Actions',
    emoji: '💡',
    aliases: ['ideas'],
    defaultContent: '💡 AI brainstorming ideas...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#fef3c7',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #f59e0b'
    }
  },
  {
    id: 'improve',
    label: 'Improve Writing',
    description: 'Rewrite content for clarity',
    category: 'AI Actions',
    emoji: '✨',
    aliases: ['rewrite'],
    defaultContent: '✨ Improved content will appear here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#f0f9ff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #0ea5e9'
    }
  },

  // Project Management
  {
    id: 'task',
    label: 'Task Item',
    description: 'Create a task with checkbox',
    category: 'Project Management',
    emoji: '☐',
    aliases: ['todo', 'checkbox'],
    defaultContent: '☐ ',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      padding: '8px',
      paddingLeft: '32px',
      lineHeight: '1.6'
    }
  },

  // Media & Embeds
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed image',
    category: 'Media & Embeds',
    emoji: '🖼️',
    aliases: ['img', 'picture'],
    defaultContent: '🖼️ [Image placeholder - drag & drop or paste]',
    defaultStyles: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      padding: '40px',
      borderRadius: '8px',
      border: '2px dashed #d1d5db',
      textAlign: 'center',
      minHeight: '200px'
    }
  },
  {
    id: 'video',
    label: 'Video Embed',
    description: 'Embed video content',
    category: 'Media & Embeds',
    emoji: '🎥',
    aliases: ['vid'],
    defaultContent: '🎥 [Video embed placeholder]',
    defaultStyles: {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: '60px',
      borderRadius: '8px',
      textAlign: 'center',
      minHeight: '300px'
    }
  }
])

// Canvas Methods
const handleCanvasClick = (e) => {
  console.log('Canvas clicked:', e.target === e.currentTarget, 'Target:', e.target.className)
  
  // If clicking empty canvas, start typing
  if (e.target === e.currentTarget || e.target.classList.contains('canvas-elements')) {
    e.preventDefault()
    // Use click position, but if no elements exist yet, start at top-left like a document
    if (elements.value.length === 0) {
      startTyping(50, 50) // First typing always starts at top-left
    } else {
      startTyping(e.clientX, e.clientY) // Otherwise use click position
    }
  } else {
    // Deselect elements when clicking canvas
    selectedElementId.value = null
    showStylePanel.value = false
  }
}

const startTyping = (x, y) => {
  isTyping.value = true
  typingContent.value = ''
  typingPosition.value = { x, y }
  showCommandMenu.value = false
  console.log('Started typing at position:', x, y)
}

const createElement = (type, content, position) => {
  const command = availableCommands.value.find(cmd => cmd.id === type)
  if (!command) return
  
  const newElement = {
    id: Date.now(),
    type: command.id,
    content: content !== null && content !== undefined ? content : command.defaultContent,
    position: position || typingPosition.value,
    styles: { ...command.defaultStyles }
  }
  
  elements.value.push(newElement)
  selectedElementId.value = newElement.id
  
  // Focus the new element for immediate editing
  nextTick(() => {
    setTimeout(() => {
      const elementDiv = document.querySelector(`[data-element-id="${newElement.id}"]`)
      if (elementDiv) {
        elementDiv.focus()
        
        // Place cursor at end of content
        const range = document.createRange()
        const selection = window.getSelection()
        
        // Make sure we select the text node, not the element
        const textNode = elementDiv.firstChild || elementDiv
        if (textNode.nodeType === Node.TEXT_NODE) {
          range.setStart(textNode, textNode.textContent.length)
        } else {
          range.selectNodeContents(elementDiv)
          range.collapse(false)
        }
        
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }, 50) // Small delay to ensure DOM is fully updated
  })
  
  return newElement
}

const selectElement = (elementId) => {
  selectedElementId.value = elementId
  // Don't auto-show style panel - only show on Option+S
}

const updateElementContent = (elementId, newContent) => {
  const element = elements.value.find(el => el.id === elementId)
  if (element && element.content !== newContent) {
    // Store cursor position before update
    const selection = window.getSelection()
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    const cursorOffset = range ? range.startOffset : 0
    
    element.content = newContent
    
    // Restore cursor position after Vue updates
    nextTick(() => {
      if (range && document.activeElement?.getAttribute('data-element-id') === elementId.toString()) {
        try {
          const elementDiv = document.activeElement
          const textNode = elementDiv.firstChild || elementDiv
          
          if (textNode.nodeType === Node.TEXT_NODE) {
            const newRange = document.createRange()
            const newSelection = window.getSelection()
            const maxOffset = Math.min(cursorOffset, textNode.textContent.length)
            
            newRange.setStart(textNode, maxOffset)
            newRange.setEnd(textNode, maxOffset)
            newSelection.removeAllRanges()
            newSelection.addRange(newRange)
          }
        } catch (e) {
          // Fallback: place cursor at end
          console.log('Cursor position fallback')
        }
      }
    })
  }
}

const deleteElement = (elementId) => {
  elements.value = elements.value.filter(el => el.id !== elementId)
  selectedElementId.value = null
  showStylePanel.value = false
}

const executeCommand = (command) => {
  createElement(command.id, command.defaultContent, typingPosition.value)
  showCommandMenu.value = false
  isTyping.value = false
  typingContent.value = ''
}

const handleElementKeydown = (e, elementId) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    // Check if current element has slash command content
    const currentElement = elements.value.find(el => el.id === elementId)
    const currentContent = e.target.textContent.trim()
    
    // Check for slash commands in current element
    if (currentContent.startsWith('/')) {
      e.preventDefault()
      const slashCommand = parseSlashCommand(currentContent)
      if (slashCommand) {
        // Transform current element to the new type
        const command = availableCommands.value.find(cmd => cmd.id === slashCommand.type)
        if (command && currentElement) {
          currentElement.type = slashCommand.type
          currentElement.content = slashCommand.content || ''
          currentElement.styles = { ...command.defaultStyles }
          
          // Focus back on the transformed element
          nextTick(() => {
            setTimeout(() => {
              const elementDiv = document.querySelector(`[data-element-id="${elementId}"]`)
              if (elementDiv) {
                elementDiv.focus()
                
                // Place cursor at end if there's content, beginning if empty
                const range = document.createRange()
                const selection = window.getSelection()
                const textNode = elementDiv.firstChild || elementDiv
                
                if (slashCommand.content) {
                  if (textNode.nodeType === Node.TEXT_NODE) {
                    range.setStart(textNode, textNode.textContent.length)
                  } else {
                    range.selectNodeContents(elementDiv)
                    range.collapse(false)
                  }
                } else {
                  range.selectNodeContents(elementDiv)
                  range.collapse(true)
                }
                
                selection.removeAllRanges()
                selection.addRange(range)
              }
            }, 50)
          })
          return
        }
      }
    }
    
    // Regular Enter behavior - create new text element below
    e.preventDefault()
    
    if (currentElement) {
      // Calculate position for new element (below current one, document-style)
      const lineHeight = parseInt(currentElement.styles.fontSize || '16px') * 1.5
      const newY = currentElement.position.y + lineHeight + 8 // Tighter spacing like a document
      
      // Create new plain text element
      const newElement = {
        id: Date.now(),
        type: 'text',
        content: '',
        position: { 
          x: 50, // Always start new lines at left margin like a document
          y: newY 
        },
        styles: {
          fontSize: '16px',
          color: '#1a1a1a',
          padding: '8px',
          lineHeight: '1.5'
        }
      }
      
      elements.value.push(newElement)
      selectedElementId.value = newElement.id
      
      // Focus the new element
      nextTick(() => {
        setTimeout(() => {
          const newElementDiv = document.querySelector(`[data-element-id="${newElement.id}"]`)
          if (newElementDiv) {
            newElementDiv.focus()
            
            // Place cursor at beginning
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(newElementDiv)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }, 50)
      })
    }
  } else if (e.key === 'Escape') {
    e.target.blur()
    selectedElementId.value = null
    showStylePanel.value = false
  }
}

// Command parsing helper
const parseSlashCommand = (text) => {
  // Build dynamic command map from availableCommands with aliases
  const commands = {}
  
  availableCommands.value.forEach(cmd => {
    // Add primary command
    commands[`/${cmd.id}`] = cmd.id
    
    // Add aliases if they exist
    if (cmd.aliases) {
      cmd.aliases.forEach(alias => {
        commands[`/${alias}`] = cmd.id
      })
    }
  })
  
  // Debug: Log available commands
  console.log('Available commands:', Object.keys(commands).slice(0, 10))
  
  for (const [command, type] of Object.entries(commands)) {
    if (text.toLowerCase().includes(command)) {
      const content = text.replace(new RegExp(command, 'i'), '').trim()
      console.log('Matched command:', command, 'Type:', type)
      return { type, content: content || null }
    }
  }
  return null
}

// Global Keyboard Handling
const handleGlobalKeydown = (e) => {
  console.log('Key pressed:', e.key, 'Target:', e.target.tagName, 'ContentEditable:', e.target.contentEditable)
  
  // Handle typing state
  if (isTyping.value) {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // Check for slash commands first
      const slashCommand = parseSlashCommand(typingContent.value)
      if (slashCommand) {
        const command = availableCommands.value.find(cmd => cmd.id === slashCommand.type)
        if (command) {
          createElement(slashCommand.type, slashCommand.content || command.defaultContent, typingPosition.value)
        }
      } else if (typingContent.value.trim()) {
        // Create regular text element
        createElement('text', typingContent.value, typingPosition.value)
      }
      
      isTyping.value = false
      typingContent.value = ''
      showCommandMenu.value = false
    } else if (e.key === 'Escape') {
      isTyping.value = false
      typingContent.value = ''
      showCommandMenu.value = false
    } else if (e.key === 'Backspace') {
      typingContent.value = typingContent.value.slice(0, -1)
      // Hide command menu if we backspace past the /
      if (!typingContent.value.includes('/')) {
        showCommandMenu.value = false
      }
    } else if (e.key === 'Space' && typingContent.value.startsWith('/')) {
      // Auto-complete commands on space
      const slashCommand = parseSlashCommand(typingContent.value)
      if (slashCommand) {
        e.preventDefault()
        const command = availableCommands.value.find(cmd => cmd.id === slashCommand.type)
        if (command) {
          createElement(slashCommand.type, slashCommand.content || command.defaultContent, typingPosition.value)
          isTyping.value = false
          typingContent.value = ''
          showCommandMenu.value = false
          return
        }
      }
      typingContent.value += e.key
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typingContent.value += e.key
      // Don't auto-show command menu when typing "/" - only on Option+M
    }
    return
  }
  
  // Handle keyboard shortcuts
  if (e.altKey && e.key.toLowerCase() === 's') {
    // Option+S: Toggle style panel
    e.preventDefault()
    if (selectedElementId.value) {
      showStylePanel.value = !showStylePanel.value
    }
    return
  }
  
  if (e.altKey && e.key.toLowerCase() === 'm') {
    // Option+M: Toggle command menu
    e.preventDefault()
    if (isTyping.value) {
      showCommandMenu.value = !showCommandMenu.value
      if (showCommandMenu.value) {
        commandMenuPosition.value = {
          x: Math.min(typingPosition.value.x, window.innerWidth - 320),
          y: Math.min(typingPosition.value.y + 40, window.innerHeight - 400)
        }
      }
    }
    return
  }
  
  // Handle command menu
  if (showCommandMenu.value && e.key === 'Escape') {
    showCommandMenu.value = false
    return
  }
  
  // Start typing on any character key (if not focused on editable element)
  if (
    e.key.length === 1 && 
    !e.ctrlKey && 
    !e.metaKey && 
    !e.altKey &&
    !['INPUT', 'TEXTAREA'].includes(e.target.tagName) &&
    e.target.contentEditable !== 'true'
  ) {
    e.preventDefault()
    startTyping(50, 50) // Top-left document position
    typingContent.value = e.key
  }
}

// Mount and cleanup
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  console.log('Event listeners mounted')
  
  // Clean start - no welcome text
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// Page Management Functions
const currentPage = computed(() => {
  return pages.value.find(page => page.id === currentPageId.value)
})

const addNewPage = () => {
  const newPageId = Date.now()
  const newPage = {
    id: newPageId,
    title: 'Untitled',
    elements: []
  }
  
  // Save current page elements
  if (currentPage.value) {
    currentPage.value.elements = [...elements.value]
  }
  
  // Add new page to current workspace and switch to it
  if (currentWorkspace.value) {
    currentWorkspace.value.pages.push(newPage)
    switchToPage(newPageId)
  }
}

const switchToPage = (pageId) => {
  // Save current page elements
  if (currentPage.value) {
    currentPage.value.elements = [...elements.value]
  }
  
  // Switch to new page
  currentPageId.value = pageId
  const newPage = pages.value.find(page => page.id === pageId)
  if (newPage) {
    elements.value = [...newPage.elements]
    selectedElementId.value = null
    showStylePanel.value = false
    isTyping.value = false
    typingContent.value = ''
  }
}

const closePage = (pageId) => {
  if (!currentWorkspace.value || currentWorkspace.value.pages.length <= 1) return // Don't close last page
  
  const pageIndex = currentWorkspace.value.pages.findIndex(page => page.id === pageId)
  if (pageIndex === -1) return
  
  // If closing current page, switch to another page first
  if (currentPageId.value === pageId) {
    const newPageIndex = pageIndex > 0 ? pageIndex - 1 : pageIndex + 1
    const newPageId = currentWorkspace.value.pages[newPageIndex]?.id
    if (newPageId) {
      switchToPage(newPageId)
    }
  }
  
  // Remove the page from current workspace
  currentWorkspace.value.pages.splice(pageIndex, 1)
}

const handleTabHover = (event, pageId) => {
  if (currentPageId.value !== pageId) {
    event.target.style.backgroundColor = '#f3f4f6'
  }
}

const handleTabLeave = (event, pageId) => {
  if (currentPageId.value !== pageId) {
    event.target.style.backgroundColor = 'transparent'
  }
}

// Tab editing functions
const startEditingTab = (pageId, currentTitle) => {
  editingTabId.value = pageId
  editingTabTitle.value = currentTitle
}

const saveTabTitle = (pageId) => {
  if (editingTabTitle.value.trim()) {
    const page = pages.value.find(p => p.id === pageId)
    if (page) {
      page.title = editingTabTitle.value.trim()
    }
  }
  editingTabId.value = null
  editingTabTitle.value = ''
}

const cancelEditingTab = () => {
  editingTabId.value = null
  editingTabTitle.value = ''
}

// Workspace Management Functions
const createWorkspace = () => {
  if (!newWorkspaceName.value.trim()) return
  
  const newWorkspaceId = Date.now()
  const newWorkspace = {
    id: newWorkspaceId,
    name: newWorkspaceName.value.trim(),
    pages: [{ id: Date.now() + 1, title: 'Untitled', elements: [] }]
  }
  
  workspaces.value.push(newWorkspace)
  switchToWorkspace(newWorkspaceId)
  
  // Reset form
  newWorkspaceName.value = ''
  showCreateWorkspace.value = false
  showWorkspaces.value = false
}

const switchToWorkspace = (workspaceId) => {
  // Save current page elements before switching
  if (currentPage.value) {
    currentPage.value.elements = [...elements.value]
  }
  
  currentWorkspaceId.value = workspaceId
  const newWorkspace = workspaces.value.find(w => w.id === workspaceId)
  
  if (newWorkspace && newWorkspace.pages.length > 0) {
    currentPageId.value = newWorkspace.pages[0].id
    elements.value = [...newWorkspace.pages[0].elements]
  } else {
    elements.value = []
  }
  
  selectedElementId.value = null
  showStylePanel.value = false
  isTyping.value = false
  typingContent.value = ''
  showWorkspaces.value = false
}

// Dark Mode Functions
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  showPaperMenu.value = false // Close menu after selection
  
  // Apply dark mode to document
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Watch for element changes to auto-save to current page
watch(elements, (newElements) => {
  if (currentPage.value) {
    currentPage.value.elements = [...newElements]
  }
}, { deep: true })

// Authentication methods
const navigateToAuth = () => {
  navigateTo('/auth/login')
}

const handleSignOut = async () => {
  await authStore.logout()
}

// Initialize authentication and first page
onMounted(async () => {
  // Fetch current user if authenticated
  if (!authStore.user) {
    await authStore.fetchUser()
  }
  
  if (currentWorkspace.value && currentWorkspace.value.pages.length > 0) {
    const firstPage = currentWorkspace.value.pages[0]
    currentPageId.value = firstPage.id
    elements.value = [...firstPage.elements]
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Canvas Styling */
.canvas-elements {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.element-item {
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 20px;
  min-height: 1.5em; /* Ensure empty elements are visible */
}

/* Removed placeholder text - clean paper experience */

.element-item:hover {
  /* No automatic borders - only if user adds them */
}

.element-item.selected {
  /* No automatic borders - only if user adds them */
}

.element-item:focus {
  outline: none;
  /* No automatic borders - only if user adds them */
}

/* Smooth transitions */
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode support */
.dark .element-item:hover {
  outline-color: #4b5563;
}

.dark .element-item.selected,
.dark .element-item:focus {
  outline-color: #60a5fa;
}

/* Responsive grid for grid elements */
.element-item[data-type="grid"] {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>