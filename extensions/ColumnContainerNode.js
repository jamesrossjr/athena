import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ColumnContainerComponent from '../components/ColumnContainerComponent.vue'

export default Node.create({
  name: 'columnContainer',

  group: 'block',

  content: 'column+',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      columnCount: {
        default: 2,
        parseHTML: element => parseInt(element.getAttribute('data-column-count')) || 2,
        renderHTML: attributes => {
          return {
            'data-column-count': attributes.columnCount,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column-container"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column-container',
        'class': 'column-container flex flex-row gap-4 md:flex-row max-md:flex-col',
      }),
      0,
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(ColumnContainerComponent)
  },

  addCommands() {
    return {
      setColumnContainer: (attributes) => ({ commands }) => {
        return commands.setNode(this.name, attributes)
      },
      
      unsetColumnContainer: () => ({ commands }) => {
        return commands.lift(this.name)
      },

      createColumnLayout: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        // Don't create columns if we're already in a column container
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === 'columnContainer') {
            return false
          }
        }

        // Find the current block to convert
        let targetDepth = $from.depth
        let targetNode = $from.node(targetDepth)
        let targetPos = $from.before(targetDepth)

        // Make sure we're targeting a block-level node
        while (targetDepth > 0 && targetNode.type.group !== 'block') {
          targetDepth--
          targetNode = $from.node(targetDepth)
          targetPos = $from.before(targetDepth)
        }

        if (targetDepth === 0) return false

        // Create the column container with two columns
        const firstColumn = state.schema.nodes.column.create({}, [targetNode])
        const secondColumn = state.schema.nodes.column.create({}, [
          state.schema.nodes.paragraph.create({})
        ])

        const columnContainer = state.schema.nodes.columnContainer.create(
          { columnCount: 2 },
          [firstColumn, secondColumn]
        )

        if (dispatch) {
          // Replace the current block with the column container
          tr.replaceWith(targetPos, targetPos + targetNode.nodeSize, columnContainer)
          
          // Set cursor in the second column's paragraph
          const newPos = targetPos + firstColumn.nodeSize + 2 // +2 for column wrapper
          const resolvedPos = tr.doc.resolve(newPos)
          tr.setSelection(state.selection.constructor.near(resolvedPos))
        }

        return true
      },

      addColumn: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        // Find the column container
        let columnContainer = null
        let containerPos = null

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'columnContainer') {
            columnContainer = node
            containerPos = $from.before(depth)
            break
          }
        }

        if (!columnContainer) return false

        // Don't add more than 6 columns
        if (columnContainer.childCount >= 6) return false

        const newColumn = state.schema.nodes.column.create({}, [
          state.schema.nodes.paragraph.create()
        ])

        const newContainer = columnContainer.copy([
          ...columnContainer.content.content,
          newColumn
        ])

        // Update column count attribute
        const newAttrs = { ...columnContainer.attrs, columnCount: columnContainer.childCount + 1 }
        const updatedContainer = newContainer.type.create(newAttrs, newContainer.content)

        if (dispatch) {
          tr.replaceWith(containerPos, containerPos + columnContainer.nodeSize, updatedContainer)
        }

        return true
      },

      removeColumn: (columnIndex) => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { $from } = selection

        // Find the column container
        let columnContainer = null
        let containerPos = null

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'columnContainer') {
            columnContainer = node
            containerPos = $from.before(depth)
            break
          }
        }

        if (!columnContainer || columnContainer.childCount <= 1) return false

        const columns = []
        columnContainer.forEach((child, offset, index) => {
          if (index !== columnIndex) {
            columns.push(child)
          }
        })

        const newContainer = columnContainer.copy(columns)
        const newAttrs = { ...columnContainer.attrs, columnCount: columns.length }
        const updatedContainer = newContainer.type.create(newAttrs, newContainer.content)

        if (dispatch) {
          tr.replaceWith(containerPos, containerPos + columnContainer.nodeSize, updatedContainer)
        }

        return true
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-2': () => {
        return this.editor.commands.createColumnLayout()
      },
    }
  },
})