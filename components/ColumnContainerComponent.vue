<template>
  <div
    class="column-container-wrapper relative"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
  >
    <!-- Column Controls -->
    <div 
      v-if="showControls"
      class="column-controls absolute -top-10 left-0 right-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 z-10"
      :class="{ 'dark:bg-gray-800 dark:border-gray-600': isDarkMode }"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
          {{ node.attrs.columnCount }} Columns
        </span>
        <button
          v-if="node.attrs.columnCount < 6"
          @click="addColumn"
          class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          title="Add Column"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <button
          v-if="node.attrs.columnCount > 1"
          @click="removeLastColumn"
          class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          title="Remove Column"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
          </svg>
        </button>
      </div>
      
      <button
        @click="convertToBlocks"
        class="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
        title="Convert to Blocks"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Column Container -->
    <div 
      ref="containerRef"
      :class="containerClasses"
      data-type="column-container"
      :data-column-count="node.attrs.columnCount"
    >
      <!-- Columns with Drag Handles -->
      <div
        v-for="(column, columnIndex) in columns"
        :key="`column-${columnIndex}`"
        class="column-wrapper relative flex-1 min-w-0"
        @mouseenter="hoveredColumn = columnIndex"
        @mouseleave="hoveredColumn = null"
      >
        <!-- Drag Handle -->
        <div
          v-if="showControls && hoveredColumn === columnIndex && node.attrs.columnCount > 1"
          class="column-drag-handle absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gray-200 hover:bg-gray-300 rounded cursor-grab active:cursor-grabbing flex items-center justify-center z-20"
          :class="{ 'dark:bg-gray-600 dark:hover:bg-gray-500': isDarkMode }"
          @mousedown="startDrag($event, columnIndex)"
          draggable="true"
          @dragstart="handleDragStart($event, columnIndex)"
          @dragover="handleDragOver($event, columnIndex)"
          @drop="handleDrop($event, columnIndex)"
          @dragend="handleDragEnd"
        >
          <svg class="w-3 h-3 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
          </svg>
        </div>

        <!-- Drop Indicator -->
        <div
          v-if="dragState.isDragging && dragState.dropIndex === columnIndex"
          class="absolute inset-0 border-2 border-blue-500 border-dashed bg-blue-50 dark:bg-blue-900/20 rounded-lg z-10 flex items-center justify-center"
        >
          <span class="text-blue-500 font-medium text-sm">Drop here</span>
        </div>

        <!-- Column Content -->
        <div
          class="column-content"
          :class="columnClasses"
          :data-column-index="columnIndex"
        >
          <node-view-content 
            :node="column" 
            :pos="getColumnPos(columnIndex)"
            :editor="editor"
            as="div"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { ref, computed, inject } from 'vue'

// Props from TipTap NodeView
const props = defineProps(nodeViewProps)

// Inject dark mode state (optional)
const isDarkMode = inject('darkMode', false)

// Reactive state
const showControls = ref(false)
const hoveredColumn = ref(null)
const containerRef = ref(null)

const dragState = ref({
  isDragging: false,
  dragIndex: -1,
  dropIndex: -1
})

// Computed properties
const columns = computed(() => {
  const cols = []
  props.node.forEach((child) => {
    if (child.type.name === 'column') {
      cols.push(child)
    }
  })
  return cols
})

const containerClasses = computed(() => [
  'column-container',
  'flex gap-4 p-4 rounded-lg border border-transparent hover:border-gray-200 transition-colors duration-200',
  'md:flex-row max-md:flex-col', // Responsive: row on desktop, column on mobile
])

const columnClasses = computed(() => [
  'column flex-1 min-w-0 p-3 rounded border-l-2 border-transparent hover:border-gray-200 transition-all duration-200',
  'focus-within:border-blue-300 focus-within:bg-blue-50/50',
])

// Methods
function getColumnPos(columnIndex) {
  let pos = props.getPos() + 1
  for (let i = 0; i < columnIndex; i++) {
    pos += columns.value[i].nodeSize
  }
  return pos
}

function addColumn() {
  props.editor.commands.addColumn()
}

function removeLastColumn() {
  const lastIndex = columns.value.length - 1
  props.editor.commands.removeColumn(lastIndex)
}

function convertToBlocks() {
  const tr = props.editor.state.tr
  const pos = props.getPos()
  
  // Extract all content from all columns
  const allContent = []
  columns.value.forEach(column => {
    column.forEach(block => {
      allContent.push(block)
    })
  })
  
  // Replace column container with extracted blocks
  tr.replaceWith(pos, pos + props.node.nodeSize, allContent)
  
  if (props.editor.view.dispatch) {
    props.editor.view.dispatch(tr)
  }
}

// Drag and Drop functionality
function startDrag(event, columnIndex) {
  event.stopPropagation()
  dragState.value = {
    isDragging: true,
    dragIndex: columnIndex,
    dropIndex: -1
  }
}

function handleDragStart(event, columnIndex) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/column-index', columnIndex.toString())
  dragState.value.isDragging = true
  dragState.value.dragIndex = columnIndex
}

function handleDragOver(event, columnIndex) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  dragState.value.dropIndex = columnIndex
}

function handleDrop(event, dropIndex) {
  event.preventDefault()
  
  const dragIndex = parseInt(event.dataTransfer.getData('text/column-index'))
  if (dragIndex === dropIndex || dragIndex < 0) return
  
  // Reorder columns
  reorderColumns(dragIndex, dropIndex)
  handleDragEnd()
}

function handleDragEnd() {
  dragState.value = {
    isDragging: false,
    dragIndex: -1,
    dropIndex: -1
  }
}

function reorderColumns(fromIndex, toIndex) {
  const tr = props.editor.state.tr
  const pos = props.getPos()
  
  // Get all columns
  const columnNodes = [...columns.value]
  
  // Reorder the array
  const [movedColumn] = columnNodes.splice(fromIndex, 1)
  columnNodes.splice(toIndex, 0, movedColumn)
  
  // Create new container with reordered columns
  const newContainer = props.node.type.create(
    props.node.attrs,
    columnNodes
  )
  
  // Replace the container
  tr.replaceWith(pos, pos + props.node.nodeSize, newContainer)
  
  if (props.editor.view.dispatch) {
    props.editor.view.dispatch(tr)
  }
}
</script>

<style scoped>
/* Additional responsive styles */
@media (max-width: 768px) {
  .column-container {
    flex-direction: column;
  }
  
  .column-wrapper {
    min-width: 100%;
  }
  
  .column-drag-handle {
    display: none; /* Hide drag handles on mobile */
  }
}

/* Column content styles */
.column-content :deep(.ProseMirror) {
  outline: none;
  min-height: 2rem;
}

.column-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: 'Type something...';
  float: left;
  height: 0;
  pointer-events: none;
}

/* Drag states */
.column-drag-handle:active {
  transform: translate(-50%, -2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Focus styles */
.column-wrapper:focus-within {
  z-index: 1;
}

.column-wrapper:focus-within .column-content {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}
</style>