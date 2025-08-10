import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ColumnContainerNode from '../extensions/ColumnContainerNode.js'
import ColumnNode from '../extensions/ColumnNode.js'

export function useTipTapEditor(content = '', options = {}) {
  let editorInstance = null
  
  const editor = useEditor({
    content,
    extensions: [
      StarterKit.configure({
        // Disable default heading shortcuts since we're using custom ones
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          if (node.type.name === 'paragraph') {
            return "Type '/' for commands"
          }
          return 'Start typing...'
        },
      }),
      // Our custom column extensions
      ColumnContainerNode,
      ColumnNode,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleKeyDown(view, event) {
        // Handle Shift+Tab for creating column layout
        if (event.shiftKey && event.key === 'Tab') {
          event.preventDefault()
          event.stopPropagation()
          
          // Use the stored editor instance
          if (editorInstance && editorInstance.commands) {
            const result = editorInstance.commands.createColumnLayout()
            return result
          }
          
          return true
        }
        
        return false
      },
    },
    onCreate: ({ editor: createdEditor }) => {
      editorInstance = createdEditor
    },
    onUpdate: ({ editor }) => {
      // Handle content updates
      if (options.onUpdate) {
        options.onUpdate(editor.getHTML())
      }
    },
    ...options,
  })

  return {
    editor
  }
}

// Helper commands for the editor
export const editorCommands = {
  // Create a column layout from current selection
  createColumns: (editor) => {
    return editor.commands.createColumnLayout()
  },

  // Add a column to existing layout
  addColumn: (editor) => {
    return editor.commands.addColumn()
  },

  // Remove a column by index
  removeColumn: (editor, columnIndex) => {
    return editor.commands.removeColumn(columnIndex)
  },

  // Split current column
  splitColumn: (editor) => {
    return editor.commands.splitColumn()
  },

  // Merge with next column
  mergeColumns: (editor) => {
    return editor.commands.mergeWithNextColumn()
  },

  // Check if cursor is in a column
  isInColumn: (editor) => {
    const { selection } = editor.state
    const { $from } = selection

    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'column') {
        return true
      }
    }
    return false
  },

  // Check if cursor is in a column container
  isInColumnContainer: (editor) => {
    const { selection } = editor.state
    const { $from } = selection

    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'columnContainer') {
        return true
      }
    }
    return false
  },
}