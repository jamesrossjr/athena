<template>
  <div 
    class="document-editor"
    :class="{ 
      'high-contrast': isHighContrast,
      'focus-mode': focusMode 
    }"
    role="application"
    :aria-label="'Document editor with ' + document.blocks.length + ' blocks'"
  >
    <!-- Document Header -->
    <div class="document-header">
      <KeyboardTooltip shortcut="Click" description="Click to edit title">
        <h1 
          class="document-title"
          :contenteditable="titleEditable"
          @click="startEditingTitle"
          @blur="stopEditingTitle"
          @keydown="handleTitleKeydown"
          ref="titleElement"
          :aria-label="'Document title: ' + document.title"
        >
          {{ document.title }}
        </h1>
      </KeyboardTooltip>
    </div>

    <!-- Block Editor -->
    <div 
      class="blocks-container"
      role="main"
      :aria-label="'Document content with ' + document.blocks.length + ' blocks'"
    >
      <BlockRenderer
        v-for="(block, index) in document.blocks"
        :key="block.id"
        :block="block"
        :block-index="index"
        :column-index="0"
        @update="handleBlockUpdate"
        @delete="handleBlockDelete"
        @split="handleBlockSplit"
        @merge="handleBlockMerge"
        @reorder="handleBlockReorder"
        @show-onboarding="showOnboarding"
        @show-block-menu="showBlockMenu"
      />
      
      <!-- Add Block Button -->
      <KeyboardTooltip shortcut="Enter" description="Press Enter to add new block">
        <div 
          class="add-block-area"
          @click="addNewBlock"
          @keydown="handleAddBlockKeydown"
          tabindex="0"
          role="button"
          :aria-label="'Add new block'"
        >
          <div class="add-block-icon">+</div>
          <div class="add-block-text">Add a block</div>
        </div>
      </KeyboardTooltip>
    </div>
    
    <!-- Onboarding Tooltip -->
    <BlockOnboardingTooltip
      v-if="showingOnboarding"
      :block-index="onboardingBlockIndex"
      :target-element="onboardingTarget"
      @dismiss="hideOnboarding"
    />
    
    <!-- Block Menu -->
    <BlockTypeMenu
      v-if="showingBlockMenu"
      :block-index="blockMenuIndex"
      :current-type="blockMenuType"
      :target-element="blockMenuTarget"
      @select-type="changeBlockType"
      @close="hideBlockMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import BlockRenderer from './BlockRenderer.vue'
import BlockOnboardingTooltip from './BlockOnboardingTooltip.vue'
import KeyboardTooltip from './KeyboardTooltip.vue'
import BlockTypeMenu from './BlockTypeMenu.vue'

interface Block {
  id: string
  type: string
  content?: string
  items?: string[]
  done?: boolean
  [key: string]: any
}

interface Document {
  id: string
  title: string
  blocks: Block[]
}

const props = defineProps<{
  document: Document
  focusMode?: boolean
  isHighContrast?: boolean
}>()

const emit = defineEmits<{
  'update:document': [document: Document]
  'document-change': [document: Document]
}>()

// State
const titleEditable = ref(false)
const titleElement = ref<HTMLElement>()
const showingOnboarding = ref(false)
const onboardingBlockIndex = ref(-1)
const onboardingTarget = ref<HTMLElement>()
const showingBlockMenu = ref(false)
const blockMenuIndex = ref(-1)
const blockMenuType = ref('')
const blockMenuTarget = ref<HTMLElement>()

// Document management
function updateDocument(updatedDocument: Document) {
  emit('update:document', updatedDocument)
  emit('document-change', updatedDocument)
}

// Title editing
function startEditingTitle() {
  titleEditable.value = true
  nextTick(() => {
    if (titleElement.value) {
      titleElement.value.focus()
      selectAllText(titleElement.value)
    }
  })
}

function stopEditingTitle() {
  titleEditable.value = false
  const newTitle = titleElement.value?.textContent?.trim() || props.document.title
  
  if (newTitle !== props.document.title) {
    const updatedDocument = {
      ...props.document,
      title: newTitle
    }
    updateDocument(updatedDocument)
  }
}

function handleTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    stopEditingTitle()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    titleElement.value!.textContent = props.document.title
    titleEditable.value = false
  }
}

// Block management
function handleBlockUpdate(columnIndex: number, blockIndex: number, updatedBlock: Block) {
  const updatedBlocks = [...props.document.blocks]
  updatedBlocks[blockIndex] = updatedBlock
  
  const updatedDocument = {
    ...props.document,
    blocks: updatedBlocks
  }
  updateDocument(updatedDocument)
}

function handleBlockDelete(columnIndex: number, blockIndex: number) {
  if (props.document.blocks.length <= 1) return // Keep at least one block
  
  const updatedBlocks = [...props.document.blocks]
  updatedBlocks.splice(blockIndex, 1)
  
  const updatedDocument = {
    ...props.document,
    blocks: updatedBlocks
  }
  updateDocument(updatedDocument)
  
  // Focus previous block if available
  nextTick(() => {
    const prevIndex = Math.max(0, blockIndex - 1)
    focusBlock(prevIndex)
  })
}

function handleBlockSplit(columnIndex: number, blockIndex: number, newBlock: Block) {
  const updatedBlocks = [...props.document.blocks]
  updatedBlocks.splice(blockIndex + 1, 0, newBlock)
  
  const updatedDocument = {
    ...props.document,
    blocks: updatedBlocks
  }
  updateDocument(updatedDocument)
  
  // Focus the new block
  nextTick(() => {
    focusBlock(blockIndex + 1)
  })
}

function handleBlockMerge(columnIndex: number, blockIndex: number) {
  if (blockIndex <= 0) return // Can't merge first block
  
  const currentBlock = props.document.blocks[blockIndex]
  const previousBlock = props.document.blocks[blockIndex - 1]
  
  // Merge content
  const mergedContent = (previousBlock.content || '') + (currentBlock.content || '')
  const updatedPreviousBlock = {
    ...previousBlock,
    content: mergedContent
  }
  
  const updatedBlocks = [...props.document.blocks]
  updatedBlocks[blockIndex - 1] = updatedPreviousBlock
  updatedBlocks.splice(blockIndex, 1)
  
  const updatedDocument = {
    ...props.document,
    blocks: updatedBlocks
  }
  updateDocument(updatedDocument)
  
  // Focus the merged block
  nextTick(() => {
    focusBlock(blockIndex - 1)
  })
}

function handleBlockReorder(columnIndex: number, fromIndex: number, toIndex: number) {
  const updatedBlocks = [...props.document.blocks]
  const [movedBlock] = updatedBlocks.splice(fromIndex, 1)
  updatedBlocks.splice(toIndex, 0, movedBlock)
  
  const updatedDocument = {
    ...props.document,
    blocks: updatedBlocks
  }
  updateDocument(updatedDocument)
}

function addNewBlock() {
  const newBlock: Block = {
    id: generateId(),
    type: 'paragraph',
    content: ''
  }
  
  const updatedDocument = {
    ...props.document,
    blocks: [...props.document.blocks, newBlock]
  }
  updateDocument(updatedDocument)
  
  // Focus the new block
  nextTick(() => {
    focusBlock(props.document.blocks.length)
  })
}

function handleAddBlockKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    addNewBlock()
  }
}

// Onboarding
function showOnboarding(blockIndex: number) {
  onboardingBlockIndex.value = blockIndex
  onboardingTarget.value = getBlockElement(blockIndex)
  showingOnboarding.value = true
}

function hideOnboarding() {
  showingOnboarding.value = false
  onboardingBlockIndex.value = -1
  onboardingTarget.value = undefined
}

// Block menu
function showBlockMenu(columnIndex: number, blockIndex: number, targetElement: HTMLElement) {
  blockMenuIndex.value = blockIndex
  blockMenuType.value = props.document.blocks[blockIndex].type
  blockMenuTarget.value = targetElement
  showingBlockMenu.value = true
}

function hideBlockMenu() {
  showingBlockMenu.value = false
  blockMenuIndex.value = -1
  blockMenuType.value = ''
  blockMenuTarget.value = undefined
}

function changeBlockType(newType: string) {
  if (blockMenuIndex.value >= 0) {
    const updatedBlock = {
      ...props.document.blocks[blockMenuIndex.value],
      type: newType
    }
    handleBlockUpdate(0, blockMenuIndex.value, updatedBlock)
  }
  hideBlockMenu()
}

// Utilities
function focusBlock(index: number) {
  // Implementation to focus a specific block
  const blockElements = document.querySelectorAll('.block-renderer')
  if (blockElements[index]) {
    const editableElement = blockElements[index].querySelector('[contenteditable="true"]') as HTMLElement
    if (editableElement) {
      editableElement.focus()
    }
  }
}

function getBlockElement(index: number): HTMLElement | undefined {
  const blockElements = document.querySelectorAll('.block-renderer')
  return blockElements[index] as HTMLElement
}

function selectAllText(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Accessibility
onMounted(() => {
  // Set up keyboard navigation
  document.addEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(event: KeyboardEvent) {
  // Handle global document keyboard shortcuts
  if (event.metaKey || event.ctrlKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        // Save document
        emit('document-change', props.document)
        break
    }
  }
}
</script>

<style scoped>
.document-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 96px;
  min-height: 100vh;
  position: relative;
}

.document-header {
  margin-bottom: 32px;
}

.document-title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  margin: 0;
  padding: 8px 0;
  border: none;
  outline: none;
  cursor: text;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.document-title:hover {
  background: #f9fafb;
}

.document-title:focus {
  background: #f9fafb;
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.blocks-container {
  position: relative;
}

.add-block-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  margin-top: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #6b7280;
  background: transparent;
}

.add-block-area:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.add-block-area:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: #3b82f6;
}

.add-block-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e5e7eb;
  font-size: 14px;
  font-weight: 600;
}

.add-block-text {
  font-size: 14px;
  font-weight: 500;
}

/* Focus mode */
.focus-mode {
  max-width: 800px;
}

.focus-mode .add-block-area {
  opacity: 0.5;
}

.focus-mode .add-block-area:hover {
  opacity: 1;
}

/* Dark mode */
.dark .document-title {
  color: #f9fafb;
}

.dark .document-title:hover,
.dark .document-title:focus {
  background: #374151;
}

.dark .add-block-area {
  border-color: #4b5563;
  color: #9ca3af;
}

.dark .add-block-area:hover {
  border-color: #6b7280;
  background: #374151;
}

.dark .add-block-icon {
  background: #4b5563;
}

/* High contrast mode */
.high-contrast .document-title {
  color: #000000 !important;
  background: #ffffff !important;
  border: 2px solid #000000 !important;
}

.high-contrast .add-block-area {
  border: 2px solid #000000 !important;
  color: #000000 !important;
  background: #ffffff !important;
}

.high-contrast .add-block-icon {
  background: #000000 !important;
  color: #ffffff !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .document-editor {
    padding: 20px;
  }
  
  .document-title {
    font-size: 28px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>