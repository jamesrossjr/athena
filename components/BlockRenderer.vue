<template>
  <div 
    class="block-renderer"
    :class="{ 
      'block-renderer--active': isActive,
      'block-renderer--hovered': isHovered
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="setActive"
  >
    <!-- Block Handle -->
    <div 
      class="block-handle"
      :class="{ 'block-handle--visible': isHovered || isActive }"
    >
      <div class="handle-grip">
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
      </div>
    </div>

    <!-- Block Content -->
    <div class="block-content">
      <!-- Heading 1 -->
      <h1 
        v-if="block.type === 'heading1'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-heading1"
        :placeholder="'Heading 1'"
        ref="contentElement"
      >{{ block.content }}</h1>

      <!-- Heading 2 -->
      <h2 
        v-else-if="block.type === 'heading2'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-heading2"
        :placeholder="'Heading 2'"
        ref="contentElement"
      >{{ block.content }}</h2>

      <!-- Heading 3 -->
      <h3 
        v-else-if="block.type === 'heading3'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-heading3"
        :placeholder="'Heading 3'"
        ref="contentElement"
      >{{ block.content }}</h3>

      <!-- Paragraph -->
      <p 
        v-else-if="block.type === 'paragraph'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-paragraph"
        :placeholder="'Type something...'"
        ref="contentElement"
      >{{ block.content }}</p>

      <!-- Bullet List -->
      <ul 
        v-else-if="block.type === 'bullet-list'"
        class="block-list"
      >
        <li 
          v-for="(item, itemIndex) in block.items" 
          :key="`ul-${itemIndex}`"
          :contenteditable="true"
          @input="updateListItem(itemIndex, $event)"
          @keydown="handleListKeydown(itemIndex, $event)"
          class="block-list-item"
          :placeholder="itemIndex === 0 ? 'List item' : ''"
        >{{ item }}</li>
      </ul>

      <!-- Numbered List -->
      <ol 
        v-else-if="block.type === 'number-list' || block.type === 'numbered-list'"
        class="block-list"
      >
        <li 
          v-for="(item, itemIndex) in block.items" 
          :key="`ol-${itemIndex}`"
          :contenteditable="true"
          @input="updateListItem(itemIndex, $event)"
          @keydown="handleListKeydown(itemIndex, $event)"
          class="block-list-item"
          :placeholder="itemIndex === 0 ? 'List item' : ''"
        >{{ item }}</li>
      </ol>

      <!-- Quote -->
      <blockquote 
        v-else-if="block.type === 'quote'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-quote"
        :placeholder="'Quote'"
        ref="contentElement"
      >{{ block.content }}</blockquote>

      <!-- Code Block -->
      <pre 
        v-else-if="block.type === 'code'"
        :contenteditable="true"
        @input="updateContent"
        @keydown="handleKeydown"
        @paste="handlePaste"
        class="block-code"
        :placeholder="'Code'"
        ref="contentElement"
      ><code>{{ block.content }}</code></pre>

      <!-- Divider -->
      <hr 
        v-else-if="block.type === 'divider'"
        class="block-divider"
      />

      <!-- Todo -->
      <div 
        v-else-if="block.type === 'todo'"
        class="block-todo"
      >
        <input 
          type="checkbox"
          :checked="block.done"
          @change="toggleTodo"
          class="todo-checkbox"
        />
        <span 
          :contenteditable="true"
          @input="updateContent"
          @keydown="handleKeydown"
          class="todo-text"
          :class="{ 'todo-done': block.done }"
          :placeholder="'To-do'"
          ref="contentElement"
        >{{ block.content }}</span>
      </div>

      <!-- Fallback -->
      <div 
        v-else
        class="block-unknown"
      >
        <span class="block-type-label">{{ block.type }}</span>
        <p 
          :contenteditable="true"
          @input="updateContent"
          @keydown="handleKeydown"
          class="block-paragraph"
          ref="contentElement"
        >{{ block.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, nextTick } from 'vue'

interface Block {
  id: string
  type: string
  content?: string
  items?: string[]
  done?: boolean
  [key: string]: any
}

const props = defineProps<{
  block: Block
  blockIndex: number
  columnIndex: number
}>()

const emit = defineEmits<{
  'update': [columnIndex: number, blockIndex: number, updatedBlock: Block]
  'delete': [columnIndex: number, blockIndex: number]
  'split': [columnIndex: number, blockIndex: number, newBlock: Block]
  'merge': [columnIndex: number, blockIndex: number]
}>()

// State
const isActive = ref(false)
const isHovered = ref(false)
const contentElement = ref<HTMLElement>()

// Methods
function setActive() {
  isActive.value = true
  nextTick(() => {
    if (contentElement.value) {
      contentElement.value.focus()
    }
  })
}

function updateContent(event: Event) {
  const target = event.target as HTMLElement
  const content = target.textContent || ''
  
  const updatedBlock = {
    ...props.block,
    content
  }
  
  emit('update', props.columnIndex, props.blockIndex, updatedBlock)
}

function updateListItem(itemIndex: number, event: Event) {
  const target = event.target as HTMLElement
  const content = target.textContent || ''
  
  const items = [...(props.block.items || [])]
  items[itemIndex] = content
  
  const updatedBlock = {
    ...props.block,
    items
  }
  
  emit('update', props.columnIndex, props.blockIndex, updatedBlock)
}

function toggleTodo() {
  const updatedBlock = {
    ...props.block,
    done: !props.block.done
  }
  
  emit('update', props.columnIndex, props.blockIndex, updatedBlock)
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  
  // Enter key behavior
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const beforeContent = target.textContent?.substring(0, range.startOffset) || ''
      const afterContent = target.textContent?.substring(range.startOffset) || ''
      
      // Update current block with content before cursor
      const updatedBlock = {
        ...props.block,
        content: beforeContent
      }
      emit('update', props.columnIndex, props.blockIndex, updatedBlock)
      
      // Create new block with content after cursor
      const newBlock: Block = {
        id: generateId(),
        type: 'paragraph',
        content: afterContent
      }
      emit('split', props.columnIndex, props.blockIndex, newBlock)
    }
  }
  
  // Backspace at beginning - merge with previous block
  if (event.key === 'Backspace') {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (range.startOffset === 0 && range.endOffset === 0) {
        event.preventDefault()
        emit('merge', props.columnIndex, props.blockIndex)
      }
    }
  }
  
  // Delete empty block
  if (event.key === 'Backspace' && (!target.textContent || target.textContent === '')) {
    event.preventDefault()
    emit('delete', props.columnIndex, props.blockIndex)
  }
}

function handleListKeydown(itemIndex: number, event: KeyboardEvent) {
  const target = event.target as HTMLElement
  
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    
    const content = target.textContent || ''
    if (content.trim() === '') {
      // Convert to paragraph block
      const newBlock: Block = {
        id: generateId(),
        type: 'paragraph',
        content: ''
      }
      emit('split', props.columnIndex, props.blockIndex, newBlock)
    } else {
      // Add new list item
      const items = [...(props.block.items || [])]
      items.splice(itemIndex + 1, 0, '')
      
      const updatedBlock = {
        ...props.block,
        items
      }
      emit('update', props.columnIndex, props.blockIndex, updatedBlock)
    }
  }
  
  // Remove empty list item
  if (event.key === 'Backspace' && (!target.textContent || target.textContent === '')) {
    event.preventDefault()
    
    const items = [...(props.block.items || [])]
    if (items.length > 1) {
      items.splice(itemIndex, 1)
      const updatedBlock = {
        ...props.block,
        items
      }
      emit('update', props.columnIndex, props.blockIndex, updatedBlock)
    } else {
      emit('delete', props.columnIndex, props.blockIndex)
    }
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  
  const text = event.clipboardData?.getData('text/plain') || ''
  const selection = window.getSelection()
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(text))
    range.collapse(false)
    
    // Update block with new content
    const target = event.target as HTMLElement
    const content = target.textContent || ''
    const updatedBlock = {
      ...props.block,
      content
    }
    emit('update', props.columnIndex, props.blockIndex, updatedBlock)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>
.block-renderer {
  position: relative;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.block-renderer--hovered,
.block-renderer--active {
  background: #f8fafc;
}

.app-layout--dark .block-renderer--hovered,
.app-layout--dark .block-renderer--active {
  background: #374151;
}

/* Block Handle */
.block-handle {
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  cursor: grab;
  transition: all 0.15s ease;
  z-index: 1;
}

.block-handle--visible {
  opacity: 1;
}

.handle-grip {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  padding: 2px;
}

.grip-dot {
  width: 3px;
  height: 3px;
  background: #9ca3af;
  border-radius: 50%;
}

.app-layout--dark .grip-dot {
  background: #6b7280;
}

/* Block Content */
.block-content {
  position: relative;
}

/* Block Styles */
.block-heading1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  margin: 0;
  padding: 8px 12px;
  border: none;
  outline: none;
  min-height: 1.2em;
}

.app-layout--dark .block-heading1 {
  color: #f9fafb;
}

.block-heading2 {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
  margin: 0;
  padding: 6px 12px;
  border: none;
  outline: none;
  min-height: 1.3em;
}

.app-layout--dark .block-heading2 {
  color: #f9fafb;
}

.block-heading3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
  margin: 0;
  padding: 4px 12px;
  border: none;
  outline: none;
  min-height: 1.4em;
}

.app-layout--dark .block-heading3 {
  color: #f9fafb;
}

.block-paragraph {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  padding: 4px 12px;
  border: none;
  outline: none;
  min-height: 1.6em;
}

.app-layout--dark .block-paragraph {
  color: #d1d5db;
}

.block-list {
  margin: 0;
  padding: 4px 12px 4px 32px;
}

.block-list-item {
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
  padding: 2px 0;
  border: none;
  outline: none;
  min-height: 1.6em;
  list-style-position: outside;
}

.app-layout--dark .block-list-item {
  color: #d1d5db;
}

.block-quote {
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
  padding: 12px 16px;
  border-left: 4px solid #e5e7eb;
  background: #f9fafb;
  border: none;
  outline: none;
  min-height: 1.6em;
  font-style: italic;
}

.app-layout--dark .block-quote {
  color: #9ca3af;
  border-left-color: #4b5563;
  background: #374151;
}

.block-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  margin: 0;
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  min-height: 1.5em;
  white-space: pre-wrap;
  overflow-x: auto;
}

.app-layout--dark .block-code {
  color: #e5e7eb;
  background: #374151;
  border-color: #4b5563;
}

.block-divider {
  margin: 16px 12px;
  border: none;
  border-top: 1px solid #e5e7eb;
}

.app-layout--dark .block-divider {
  border-top-color: #4b5563;
}

.block-todo {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 12px;
}

.todo-checkbox {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: #374151;
  border: none;
  outline: none;
  min-height: 1.6em;
}

.todo-done {
  text-decoration: line-through;
  opacity: 0.6;
}

.app-layout--dark .todo-text {
  color: #d1d5db;
}

.block-unknown {
  padding: 8px 12px;
  border: 1px dashed #e5e7eb;
  border-radius: 4px;
  background: #fef3c7;
}

.app-layout--dark .block-unknown {
  border-color: #4b5563;
  background: #451a03;
}

.block-type-label {
  font-size: 12px;
  font-weight: 600;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  display: block;
}

.app-layout--dark .block-type-label {
  color: #fbbf24;
}

/* Placeholder styles */
[contenteditable="true"]:empty::before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.app-layout--dark [contenteditable="true"]:empty::before {
  color: #6b7280;
}
</style>