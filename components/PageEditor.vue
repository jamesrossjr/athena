<template>
  <div class="page-editor h-full">
    <!-- Clean Paper-style Document -->
    <div class="document-content" @click="focusEditor">
      <!-- Document Blocks -->
      <div 
        v-for="(block, index) in blocks" 
        :key="block.id"
        class="document-block"
        :class="{ 
          'document-block--active': activeBlockIndex === index,
          'document-block--dragging': dragState.isDragging && dragState.dragIndex === index
        }"
        :data-block-index="index"
        @mouseenter="showHandle(index)"
        @mouseleave="hideHandle(index)"
      >
        <!-- Drag Handle -->
        <div 
          class="block-handle"
          :class="{ 
            'block-handle--visible': hoveredBlockIndex === index || activeBlockIndex === index,
            'block-handle--menu-open': showBlockMenu && activeMenuBlockIndex === index
          }"
          @mousedown="startDrag(index, $event)"
          @click="toggleBlockMenu(index, $event)"
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

        <!-- Column Drag Zones -->
        <div 
          v-if="dragState.isDragging && dragState.dragIndex !== index"
          class="column-drag-zones"
        >
          <div 
            class="column-drag-zone column-drag-zone--left"
            :class="{ 'column-drag-zone--active': columnDragTarget.side === 'left' && columnDragTarget.index === index }"
            @dragover="handleColumnDragOver($event, index, 'left')"
            @drop="handleColumnDrop($event, index, 'left')"
          >
            <div class="column-drag-indicator">
              <div class="column-preview-line"></div>
              <div class="column-preview-text">Drop here to create columns</div>
            </div>
          </div>
          
          <div 
            class="column-drag-zone column-drag-zone--right"
            :class="{ 'column-drag-zone--active': columnDragTarget.side === 'right' && columnDragTarget.index === index }"
            @dragover="handleColumnDragOver($event, index, 'right')"
            @drop="handleColumnDrop($event, index, 'right')"
          >
            <div class="column-drag-indicator">
              <div class="column-preview-line"></div>
              <div class="column-preview-text">Drop here to create columns</div>
            </div>
          </div>
        </div>

        <!-- Drop Indicator -->
        <div 
          v-if="dragState.isDragging && dragState.dropIndex === index"
          class="drop-indicator"
        ></div>
        <!-- Heading 1 Block -->
        <h1 
          v-if="block.type === 'heading1'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @paste="handlePaste(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading1"
          :placeholder="block.placeholder || 'Heading 1'"
          :key="`h1-${block.id}`"
        ></h1>
        
        <!-- Heading 2 Block -->
        <h2 
          v-else-if="block.type === 'heading2'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @paste="handlePaste(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading2"
          :placeholder="block.placeholder || 'Heading 2'"
          :key="`h2-${block.id}`"
        ></h2>
        
        <!-- Heading 3 Block -->
        <h3 
          v-else-if="block.type === 'heading3'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @paste="handlePaste(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading3"
          :placeholder="block.placeholder || 'Heading 3'"
          :key="`h3-${block.id}`"
        ></h3>
        
        <!-- Paragraph Block -->
        <div 
          v-else-if="block.type === 'paragraph'"
          class="block-paragraph-container"
        >
          <p 
            :contenteditable="true"
            @input="updateBlock(index, $event)"
            @paste="handlePaste(index, $event)"
            @keydown="handleBlockKeydown(index, $event)"
            @focus="setActiveBlock(index)"
            class="block-paragraph"
            :placeholder="block.placeholder || 'Type \'/\' for commands'"
            :key="`p-${block.id}`"
            :data-block-index="index"
            :data-initial-content="block.content"
            ref="paragraphBlock"
          ></p>
          
          <!-- Page Link Autocomplete Menu -->
          <div 
            v-if="showPageLinkAutocomplete && activeBlockIndex === index"
            class="pagelink-autocomplete"
            :style="{ 
              left: pageLinkAutocompletePosition.x + 'px', 
              top: pageLinkAutocompletePosition.y + 'px' 
            }"
          >
            <div class="autocomplete-header">Link to page</div>
            <div class="autocomplete-list">
              <div
                v-for="(page, pageIndex) in filteredPages"
                :key="page.id"
                @click="insertPageLink(index, page)"
                @mouseenter="selectedPageIndex = pageIndex"
                class="autocomplete-item"
                :class="{ 'autocomplete-item--selected': pageIndex === selectedPageIndex }"
              >
                <span class="page-icon">📝</span>
                <span class="page-title">{{ page.title }}</span>
              </div>
              
              <div v-if="filteredPages.length === 0" class="autocomplete-item autocomplete-item--empty">
                No pages found
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bullet List Block -->
        <ul 
          v-else-if="block.type === 'bullet-list'"
          class="block-list"
        >
          <li 
            v-for="(item, itemIndex) in block.items" 
            :key="`${block.id}-ul-${itemIndex}`"
            :contenteditable="true"
            @input="updateListItem(index, itemIndex, $event)"
            @keydown="handleListKeydown(index, itemIndex, $event)"
            @focus="setActiveBlock(index)"
            class="block-list-item"
            :placeholder="itemIndex === 0 ? 'List item' : ''"
          ></li>
        </ul>
        
        <!-- Numbered List Block -->
        <ol 
          v-else-if="block.type === 'number-list' || block.type === 'numbered-list'"
          class="block-list"
        >
          <li 
            v-for="(item, itemIndex) in block.items" 
            :key="`${block.id}-ol-${itemIndex}`"
            :contenteditable="true"
            @input="updateListItem(index, itemIndex, $event)"
            @keydown="handleListKeydown(index, itemIndex, $event)"
            @focus="setActiveBlock(index)"
            class="block-list-item"
            :placeholder="itemIndex === 0 ? 'List item' : ''"
          ></li>
        </ol>
        
        <!-- Bulleted List Block (new input rule support) -->
        <ul 
          v-else-if="block.type === 'bulleted-list'"
          class="block-list"
        >
          <li 
            v-for="(item, itemIndex) in block.items" 
            :key="`${block.id}-bl-${itemIndex}`"
            :contenteditable="true"
            @input="updateListItem(index, itemIndex, $event)"
            @keydown="handleListKeydown(index, itemIndex, $event)"
            @focus="setActiveBlock(index)"
            class="block-list-item"
            :placeholder="itemIndex === 0 ? 'List item' : ''"
          ></li>
        </ul>
        
        <!-- To-do List Block -->
        <div 
          v-else-if="block.type === 'todo'"
          class="block-todo"
        >
          <input 
            type="checkbox"
            :checked="block.done"
            @change="toggleTodo(index)"
            class="todo-checkbox"
          />
          <span 
            :contenteditable="true"
            @input="updateBlock(index, $event)"
            @keydown="handleBlockKeydown(index, $event)"
            @focus="setActiveBlock(index)"
            class="todo-text"
            :class="{ 'todo-done': block.done }"
            :placeholder="'To-do'"
            :key="`todo-${block.id}`"
          ></span>
        </div>
        
        <!-- Quote Block -->
        <blockquote 
          v-else-if="block.type === 'quote'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-quote"
          :placeholder="block.placeholder || 'Quote'"
          :key="`quote-${block.id}`"
        ></blockquote>
        
        <!-- Code Block -->
        <pre 
          v-else-if="block.type === 'code'"
          class="block-code"
        ><code 
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          :placeholder="block.placeholder || 'Code'"
          :key="`code-${block.id}`"
        ></code></pre>
        
        <!-- Divider Block -->
        <hr v-else-if="block.type === 'divider'" class="block-divider" />
        
        <!-- Image Block -->
        <div 
          v-else-if="block.type === 'image'"
          class="block-image"
        >
          <div v-if="!block.src" class="image-placeholder">
            <div class="image-upload-area">
              <div class="upload-icon">🖼️</div>
              <div class="upload-text">
                <div class="upload-title">Add an image</div>
                <div class="upload-subtitle">
                  <input 
                    type="text"
                    placeholder="Paste image URL here..."
                    @keydown.enter="setImageUrl(index, $event)"
                    @blur="setImageUrl(index, $event)"
                    class="image-url-input"
                  />
                  <div class="upload-or">or</div>
                  <input 
                    type="file"
                    accept="image/*"
                    @change="uploadImage(index, $event)"
                    class="image-file-input"
                    ref="imageInput"
                  />
                  <button 
                    @click="$refs.imageInput[index]?.click()"
                    class="upload-button"
                  >
                    Upload a file
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="image-container" :class="{ 'image-resizing': resizingImage === index }">
            <img 
              :src="block.src"
              :alt="block.alt || 'Image'"
              class="block-image-element"
              :style="{ width: block.width || 'auto', height: block.height || 'auto' }"
              @load="onImageLoad(index)"
              @error="onImageError(index)"
            />
            <!-- Resize handles -->
            <div 
              v-if="activeBlockIndex === index"
              class="image-resize-handles"
            >
              <div 
                class="resize-handle resize-handle--nw"
                @mousedown="startImageResize(index, 'nw', $event)"
              ></div>
              <div 
                class="resize-handle resize-handle--ne"
                @mousedown="startImageResize(index, 'ne', $event)"
              ></div>
              <div 
                class="resize-handle resize-handle--sw"
                @mousedown="startImageResize(index, 'sw', $event)"
              ></div>
              <div 
                class="resize-handle resize-handle--se"
                @mousedown="startImageResize(index, 'se', $event)"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Column Layout Block -->
        <ColumnLayout
          v-else-if="block.type === 'columns'"
          :columns="block.columns || []"
          :show-controls="activeBlockIndex === index || hoveredBlockIndex === index"
          :is-active="activeBlockIndex === index"
          @update-columns="updateColumnLayout(index, $event)"
          @delete-columns="convertColumnsToBlocks(index)"
          @add-block="addBlockToColumn(index, $event)"
          @move-block="(fromColumn, fromIndex, toColumn, toIndex) => moveBlockInColumns(index, fromColumn, fromIndex, toColumn, toIndex)"
          @delete-block="deleteBlockFromColumn(index, $event)"
        />
      </div>
      
      <!-- Block Options Menu -->
      <div 
        v-if="showBlockMenu"
        class="block-menu-overlay"
        @click="closeBlockMenu"
      >
        <div 
          class="block-menu"
          @click.stop
          :style="{ 
            left: blockMenuPosition.x + 'px', 
            top: blockMenuPosition.y + 'px' 
          }"
        >
          <button 
            class="block-menu-item block-menu-item--danger"
            @click="deleteBlock(activeMenuBlockIndex)"
          >
            <span class="menu-icon">🗑️</span>
            <span>Delete</span>
          </button>
          
          <button 
            class="block-menu-item"
            @click="duplicateBlock(activeMenuBlockIndex)"
          >
            <span class="menu-icon">📋</span>
            <span>Duplicate</span>
          </button>
          
          <button 
            class="block-menu-item"
            @click="toggleTransformMenu"
          >
            <span class="menu-icon">🔄</span>
            <span>Turn into...</span>
            <span class="menu-arrow">→</span>
          </button>
        </div>

        <!-- Transform Submenu -->
        <div 
          v-if="showTransformMenu"
          class="block-menu transform-menu"
          :style="{ 
            left: (blockMenuPosition.x + 160) + 'px', 
            top: blockMenuPosition.y + 'px' 
          }"
        >
          <button 
            v-for="blockType in availableBlockTypes"
            :key="blockType.id"
            class="block-menu-item"
            :class="{ 'block-menu-item--current': blocks[activeMenuBlockIndex]?.type === blockType.id }"
            @click="transformBlock(activeMenuBlockIndex, blockType.id)"
          >
            <span class="menu-icon">{{ blockType.icon }}</span>
            <span>{{ blockType.title }}</span>
          </button>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="blocks.length === 0" class="empty-document">
        <p 
          :contenteditable="true"
          @input="updateBlock(0, $event, true)"
          @keydown="handleBlockKeydown(0, $event)"
          @focus="setActiveBlock(0)"
          class="block-paragraph"
          placeholder="Type '/' for commands"
        ></p>
      </div>
      
      <!-- Document Backlinks -->
      <DocumentBacklinks
        v-if="props.document.id"
        :document-id="props.document.id"
        :documents="allDocuments"
        @navigate-to-page="handleNavigateToPage"
      />
    </div>
  </div>
</template>

<script setup>
import { watch, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { usePageLinks } from '~/composables/usePageLinks'
import DocumentBacklinks from './DocumentBacklinks.vue'
import ColumnLayout from './ColumnLayout.vue'

const props = defineProps({
  document: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'slash-command', 'navigate-to-page'])

// State
const blocks = ref([])
const activeBlockIndex = ref(0)

// Page link autocomplete state
const showPageLinkAutocomplete = ref(false)
const pageLinkAutocompletePosition = ref({ x: 0, y: 0 })
const pageLinkQuery = ref('')
const selectedPageIndex = ref(0)
const availablePages = ref([])
const filteredPages = ref([])
const allDocuments = ref([])

// Drag and drop state
const dragState = ref({
  isDragging: false,
  dragIndex: -1,
  dropIndex: -1,
  dragElement: null,
  mouseStartY: 0
})

// Column drag state
const columnDragTarget = ref({
  index: -1,
  side: null // 'left' or 'right'
})

// Block handle state  
const hoveredBlockIndex = ref(-1)
const showBlockMenu = ref(false)
const blockMenuPosition = ref({ x: 0, y: 0 })
const activeMenuBlockIndex = ref(-1)
const showTransformMenu = ref(false)

// Initialize blocks from document content
function initializeBlocks() {
  if (props.document.blocks && Array.isArray(props.document.blocks)) {
    blocks.value = [...props.document.blocks]
  } else if (props.document.content) {
    // Convert markdown content to blocks (legacy support)
    parseMarkdownToBlocks(props.document.content)
  } else {
    // Start with empty paragraph
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: '',
      placeholder: "Type '/' for commands"
    }]
  }
}

// No automatic watchers - only manual updates to prevent loops

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function normalizeText(text) {
  if (!text) return ''
  
  // Normalize Unicode characters to NFC form
  let normalized = text.normalize('NFC')
  
  // Replace problematic characters that can cause text direction issues
  normalized = normalized
    // Replace zero-width characters that can cause cursor issues
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace non-breaking spaces with regular spaces
    .replace(/\u00A0/g, ' ')
    // Replace various whitespace characters with regular spaces
    .replace(/[\u2000-\u200A\u202F\u205F]/g, ' ')
    // Replace line separators with regular newlines
    .replace(/[\u2028\u2029]/g, '\n')
    // Remove RTL/LTR marks that can cause text direction issues
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    // Normalize quotation marks
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Normalize ellipsis
    .replace(/…/g, '...')
  
  return normalized
}

function ensureTextDirection(element) {
  if (!element) return
  
  // Force LTR text direction attributes
  element.dir = 'ltr'
  element.style.direction = 'ltr'
  element.style.unicodeBidi = 'normal'
  element.style.textAlign = 'left'
  element.style.writingMode = 'horizontal-tb'
  
  // Add HTML attributes for maximum compatibility
  element.setAttribute('dir', 'ltr')
  element.setAttribute('lang', 'en')
}

function setActiveBlock(index) {
  activeBlockIndex.value = index
  
  // Ensure the focused element has correct text direction
  nextTick(() => {
    const activeElement = document.activeElement
    if (activeElement && activeElement.contentEditable === 'true') {
      ensureTextDirection(activeElement)
    }
  })
}

function checkInputRules(index, content, event) {
  const trimmedContent = content.trim()
  
  // Heading rules: #, ##, ###
  if (trimmedContent.match(/^#{1,3}\s/)) {
    const level = trimmedContent.match(/^(#{1,3})/)[1].length
    const text = trimmedContent.replace(/^#{1,3}\s/, '')
    const blockType = `heading${level}`
    
    transformBlockWithContent(index, blockType, text, event)
    return true
  }
  
  // List rules: -, 1.
  if (trimmedContent.match(/^-\s/) || trimmedContent.match(/^\d+\.\s/)) {
    const isNumbered = trimmedContent.match(/^\d+\.\s/)
    const text = trimmedContent.replace(/^(-|\d+\.)\s/, '')
    const blockType = isNumbered ? 'numbered-list' : 'bulleted-list'
    
    transformBlockToList(index, blockType, text, event)
    return true
  }
  
  // To-do list rule: []
  if (trimmedContent.match(/^\[\s?\]\s/)) {
    const text = trimmedContent.replace(/^\[\s?\]\s/, '')
    const done = trimmedContent.match(/^\[x\]\s/i) ? true : false
    
    transformBlockToTodo(index, text, done, event)
    return true
  }
  
  // Quote rule: >
  if (trimmedContent.match(/^>\s/)) {
    const text = trimmedContent.replace(/^>\s/, '')
    
    transformBlockWithContent(index, 'quote', text, event)
    return true
  }
  
  // Divider rule: ---
  if (trimmedContent === '---') {
    transformBlockWithContent(index, 'divider', '', event)
    return true
  }
  
  return false
}

function transformBlockWithContent(index, newType, content, event) {
  if (blocks.value[index]) {
    blocks.value[index].type = newType
    blocks.value[index].content = content
    
    updateDocument()
    
    nextTick(() => {
      const blockElement = document.querySelector(`[data-block-index="${index}"] [contenteditable]`)
      if (blockElement && newType !== 'divider') {
        blockElement.textContent = content
        // Place cursor at end
        const range = document.createRange()
        const sel = window.getSelection()
        if (blockElement.childNodes.length > 0) {
          range.setStart(blockElement.childNodes[0], content.length)
        } else {
          range.setStart(blockElement, 0)
        }
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        blockElement.focus()
      }
    })
  }
}

function transformBlockToList(index, blockType, content, event) {
  if (blocks.value[index]) {
    blocks.value[index].type = blockType
    blocks.value[index].items = [content]
    delete blocks.value[index].content
    
    updateDocument()
    
    nextTick(() => {
      const listItem = document.querySelector(`[data-block-index="${index}"] li[contenteditable]`)
      if (listItem) {
        listItem.textContent = content
        // Place cursor at end
        const range = document.createRange()
        const sel = window.getSelection()
        if (listItem.childNodes.length > 0) {
          range.setStart(listItem.childNodes[0], content.length)
        } else {
          range.setStart(listItem, 0)
        }
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        listItem.focus()
      }
    })
  }
}

function transformBlockToTodo(index, content, done, event) {
  if (blocks.value[index]) {
    blocks.value[index].type = 'todo'
    blocks.value[index].content = content
    blocks.value[index].done = done
    
    updateDocument()
    
    nextTick(() => {
      const todoText = document.querySelector(`[data-block-index="${index}"] .todo-text[contenteditable]`)
      if (todoText) {
        todoText.textContent = content
        // Place cursor at end
        const range = document.createRange()
        const sel = window.getSelection()
        if (todoText.childNodes.length > 0) {
          range.setStart(todoText.childNodes[0], content.length)
        } else {
          range.setStart(todoText, 0)
        }
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        todoText.focus()
      }
    })
  }
}

// Page linking functions
function renderContentWithLinks(content) {
  if (!content) return ''
  
  // Replace [[Page Name]] patterns with clickable links
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, pageName) => {
    const pageId = findPageIdByName(pageName.trim())
    if (pageId) {
      return `<span class="page-link" data-page-id="${pageId}" data-page-name="${pageName.trim()}" onclick="openLinkedPage('${pageId}')">${pageName.trim()}</span>`
    } else {
      // Page doesn't exist, show as broken link
      return `<span class="page-link page-link--broken" data-page-name="${pageName.trim()}">${pageName.trim()}</span>`
    }
  })
}

function findPageIdByName(pageName) {
  const page = availablePages.value.find(p => p.title.toLowerCase() === pageName.toLowerCase())
  return page?.id || null
}

function openLinkedPage(pageId) {
  // This will be implemented to navigate to the linked page
  console.log('Opening linked page:', pageId)
  // TODO: Integrate with workspace navigation
  // For now, we'll emit an event to let the parent component handle it
  emit('navigate-to-page', pageId)
}

// Make openLinkedPage available globally for HTML onclick
window.openLinkedPage = openLinkedPage

function handleNavigateToPage(pageId) {
  emit('navigate-to-page', pageId)
}

function detectPageLinkPattern(content, cursorPosition) {
  // Look for [[ pattern before cursor
  const beforeCursor = content.substring(0, cursorPosition)
  const match = beforeCursor.match(/\[\[([^\]]*?)$/)
  
  if (match) {
    return {
      isPageLink: true,
      query: match[1],
      startPosition: match.index + 2 // After [[
    }
  }
  
  return { isPageLink: false }
}

function showPageLinkAutocompleteMenu(element, query, startPosition) {
  pageLinkQuery.value = query
  selectedPageIndex.value = 0
  
  // Filter pages based on query
  if (query) {
    filteredPages.value = availablePages.value.filter(page =>
      page.title.toLowerCase().includes(query.toLowerCase())
    )
  } else {
    filteredPages.value = availablePages.value
  }
  
  // Calculate position
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  pageLinkAutocompletePosition.value = {
    x: rect.left,
    y: rect.bottom + 5
  }
  
  showPageLinkAutocomplete.value = true
}

function hidePageLinkAutocomplete() {
  showPageLinkAutocomplete.value = false
  pageLinkQuery.value = ''
  selectedPageIndex.value = 0
  filteredPages.value = []
}

function insertPageLink(blockIndex, page) {
  const element = document.querySelector(`[data-block-index="${blockIndex}"] [contenteditable]`)
  if (!element) return
  
  const content = element.textContent || ''
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const cursorPosition = range.startOffset
  
  // Find the [[ pattern
  const pattern = detectPageLinkPattern(content, cursorPosition)
  if (pattern.isPageLink) {
    const beforeLink = content.substring(0, cursorPosition - pattern.query.length - 2)
    const afterLink = content.substring(cursorPosition)
    const newContent = beforeLink + `[[${page.title}]]` + afterLink
    
    // Update the block content
    blocks.value[blockIndex].content = newContent
    element.textContent = newContent
    
    // Position cursor after the link
    const newCursorPosition = beforeLink.length + page.title.length + 4
    setTimeout(() => {
      const newRange = document.createRange()
      const textNode = element.childNodes[0] || element
      newRange.setStart(textNode, Math.min(newCursorPosition, textNode.textContent?.length || 0))
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }, 0)
    
    updateDocument()
  }
  
  hidePageLinkAutocomplete()
}

async function loadAvailablePages() {
  try {
    // Load pages from the workspace
    const { useWorkspaceStore } = await import('~/stores/workspace')
    const workspaceStore = useWorkspaceStore()
    
    if (workspaceStore.activeWorkspace) {
      // Load all documents for backlinks
      allDocuments.value = [...workspaceStore.activeWorkspace.documents]
      
      // Load only pages for autocomplete
      availablePages.value = workspaceStore.activeWorkspace.documents
        .filter(doc => doc.type === 'page' && doc.title)
        .map(doc => ({
          id: doc.id,
          title: doc.title
        }))
    }
  } catch (error) {
    console.error('Error loading available pages:', error)
    availablePages.value = []
    allDocuments.value = []
  }
}

function updateBlock(index, event, isNewBlock = false) {
  // Get current content without modifying it
  const currentContent = event.target.textContent || ''
  
  // Log for debugging
  console.log('Update block:', index, 'Content:', currentContent, 'Target:', event.target.tagName)
  
  if (isNewBlock && blocks.value.length === 0) {
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: currentContent,
      placeholder: "Type '/' for commands"
    }]
    updateDocument()
    return
  }

  if (blocks.value[index]) {
    // Check for slash commands
    if (currentContent.startsWith('/')) {
      handleSlashCommand(index, currentContent)
      return
    }
    
    // Check for page link pattern [[
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const cursorPosition = range.startOffset
      const pattern = detectPageLinkPattern(currentContent, cursorPosition)
      
      if (pattern.isPageLink) {
        showPageLinkAutocompleteMenu(event.target, pattern.query, pattern.startPosition)
      } else {
        hidePageLinkAutocomplete()
      }
    }
    
    // Check for markdown input rules
    if (checkInputRules(index, currentContent, event)) {
      return
    }
    
    // Simply update state without any text processing
    blocks.value[index].content = currentContent
    updateDocument()
  }
}

function updateListItem(blockIndex, itemIndex, event) {
  if (blocks.value[blockIndex] && blocks.value[blockIndex].items) {
    const currentContent = event.target.textContent || ''
    
    // Only update state - do NOT modify DOM textContent during input events
    blocks.value[blockIndex].items[itemIndex] = currentContent
    updateDocument()
  }
}

function handlePaste(index, event) {
  event.preventDefault()
  
  // Get clipboard data
  const clipboardData = event.clipboardData || window.clipboardData
  const pastedText = clipboardData.getData('text/plain')
  
  if (!pastedText) return
  
  // Normalize the pasted text
  const normalizedText = normalizeText(pastedText)
  
  // Insert the normalized text at cursor position
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    
    const textNode = document.createTextNode(normalizedText)
    range.insertNode(textNode)
    
    // Move cursor to end of inserted text
    range.setStartAfter(textNode)
    range.setEndAfter(textNode)
    selection.removeAllRanges()
    selection.addRange(range)
    
    // Trigger update
    const syntheticEvent = {
      target: event.target
    }
    updateBlock(index, syntheticEvent)
  }
}

function handleKeypress(index, event) {
  // For debugging - let's see what's happening
  console.log('Keypress:', event.key, 'Target text before:', event.target.textContent)
  
  // Test: Force text direction manually
  setTimeout(() => {
    console.log('Target text after:', event.target.textContent)
    ensureTextDirection(event.target)
    
    // Check for text reversal
    const text = event.target.textContent || ''
    if (text === text.split('').reverse().join('')) {
      console.warn('TEXT IS REVERSED!')
      // Try to fix by forcing correct content
      const correctText = text.split('').reverse().join('')
      event.target.textContent = correctText
    }
  }, 10)
}

function handleSlashCommand(index, content) {
  const command = content.toLowerCase().trim()
  
  // Get cursor position for slash command menu
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  emit('slash-command', {
    position: { x: rect.left, y: rect.bottom + window.scrollY },
    query: content.slice(1), // Remove the '/'
    blockIndex: index
  })
}

function executeSlashCommand(commandId, blockIndex) {
  let newBlock = {
    id: generateId(),
    content: '',
  }
  
  switch (commandId) {
    case 'heading1':
      newBlock = { ...newBlock, type: 'heading1', placeholder: 'Heading 1' }
      break
    case 'heading2':
      newBlock = { ...newBlock, type: 'heading2', placeholder: 'Heading 2' }
      break
    case 'heading3':
      newBlock = { ...newBlock, type: 'heading3', placeholder: 'Heading 3' }
      break
    case 'bullet-list':
      newBlock = { ...newBlock, type: 'bullet-list', items: [''] }
      break
    case 'number-list':
      newBlock = { ...newBlock, type: 'number-list', items: [''] }
      break
    case 'quote':
      newBlock = { ...newBlock, type: 'quote', placeholder: 'Quote' }
      break
    case 'code':
      newBlock = { ...newBlock, type: 'code', placeholder: 'Code' }
      break
    case 'divider':
      newBlock = { ...newBlock, type: 'divider' }
      break
    default:
      // Convert back to paragraph
      newBlock = { ...newBlock, type: 'paragraph', placeholder: "Type '/' for commands" }
  }
  
  // Replace the current block
  if (blockIndex < blocks.value.length) {
    blocks.value[blockIndex] = newBlock
    updateDocument()
  }
  
  nextTick(() => {
    focusBlock(blockIndex)
  })
}

function handleBlockKeydown(index, event) {
  // Handle autocomplete navigation
  if (showPageLinkAutocomplete.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedPageIndex.value = Math.min(selectedPageIndex.value + 1, filteredPages.value.length - 1)
      return
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedPageIndex.value = Math.max(selectedPageIndex.value - 1, 0)
      return
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredPages.value[selectedPageIndex.value]) {
        insertPageLink(index, filteredPages.value[selectedPageIndex.value])
      }
      return
    } else if (event.key === 'Escape') {
      event.preventDefault()
      hidePageLinkAutocomplete()
      return
    }
  }
  
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Soft break - allow default behavior
      return
    }
    
    event.preventDefault()
    createNewBlock(index)
  } else if (event.key === 'Backspace' && blocks.value[index].content === '') {
    if (blocks.value.length > 1) {
      event.preventDefault()
      deleteBlock(index)
    }
  } else if (event.key === 'ArrowUp' && index > 0) {
    if (isAtStartOfBlock(event.target)) {
      event.preventDefault()
      focusBlock(index - 1)
    }
  } else if (event.key === 'ArrowDown' && index < blocks.value.length - 1) {
    if (isAtEndOfBlock(event.target)) {
      event.preventDefault()
      focusBlock(index + 1)
    }
  }
}

function handleListKeydown(blockIndex, itemIndex, event) {
  if (event.key === 'Tab') {
    event.preventDefault()
    
    if (event.shiftKey) {
      // Decrease indentation (not implemented for simplicity)
      // Could add nested list support here
    } else {
      // Increase indentation (not implemented for simplicity)
      // Could add nested list support here
    }
    return
  }
  
  if (event.key === 'Enter') {
    event.preventDefault()
    const items = blocks.value[blockIndex].items
    
    if (event.target.textContent === '' && items.length > 1) {
      // Remove empty item and exit list
      items.splice(itemIndex, 1)
      createNewBlock(blockIndex)
    } else {
      // Add new list item
      items.splice(itemIndex + 1, 0, '')
      nextTick(() => {
        const listItems = event.target.parentElement.parentElement.querySelectorAll('li[contenteditable]')
        if (listItems[itemIndex + 1]) {
          listItems[itemIndex + 1].focus()
        }
      })
    }
  } else if (event.key === 'Backspace' && event.target.textContent === '' && itemIndex > 0) {
    event.preventDefault()
    blocks.value[blockIndex].items.splice(itemIndex, 1)
    nextTick(() => {
      const listItems = event.target.parentElement.parentElement.querySelectorAll('li[contenteditable]')
      if (listItems[itemIndex - 1]) {
        listItems[itemIndex - 1].focus()
        // Move cursor to end
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(listItems[itemIndex - 1])
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    })
  }
}

function createNewBlock(afterIndex) {
  const newBlock = {
    id: generateId(),
    type: 'paragraph',
    content: '',
    placeholder: "Type '/' for commands"
  }
  
  blocks.value.splice(afterIndex + 1, 0, newBlock)
  updateDocument()
  nextTick(() => {
    focusBlock(afterIndex + 1)
  })
}

function deleteBlock(index) {
  blocks.value.splice(index, 1)
  
  if (blocks.value.length === 0) {
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: '',
      placeholder: "Type '/' for commands"
    }]
    updateDocument()
    nextTick(() => focusBlock(0))
  } else {
    updateDocument()
    const newIndex = Math.max(0, index - 1)
    nextTick(() => focusBlock(newIndex))
  }
}

// Column Layout Methods
function updateColumnLayout(blockIndex, columns) {
  blocks.value[blockIndex] = {
    ...blocks.value[blockIndex],
    columns
  }
  updateDocument()
}

function convertColumnsToBlocks(blockIndex) {
  const columnBlock = blocks.value[blockIndex]
  if (columnBlock.type === 'columns' && columnBlock.columns) {
    // Extract all blocks from all columns
    const allBlocks = columnBlock.columns.flatMap(column => column.blocks || [])
    
    // Remove the column block and replace with extracted blocks
    blocks.value.splice(blockIndex, 1, ...allBlocks)
    updateDocument()
  }
}

function addBlockToColumn(blockIndex, { columnIndex, blockIndex: targetBlockIndex, block }) {
  const columnBlock = blocks.value[blockIndex]
  if (columnBlock.type === 'columns' && columnBlock.columns) {
    const columns = [...columnBlock.columns]
    if (columns[columnIndex]) {
      columns[columnIndex].blocks.splice(targetBlockIndex, 0, block)
      updateColumnLayout(blockIndex, columns)
    }
  }
}

function moveBlockInColumns(blockIndex, fromColumn, fromIndex, toColumn, toIndex) {
  const columnBlock = blocks.value[blockIndex]
  if (columnBlock.type === 'columns' && columnBlock.columns) {
    const columns = [...columnBlock.columns]
    
    // Remove block from source column
    const [movedBlock] = columns[fromColumn].blocks.splice(fromIndex, 1)
    
    // Add block to target column
    columns[toColumn].blocks.splice(toIndex, 0, movedBlock)
    
    updateColumnLayout(blockIndex, columns)
  }
}

function deleteBlockFromColumn(blockIndex, { columnIndex, blockIndex: targetBlockIndex }) {
  const columnBlock = blocks.value[blockIndex]
  if (columnBlock.type === 'columns' && columnBlock.columns) {
    const columns = [...columnBlock.columns]
    if (columns[columnIndex]) {
      columns[columnIndex].blocks.splice(targetBlockIndex, 1)
      updateColumnLayout(blockIndex, columns)
    }
  }
}

function createColumnLayout(afterIndex = -1) {
  const newColumnBlock = {
    id: generateId(),
    type: 'columns',
    columns: [
      {
        id: generateId(),
        blocks: [{
          id: generateId(),
          type: 'paragraph',
          content: '',
          placeholder: "Type something..."
        }]
      },
      {
        id: generateId(),
        blocks: [{
          id: generateId(),
          type: 'paragraph',
          content: '',
          placeholder: "Type something..."
        }]
      }
    ]
  }
  
  blocks.value.splice(afterIndex + 1, 0, newColumnBlock)
  updateDocument()
  nextTick(() => {
    setActiveBlock(afterIndex + 1)
  })
}

function focusBlock(index) {
  const blockElements = document.querySelectorAll('.document-block [contenteditable]')
  if (blockElements[index]) {
    blockElements[index].focus()
    setActiveBlock(index)
  }
}

function focusEditor() {
  if (blocks.value.length === 0) {
    initializeBlocks()
  }
  nextTick(() => {
    focusBlock(activeBlockIndex.value)
  })
}

function isAtStartOfBlock(element) {
  const selection = window.getSelection()
  if (selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  return range.startOffset === 0 && range.collapsed
}

function isAtEndOfBlock(element) {
  const selection = window.getSelection()
  if (selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  const textLength = element.textContent.length
  return range.endOffset === textLength && range.collapsed
}

function parseMarkdownToBlocks(markdown) {
  const lines = markdown.split('\n')
  const parsedBlocks = []
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      parsedBlocks.push({ id: generateId(), type: 'heading1', content: line.slice(2) })
    } else if (line.startsWith('## ')) {
      parsedBlocks.push({ id: generateId(), type: 'heading2', content: line.slice(3) })
    } else if (line.startsWith('### ')) {
      parsedBlocks.push({ id: generateId(), type: 'heading3', content: line.slice(4) })
    } else if (line.startsWith('- ')) {
      parsedBlocks.push({ id: generateId(), type: 'bullet-list', items: [line.slice(2)] })
    } else if (line.match(/^\d+\. /)) {
      parsedBlocks.push({ id: generateId(), type: 'number-list', items: [line.replace(/^\d+\. /, '')] })
    } else if (line.startsWith('> ')) {
      parsedBlocks.push({ id: generateId(), type: 'quote', content: line.slice(2) })
    } else if (line === '---') {
      parsedBlocks.push({ id: generateId(), type: 'divider' })
    } else if (line.trim()) {
      parsedBlocks.push({ id: generateId(), type: 'paragraph', content: line })
    }
  }
  
  blocks.value = parsedBlocks.length > 0 ? parsedBlocks : [{
    id: generateId(),
    type: 'paragraph',
    content: '',
    placeholder: "Type '/' for commands"
  }]
}

// Debounced update to prevent excessive re-renders during typing
const updateDocument = useDebounceFn(() => {
  const updatedDoc = {
    ...props.document,
    blocks: toRaw(blocks.value),
    lastModified: new Date()
  }
  emit('update', updatedDoc)
  
  // Render page links after a short delay
  setTimeout(() => {
    renderLinksInParagraphs()
  }, 150)
}, 100)

// Computed properties
const availableBlockTypes = computed(() => [
  { id: 'paragraph', title: 'Paragraph', icon: '¶' },
  { id: 'heading1', title: 'Heading 1', icon: 'H₁' },
  { id: 'heading2', title: 'Heading 2', icon: 'H₂' },
  { id: 'heading3', title: 'Heading 3', icon: 'H₃' },
  { id: 'bullet-list', title: 'Bulleted List', icon: '•' },
  { id: 'bulleted-list', title: 'Bulleted List (New)', icon: '•' },
  { id: 'number-list', title: 'Numbered List', icon: '1.' },
  { id: 'numbered-list', title: 'Numbered List (New)', icon: '1.' },
  { id: 'todo', title: 'To-do List', icon: '☑' },
  { id: 'quote', title: 'Quote', icon: '"' },
  { id: 'code', title: 'Code', icon: '</>' },
  { id: 'divider', title: 'Divider', icon: '―' },
  { id: 'image', title: 'Image', icon: '🖼️' }
])

// Block handle functions
function showHandle(index) {
  hoveredBlockIndex.value = index
}

function hideHandle(index) {
  if (hoveredBlockIndex.value === index) {
    hoveredBlockIndex.value = -1
  }
}

function toggleBlockMenu(index, event) {
  if (showBlockMenu.value && activeMenuBlockIndex.value === index) {
    closeBlockMenu()
    return
  }
  
  event.stopPropagation()
  const rect = event.target.getBoundingClientRect()
  
  blockMenuPosition.value = {
    x: rect.right + 10,
    y: rect.top
  }
  
  activeMenuBlockIndex.value = index
  showBlockMenu.value = true
  showTransformMenu.value = false
}

function closeBlockMenu() {
  showBlockMenu.value = false
  showTransformMenu.value = false
  activeMenuBlockIndex.value = -1
}

function toggleTransformMenu() {
  showTransformMenu.value = !showTransformMenu.value
}

// Block actions
function duplicateBlock(index) {
  if (blocks.value[index]) {
    const originalBlock = blocks.value[index]
    const duplicatedBlock = {
      ...originalBlock,
      id: generateId()
    }
    
    // Handle list items duplication
    if (originalBlock.items) {
      duplicatedBlock.items = [...originalBlock.items]
    }
    
    blocks.value.splice(index + 1, 0, duplicatedBlock)
    updateDocument()
    
    nextTick(() => {
      focusBlock(index + 1)
    })
  }
  
  closeBlockMenu()
}

function transformBlock(index, newType) {
  if (blocks.value[index]) {
    const block = blocks.value[index]
    const content = block.content || ''
    
    // Create transformed block
    const transformedBlock = {
      id: block.id,
      type: newType,
      content: newType === 'divider' ? '' : content
    }
    
    // Handle special cases
    if (newType === 'bullet-list' || newType === 'number-list') {
      transformedBlock.items = content ? [content] : ['']
      delete transformedBlock.content
    } else if (block.items && (newType === 'paragraph' || newType.startsWith('heading') || newType === 'quote' || newType === 'code')) {
      // Convert list to text block
      transformedBlock.content = block.items.join('\n')
    }
    
    // Set appropriate placeholder
    switch (newType) {
      case 'heading1':
        transformedBlock.placeholder = 'Heading 1'
        break
      case 'heading2':
        transformedBlock.placeholder = 'Heading 2'
        break
      case 'heading3':
        transformedBlock.placeholder = 'Heading 3'
        break
      case 'quote':
        transformedBlock.placeholder = 'Quote'
        break
      case 'code':
        transformedBlock.placeholder = 'Code'
        break
      default:
        transformedBlock.placeholder = "Type '/' for commands"
    }
    
    blocks.value[index] = transformedBlock
    updateDocument()
    
    nextTick(() => {
      focusBlock(index)
    })
  }
  
  closeBlockMenu()
}

// Drag and drop functions
function startDrag(index, event) {
  if (event.button !== 0) return // Only handle left mouse button
  
  // Prevent text selection during drag
  event.preventDefault()
  
  const blockElement = event.target.closest('.document-block')
  if (!blockElement) return
  
  dragState.value = {
    isDragging: true,
    dragIndex: index,
    dropIndex: -1,
    dragElement: blockElement,
    mouseStartY: event.clientY
  }
  
  // Add global mouse event listeners
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  
  // Add dragging class for visual feedback
  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'
}

function handleDragMove(event) {
  if (!dragState.value.isDragging) return
  
  const blockElements = Array.from(document.querySelectorAll('.document-block'))
  let dropIndex = -1
  
  for (let i = 0; i < blockElements.length; i++) {
    const rect = blockElements[i].getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    
    if (event.clientY < midY) {
      dropIndex = i
      break
    }
  }
  
  if (dropIndex === -1) {
    dropIndex = blockElements.length
  }
  
  // Don't allow dropping on the same position or immediately adjacent
  if (dropIndex === dragState.value.dragIndex || 
      dropIndex === dragState.value.dragIndex + 1) {
    dropIndex = -1
  }
  
  dragState.value.dropIndex = dropIndex
}

function handleDragEnd(event) {
  if (!dragState.value.isDragging) return
  
  // Remove global event listeners
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  
  // Restore cursor
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // Perform the drop operation
  if (dragState.value.dropIndex !== -1) {
    performBlockDrop()
  }
  
  // Reset drag state
  dragState.value = {
    isDragging: false,
    dragIndex: -1,
    dropIndex: -1,
    dragElement: null,
    mouseStartY: 0
  }
}

// Column Drag Handlers
function handleColumnDragOver(event, targetIndex, side) {
  event.preventDefault()
  event.stopPropagation()
  
  columnDragTarget.value = {
    index: targetIndex,
    side: side
  }
}

function handleColumnDrop(event, targetIndex, side) {
  event.preventDefault()
  event.stopPropagation()
  
  if (!dragState.value.isDragging) return
  
  const draggedBlockIndex = dragState.value.dragIndex
  const draggedBlock = blocks.value[draggedBlockIndex]
  
  if (draggedBlockIndex === -1 || !draggedBlock) return
  
  // Create columns with the target block and dragged block
  createColumnsFromBlocks(targetIndex, draggedBlockIndex, side)
  
  // Reset states
  columnDragTarget.value = { index: -1, side: null }
  resetDragState()
}

function createColumnsFromBlocks(targetIndex, draggedIndex, side) {
  const targetBlock = blocks.value[targetIndex]
  const draggedBlock = blocks.value[draggedIndex]
  
  if (!targetBlock || !draggedBlock) return
  
  // Create column layout
  const columnBlock = {
    id: generateId(),
    type: 'columns',
    columns: side === 'left' ? [
      {
        id: generateId(),
        blocks: [{ ...draggedBlock }]
      },
      {
        id: generateId(), 
        blocks: [{ ...targetBlock }]
      }
    ] : [
      {
        id: generateId(),
        blocks: [{ ...targetBlock }]
      },
      {
        id: generateId(),
        blocks: [{ ...draggedBlock }]
      }
    ]
  }
  
  // Remove both original blocks (remove higher index first to maintain indices)
  const indices = [targetIndex, draggedIndex].sort((a, b) => b - a)
  indices.forEach(index => {
    blocks.value.splice(index, 1)
  })
  
  // Insert column block at the lower index position
  const insertIndex = Math.min(targetIndex, draggedIndex)
  blocks.value.splice(insertIndex, 0, columnBlock)
  
  updateDocument()
  nextTick(() => {
    setActiveBlock(insertIndex)
  })
}

function resetDragState() {
  dragState.value = {
    isDragging: false,
    dragIndex: -1,
    dropIndex: -1,
    dragElement: null,
    mouseStartY: 0
  }
  columnDragTarget.value = { index: -1, side: null }
}

function performBlockDrop() {
  const dragIndex = dragState.value.dragIndex
  const dropIndex = dragState.value.dropIndex
  
  if (dragIndex === -1 || dropIndex === -1) return
  
  // Remove the dragged block
  const [draggedBlock] = blocks.value.splice(dragIndex, 1)
  
  // Calculate new insertion index
  let newIndex = dropIndex
  if (dragIndex < dropIndex) {
    newIndex = dropIndex - 1
  }
  
  // Insert at new position
  blocks.value.splice(newIndex, 0, draggedBlock)
  
  // Update active block index
  activeBlockIndex.value = newIndex
  
  updateDocument()
  
  nextTick(() => {
    focusBlock(newIndex)
  })
}

// Expose method for slash command execution
defineExpose({
  executeSlashCommand
})

// Initialize on mount
onMounted(async () => {
  initializeBlocks()
  await loadAvailablePages()
  nextTick(() => {
    // Set initial content only once on mount
    const paragraphs = document.querySelectorAll('.block-paragraph')
    paragraphs.forEach((p, index) => {
      const initialContent = p.dataset.initialContent
      if (initialContent && !p.textContent) {
        p.textContent = initialContent
      }
    })
    focusEditor()
  })
})

// Removed watch to prevent DOM interference

// Manual DOM content update to avoid Vue text direction issues
function initBlockContent(index, element) {
  // Disabled to prevent interference with contenteditable
  // if (element && blocks.value[index]) {
  //   element.textContent = blocks.value[index].content || ''
  //   ensureTextDirection(element)
  // }
}

function updateDOMContent() {
  nextTick(() => {
    const blockElements = document.querySelectorAll('.document-block [contenteditable]')
    blockElements.forEach((element) => {
      const blockIndex = parseInt(element.dataset.blockIndex || element.closest('.document-block')?.dataset.blockIndex || '0')
      if (blocks.value[blockIndex] && element.textContent !== blocks.value[blockIndex].content) {
        const selection = window.getSelection()
        const isActive = selection.rangeCount > 0 && selection.anchorNode && element.contains(selection.anchorNode)
        
        if (!isActive) { // Only update if element is not currently being edited
          // Render content with page links
          if (blocks.value[blockIndex].type === 'paragraph') {
            element.innerHTML = renderContentWithLinks(blocks.value[blockIndex].content || '')
          } else {
            element.textContent = blocks.value[blockIndex].content || ''
          }
          ensureTextDirection(element)
        }
      }
    })
  })
}

function renderLinksInParagraphs() {
  nextTick(() => {
    const paragraphs = document.querySelectorAll('.block-paragraph')
    paragraphs.forEach((element, index) => {
      const blockIndex = parseInt(element.dataset.blockIndex || '0')
      const block = blocks.value[blockIndex]
      
      if (block && block.type === 'paragraph' && block.content) {
        const selection = window.getSelection()
        const isActive = selection.rangeCount > 0 && selection.anchorNode && element.contains(selection.anchorNode)
        
        if (!isActive) { // Only update if element is not currently being edited
          element.innerHTML = renderContentWithLinks(block.content)
        }
      }
    })
  })
}

// To-do list functions
function toggleTodo(index) {
  if (blocks.value[index] && blocks.value[index].type === 'todo') {
    blocks.value[index].done = !blocks.value[index].done
    updateDocument()
  }
}

// Image block functions
const resizingImage = ref(-1)
const imageResizeState = ref({
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  direction: ''
})

function setImageUrl(index, event) {
  const url = event.target.value.trim()
  if (url && blocks.value[index]) {
    blocks.value[index].src = url
    updateDocument()
  }
}

function uploadImage(index, event) {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (blocks.value[index]) {
        blocks.value[index].src = e.target.result
        blocks.value[index].alt = file.name
        updateDocument()
      }
    }
    reader.readAsDataURL(file)
  }
}

function onImageLoad(index) {
  console.log('Image loaded for block', index)
}

function onImageError(index) {
  console.error('Failed to load image for block', index)
  if (blocks.value[index]) {
    blocks.value[index].src = ''
    updateDocument()
  }
}

function startImageResize(index, direction, event) {
  event.preventDefault()
  event.stopPropagation()
  
  resizingImage.value = index
  const img = event.target.closest('.image-container').querySelector('img')
  
  imageResizeState.value = {
    startX: event.clientX,
    startY: event.clientY,
    startWidth: img.offsetWidth,
    startHeight: img.offsetHeight,
    direction: direction
  }
  
  document.addEventListener('mousemove', handleImageResize)
  document.addEventListener('mouseup', stopImageResize)
}

function handleImageResize(event) {
  if (resizingImage.value === -1) return
  
  const deltaX = event.clientX - imageResizeState.value.startX
  const deltaY = event.clientY - imageResizeState.value.startY
  
  let newWidth = imageResizeState.value.startWidth
  let newHeight = imageResizeState.value.startHeight
  
  switch (imageResizeState.value.direction) {
    case 'se': // Bottom-right
      newWidth = Math.max(100, imageResizeState.value.startWidth + deltaX)
      newHeight = Math.max(100, imageResizeState.value.startHeight + deltaY)
      break
    case 'sw': // Bottom-left
      newWidth = Math.max(100, imageResizeState.value.startWidth - deltaX)
      newHeight = Math.max(100, imageResizeState.value.startHeight + deltaY)
      break
    case 'ne': // Top-right
      newWidth = Math.max(100, imageResizeState.value.startWidth + deltaX)
      newHeight = Math.max(100, imageResizeState.value.startHeight - deltaY)
      break
    case 'nw': // Top-left
      newWidth = Math.max(100, imageResizeState.value.startWidth - deltaX)
      newHeight = Math.max(100, imageResizeState.value.startHeight - deltaY)
      break
  }
  
  if (blocks.value[resizingImage.value]) {
    blocks.value[resizingImage.value].width = newWidth + 'px'
    blocks.value[resizingImage.value].height = newHeight + 'px'
  }
}

function stopImageResize() {
  if (resizingImage.value !== -1) {
    updateDocument()
    resizingImage.value = -1
  }
  
  document.removeEventListener('mousemove', handleImageResize)
  document.removeEventListener('mouseup', stopImageResize)
}

</script>

<style scoped>
/* Page Editor Container */
.page-editor {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
  background: #ffffff;
  color: #1a202c;
  width: 100%;
  margin: 0;
  padding: 0;
  
  /* Text normalization and direction settings */
  direction: ltr;
  text-align: left;
  unicode-bidi: normal;
  font-feature-settings: "liga" 1, "kern" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout--dark .page-editor {
  background: #2d3748;
  color: #e2e8f0;
}

/* Document Content */
.document-content {
  width: 100%;
  margin: 0;
  padding: 48px 0 48px 0;
  min-height: 100%;
}

@media (max-width: 768px) {
  .document-content {
    padding: 24px 0 24px 0;
  }
}

/* Document Blocks */
.document-block {
  margin-bottom: 8px;
  position: relative;
}

.document-block--active {
  /* Optional active state styling */
}

/* Shared contenteditable normalization */
[contenteditable] {
  direction: ltr !important;
  unicode-bidi: normal !important;
  text-align: left !important;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
  
  /* Force LTR input behavior */
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  -webkit-writing-mode: horizontal-tb !important;
  -ms-writing-mode: lr-tb !important;
}

/* Block Elements */
.block-heading1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a202c;
  margin: 1.5em 0 0.5em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-heading1:empty:before {
  content: attr(placeholder);
  color: rgba(26, 32, 44, 0.4);
  font-style: italic;
}

.app-layout--dark .block-heading1 {
  color: #e2e8f0;
}

.app-layout--dark .block-heading1:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-heading2 {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
  color: #1a202c;
  margin: 1.25em 0 0.4em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-heading2:empty:before {
  content: attr(placeholder);
  color: rgba(26, 32, 44, 0.4);
  font-style: italic;
}

.app-layout--dark .block-heading2 {
  color: #e2e8f0;
}

.app-layout--dark .block-heading2:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-heading3 {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.3;
  color: #1a202c;
  margin: 1em 0 0.3em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-heading3:empty:before {
  content: attr(placeholder);
  color: rgba(26, 32, 44, 0.4);
  font-style: italic;
}

.app-layout--dark .block-heading3 {
  color: #e2e8f0;
}

.app-layout--dark .block-heading3:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-paragraph {
  font-size: 16px;
  line-height: 1.6;
  color: #2d3748;
  margin: 0.5em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  min-height: 1.6em;
}

.block-paragraph:empty:before {
  content: attr(placeholder);
  color: rgba(45, 55, 72, 0.4);
  font-style: italic;
}

.app-layout--dark .block-paragraph {
  color: #e2e8f0;
}

.app-layout--dark .block-paragraph:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-list {
  margin: 0.5em 0;
  padding-left: 1.7em;
}

.block-list-item {
  font-size: 16px;
  line-height: 1.6;
  color: #2d3748;
  margin: 0.25em 0;
  border: none;
  outline: none;
  background: transparent;
  min-height: 1.6em;
  list-style: inherit;
}

.block-list-item:empty:before {
  content: attr(placeholder);
  color: rgba(45, 55, 72, 0.4);
  font-style: italic;
}

.app-layout--dark .block-list-item {
  color: #e2e8f0;
}

.app-layout--dark .block-list-item:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-quote {
  font-size: 16px;
  line-height: 1.6;
  color: #4a5568;
  font-style: italic;
  border-left: 3px solid #cbd5e0;
  padding-left: 1rem;
  margin: 1em 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
  outline: none;
  background: transparent;
  width: calc(100% - 1rem);
  min-height: 1.6em;
}

.block-quote:empty:before {
  content: attr(placeholder);
  color: rgba(74, 85, 104, 0.4);
}

.app-layout--dark .block-quote {
  color: #a0aec0;
  border-left-color: #4a5568;
}

.app-layout--dark .block-quote:empty:before {
  color: rgba(160, 174, 192, 0.4);
}

.block-code {
  background: #f7fafc;
  border-radius: 6px;
  padding: 1rem;
  margin: 1em 0;
  overflow-x: auto;
}

.app-layout--dark .block-code {
  background: #1a202c;
}

.block-code code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #1a202c;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.block-code code:empty:before {
  content: attr(placeholder);
  color: rgba(26, 32, 44, 0.4);
  font-style: italic;
}

.app-layout--dark .block-code code {
  color: #e2e8f0;
}

.app-layout--dark .block-code code:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

.block-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 2em 0;
}

.app-layout--dark .block-divider {
  border-top-color: #4a5568;
}

/* Empty Document */
.empty-document {
  min-height: 200px;
}

.empty-document p {
  font-size: 16px;
  line-height: 1.6;
  color: #2d3748;
  margin: 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  min-height: 1.6em;
}

.empty-document p:empty:before {
  content: attr(placeholder);
  color: rgba(45, 55, 72, 0.4);
  font-style: italic;
}

.app-layout--dark .empty-document p {
  color: #e2e8f0;
}

.app-layout--dark .empty-document p:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

/* Focus States */
[contenteditable]:focus {
  outline: none;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 3px;
}

.app-layout--dark [contenteditable]:focus {
  background: rgba(59, 130, 246, 0.1);
}

/* Selection */
::selection {
  background: rgba(59, 130, 246, 0.2);
}

.app-layout--dark ::selection {
  background: rgba(59, 130, 246, 0.3);
}

/* Clean scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.app-layout--dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.app-layout--dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Document Block with Handle */
.document-block {
  position: relative;
  margin: 4px 0;
  padding-left: 32px; /* Make room for the handle */
}

.document-block--dragging {
  opacity: 0.5;
}

/* Block Handle */
.block-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 24px;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.block-handle:active {
  cursor: grabbing;
}

.block-handle--visible {
  opacity: 1;
}

.block-handle--menu-open {
  opacity: 1;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
}

/* Handle Grip */
.handle-grip {
  display: grid;
  grid-template-columns: repeat(2, 3px);
  grid-template-rows: repeat(3, 3px);
  gap: 2px;
  padding: 4px;
  border-radius: 3px;
  transition: background-color 0.15s ease;
}

.handle-grip:hover {
  background: rgba(0, 0, 0, 0.05);
}

.grip-dot {
  width: 3px;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.handle-grip:hover .grip-dot {
  background: rgba(0, 0, 0, 0.5);
}

/* Drop Indicator */
.drop-indicator {
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: #3b82f6;
  border-radius: 2px;
  z-index: 100;
  margin-left: 32px;
}

.drop-indicator::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
}

/* Block Menu Overlay */
.block-menu-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 200;
}

/* Block Menu */
.block-menu {
  position: absolute;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 4px;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 201;
}

.app-layout--dark .block-menu {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Transform Menu Positioning */
.transform-menu {
  margin-left: 4px;
}

/* Block Menu Items */
.block-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
  font-size: 14px;
  text-align: left;
  color: inherit;
}

.block-menu-item:hover {
  background: rgba(59, 130, 246, 0.08);
}

.app-layout--dark .block-menu-item:hover {
  background: rgba(59, 130, 246, 0.15);
}

.block-menu-item--danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.app-layout--dark .block-menu-item--danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.block-menu-item--current {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.app-layout--dark .block-menu-item--current {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.menu-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.menu-arrow {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.6;
}

/* Dark mode overrides for handles */
.app-layout--dark .handle-grip:hover {
  background: rgba(255, 255, 255, 0.05);
}

.app-layout--dark .grip-dot {
  background: rgba(255, 255, 255, 0.3);
}

.app-layout--dark .handle-grip:hover .grip-dot {
  background: rgba(255, 255, 255, 0.5);
}

.app-layout--dark .block-handle--menu-open {
  background: rgba(59, 130, 246, 0.2);
}

/* Ensure proper block positioning */
.document-block [contenteditable] {
  outline: none;
  min-height: 1.5em;
}

/* Hide handles when dragging globally */
.document-block--dragging .block-handle {
  display: none;
}

/* To-do List Block */
.block-todo {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.5em 0;
  line-height: 1.6;
}

.todo-checkbox {
  margin: 0;
  margin-top: 0.1em;
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}

.todo-text {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  line-height: 1.6;
  color: #2d3748;
  min-height: 1.6em;
}

.todo-text.todo-done {
  text-decoration: line-through;
  color: #718096;
}

.todo-text:empty:before {
  content: attr(placeholder);
  color: rgba(45, 55, 72, 0.4);
  font-style: italic;
}

.app-layout--dark .todo-text {
  color: #e2e8f0;
}

.app-layout--dark .todo-text.todo-done {
  color: #a0aec0;
}

.app-layout--dark .todo-text:empty:before {
  color: rgba(226, 232, 240, 0.4);
}

/* Image Block */
.block-image {
  margin: 1em 0;
  display: flex;
  justify-content: center;
  position: relative;
}

.image-placeholder {
  width: 100%;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f7fafc;
  transition: all 0.2s ease;
}

.image-placeholder:hover {
  border-color: #cbd5e0;
  background: #edf2f7;
}

.image-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  color: #a0aec0;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.upload-subtitle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  color: #718096;
  font-size: 0.875rem;
}

.image-url-input {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  outline: none;
  font-size: 0.875rem;
  width: 300px;
  max-width: 100%;
}

.image-url-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-or {
  color: #a0aec0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.image-file-input {
  display: none;
}

.upload-button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.upload-button:hover {
  background: #2563eb;
}

.image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.block-image-element {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border: 1px solid white;
  border-radius: 2px;
  pointer-events: all;
  z-index: 10;
}

.resize-handle--nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle--ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle--sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle--se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.image-resizing {
  user-select: none;
  pointer-events: all;
}

/* Dark mode styles for image blocks */
.app-layout--dark .image-placeholder {
  border-color: #4a5568;
  background: #2d3748;
}

.app-layout--dark .image-placeholder:hover {
  border-color: #718096;
  background: #4a5568;
}

.app-layout--dark .upload-title {
  color: #e2e8f0;
}

.app-layout--dark .upload-subtitle {
  color: #a0aec0;
}

.app-layout--dark .image-url-input {
  background: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.app-layout--dark .image-url-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Page Link Styles */
.page-link {
  color: #3b82f6;
  text-decoration: none;
  cursor: pointer;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.15s ease;
  font-weight: 500;
}

.page-link:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #1d4ed8;
}

.page-link--broken {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

.page-link--broken:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #b91c1c;
}

.app-layout--dark .page-link {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.2);
}

.app-layout--dark .page-link:hover {
  background: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.app-layout--dark .page-link--broken {
  color: #f87171;
  background: rgba(239, 68, 68, 0.2);
}

.app-layout--dark .page-link--broken:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

/* Page Link Autocomplete */
.pagelink-autocomplete {
  position: fixed;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
  min-width: 240px;
  max-width: 320px;
  max-height: 300px;
  overflow: hidden;
}

.app-layout--dark .pagelink-autocomplete {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.autocomplete-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.app-layout--dark .autocomplete-header {
  color: #9ca3af;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.autocomplete-list {
  max-height: 240px;
  overflow-y: auto;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
}

.autocomplete-item:hover,
.autocomplete-item--selected {
  background: rgba(59, 130, 246, 0.08);
}

.autocomplete-item--empty {
  color: #6b7280;
  font-style: italic;
  cursor: default;
}

.autocomplete-item--empty:hover {
  background: transparent;
}

.app-layout--dark .autocomplete-item:hover,
.app-layout--dark .autocomplete-item--selected {
  background: rgba(59, 130, 246, 0.15);
}

.app-layout--dark .autocomplete-item--empty {
  color: #9ca3af;
}

.page-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.page-title {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: #374151;
}

.app-layout--dark .page-title {
  color: #e5e7eb;
}

/* Paragraph Container */
.block-paragraph-container {
  position: relative;
}

/* Column Drag Zones */
.column-drag-zones {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.column-drag-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50px;
  pointer-events: auto;
  opacity: 0;
  transition: all 0.2s ease;
}

.column-drag-zone--left {
  left: -25px;
}

.column-drag-zone--right {
  right: -25px;
}

.column-drag-zone:hover,
.column-drag-zone--active {
  opacity: 1;
}

.column-drag-indicator {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.column-drag-zone--active .column-drag-indicator {
  background: rgba(59, 130, 246, 0.2);
  border-color: #1d4ed8;
  transform: scale(1.02);
}

.column-preview-line {
  width: 20px;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  margin-bottom: 8px;
}

.column-preview-text {
  font-size: 11px;
  font-weight: 600;
  color: #3b82f6;
  text-align: center;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  max-width: 40px;
}

.column-drag-zone--active .column-preview-text {
  color: #1d4ed8;
}

/* Dark mode styles */
.app-layout--dark .column-drag-indicator {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
}

.app-layout--dark .column-drag-zone--active .column-drag-indicator {
  background: rgba(96, 165, 250, 0.2);
  border-color: #93c5fd;
}

.app-layout--dark .column-preview-line {
  background: #60a5fa;
}

.app-layout--dark .column-preview-text {
  color: #60a5fa;
}

.app-layout--dark .column-drag-zone--active .column-preview-text {
  color: #93c5fd;
}
</style>