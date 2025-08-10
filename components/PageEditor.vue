<template>
  <div class="page-editor h-full">
    <!-- Clean Paper-style Document -->
    <div class="document-content" @click="focusEditor">
      <!-- Document Blocks -->
      <div 
        v-for="(block, index) in blocks" 
        :key="block.id"
        class="document-block"
        :class="{ 'document-block--active': activeBlockIndex === index }"
        :data-block-index="index"
      >
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
          dir="ltr"
          lang="en"
        >{{ block.content }}</h1>
        
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
          dir="ltr"
          lang="en"
        >{{ block.content }}</h2>
        
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
          dir="ltr"
          lang="en"
        >{{ block.content }}</h3>
        
        <!-- Paragraph Block -->
        <p 
          v-else-if="block.type === 'paragraph'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @paste="handlePaste(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @keypress="handleKeypress(index, $event)"
          @focus="setActiveBlock(index)"
          @mounted="initBlockContent(index, $el)"
          class="block-paragraph"
          :placeholder="block.placeholder || 'Type \'/\' for commands'"
          :key="`p-${block.id}`"
          dir="ltr"
          lang="en"
          spellcheck="false"
          :data-block-index="index"
        ></p>
        
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
            dir="ltr"
            lang="en"
          >{{ item }}</li>
        </ul>
        
        <!-- Numbered List Block -->
        <ol 
          v-else-if="block.type === 'number-list'"
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
            dir="ltr"
            lang="en"
          >{{ item }}</li>
        </ol>
        
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
          dir="ltr"
          lang="en"
        >{{ block.content }}</blockquote>
        
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
          dir="ltr"
          lang="en"
        >{{ block.content }}</code></pre>
        
        <!-- Divider Block -->
        <hr v-else-if="block.type === 'divider'" class="block-divider" />
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
    </div>
  </div>
</template>

<script setup>
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  document: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'slash-command'])

// State
const blocks = ref([])
const activeBlockIndex = ref(0)

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

function updateBlock(index, event, isNewBlock = false) {
  // Get current content without modifying it
  const currentContent = event.target.textContent || ''
  
  // Log for debugging
  console.log('Update block:', index, 'Content:', currentContent, 'Target:', event.target.tagName)
  
  if (isNewBlock && blocks.value.length === 0) {
    const normalizedContent = normalizeText(currentContent)
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: normalizedContent,
      placeholder: "Type '/' for commands"
    }]
    updateDocument()
    return
  }

  if (blocks.value[index]) {
    const normalizedContent = normalizeText(currentContent)
    
    // Ensure text direction is LTR but don't modify DOM during input
    ensureTextDirection(event.target)
    
    // Check for slash commands
    if (normalizedContent.startsWith('/')) {
      handleSlashCommand(index, normalizedContent)
      return
    }
    
    // Only update state - let Vue handle DOM updates
    if (blocks.value[index].content !== normalizedContent) {
      // Stop Vue from updating DOM by preventing the default event
      event.preventDefault?.()
      
      blocks.value[index].content = normalizedContent
      updateDocument()
      
      // Manually update DOM to ensure correct text direction
      if (event.target.textContent !== normalizedContent) {
        const selection = window.getSelection()
        const cursorPos = selection.rangeCount > 0 ? selection.getRangeAt(0).startOffset : currentContent.length
        
        event.target.textContent = normalizedContent
        
        // Restore cursor
        nextTick(() => {
          const range = document.createRange()
          const textNode = event.target.firstChild
          if (textNode) {
            range.setStart(textNode, Math.min(cursorPos, normalizedContent.length))
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        })
      }
    }
  }
}

function updateListItem(blockIndex, itemIndex, event) {
  if (blocks.value[blockIndex] && blocks.value[blockIndex].items) {
    const currentContent = event.target.textContent || ''
    const normalizedContent = normalizeText(currentContent)
    
    // Ensure text direction is LTR but don't modify DOM during input
    ensureTextDirection(event.target)
    
    // Only update state - do NOT modify DOM textContent during input events
    if (blocks.value[blockIndex].items[itemIndex] !== normalizedContent) {
      blocks.value[blockIndex].items[itemIndex] = normalizedContent
      updateDocument()
    }
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
}, 100)

// Expose method for slash command execution
defineExpose({
  executeSlashCommand
})

// Initialize on mount
onMounted(() => {
  initializeBlocks()
  nextTick(() => {
    focusEditor()
    
    // Manually sync content to avoid Vue reactivity issues
    updateDOMContent()
  })
})

// Manual DOM content update to avoid Vue text direction issues
function initBlockContent(index, element) {
  if (element && blocks.value[index]) {
    element.textContent = blocks.value[index].content || ''
    ensureTextDirection(element)
  }
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
          element.textContent = blocks.value[blockIndex].content || ''
          ensureTextDirection(element)
        }
      }
    })
  })
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
</style>