<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="block-type-menu"
      :style="menuStyle"
      role="menu"
      :aria-label="'Change block type from ' + currentType"
    >
      <div class="menu-content">
        <div class="menu-header">
          <span class="menu-title">Turn into</span>
          <button
            class="menu-close"
            @click="close"
            :aria-label="'Close block type menu'"
          >
            ✕
          </button>
        </div>
        
        <div class="menu-items">
          <KeyboardTooltip
            v-for="blockType in blockTypes"
            :key="blockType.type"
            :shortcut="blockType.shortcut"
            :description="blockType.description"
            position="right"
          >
            <div
              class="menu-item"
              :class="{ 'menu-item--selected': currentType === blockType.type }"
              @click="selectType(blockType.type)"
              @keydown="handleItemKeydown(blockType.type, $event)"
              role="menuitem"
              :tabindex="currentType === blockType.type ? 0 : -1"
              :aria-label="`Change to ${blockType.name}`"
            >
              <div class="item-icon">{{ blockType.icon }}</div>
              <div class="item-content">
                <div class="item-name">{{ blockType.name }}</div>
                <div class="item-description">{{ blockType.description }}</div>
              </div>
              <div v-if="blockType.shortcut" class="item-shortcut">
                {{ blockType.shortcut }}
              </div>
            </div>
          </KeyboardTooltip>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import KeyboardTooltip from './KeyboardTooltip.vue'

interface Props {
  blockIndex: number
  currentType: string
  targetElement?: HTMLElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-type': [type: string]
  'close': []
}>()

// State
const isVisible = ref(true)
const menuPosition = ref({ top: 0, left: 0 })

// Block types configuration
const blockTypes = [
  {
    type: 'paragraph',
    name: 'Text',
    description: 'Plain text paragraph',
    icon: '¶',
    shortcut: 'Ctrl+Alt+0'
  },
  {
    type: 'heading1',
    name: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    shortcut: 'Ctrl+Alt+1'
  },
  {
    type: 'heading2',
    name: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    shortcut: 'Ctrl+Alt+2'
  },
  {
    type: 'heading3',
    name: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    shortcut: 'Ctrl+Alt+3'
  },
  {
    type: 'bullet-list',
    name: 'Bulleted list',
    description: 'Create a simple bulleted list',
    icon: '•',
    shortcut: 'Ctrl+Shift+8'
  },
  {
    type: 'numbered-list',
    name: 'Numbered list',
    description: 'Create a list with numbering',
    icon: '#',
    shortcut: 'Ctrl+Shift+7'
  },
  {
    type: 'todo',
    name: 'To-do list',
    description: 'Track tasks with a to-do list',
    icon: '☐',
    shortcut: 'Ctrl+Shift+9'
  },
  {
    type: 'quote',
    name: 'Quote',
    description: 'Capture a quote',
    icon: '"',
    shortcut: 'Ctrl+Shift+.'
  },
  {
    type: 'code',
    name: 'Code',
    description: 'Capture a code snippet',
    icon: '</>',
    shortcut: 'Ctrl+E'
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Visually divide blocks',
    icon: '—',
    shortcut: 'Ctrl+Shift+-'
  }
]

// Computed menu style
const menuStyle = computed(() => ({
  position: 'absolute',
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`,
  zIndex: 10000
}))

// Position the menu
function updatePosition() {
  if (!props.targetElement) return
  
  const rect = props.targetElement.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  
  const menuWidth = 320
  const menuHeight = 400
  
  let left = rect.right + scrollLeft + 8
  let top = rect.top + scrollTop
  
  // Keep menu within viewport
  if (left + menuWidth > window.innerWidth) {
    left = rect.left + scrollLeft - menuWidth - 8
  }
  
  if (top + menuHeight > window.innerHeight + scrollTop) {
    top = window.innerHeight + scrollTop - menuHeight - 8
  }
  
  if (top < scrollTop) {
    top = scrollTop + 8
  }
  
  menuPosition.value = { top, left }
}

// Event handlers
function selectType(type: string) {
  emit('select-type', type)
  close()
}

function close() {
  isVisible.value = false
  emit('close')
}

function handleItemKeydown(type: string, event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectType(type)
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNextItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousItem()
      break
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  // Handle keyboard shortcuts for block types
  if (event.ctrlKey && event.altKey) {
    const shortcutMap: Record<string, string> = {
      '0': 'paragraph',
      '1': 'heading1',
      '2': 'heading2',
      '3': 'heading3'
    }
    
    const type = shortcutMap[event.key]
    if (type) {
      event.preventDefault()
      selectType(type)
    }
  }
  
  if (event.ctrlKey && event.shiftKey) {
    const shortcutMap: Record<string, string> = {
      '8': 'bullet-list',
      '7': 'numbered-list',
      '9': 'todo',
      '.': 'quote',
      '-': 'divider'
    }
    
    const type = shortcutMap[event.key]
    if (type) {
      event.preventDefault()
      selectType(type)
    }
  }
  
  if (event.ctrlKey && event.key === 'e') {
    event.preventDefault()
    selectType('code')
  }
  
  if (event.key === 'Escape') {
    close()
  }
}

function focusNextItem() {
  const items = document.querySelectorAll('.menu-item')
  const currentIndex = Array.from(items).findIndex(item => 
    item.classList.contains('menu-item--selected')
  )
  const nextIndex = (currentIndex + 1) % items.length
  ;(items[nextIndex] as HTMLElement).focus()
}

function focusPreviousItem() {
  const items = document.querySelectorAll('.menu-item')
  const currentIndex = Array.from(items).findIndex(item => 
    item.classList.contains('menu-item--selected')
  )
  const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
  ;(items[prevIndex] as HTMLElement).focus()
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    updatePosition()
    
    // Focus current type initially
    const currentItem = document.querySelector(`[data-type="${props.currentType}"]`) as HTMLElement
    if (currentItem) {
      currentItem.focus()
    }
  })
  
  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('scroll', updatePosition)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.block-type-menu {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  animation: slideIn 0.15s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-content {
  display: flex;
  flex-direction: column;
  max-height: 400px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.menu-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
}

.menu-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.menu-close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.menu-items {
  overflow-y: auto;
  max-height: 340px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  border: none;
  background: none;
  gap: 12px;
  transition: background-color 0.1s ease;
  width: 100%;
  text-align: left;
}

.menu-item:hover,
.menu-item:focus {
  background: #f3f4f6;
}

.menu-item--selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.item-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  font-family: ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 1px;
}

.item-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
}

.item-shortcut {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* Dark mode */
.dark .block-type-menu {
  background: #1f2937;
  border-color: #374151;
}

.dark .menu-header {
  background: #374151;
  border-bottom-color: #4b5563;
}

.dark .menu-title {
  color: #9ca3af;
}

.dark .menu-close {
  color: #9ca3af;
}

.dark .menu-close:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.dark .menu-item:hover,
.dark .menu-item:focus {
  background: #374151;
}

.dark .menu-item--selected {
  background: #1e3a8a;
  border-left-color: #3b82f6;
}

.dark .item-name {
  color: #f9fafb;
}

.dark .item-description {
  color: #d1d5db;
}

.dark .item-icon {
  color: #9ca3af;
}

.dark .item-shortcut {
  background: #374151;
  color: #d1d5db;
  border-color: #4b5563;
}

/* High contrast mode */
.high-contrast .block-type-menu {
  background: #ffffff !important;
  border: 2px solid #000000 !important;
}

.high-contrast .menu-item {
  color: #000000 !important;
  border-bottom: 1px solid #000000 !important;
}

.high-contrast .menu-item:hover,
.high-contrast .menu-item:focus {
  background: #ffff00 !important;
}

.high-contrast .menu-item--selected {
  background: #0000ff !important;
  color: #ffffff !important;
}

.high-contrast .item-name,
.high-contrast .item-description {
  color: inherit !important;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .block-type-menu {
    animation: none;
  }
  
  @keyframes slideIn {
    from, to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
}
</style>