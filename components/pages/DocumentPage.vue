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
 * CUSTOM NODE: Invisible Columns Container
 * 
 * Creates a flexbox container that renders child blocks side-by-side
 * with no visible UI chrome - appears as seamless content
 */
const ColumnsNode = Node.create({
  name: 'columns',
  
  group: 'block',
  content: 'block+',
  
  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'columns',
      'class': 'paper-columns'
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
      'Shift-Tab': ({ editor }) => {
        console.log('🎯 Shift+Tab pressed - attempting to create columns')
        
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection
        
        // Find current paragraph
        const currentParagraph = $from.parent
        if (currentParagraph.type.name !== 'paragraph') {
          console.log('❌ Not in a paragraph')
          return false
        }
        
        // Find position of current paragraph
        const currentPos = $from.start() - 1
        
        // Look for previous paragraph
        let prevParagraphPos = null
        let prevParagraph = null
        
        // Walk backwards to find previous paragraph
        for (let pos = currentPos - 1; pos >= 0; pos--) {
          const node = state.doc.nodeAt(pos)
          if (node && node.type.name === 'paragraph') {
            prevParagraphPos = pos
            prevParagraph = node
            break
          }
        }
        
        if (!prevParagraph || prevParagraphPos === null) {
          console.log('❌ No previous paragraph found')
          return false
        }
        
        console.log('✅ Found paragraphs to columnize:', {
          prev: prevParagraph.textContent,
          current: currentParagraph.textContent
        })
        
        // Create columns node
        const columnsContent = [
          state.schema.nodes.paragraph.create({}, prevParagraph.content),
          state.schema.nodes.paragraph.create({}, currentParagraph.content)
        ]
        
        const columnsNode = state.schema.nodes.columns.create({}, columnsContent)
        
        // Calculate positions for replacement
        const startPos = prevParagraphPos
        const endPos = $from.end() + 1
        
        console.log('📍 Replacing positions:', { startPos, endPos })
        
        // Create and apply transaction
        const tr = state.tr.replaceWith(startPos, endPos, columnsNode)
        
        // Position cursor in first column
        const newCursorPos = startPos + 2
        tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newCursorPos)))
        
        view.dispatch(tr)
        
        console.log('✅ Columns created successfully!')
        return true
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
    },
    
    onCreate: () => {
      console.log('📄 Document page editor created for:', props.page.title)
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
  max-width: 65rem;
  margin-left: auto;
  margin-right: auto;
  
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