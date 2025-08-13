<template>
  <div class="document-page">
    <!-- Pure Paper Interface - Hyper-Minimalist -->
    <div class="paper-canvas">
      <editor-content :editor="editor" class="paper-content" />
      
      <!-- Invisible Slash Command Menu -->
      <div 
        v-if="showSlashMenu" 
        class="slash-menu"
        :style="slashMenuPosition"
      >
        <div 
          v-for="(command, index) in filteredCommands"
          :key="command.id"
          class="slash-command-item"
          :class="{ 'slash-command-active': selectedCommandIndex === index }"
          @click="executeCommand(command)"
          @mouseenter="selectedCommandIndex = index"
        >
          <span class="command-icon">{{ command.icon }}</span>
          <span class="command-name">{{ command.name }}</span>
        </div>
      </div>
      
      <!-- Layout Brush Instructions -->
      <div v-if="layoutBrushMode" class="layout-brush-instructions">
        <h4>🎨 Layout Brush Mode</h4>
        <ul>
          <li>Click blocks to select them</li>
          <li>Press <kbd>Enter</kbd> to arrange into columns</li>
          <li>Press <kbd>Esc</kbd> to exit</li>
        </ul>
        <div style="margin-top: 0.5rem; color: #6b7280; font-size: 0.8rem;">
          Selected: {{ selectedBlocks.length }} blocks
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { History } from '@tiptap/extension-history'
import { Heading } from '@tiptap/extension-heading'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { Extension } from '@tiptap/core'
import { Node, mergeAttributes } from '@tiptap/core'
import type { PageWithRelations } from '~/types/unified-data-layer'

interface Props {
  page: PageWithRelations
}

interface Emits {
  update: [page: PageWithRelations]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const editor = ref<Editor | null>(null)
const showSlashMenu = ref(false)
const slashQuery = ref('')
const selectedCommandIndex = ref(0)
const slashMenuPosition = ref({ top: '0px', left: '0px' })

/**
 * CUSTOM NODE: Invisible Columns Container with Resizable Columns
 * 
 * Creates a flexbox container that renders child blocks side-by-side
 * with invisible resizers that appear on hover and allow drag-to-resize
 */
const ColumnsNode = Node.create({
  name: 'columns',
  
  group: 'block',
  content: 'block+',
  
  addAttributes() {
    return {
      columnWidths: {
        default: null,
        parseHTML: element => {
          const widths = element.getAttribute('data-column-widths')
          return widths ? JSON.parse(widths) : null
        },
        renderHTML: attributes => {
          if (attributes.columnWidths) {
            return {
              'data-column-widths': JSON.stringify(attributes.columnWidths)
            }
          }
          return {}
        }
      }
    }
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const columnWidths = node.attrs.columnWidths
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'columns',
      'class': 'paper-columns',
      'data-column-widths': columnWidths ? JSON.stringify(columnWidths) : null
    }), 0]
  }
})

/**
 * CUSTOM EXTENSION: Invisible Grid System
 * 
 * Handles Shift+Tab to wrap current and previous block in columns
 * Creates multi-column layouts with no visible UI
 */
const InvisibleGridExtension = Extension.create({
  name: 'invisibleGrid',
  
  addKeyboardShortcuts() {
    return {
      // Tab: Navigate to next column, or add new column if in last column
      'Tab': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('🔎 Tab: Navigation within columns')
        
        // Check if we're inside columns
        let inColumns = false
        let columnsDepth = -1
        
        for (let i = 1; i <= $from.depth; i++) {
          if ($from.node(i).type.name === 'columns') {
            inColumns = true
            columnsDepth = i
            break
          }
        }
        
        if (!inColumns) {
          console.log('ℹ️ Not in columns - preventing default tab')
          return true // Prevent default tab behavior outside columns
        }
        
        const columnsNode = $from.node(columnsDepth)
        const columnsPos = $from.before(columnsDepth)
        
        // Find which column we're currently in
        let currentColumnIndex = -1
        let currentPos = columnsPos + 1
        
        for (let i = 0; i < columnsNode.childCount; i++) {
          const child = columnsNode.child(i)
          const childEnd = currentPos + child.nodeSize
          
          if ($from.pos >= currentPos && $from.pos < childEnd) {
            currentColumnIndex = i
            break
          }
          currentPos = childEnd
        }
        
        console.log(`📍 Currently in column ${currentColumnIndex} of ${columnsNode.childCount}`)
        
        if (currentColumnIndex < columnsNode.childCount - 1) {
          // Move to next column (right)
          let targetPos = columnsPos + 1
          
          for (let i = 0; i <= currentColumnIndex; i++) {
            targetPos += columnsNode.child(i).nodeSize
          }
          
          const tr = state.tr.setSelection(state.selection.constructor.near(state.doc.resolve(targetPos + 1)))
          view.dispatch(tr)
          console.log(`➡️ Moved to column ${currentColumnIndex + 1}`)
          return true
        } else {
          // We're in the last column - add new empty column
          console.log('➕ In last column - adding new empty column')
          
          const existingColumns = []
          columnsNode.forEach(child => {
            existingColumns.push(child)
          })
          
          const emptyParagraph = state.schema.nodes.paragraph.create()
          existingColumns.push(emptyParagraph)
          
          const newColumnsNode = state.schema.nodes.columns.create({}, existingColumns)
          const columnsEnd = columnsPos + columnsNode.nodeSize
          
          const tr = state.tr.replaceWith(columnsPos, columnsEnd, newColumnsNode)
          
          // Position cursor in the new empty column
          let targetPos = columnsPos + 1
          for (let i = 0; i < existingColumns.length - 1; i++) {
            targetPos += existingColumns[i].nodeSize
          }
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(targetPos + 1)))
          
          view.dispatch(tr)
          console.log('✅ Added new column and moved cursor there')
          return true
        }
      },
      
      // Shift+Tab: Contextual creation or navigation
      'Shift-Tab': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('🎯 Shift+Tab: Contextual creation or navigation')
        
        // Check if we're inside columns
        let inColumns = false
        let columnsDepth = -1
        
        for (let i = 1; i <= $from.depth; i++) {
          if ($from.node(i).type.name === 'columns') {
            inColumns = true
            columnsDepth = i
            break
          }
        }
        
        // NEW NESTED CONTEXT LOGIC:
        // Shift+Tab should work at the CURRENT LEVEL, treating each context as a mini-document
        
        // Find the immediate parent context where we can create columns
        const currentParagraph = $from.parent
        if (currentParagraph.type.name !== 'paragraph') {
          console.log('❌ Not in a paragraph - cannot create columns')
          return true
        }
        
        // Get the parent container (could be document root or a column)
        const parentContainer = $from.node($from.depth - 1)
        const currentParentPos = $from.before($from.depth)
        const currentStart = currentParentPos
        const currentEnd = currentParentPos + currentParagraph.nodeSize
        
        console.log(`🔍 Working within ${parentContainer.type.name} context`)
        
        // Check if we're at the first column in a columns group - if so, navigate
        if (inColumns) {
          const columnsNode = $from.node(columnsDepth)
          const columnsPos = $from.before(columnsDepth)
          
          // Find which column we're in
          let currentColumnIndex = -1
          let currentPos = columnsPos + 1
          
          for (let i = 0; i < columnsNode.childCount; i++) {
            const child = columnsNode.child(i)
            const childEnd = currentPos + child.nodeSize
            
            if ($from.pos >= currentPos && $from.pos < childEnd) {
              currentColumnIndex = i
              break
            }
            currentPos = childEnd
          }
          
          if (currentColumnIndex > 0) {
            // NAVIGATION: Move to previous column at current level
            console.log('⬅️ Navigating to previous column in current columns group')
            
            let targetPos = columnsPos + 1
            for (let i = 0; i < currentColumnIndex - 1; i++) {
              targetPos += columnsNode.child(i).nodeSize
            }
            
            const tr = state.tr.setSelection(state.selection.constructor.near(state.doc.resolve(targetPos + 1)))
            view.dispatch(tr)
            console.log(`⬅️ Moved to column ${currentColumnIndex - 1}`)
            return true
          }
          
          // If at first column, fall through to creation mode within this column
          console.log('📍 At first column - will try to create sub-columns within current context')
        }
        
        // CREATION MODE: Work within current context (document root or column)
        console.log('📝 Creation mode - looking for previous block in current context')
          
        // Find immediately preceding block in current context
        let prevBlock = null
        let prevBlockPos = null
        
        parentContainer.forEach((child, offset, index) => {
          const childPos = $from.start($from.depth - 1) + offset
          if (childPos === currentStart) {
            if (index > 0) {
              // Get previous block in this context
              parentContainer.forEach((prevChild, prevOffset, prevIndex) => {
                if (prevIndex === index - 1) {
                  prevBlock = prevChild
                  prevBlockPos = $from.start($from.depth - 1) + prevOffset
                }
              })
            }
          }
        })
          
          if (!prevBlock) {
          console.log(`❌ No previous block found in ${parentContainer.type.name} context`)
          return true
        }
        
        console.log(`📋 Found previous block in ${parentContainer.type.name} context:`, {
          type: prevBlock.type.name,
          content: prevBlock.type.name === 'paragraph' ? prevBlock.textContent : 'non-paragraph'
        })
        
        let newColumnsNode
        let replaceStart = prevBlockPos
        let replaceEnd = currentEnd
        
        if (prevBlock.type.name === 'paragraph') {
          // Create [prev_text | current_text] within current context
          const contextName = parentContainer.type.name === 'doc' ? 'document' : 'column'
          console.log(`🏗️ Creating nested columns within ${contextName}: [prev_text | current_text]`)
          newColumnsNode = state.schema.nodes.columns.create({}, [
            state.schema.nodes.paragraph.create({}, prevBlock.content),
            state.schema.nodes.paragraph.create({}, currentParagraph.content)
          ])
        } else if (prevBlock.type.name === 'columns') {
          // Add to existing: [col1 | col2 | current_text]
          const contextName = parentContainer.type.name === 'doc' ? 'document' : 'column'
          console.log(`🧩 Extending existing columns within ${contextName}: [col1 | col2 | current_text]`)
          const existingColumns = []
          prevBlock.forEach(child => existingColumns.push(child))
          existingColumns.push(state.schema.nodes.paragraph.create({}, currentParagraph.content))
          newColumnsNode = state.schema.nodes.columns.create({}, existingColumns)
        } else {
          console.log('❌ Cannot create columns with block type:', prevBlock.type.name)
          return true
        }
        
        const tr = state.tr.replaceWith(replaceStart, replaceEnd, newColumnsNode)
        
        // Position cursor at BEGINNING of the moved block (current text)
        let targetPos = replaceStart + 1
        
        // Navigate to the last column (where current text now lives)
        let columnCount = 0
        newColumnsNode.descendants((node, pos) => {
          if (node.type.name === 'paragraph') {
            columnCount++
            if (columnCount === newColumnsNode.childCount) {
              targetPos = replaceStart + pos + 1
              return false
            }
          }
        })
        
        tr.setSelection(state.selection.constructor.near(tr.doc.resolve(targetPos)))
        view.dispatch(tr)
        
        const contextName = parentContainer.type.name === 'doc' ? 'document' : 'column'
        console.log(`✅ Created nested columns within ${contextName} and positioned cursor at beginning of moved block`)
        return true
      },
      
      // Enter: Create new paragraph within current column (natural flow)
      'Enter': ({ editor }) => {
        // Layout Brush Mode: Arrange selected blocks into columns
        if (layoutBrushMode.value && selectedBlocks.value.length >= 2) {
          arrangeSelectedIntoColumns()
          return true
        }
        
        const { state } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('⤵ Enter: Create paragraph within column')
        
        // Check if we're inside columns
        let inColumns = false
        
        for (let i = 0; i <= $from.depth; i++) {
          if ($from.node(i).type.name === 'columns') {
            inColumns = true
            break
          }
        }
        
        if (inColumns) {
          console.log('📝 Inside column - using default Enter to create paragraph within column')
          // Let TipTap handle the default Enter behavior (creates new paragraph in same column)
          return false
        }
        
        console.log('ℹ️ Not in columns - using default Enter behavior')
        return false
      },
      
      // Shift+Enter: Escape hatch - exit columns and create full-width paragraph
      'Shift-Enter': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('⏎ Shift+Enter: Escape hatch from columns')
        
        // Check if we're inside columns
        let inColumns = false
        let columnsNode = null
        let columnsDepth = null
        
        for (let i = 0; i <= $from.depth; i++) {
          const node = $from.node(i)
          if (node.type.name === 'columns') {
            inColumns = true
            columnsNode = node
            columnsDepth = i
            break
          }
        }
        
        if (inColumns && columnsNode && columnsDepth !== null) {
          console.log('🚪 Exiting columns - creating full-width paragraph below')
          
          const columnsPos = $from.before(columnsDepth)
          const columnsEnd = columnsPos + columnsNode.nodeSize
          
          // Create new paragraph after the columns
          const newParagraph = state.schema.nodes.paragraph.create()
          const tr = state.tr.insert(columnsEnd, newParagraph)
          
          // Position cursor in the new paragraph
          const newCursorPos = columnsEnd + 1
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
          
          view.dispatch(tr)
          console.log('✅ Escaped to full-width paragraph')
          return true
        }
        
        console.log('ℹ️ Not in columns - using default Shift+Enter behavior')
        return false // Use default behavior for non-column contexts
      },
      
      // Perfect Backspace behavior for block merging
      'Backspace': ({ editor }) => {
        const { state, view } = editor
        const { selection, doc } = state
        const { $from } = selection
        
        // Check if at start of block (not first block)
        const atStartOfBlock = $from.parentOffset === 0
        const blockPos = $from.start($from.depth)
        const isFirstBlock = blockPos <= 2
        
        if (atStartOfBlock && !isFirstBlock) {
          console.log('🔀 Merging blocks with Backspace')
          
          // Find previous block
          const prevBlockPos = $from.before($from.depth)
          let prevBlock = null
          let prevBlockEnd = 0
          
          // Navigate to find the actual previous block
          const parent = doc.resolve(prevBlockPos - 1)
          if (parent.parent && parent.parent.type.name === 'paragraph') {
            prevBlock = parent.parent
            prevBlockEnd = parent.end()
          }
          
          if (prevBlock) {
            const currentBlock = $from.parent
            const prevContent = prevBlock.textContent
            const currentContent = currentBlock.textContent
            
            // Create merge transaction
            const tr = state.tr
            
            // Insert current content at end of previous block
            if (currentContent) {
              tr.insertText(currentContent, prevBlockEnd)
            }
            
            // Delete current block
            const currentStart = $from.start() - 1
            const currentEnd = $from.end()
            tr.delete(currentStart, currentEnd + 1)
            
            // Position cursor at merge point
            const mergePos = prevBlockEnd
            tr.setSelection(state.selection.constructor.near(tr.doc.resolve(mergePos)))
            
            view.dispatch(tr)
            return true
          }
        }
        
        return false // Use default behavior
      },
      
      // Layout Brush Mode shortcuts
      'Escape': () => {
        if (layoutBrushMode.value) {
          exitLayoutBrush()
          return true
        }
        return false
      }
    }
  }
})

/**
 * EXTENSION: Seamless Slash Commands
 */
const SlashCommandExtension = Extension.create({
  name: 'slashCommands',
  
  addKeyboardShortcuts() {
    return {
      'ArrowDown': () => {
        if (showSlashMenu.value) {
          selectedCommandIndex.value = Math.min(
            selectedCommandIndex.value + 1, 
            filteredCommands.value.length - 1
          )
          return true
        }
        return false
      },
      
      'ArrowUp': () => {
        if (showSlashMenu.value) {
          selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0)
          return true
        }
        return false
      },
      
      'Enter': ({ editor }) => {
        if (showSlashMenu.value) {
          const command = filteredCommands.value[selectedCommandIndex.value]
          if (command) {
            executeCommand(command)
          }
          return true
        }
        return false
      },
      
      'Escape': () => {
        if (showSlashMenu.value) {
          hideSlashMenu()
          return true
        }
        return false
      }
    }
  }
})

// Slash Command Definitions
const slashCommands = [
  { id: 'paragraph', name: 'Text', icon: '𝖳', command: () => setBlockType('paragraph') },
  { id: 'heading1', name: 'Heading 1', icon: '𝗛𝟭', command: () => setHeading(1) },
  { id: 'heading2', name: 'Heading 2', icon: '𝗛𝟮', command: () => setHeading(2) },
  { id: 'heading3', name: 'Heading 3', icon: '𝗛𝟯', command: () => setHeading(3) },
  { id: 'bulletlist', name: 'Bullet List', icon: '∘', command: () => setBlockType('bulletList') },
  { id: 'orderedlist', name: 'Numbered List', icon: '𝟏.', command: () => setBlockType('orderedList') },
  
  // ADVANCED COLUMN COMMANDS
  { id: 'columns2', name: 'Two Columns', icon: '⦀', command: () => createColumns(2) },
  { id: 'columns3', name: 'Three Columns', icon: '⦀', command: () => createColumns(3) },
  { id: 'columns4', name: 'Four Columns', icon: '⦀', command: () => createColumns(4) },
  { id: 'columns', name: 'Custom Columns (add number)', icon: '⦀', command: (params) => createColumns(params) },
  { id: 'layout', name: 'Layout Brush Mode', icon: '🎨', command: () => activateLayoutBrush() },
]

const filteredCommands = computed(() => {
  if (!slashQuery.value) return slashCommands
  const query = slashQuery.value.toLowerCase()
  return slashCommands.filter(cmd => 
    cmd.name.toLowerCase().includes(query) || 
    cmd.id.toLowerCase().includes(query)
  )
})

/**
 * Slash Command Functions
 */
const executeCommand = (command: any) => {
  if (!editor.value) return
  
  // Clear the slash command from text and parse parameters
  const { state } = editor.value
  const { selection } = state
  const { $from } = selection
  
  // Find the slash position and extract full command with parameters
  const textBefore = $from.parent.textBetween(0, $from.parentOffset)
  const slashIndex = textBefore.lastIndexOf('/')
  
  let commandParams = null
  
  if (slashIndex !== -1) {
    const deleteFrom = $from.pos - ($from.parentOffset - slashIndex)
    const deleteTo = $from.pos
    
    // Extract the full command text to parse parameters
    const fullCommand = textBefore.substring(slashIndex + 1)
    console.log('🔧 Full command:', fullCommand)
    
    // Parse parameters (e.g., "columns 3" -> params = 3)
    const parts = fullCommand.trim().split(/\\s+/)
    if (parts.length > 1 && command.id === 'columns') {
      const numberParam = parseInt(parts[1])
      if (!isNaN(numberParam) && numberParam >= 2 && numberParam <= 8) {
        commandParams = numberParam
        console.log('📊 Parsed column count:', commandParams)
      }
    }
    
    editor.value.chain()
      .deleteRange({ from: deleteFrom, to: deleteTo })
      .run()
  }
  
  // Execute the command with parameters
  if (commandParams !== null) {
    command.command(commandParams)
  } else {
    command.command()
  }
  
  hideSlashMenu()
  
  // Focus back to editor
  nextTick(() => {
    editor.value?.commands.focus()
  })
}

const setBlockType = (type: string) => {
  if (!editor.value) return
  
  switch (type) {
    case 'paragraph':
      editor.value.chain().focus().setParagraph().run()
      break
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run()
      break
  }
}

const setHeading = (level: number) => {
  if (!editor.value) return
  editor.value.chain().focus().toggleHeading({ level }).run()
}

/**
 * ADVANCED COLUMN COMMANDS
 */
const createColumns = (count: number = 2) => {
  if (!editor.value || count < 2 || count > 8) {
    console.log('❌ Invalid column count:', count)
    return
  }
  
  console.log(`🏗️ Creating ${count} columns instantly`)
  
  const { state, view } = editor.value
  const { selection } = state
  const { $from } = selection
  
  // Create array of empty paragraphs for each column
  const columnBlocks = []
  for (let i = 0; i < count; i++) {
    columnBlocks.push(state.schema.nodes.paragraph.create())
  }
  
  const newColumnsNode = state.schema.nodes.columns.create({}, columnBlocks)
  
  // Replace current paragraph or insert at current position
  const currentParagraph = $from.parent
  if (currentParagraph.type.name === 'paragraph' && currentParagraph.textContent.trim() === '') {
    // Replace empty paragraph
    const currentParentPos = $from.before($from.depth)
    const currentEnd = currentParentPos + currentParagraph.nodeSize
    
    const tr = state.tr.replaceWith(currentParentPos, currentEnd, newColumnsNode)
    
    // Position cursor in first column
    const newCursorPos = currentParentPos + 2
    tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
    
    view.dispatch(tr)
  } else {
    // Insert after current block
    const insertPos = $from.after($from.depth)
    const tr = state.tr.insert(insertPos, newColumnsNode)
    
    // Position cursor in first column of new columns
    const newCursorPos = insertPos + 2
    tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
    
    view.dispatch(tr)
  }
  
  console.log(`✅ Created ${count} columns successfully`)
}

/**
 * LAYOUT BRUSH MODE
 * Allows visual selection and reorganization of blocks into columns
 */
const layoutBrushMode = ref(false)
const selectedBlocks = ref<any[]>([])

const activateLayoutBrush = () => {
  if (!editor.value) return
  
  console.log('🎨 Activating Layout Brush mode')
  layoutBrushMode.value = true
  selectedBlocks.value = []
  
  // Add visual feedback to the editor
  const editorElement = document.querySelector('.ProseMirror')
  if (editorElement) {
    editorElement.classList.add('layout-brush-active')
  }
  
  // Show instructions
  console.log('📝 Layout Brush Instructions:')
  console.log('  • Click blocks to select them for column layout')
  console.log('  • Press Enter to arrange selected blocks into columns')
  console.log('  • Press Escape to exit Layout Brush mode')
}

const exitLayoutBrush = () => {
  console.log('❌ Exiting Layout Brush mode')
  layoutBrushMode.value = false
  selectedBlocks.value = []
  
  // Remove visual feedback
  const editorElement = document.querySelector('.ProseMirror')
  if (editorElement) {
    editorElement.classList.remove('layout-brush-active')
  }
}

const toggleBlockSelection = (pos: number) => {
  if (!layoutBrushMode.value) return
  
  console.log('🖱️ Toggling block selection at position:', pos)
  
  const blockIndex = selectedBlocks.value.findIndex(block => block.pos === pos)
  if (blockIndex > -1) {
    // Remove from selection
    selectedBlocks.value.splice(blockIndex, 1)
    console.log('➖ Removed block from selection')
  } else {
    // Add to selection
    selectedBlocks.value.push({ pos })
    console.log('➕ Added block to selection')
  }
  
  console.log(`📋 Selected blocks: ${selectedBlocks.value.length}`)
}

const arrangeSelectedIntoColumns = () => {
  if (!editor.value || selectedBlocks.value.length < 2) {
    console.log('❌ Need at least 2 blocks to create columns')
    return
  }
  
  console.log(`🏗️ Arranging ${selectedBlocks.value.length} blocks into columns`)
  
  const { state, view } = editor.value
  
  // Sort blocks by position
  const sortedBlocks = [...selectedBlocks.value].sort((a, b) => a.pos - b.pos)
  
  // Get the actual block nodes and their content
  const blockContents = []
  let firstBlockPos = null
  let lastBlockPos = null
  
  for (const block of sortedBlocks) {
    const resolvedPos = state.doc.resolve(block.pos)
    const blockNode = resolvedPos.parent
    
    if (blockNode.type.name === 'paragraph') {
      blockContents.push(state.schema.nodes.paragraph.create({}, blockNode.content))
      
      if (firstBlockPos === null) {
        firstBlockPos = resolvedPos.before(resolvedPos.depth)
      }
      lastBlockPos = resolvedPos.after(resolvedPos.depth)
    }
  }
  
  if (blockContents.length < 2) {
    console.log('❌ Invalid blocks for column creation')
    return
  }
  
  // Create columns node
  const newColumnsNode = state.schema.nodes.columns.create({}, blockContents)
  
  // Replace the range from first block to last block
  const tr = state.tr.replaceWith(firstBlockPos, lastBlockPos, newColumnsNode)
  
  // Position cursor in first column
  const newCursorPos = firstBlockPos + 2
  tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
  
  view.dispatch(tr)
  
  console.log('✅ Successfully arranged blocks into columns')
  exitLayoutBrush()
}

const hideSlashMenu = () => {
  showSlashMenu.value = false
  slashQuery.value = ''
  selectedCommandIndex.value = 0
}

/**
 * Handle text input to detect slash commands
 */
const handleTextInput = (text: string, from: number, to: number) => {
  if (!editor.value) return
  
  const { state } = editor.value
  const { $from } = state.selection
  
  // Check if we just typed a slash at start of line or after space
  // Enhanced regex to support parameters like "columns 3"
  const textBefore = $from.parent.textBetween(0, $from.parentOffset)
  const slashMatch = textBefore.match(/(^|\s)\/([a-zA-Z0-9\s]*)$/)
  
  if (slashMatch) {
    const fullQuery = slashMatch[2] || ''
    // For filtering, use just the command name (first word)
    const commandName = fullQuery.split(/\s+/)[0]
    slashQuery.value = commandName
    selectedCommandIndex.value = 0
    
    if (!showSlashMenu.value) {
      showSlashMenu.value = true
      
      // Position menu
      nextTick(() => {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          
          slashMenuPosition.value = {
            top: (rect.bottom + window.scrollY + 4) + 'px',
            left: (rect.left + window.scrollX) + 'px'
          }
        }
      })
    }
  } else {
    hideSlashMenu()
  }
}

/**
 * Initialize Editor with page content
 */
// Resizer functionality for columns
const isResizing = ref(false)
const resizerData = ref({ element: null, startX: 0, startWidths: [] })

const initializeResizers = () => {
  if (!editor.value) return
  
  nextTick(() => {
    const columnsElements = document.querySelectorAll('.paper-columns')
    
    columnsElements.forEach(columnContainer => {
      // Skip if already has resizers
      if (columnContainer.querySelector('.column-resizer')) return
      
      const children = Array.from(columnContainer.children)
      if (children.length < 2) return
      
      // Insert resizers between columns
      for (let i = 1; i < children.length; i++) {
        const resizer = document.createElement('div')
        resizer.className = 'column-resizer'
        resizer.setAttribute('data-resizer-index', i.toString())
        
        // Insert before the child
        columnContainer.insertBefore(resizer, children[i])
        
        // Add drag functionality
        resizer.addEventListener('mousedown', handleResizerMouseDown)
      }
      
      // Add hover listeners to show/hide resizers
      columnContainer.addEventListener('mouseenter', showResizers)
      columnContainer.addEventListener('mouseleave', hideResizers)
      
      // Apply saved column widths if they exist
      const savedWidths = columnContainer.getAttribute('data-column-widths')
      if (savedWidths) {
        try {
          const widths = JSON.parse(savedWidths)
          const columns = Array.from(columnContainer.children).filter(el => !el.classList.contains('column-resizer'))
          
          columns.forEach((column, index) => {
            if (widths[index]) {
              column.style.width = widths[index] + 'px'
              column.style.flexBasis = widths[index] + 'px'
              column.style.flexGrow = '0'
              column.style.flexShrink = '0'
            }
          })
        } catch (e) {
          console.warn('Failed to parse saved column widths:', e)
        }
      }
    })
  })
}

const showResizers = (event) => {
  const resizers = event.currentTarget.querySelectorAll('.column-resizer')
  resizers.forEach(resizer => {
    resizer.style.opacity = '1'
  })
}

const hideResizers = (event) => {
  if (isResizing.value) return
  
  const resizers = event.currentTarget.querySelectorAll('.column-resizer')
  resizers.forEach(resizer => {
    resizer.style.opacity = '0'
  })
}

const handleResizerMouseDown = (event) => {
  event.preventDefault()
  isResizing.value = true
  
  const resizer = event.target
  const columnContainer = resizer.closest('.paper-columns')
  const resizerIndex = parseInt(resizer.getAttribute('data-resizer-index'))
  
  // Add visual feedback classes
  resizer.classList.add('resizing')
  columnContainer.classList.add('is-resizing')
  
  // Get current column widths
  const columns = Array.from(columnContainer.children).filter(el => !el.classList.contains('column-resizer'))
  const currentWidths = columns.map(col => col.offsetWidth)
  
  resizerData.value = {
    element: resizer,
    startX: event.clientX,
    startWidths: currentWidths,
    columnContainer,
    resizerIndex,
    leftColumn: columns[resizerIndex - 1],
    rightColumn: columns[resizerIndex]
  }
  
  document.addEventListener('mousemove', handleResizerMouseMove)
  document.addEventListener('mouseup', handleResizerMouseUp)
}

const handleResizerMouseMove = (event) => {
  if (!isResizing.value || !resizerData.value.element) return
  
  const { startX, startWidths, leftColumn, rightColumn, resizerIndex } = resizerData.value
  const deltaX = event.clientX - startX
  
  // Calculate new widths
  const leftWidth = Math.max(100, startWidths[resizerIndex - 1] + deltaX)
  const rightWidth = Math.max(100, startWidths[resizerIndex] - deltaX)
  
  // Apply new widths
  leftColumn.style.width = leftWidth + 'px'
  leftColumn.style.flexBasis = leftWidth + 'px'
  leftColumn.style.flexGrow = '0'
  leftColumn.style.flexShrink = '0'
  
  rightColumn.style.width = rightWidth + 'px'
  rightColumn.style.flexBasis = rightWidth + 'px'
  rightColumn.style.flexGrow = '0'
  rightColumn.style.flexShrink = '0'
}

const handleResizerMouseUp = () => {
  if (!isResizing.value) return
  
  isResizing.value = false
  
  // Remove visual feedback classes
  const { element: resizer, columnContainer } = resizerData.value
  if (resizer) {
    resizer.classList.remove('resizing')
  }
  if (columnContainer) {
    columnContainer.classList.remove('is-resizing')
  }
  
  // Save the new widths to the node attributes
  const columns = Array.from(columnContainer.children).filter(el => !el.classList.contains('column-resizer'))
  const newWidths = columns.map(col => col.offsetWidth)
  
  // Update the TipTap node with new widths
  if (editor.value) {
    const { state, view } = editor.value
    const pos = view.posAtDOM(columnContainer, 0)
    if (pos !== null && pos !== undefined) {
      const resolvedPos = state.doc.resolve(pos)
      const node = resolvedPos.parent
      
      if (node && node.type.name === 'columns') {
        const tr = state.tr.setNodeMarkup(resolvedPos.pos - resolvedPos.parentOffset - 1, undefined, {
          ...node.attrs,
          columnWidths: newWidths
        })
        view.dispatch(tr)
      }
    }
  }
  
  document.removeEventListener('mousemove', handleResizerMouseMove)
  document.removeEventListener('mouseup', handleResizerMouseUp)
  
  resizerData.value = { element: null, startX: 0, startWidths: [] }
}

onMounted(() => {
  // Convert page blocks to TipTap content if they exist
  let initialContent = '<p></p>' // Default empty paragraph
  
  if (props.page.blocks && props.page.blocks.length > 0) {
    // Convert blocks to HTML content
    initialContent = props.page.blocks
      .sort((a, b) => a.position - b.position)
      .map(block => {
        const text = block.content.text || ''
        
        switch (block.type) {
          case 'HEADING':
            const level = block.content.level || 1
            return `<h${level}>${text}</h${level}>`
          case 'TEXT':
            return `<p>${text}</p>`
          default:
            return `<p>${text}</p>`
        }
      })
      .join('')
  }

  editor.value = new Editor({
    content: initialContent,
    
    extensions: [
      // Core structure
      Document,
      
      // Block types
      Paragraph,
      Text,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList.configure({ HTMLAttributes: { class: 'paper-bullet-list' } }),
      OrderedList.configure({ HTMLAttributes: { class: 'paper-ordered-list' } }),
      ListItem,
      
      // Custom nodes and extensions
      ColumnsNode,
      InvisibleGridExtension,
      SlashCommandExtension,
      
      // History
      History.configure({
        depth: 100,
        newGroupDelay: 500,
      }),
    ],
    
    editable: true,
    autofocus: 'end',
    
    // Handle content updates
    onUpdate: ({ editor }) => {
      // Emit page update with current content
      if (editor) {
        const updatedPage = {
          ...props.page,
          // For now, store content as HTML
          // In future, could convert TipTap JSON to blocks
          content: editor.getHTML()
        }
        emit('update', updatedPage)
      }
      
      // Check for slash commands on update
      if (editor) {
        const { state } = editor
        const { $from } = state.selection
        const textBefore = $from.parent.textBetween(0, $from.parentOffset)
        const slashMatch = textBefore.match(/(^|\s)\/([a-zA-Z0-9]*)$/)
        
        if (slashMatch && !showSlashMenu.value) {
          const query = slashMatch[2] || ''
          slashQuery.value = query
          showSlashMenu.value = true
          selectedCommandIndex.value = 0
        } else if (!slashMatch && showSlashMenu.value) {
          hideSlashMenu()
        }
      }
      
      // Initialize resizers for any new columns
      initializeResizers()
    },
    
    onCreate: () => {
      console.log('📄 Document page editor created for:', props.page.title)
      // Initialize resizers for any existing columns
      initializeResizers()
    }
  })
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// Watch for page changes
watch(() => props.page, (newPage) => {
  if (editor.value && newPage) {
    // Update editor content when page changes
    // This would happen when switching between pages
    console.log('📄 Page updated:', newPage.title)
  }
}, { deep: true })
</script>

<style scoped>
/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/**
 * DOCUMENT PAGE CONTAINER
 * Clean, full-height paper interface
 */
.document-page {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #fefefe;
  overflow: hidden;
}

.paper-canvas {
  position: relative;
  background: transparent;
  height: 100%;
  width: 100%;
  overflow: auto;
}

.paper-content {
  background: transparent;
  outline: none;
  border: none;
  height: 100%;
  width: 100%;
}

/**
 * CORE EDITOR STYLING
 * Hyper-minimalist with premium typography - Full Screen
 */
:deep(.ProseMirror) {
  outline: none;
  border: none;
  background: transparent;
  
  /* Premium Typography - Inter Font */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: #1a1a1a;
  font-weight: 400;
  letter-spacing: -0.011em;
  
  /* Full screen coverage with comfortable margins */
  padding: 3rem 4rem;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  
  /* Center content with max width for readability */
  max-width: none;
  
  /* No visual chrome anywhere */
  caret-color: #1a1a1a;
}

/* Content centering container */
:deep(.ProseMirror > *) {
  max-width: 65rem;
  margin-left: auto;
  margin-right: auto;
}

/**
 * BLOCK STYLING
 * Invisible blocks with perfect typography
 */
:deep(.ProseMirror p) {
  margin: 0 0 1.25rem 0;
  padding: 0;
  
  /* NO visible highlighting or borders */
  background: transparent;
  border: none;
  outline: none;
  
  /* Clean typography */
  font-size: 16px;
  line-height: 1.7;
  color: #1a1a1a;
  
  /* Subtle focus - just the cursor */
  caret-color: #1a1a1a;
}

:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

/**
 * HEADING STYLES
 * Clean hierarchy with Inter font
 */
:deep(.ProseMirror h1) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
  letter-spacing: -0.025em;
}

:deep(.ProseMirror h2) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a1a;
  margin: 0 0 1.25rem 0;
  letter-spacing: -0.021em;
}

:deep(.ProseMirror h3) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
  margin: 0 0 1rem 0;
  letter-spacing: -0.017em;
}

/**
 * LIST STYLES
 * Clean, minimal lists
 */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  margin: 0 0 1.25rem 0;
  padding-left: 1.5rem;
}

:deep(.ProseMirror li) {
  margin: 0 0 0.5rem 0;
  line-height: 1.7;
}

:deep(.ProseMirror ul li::marker) {
  color: #666;
}

/**
 * LAYOUT BRUSH MODE STYLES
 * Visual feedback for block selection and reorganization
 */
:deep(.layout-brush-active) {
  border: 2px dashed var(--theme-accent, #3b82f6) !important;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.03);
}

:deep(.layout-brush-active p) {
  cursor: pointer;
  padding: 0.5rem;
  margin: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

:deep(.layout-brush-active p:hover) {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

:deep(.layout-brush-active p.selected) {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--theme-accent, #3b82f6);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* Layout Brush instructions overlay */
.layout-brush-instructions {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--theme-surface, white);
  border: 1px solid var(--theme-border, #e5e7eb);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 0.875rem;
  max-width: 280px;
}

.layout-brush-instructions h4 {
  margin: 0 0 0.5rem 0;
  color: var(--theme-accent, #3b82f6);
  font-weight: 600;
}

.layout-brush-instructions ul {
  margin: 0;
  padding-left: 1.2rem;
  list-style-type: disc;
}

.layout-brush-instructions li {
  margin: 0.25rem 0;
  line-height: 1.4;
}

:deep(.ProseMirror ol li::marker) {
  color: #666;
  font-weight: 500;
}

/**
 * INVISIBLE COLUMNS SYSTEM
 * The magical per-block grid with no visible UI
 */
:deep(.paper-columns) {
  display: flex;
  gap: 2rem;
  margin: 0 0 1.25rem 0;
  align-items: flex-start;
  width: 100%;
  
  /* NO visible chrome - appears seamless */
  background: transparent;
  border: none;
  outline: none;
}

:deep(.paper-columns > *) {
  flex: 1;
  min-width: 0;
  margin: 0;
}

:deep(.paper-columns > p) {
  margin: 0 0 1.25rem 0;
}

/**
 * NESTED COLUMNS SUPPORT
 * Visual hierarchy and spacing for columns within columns
 */
:deep(.paper-columns .paper-columns) {
  /* Nested columns have slightly smaller gap */
  gap: 1.5rem;
  margin: 0.75rem 0;
  
  /* Subtle visual distinction for nested context */
  padding: 0.5rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.01);
}

:deep(.paper-columns .paper-columns .paper-columns) {
  /* Third-level nesting - even more subtle */
  gap: 1rem;
  margin: 0.5rem 0;
  background: rgba(0, 0, 0, 0.015);
}

/* Ensure nested columns maintain minimum width */
:deep(.paper-columns .paper-columns > *) {
  min-width: 0;
  flex: 1;
}

/**
 * INVISIBLE COLUMN RESIZERS
 * Hidden by default, visible on hover, draggable to resize columns
 */
:deep(.column-resizer) {
  position: relative;
  width: 8px;
  margin: 0 -4px;
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
  
  /* Create the visual resizer line */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    bottom: 0;
    width: 1px;
    background-color: #d1d5db;
    transform: translateX(-50%);
  }
  
  /* Hover state - slightly more visible */
  &:hover::after {
    background-color: #9ca3af;
    width: 2px;
  }
}

/* Show resizers when parent is hovered */
:deep(.paper-columns:hover .column-resizer) {
  opacity: 1;
}

/* Keep resizers visible during drag */
:deep(.paper-columns .column-resizer.resizing) {
  opacity: 1;
}

/* Cursor feedback during resize */
:deep(.paper-columns.is-resizing) {
  cursor: col-resize;
}

:deep(.paper-columns.is-resizing *) {
  cursor: col-resize !important;
  user-select: none;
}

/**
 * SELECTION STYLING
 * Subtle, professional selection
 */
:deep(.ProseMirror ::selection) {
  background: rgba(59, 130, 246, 0.15);
}

:deep(.ProseMirror-focused) {
  outline: none;
  border: none;
}

/**
 * PLACEHOLDER STYLING
 * Subtle placeholder for empty blocks
 */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: 'Start typing...';
  color: #9ca3af;
  pointer-events: none;
  float: left;
  height: 0;
  font-weight: 400;
}

/**
 * SLASH COMMAND MENU
 * Invisible until needed, then elegant and minimal
 */
.slash-menu {
  position: fixed;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 4px 0;
  min-width: 200px;
  animation: slash-appear 0.15s ease-out;
}

@keyframes slash-appear {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slash-command-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.1s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  color: #374151;
}

.slash-command-item:hover,
.slash-command-active {
  background: rgba(59, 130, 246, 0.08);
}

.command-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  text-align: center;
  color: #6b7280;
}

.command-name {
  font-weight: 500;
}

/**
 * RESPONSIVE DESIGN
 * Clean scaling for mobile
 */
@media (max-width: 768px) {
  :deep(.ProseMirror) {
    padding: 2rem 1.5rem;
    font-size: 15px;
  }
  
  :deep(.ProseMirror h1) {
    font-size: 1.875rem;
  }
  
  :deep(.ProseMirror h2) {
    font-size: 1.5rem;
  }
  
  :deep(.ProseMirror h3) {
    font-size: 1.25rem;
  }
  
  :deep(.paper-columns) {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  :deep(.ProseMirror) {
    padding: 1.5rem 1rem;
    font-size: 14px;
  }
}

/**
 * PRINT STYLING
 * Perfect for printing as clean document
 */
@media print {
  .document-page {
    max-width: none;
  }
  
  :deep(.ProseMirror) {
    padding: 0;
    max-width: none;
    font-size: 12pt;
    line-height: 1.5;
  }
  
  .slash-menu {
    min-width: 160px;
  }
}
</style>