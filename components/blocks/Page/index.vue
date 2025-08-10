<template>
  <div class="page-block-editor">
    <!-- Rich Text Editor Interface -->
    <div class="page-content" @click="focusEditor">
      <!-- Document Blocks -->
      <div 
        v-for="(block, index) in blocks" 
        :key="block.id"
        class="content-block"
        :class="{ 'content-block--active': activeBlockIndex === index }"
      >
        <!-- Heading 1 Block -->
        <h1 
          v-if="block.type === 'heading1'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading1"
          :placeholder="'Heading 1'"
          v-text="block.content"
        ></h1>
        
        <!-- Heading 2 Block -->
        <h2 
          v-else-if="block.type === 'heading2'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading2"
          :placeholder="'Heading 2'"
          v-text="block.content"
        ></h2>
        
        <!-- Heading 3 Block -->
        <h3 
          v-else-if="block.type === 'heading3'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-heading3"
          :placeholder="'Heading 3'"
          v-text="block.content"
        ></h3>
        
        <!-- Paragraph Block -->
        <p 
          v-else-if="block.type === 'paragraph'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-paragraph"
          :placeholder="'Type / for commands'"
          v-html="block.content || '&nbsp;'"
        ></p>
        
        <!-- Bullet List Block -->
        <ul 
          v-else-if="block.type === 'bullet-list'"
          class="block-list"
        >
          <li 
            v-for="(item, itemIndex) in block.items" 
            :key="itemIndex"
            :contenteditable="true"
            @input="updateListItem(index, itemIndex, $event)"
            @keydown="handleListKeydown(index, itemIndex, $event)"
            @focus="setActiveBlock(index)"
            class="block-list-item"
            :placeholder="itemIndex === 0 ? 'List item' : ''"
            v-text="item"
          ></li>
        </ul>
        
        <!-- Numbered List Block -->
        <ol 
          v-else-if="block.type === 'number-list'"
          class="block-list"
        >
          <li 
            v-for="(item, itemIndex) in block.items" 
            :key="itemIndex"
            :contenteditable="true"
            @input="updateListItem(index, itemIndex, $event)"
            @keydown="handleListKeydown(index, itemIndex, $event)"
            @focus="setActiveBlock(index)"
            class="block-list-item"
            :placeholder="itemIndex === 0 ? 'List item' : ''"
            v-text="item"
          ></li>
        </ol>
        
        <!-- Quote Block -->
        <blockquote 
          v-else-if="block.type === 'quote'"
          :contenteditable="true"
          @input="updateBlock(index, $event)"
          @keydown="handleBlockKeydown(index, $event)"
          @focus="setActiveBlock(index)"
          class="block-quote"
          :placeholder="'Quote'"
          v-text="block.content"
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
          :placeholder="'Code'"
          v-text="block.content"
        ></code></pre>
        
        <!-- Divider Block -->
        <hr v-else-if="block.type === 'divider'" class="block-divider" />
      </div>
      
      <!-- Empty state -->
      <div v-if="blocks.length === 0" class="empty-page">
        <p 
          :contenteditable="true"
          @input="updateBlock(0, $event, true)"
          @keydown="handleBlockKeydown(0, $event)"
          @focus="setActiveBlock(0)"
          class="block-paragraph"
          placeholder="Type / for commands"
        ></p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  blockId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update', 'slash-command'])

// State
const blocks = ref(props.data?.blocks || [{
  id: generateId(),
  type: 'paragraph',
  content: '',
  placeholder: "Type / for commands"
}])
const activeBlockIndex = ref(0)

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function setActiveBlock(index) {
  activeBlockIndex.value = index
}

function updateBlock(index, event, isNewBlock = false) {
  if (isNewBlock && blocks.value.length === 0) {
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: event.target.textContent || '',
      placeholder: "Type / for commands"
    }]
    emitUpdate()
    return
  }

  if (blocks.value[index]) {
    const content = event.target.textContent || ''
    
    // Check for slash commands
    if (content.startsWith('/')) {
      handleSlashCommand(index, content)
      return
    }
    
    blocks.value[index].content = content
    emitUpdate()
  }
}

function updateListItem(blockIndex, itemIndex, event) {
  if (blocks.value[blockIndex] && blocks.value[blockIndex].items) {
    blocks.value[blockIndex].items[itemIndex] = event.target.textContent || ''
    emitUpdate()
  }
}

function handleSlashCommand(index, content) {
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  emit('slash-command', {
    position: { x: rect.left, y: rect.bottom + window.scrollY },
    query: content.slice(1), // Remove the '/'
    blockIndex: index
  })
}

function handleBlockKeydown(index, event) {
  if (event.key === 'Enter') {
    if (event.shiftKey) return // Allow soft breaks
    event.preventDefault()
    createNewBlock(index)
  } else if (event.key === 'Backspace' && blocks.value[index].content === '') {
    if (blocks.value.length > 1) {
      event.preventDefault()
      deleteBlock(index)
    }
  }
}

function handleListKeydown(blockIndex, itemIndex, event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    const items = blocks.value[blockIndex].items
    
    if (event.target.textContent === '' && items.length > 1) {
      items.splice(itemIndex, 1)
      createNewBlock(blockIndex)
    } else {
      items.splice(itemIndex + 1, 0, '')
      nextTick(() => {
        const listItems = event.target.parentElement.parentElement.querySelectorAll('li[contenteditable]')
        if (listItems[itemIndex + 1]) {
          listItems[itemIndex + 1].focus()
        }
      })
    }
    emitUpdate()
  }
}

function createNewBlock(afterIndex) {
  const newBlock = {
    id: generateId(),
    type: 'paragraph',
    content: '',
    placeholder: "Type / for commands"
  }
  
  blocks.value.splice(afterIndex + 1, 0, newBlock)
  emitUpdate()
  nextTick(() => {
    focusBlock(afterIndex + 1)
  })
}

function deleteBlock(index) {
  blocks.value.splice(index, 1)
  emitUpdate()
  
  if (blocks.value.length === 0) {
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: '',
      placeholder: "Type / for commands"
    }]
    nextTick(() => focusBlock(0))
  } else {
    const newIndex = Math.max(0, index - 1)
    nextTick(() => focusBlock(newIndex))
  }
}

function focusBlock(index) {
  const blockElements = document.querySelectorAll('.content-block [contenteditable]')
  if (blockElements[index]) {
    blockElements[index].focus()
    setActiveBlock(index)
  }
}

function focusEditor() {
  if (blocks.value.length === 0) {
    blocks.value = [{
      id: generateId(),
      type: 'paragraph',
      content: '',
      placeholder: "Type / for commands"
    }]
  }
  nextTick(() => {
    focusBlock(activeBlockIndex.value)
  })
}

function emitUpdate() {
  emit('update', {
    blocks: toRaw(blocks.value)
  })
}

// Expose methods for slash command execution
function executeSlashCommand(commandId, blockIndex) {
  let newBlock = {
    id: generateId(),
    content: '',
  }
  
  switch (commandId) {
    case 'heading1':
      newBlock = { ...newBlock, type: 'heading1' }
      break
    case 'heading2':
      newBlock = { ...newBlock, type: 'heading2' }
      break
    case 'heading3':
      newBlock = { ...newBlock, type: 'heading3' }
      break
    case 'bullet-list':
      newBlock = { ...newBlock, type: 'bullet-list', items: [''] }
      break
    case 'number-list':
      newBlock = { ...newBlock, type: 'number-list', items: [''] }
      break
    case 'quote':
      newBlock = { ...newBlock, type: 'quote' }
      break
    case 'code':
      newBlock = { ...newBlock, type: 'code' }
      break
    case 'divider':
      newBlock = { ...newBlock, type: 'divider' }
      break
    default:
      newBlock = { ...newBlock, type: 'paragraph' }
  }
  
  if (blockIndex < blocks.value.length) {
    blocks.value[blockIndex] = newBlock
    emitUpdate()
  }
  
  nextTick(() => {
    focusBlock(blockIndex)
  })
}

defineExpose({
  executeSlashCommand
})
</script>

<style scoped>
.page-block-editor {
  width: 100%;
  height: 100%;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.page-content {
  width: 100%;
  padding: 48px 0;
  min-height: 100%;
}

.content-block {
  margin-bottom: 8px;
  position: relative;
}

/* Block Styles */
.block-heading1 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5em 0 0.5em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-heading2 {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.25em 0 0.4em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-heading3 {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.3;
  margin: 1em 0 0.3em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
}

.block-paragraph {
  font-size: 16px;
  line-height: 1.6;
  margin: 0.5em 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  min-height: 1.6em;
}

.block-list {
  margin: 0.5em 0;
  padding-left: 1.7em;
}

.block-list-item {
  font-size: 16px;
  line-height: 1.6;
  margin: 0.25em 0;
  border: none;
  outline: none;
  background: transparent;
  min-height: 1.6em;
  list-style: inherit;
}

.block-quote {
  font-size: 16px;
  line-height: 1.6;
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

.block-code {
  background: #f7fafc;
  border-radius: 6px;
  padding: 1rem;
  margin: 1em 0;
  overflow-x: auto;
}

.block-code code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.4;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.block-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 2em 0;
}

/* Placeholder styles */
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: rgba(55, 53, 47, 0.4);
  font-style: italic;
  pointer-events: none;
  position: absolute;
}

/* Focus States */
[contenteditable]:focus {
  outline: none;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 3px;
}

.empty-page {
  min-height: 200px;
}

.empty-page p {
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  min-height: 1.6em;
}
</style>