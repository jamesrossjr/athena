import { Node, mergeAttributes } from '@tiptap/core'

export default Node.create({
  name: 'column',

  content: 'block+',

  defining: true,

  isolating: false,

  addAttributes() {
    return {
      width: {
        default: 'auto',
        parseHTML: element => element.style.width || 'auto',
        renderHTML: attributes => {
          if (attributes.width === 'auto') {
            return {}
          }
          return {
            style: `width: ${attributes.width}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column',
        'class': 'column flex-1 min-w-0 p-2 border-l-2 border-transparent hover:border-gray-200 transition-colors duration-200',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setColumn: (attributes) => ({ commands }) => {
        return commands.setNode(this.name, attributes)
      },
      
      splitColumn: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        // Find the current column and container
        let columnDepth = null
        let containerDepth = null

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'column' && columnDepth === null) {
            columnDepth = depth
          }
          if (node.type.name === 'columnContainer' && containerDepth === null) {
            containerDepth = depth
            break
          }
        }

        if (columnDepth === null || containerDepth === null) return false

        const container = $from.node(containerDepth)
        const currentColumn = $from.node(columnDepth)
        const columnIndex = $from.index(containerDepth)

        // Don't split if we already have 6 columns
        if (container.childCount >= 6) return false

        // Create new empty column
        const newColumn = state.schema.nodes.column.create({}, [
          state.schema.nodes.paragraph.create()
        ])

        // Rebuild container with new column inserted
        const columns = []
        container.forEach((child, offset, index) => {
          columns.push(child)
          if (index === columnIndex) {
            columns.push(newColumn)
          }
        })

        const newContainer = container.copy(columns)
        const newAttrs = { ...container.attrs, columnCount: columns.length }
        const updatedContainer = newContainer.type.create(newAttrs, newContainer.content)

        if (dispatch) {
          const containerPos = $from.before(containerDepth)
          tr.replaceWith(containerPos, containerPos + container.nodeSize, updatedContainer)
        }

        return true
      },

      mergeWithNextColumn: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        // Find the current column and container
        let columnDepth = null
        let containerDepth = null

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'column' && columnDepth === null) {
            columnDepth = depth
          }
          if (node.type.name === 'columnContainer' && containerDepth === null) {
            containerDepth = depth
            break
          }
        }

        if (columnDepth === null || containerDepth === null) return false

        const container = $from.node(containerDepth)
        const columnIndex = $from.index(containerDepth)

        // Can't merge if this is the last column or only one column
        if (columnIndex >= container.childCount - 1 || container.childCount <= 1) return false

        const currentColumn = $from.node(columnDepth)
        const nextColumn = container.child(columnIndex + 1)

        // Merge content from next column into current column
        const mergedContent = [
          ...currentColumn.content.content,
          ...nextColumn.content.content
        ]

        const mergedColumn = currentColumn.copy(mergedContent)

        // Rebuild container without the next column
        const columns = []
        container.forEach((child, offset, index) => {
          if (index === columnIndex) {
            columns.push(mergedColumn)
          } else if (index !== columnIndex + 1) {
            columns.push(child)
          }
        })

        const newContainer = container.copy(columns)
        const newAttrs = { ...container.attrs, columnCount: columns.length }
        const updatedContainer = newContainer.type.create(newAttrs, newContainer.content)

        if (dispatch) {
          const containerPos = $from.before(containerDepth)
          tr.replaceWith(containerPos, containerPos + container.nodeSize, updatedContainer)
        }

        return true
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-Right': () => this.editor.commands.splitColumn(),
      'Mod-Shift-Left': () => this.editor.commands.mergeWithNextColumn(),
    }
  },
})