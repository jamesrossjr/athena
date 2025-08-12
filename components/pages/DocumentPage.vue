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
      // Tab navigation between columns
      'Tab': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        // Check if we're inside a column
        console.log('🔍 Tab: Checking column hierarchy')
        console.log('Current depth:', $from.depth)
        for (let i = 0; i <= $from.depth; i++) {
          const node = $from.node(i)
          console.log(`Level ${i}: ${node.type.name}`)
        }
        
        let inColumns = false
        let columnsDepth = -1
        
        for (let i = 1; i <= $from.depth; i++) {
          if ($from.node(i).type.name === 'columns') {
            inColumns = true
            columnsDepth = i
            console.log('🔍 Found columns at depth:', columnsDepth)
            break
          }
        }
        
        if (inColumns && columnsDepth > 0) {
          console.log('➕ Inside columns - adding new empty column to the right')
          
          const columnsNode = $from.node(columnsDepth)
          const currentParagraph = $from.parent
          
          // Create new columns node with all existing columns plus new empty one
          const existingColumns = []
          columnsNode.forEach(child => {
            existingColumns.push(child)
          })
          
          // Add new empty column
          const emptyParagraph = state.schema.nodes.paragraph.create()
          existingColumns.push(emptyParagraph)
          
          const newColumnsNode = state.schema.nodes.columns.create({}, existingColumns)
          
          // Replace the existing columns with the expanded version
          const columnsPos = $from.before(columnsDepth)
          const columnsEnd = columnsPos + columnsNode.nodeSize
          
          const tr = state.tr.replaceWith(columnsPos, columnsEnd, newColumnsNode)
          
          // Position cursor in the new empty column (last column)
          let targetPos = columnsPos + 1
          for (let i = 0; i < existingColumns.length - 1; i++) {
            targetPos += existingColumns[i].nodeSize
          }
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(targetPos + 1)))
          
          view.dispatch(tr)
          console.log('✅ Added new empty column and moved cursor there')
          return true
        }
        
        // Not in columns - just prevent default tab behavior
        console.log('Tab pressed outside columns - preventing default indent')
        return true // Prevent default
      },
      
      'Shift-Tab': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        // Check if we're already inside a column - if so, navigate left
        let inColumns = false
        let columnsDepth = -1
        
        for (let i = 1; i <= $from.depth; i++) {
          if ($from.node(i).type.name === 'columns') {
            inColumns = true
            columnsDepth = i
            break
          }
        }
        
        if (inColumns && columnsDepth > 0) {
            console.log('🔄 Inside columns - navigating to previous column')
            
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
                console.log(`📍 Currently in column ${i}`)
                break
              }
              currentPos = childEnd
            }
            
            if (currentColumnIndex > 0) {
              // Move to previous column (left)
              let targetPos = columnsPos + 1
              
              // Calculate position of the target column (currentColumnIndex - 1)
              for (let i = 0; i < currentColumnIndex - 1; i++) {
                targetPos += columnsNode.child(i).nodeSize
              }
              
              // Position cursor at start of previous column
              const tr = state.tr.setSelection(state.selection.constructor.near(state.doc.resolve(targetPos + 1)))
              view.dispatch(tr)
              console.log(`⬅️ Moved to column ${currentColumnIndex - 1} at position ${targetPos + 1}`)
              return true
            } else {
              console.log('📍 Already at first column')
            }
            return true
        }
        
        console.log('🎯 Shift+Tab pressed - attempting to add block to column')
        
        // Not in columns - check if current block is a paragraph
        const currentParagraph = $from.parent
        if (currentParagraph.type.name !== 'paragraph') {
          console.log('❌ Not in a paragraph')
          return true
        }
        
        // Get current paragraph position info
        const currentParentPos = $from.before($from.depth)
        const currentStart = currentParentPos
        const currentEnd = currentParentPos + currentParagraph.nodeSize
        
        console.log('Current paragraph info:', {
          content: currentParagraph.textContent,
          start: currentStart,
          end: currentEnd
        })
        
        // Find previous block
        let prevBlock = null
        let prevBlockPos = null
        
        const parent = $from.node($from.depth - 1)
        let currentIndex = -1
        let prevIndex = -1
        
        parent.forEach((child, offset, index) => {
          const childPos = $from.start($from.depth - 1) + offset
          if (childPos === currentStart) {
            currentIndex = index
            prevIndex = index - 1
          }
        })
        
        if (prevIndex >= 0) {
          parent.forEach((child, offset, index) => {
            if (index === prevIndex) {
              prevBlock = child
              prevBlockPos = $from.start($from.depth - 1) + offset
            }
          })
        }
        
        if (!prevBlock || prevBlockPos === null) {
          // No previous block - create a new empty block and make columns
          console.log('➕ No previous block found - creating new empty block for columns')
          
          const emptyParagraph = state.schema.nodes.paragraph.create()
          const columnsContent = [
            state.schema.nodes.paragraph.create({}, currentParagraph.content),
            emptyParagraph
          ]
          
          const newColumnsNode = state.schema.nodes.columns.create({}, columnsContent)
          
          // Replace current paragraph with the new columns
          const tr = state.tr.replaceWith(currentStart, currentEnd, newColumnsNode)
          
          // Position cursor in the second (empty) column
          const firstColumnSize = currentParagraph.nodeSize
          const newCursorPos = currentStart + 1 + firstColumnSize + 1
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
          
          view.dispatch(tr)
          
          // Debug: Check the created structure
          setTimeout(() => {
            console.log('🔍 Checking created columns structure...')
            const columnsElements = document.querySelectorAll('.paper-columns')
            console.log('Found', columnsElements.length, 'column containers')
            columnsElements.forEach((container, index) => {
              console.log(`Container ${index}:`, container)
              console.log('Children:', Array.from(container.children).map(child => child.tagName))
            })
          }, 100)
          
          console.log('✅ Created new columns with empty block + current block')
          return true
        }
        
        console.log('✅ Found previous block:', {
          type: prevBlock.type.name,
          content: prevBlock.type.name === 'paragraph' ? prevBlock.textContent : 'columns'
        })
        
        let newColumnsNode
        
        if (prevBlock.type.name === 'columns') {
          // Check if we just exited from columns - if so, don't create new columns
          console.log('🔍 Previous block is columns - checking if we should add to it or skip')
          
          // Look for the block before the columns to see the pattern
          let blockBeforeColumns = null
          if (prevIndex > 0) {
            parent.forEach((child, offset, index) => {
              if (index === prevIndex - 1) {
                blockBeforeColumns = child
              }
            })
          }
          
          // If there's a pattern of: columns -> paragraph -> current, don't create columns
          // This suggests the user exited columns with Enter, so don't auto-create new ones
          if (blockBeforeColumns && blockBeforeColumns.type.name === 'columns') {
            console.log('📋 Detected pattern: columns -> paragraph -> current. Skipping column creation.')
            return true
          }
          
          // Otherwise, add to existing columns
          console.log('🧩 Adding to existing columns group')
          
          const existingColumns = []
          prevBlock.forEach(child => {
            existingColumns.push(child)
          })
          
          // Add current paragraph as new column
          existingColumns.push(state.schema.nodes.paragraph.create({}, currentParagraph.content))
          
          newColumnsNode = state.schema.nodes.columns.create({}, existingColumns)
          
        } else if (prevBlock.type.name === 'paragraph') {
          // Create new columns with both blocks
          console.log('🔧 Creating new columns with both blocks')
          
          const columnsContent = [
            state.schema.nodes.paragraph.create({}, prevBlock.content),
            state.schema.nodes.paragraph.create({}, currentParagraph.content)
          ]
          
          newColumnsNode = state.schema.nodes.columns.create({}, columnsContent)
        } else {
          console.log('❌ Cannot create columns with this block type')
          return true
        }
        
        if (!newColumnsNode) {
          console.log('❌ Could not create columns node')
          return true // Return true to prevent default browser behavior
        }
        
        // Replace both blocks with the new columns node
        const replaceStart = prevBlockPos
        const replaceEnd = currentEnd
        
        console.log('Replacing from', replaceStart, 'to', replaceEnd)
        
        const tr = state.tr.replaceWith(replaceStart, replaceEnd, newColumnsNode)
        
        // Position cursor in the second column (the one we just added)
        // The structure is: columns > paragraph > text
        // We need to get inside the second paragraph
        const columnsStart = replaceStart
        let targetPos = columnsStart + 1 // Start of columns node
        
        // Find the second paragraph position
        let paragraphCount = 0
        newColumnsNode.descendants((node, pos) => {
          if (node.type.name === 'paragraph') {
            paragraphCount++
            if (paragraphCount === 2) {
              // This is the second paragraph (the one we just added)
              targetPos = columnsStart + pos + 1
              return false // Stop iterating
            }
          }
        })
        
        console.log('Setting cursor position to:', targetPos)
        tr.setSelection(state.selection.constructor.near(tr.doc.resolve(targetPos)))
        
        view.dispatch(tr)
        
        console.log('✅ Block added to column successfully!')
        
        // Debug: Check where cursor ended up (using setTimeout to let TipTap update)
        setTimeout(() => {
          // 'editor' here is the parameter from the keyboard shortcut, not the ref
          const newState = editor.state
          const newSelection = newState.selection
          const $newFrom = newSelection.$from
          console.log('📍 Cursor position after column creation:')
          for (let i = 0; i <= $newFrom.depth; i++) {
            const node = $newFrom.node(i)
            console.log(`  Level ${i}:`, node.type.name)
          }
        }, 10)
        
        return true
      },
      
      // Enter key behavior - create new paragraph WITHIN column
      'Enter': ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('↵ Enter pressed - checking context')
        console.log('Current depth:', $from.depth)
        for (let i = 0; i <= $from.depth; i++) {
          const node = $from.node(i)
          console.log(`Level ${i}: ${node.type.name}`)
        }
        
        // Check if we're inside columns - if so, exit them
        let inColumns = false
        let columnsNode = null
        let columnsDepth = null
        
        for (let i = 0; i <= $from.depth; i++) {
          const node = $from.node(i)
          if (node.type.name === 'columns') {
            inColumns = true
            columnsNode = node
            columnsDepth = i
            console.log('✅ Found columns at level:', i)
            break
          }
        }
        
        if (inColumns && columnsNode && columnsDepth !== null) {
          console.log('🚪 Enter pressed within column - exiting to create new paragraph below')
          
          // Calculate the position of the columns node
          const columnsPos = $from.before(columnsDepth)
          const columnsEnd = columnsPos + columnsNode.nodeSize
          
          console.log('Columns info:', {
            depth: columnsDepth,
            start: columnsPos,
            end: columnsEnd,
            nodeSize: columnsNode.nodeSize
          })
          
          // Create new paragraph after the columns
          const newParagraph = state.schema.nodes.paragraph.create()
          
          // Insert the new paragraph after columns and position cursor there
          const tr = state.tr.insert(columnsEnd, newParagraph)
          
          // Set cursor in the new paragraph
          const newCursorPos = columnsEnd + 1
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
          
          editor.view.dispatch(tr)
          return true
        }
        
        console.log('ℹ️ Not in columns - using default Enter behavior')
        return false // Use default behavior for non-column contexts
      },
      
      // Shift+Enter - EXIT columns and create new paragraph below
      'Shift-Enter': ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        console.log('⏎ Shift+Enter pressed - checking if we need to exit columns')
        console.log('Current depth:', $from.depth)
        
        // Debug: Show the complete node hierarchy
        for (let i = 0; i <= $from.depth; i++) {
          const node = $from.node(i)
          console.log(`Level ${i}:`, node.type.name)
        }
        
        // Check if parent or grandparent is columns
        let inColumns = false
        let columnsNode = null
        let columnsDepth = null
        
        // Check parent first (when cursor is in a paragraph inside columns)
        if ($from.depth >= 1) {
          const parent = $from.node(1)
          console.log('Parent node type:', parent.type.name)
          if (parent.type.name === 'columns') {
            inColumns = true
            columnsNode = parent
            columnsDepth = 1
          }
        }
        
        // If still not found, check grandparent (in case of nested structure)
        if (!inColumns && $from.depth >= 2) {
          const grandparent = $from.node(2)
          console.log('Grandparent node type:', grandparent.type.name)
          if (grandparent.type.name === 'columns') {
            inColumns = true
            columnsNode = grandparent
            columnsDepth = 2
          }
        }
        
        if (inColumns && columnsNode && columnsDepth !== null) {
          console.log('🚪 Shift+Enter pressed within column - exiting to create new paragraph below')
          
          // Calculate the position of the columns node
          const columnsPos = $from.before(columnsDepth)
          const columnsEnd = columnsPos + columnsNode.nodeSize
          
          console.log('Columns info:', {
            depth: columnsDepth,
            start: columnsPos,
            end: columnsEnd,
            nodeSize: columnsNode.nodeSize
          })
          
          // Create new paragraph after the columns
          const newParagraph = state.schema.nodes.paragraph.create()
          
          // Insert the new paragraph after columns and position cursor there
          const tr = state.tr.insert(columnsEnd, newParagraph)
          
          // Set cursor in the new paragraph
          const newCursorPos = columnsEnd + 1
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
          
          view.dispatch(tr)
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
  
  // Clear the slash command from text
  const { state } = editor.value
  const { selection } = state
  const { $from } = selection
  
  // Find the slash position and delete it
  const textBefore = $from.parent.textBetween(0, $from.parentOffset)
  const slashIndex = textBefore.lastIndexOf('/')
  
  if (slashIndex !== -1) {
    const deleteFrom = $from.pos - ($from.parentOffset - slashIndex)
    const deleteTo = $from.pos
    
    editor.value.chain()
      .deleteRange({ from: deleteFrom, to: deleteTo })
      .run()
  }
  
  // Execute the command
  command.command()
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
  const textBefore = $from.parent.textBetween(0, $from.parentOffset)
  const slashMatch = textBefore.match(/(^|\s)\/([a-zA-Z0-9]*)$/)
  
  if (slashMatch) {
    const query = slashMatch[2] || ''
    slashQuery.value = query
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
    display: none;
  }
}
</style>