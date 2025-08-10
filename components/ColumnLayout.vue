<template>
  <div class="column-layout" :data-columns="columns.length">
    <!-- Column Layout Controls -->
    <div 
      v-if="showControls"
      class="column-controls"
      :class="{ 'column-controls--visible': isHovered || isActive }"
    >
      <div class="column-control-group">
        <button
          v-for="i in 6"
          :key="i"
          @click="setColumnCount(i)"
          class="column-count-btn"
          :class="{ 'column-count-btn--active': columns.length === i }"
          :title="`${i} Column${i > 1 ? 's' : ''}`"
        >
          <div class="column-preview">
            <div 
              v-for="col in i" 
              :key="col" 
              class="column-preview-item"
            ></div>
          </div>
          {{ i }}
        </button>
      </div>
      
      <div class="column-actions">
        <button
          @click="addColumn"
          :disabled="columns.length >= 6"
          class="column-action-btn"
          title="Add Column"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <button
          @click="removeColumn"
          :disabled="columns.length <= 1"
          class="column-action-btn"
          title="Remove Column"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
          </svg>
        </button>
        <button
          @click="$emit('delete-columns')"
          class="column-action-btn column-action-btn--danger"
          title="Convert to Single Column"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Column Layout Grid -->
    <div 
      class="column-grid" 
      :class="`column-grid--${columns.length}`"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div
        v-for="(column, columnIndex) in columns"
        :key="`col-${columnIndex}`"
        class="column"
        :class="{
          'column--drop-target': dropState.targetColumn === columnIndex,
          'column--empty': column.blocks.length === 0
        }"
        @dragover="handleDragOver($event, columnIndex)"
        @drop="handleDrop($event, columnIndex)"
      >
        <!-- Column Header -->
        <div class="column-header">
          <div class="column-title">Column {{ columnIndex + 1 }}</div>
          <div class="column-block-count">{{ column.blocks.length }} block{{ column.blocks.length !== 1 ? 's' : '' }}</div>
        </div>

        <!-- Drop Zone for Empty Column -->
        <div 
          v-if="column.blocks.length === 0"
          class="column-drop-zone"
          @dragover="handleDragOver($event, columnIndex, 0)"
          @drop="handleDrop($event, columnIndex, 0)"
        >
          <div class="drop-zone-content">
            <div class="drop-zone-icon">📝</div>
            <div class="drop-zone-text">Drag blocks here</div>
          </div>
        </div>

        <!-- Column Blocks -->
        <div
          v-for="(block, blockIndex) in column.blocks"
          :key="block.id"
          class="column-block"
          :draggable="true"
          @dragstart="handleDragStart($event, columnIndex, blockIndex, block)"
          @dragend="handleDragEnd"
        >
          <!-- Drop Indicator -->
          <div 
            v-if="dropState.targetColumn === columnIndex && dropState.targetIndex === blockIndex"
            class="drop-indicator"
          ></div>

          <!-- Block Content -->
          <div class="block-wrapper">
            <BlockRenderer
              :block="block"
              :block-index="blockIndex"
              :column-index="columnIndex"
              @update="updateBlock"
              @delete="deleteBlock"
              @split="splitBlock"
              @merge="mergeBlocks"
            />
          </div>
        </div>

        <!-- Bottom Drop Zone -->
        <div 
          class="column-drop-zone column-drop-zone--bottom"
          @dragover="handleDragOver($event, columnIndex, column.blocks.length)"
          @drop="handleDrop($event, columnIndex, column.blocks.length)"
        >
          <div class="drop-indicator-line"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import BlockRenderer from './BlockRenderer.vue'

interface Block {
  id: string
  type: string
  content?: string
  items?: string[]
  [key: string]: any
}

interface Column {
  id: string
  blocks: Block[]
}

const props = defineProps<{
  columns: Column[]
  showControls?: boolean
  isActive?: boolean
}>()

const emit = defineEmits<{
  'update-columns': [columns: Column[]]
  'delete-columns': []
  'add-block': [columnIndex: number, blockIndex: number, block: Block]
  'move-block': [fromColumn: number, fromIndex: number, toColumn: number, toIndex: number]
  'delete-block': [columnIndex: number, blockIndex: number]
}>()

// State
const isHovered = ref(false)
const dropState = ref({
  isDragging: false,
  targetColumn: -1,
  targetIndex: -1,
  dragData: null as any
})

// Methods
function setColumnCount(count: number) {
  const newColumns = [...props.columns]
  
  if (count > props.columns.length) {
    // Add empty columns
    for (let i = props.columns.length; i < count; i++) {
      newColumns.push({
        id: generateId(),
        blocks: []
      })
    }
  } else if (count < props.columns.length) {
    // Merge columns into remaining ones
    const removedColumns = newColumns.splice(count)
    const blocksToMove = removedColumns.flatMap(col => col.blocks)
    
    // Distribute blocks across remaining columns
    if (blocksToMove.length > 0) {
      const targetColumnIndex = Math.max(0, count - 1)
      newColumns[targetColumnIndex].blocks.push(...blocksToMove)
    }
  }
  
  emit('update-columns', newColumns)
}

function addColumn() {
  if (props.columns.length < 6) {
    const newColumns = [...props.columns, {
      id: generateId(),
      blocks: []
    }]
    emit('update-columns', newColumns)
  }
}

function removeColumn() {
  if (props.columns.length > 1) {
    const newColumns = [...props.columns]
    const removedColumn = newColumns.pop()
    
    // Move blocks from removed column to the last remaining column
    if (removedColumn && removedColumn.blocks.length > 0) {
      const lastColumn = newColumns[newColumns.length - 1]
      lastColumn.blocks.push(...removedColumn.blocks)
    }
    
    emit('update-columns', newColumns)
  }
}

function handleDragStart(event: DragEvent, columnIndex: number, blockIndex: number, block: Block) {
  if (!event.dataTransfer) return
  
  dropState.value.isDragging = true
  dropState.value.dragData = {
    columnIndex,
    blockIndex,
    block
  }
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'column-block',
    columnIndex,
    blockIndex,
    block
  }))
}

function handleDragOver(event: DragEvent, columnIndex: number, blockIndex?: number) {
  event.preventDefault()
  if (!event.dataTransfer) return
  
  event.dataTransfer.dropEffect = 'move'
  dropState.value.targetColumn = columnIndex
  dropState.value.targetIndex = blockIndex ?? -1
}

function handleDrop(event: DragEvent, columnIndex: number, blockIndex?: number) {
  event.preventDefault()
  if (!event.dataTransfer) return
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'))
    
    if (data.type === 'column-block') {
      const targetIndex = blockIndex ?? props.columns[columnIndex].blocks.length
      emit('move-block', data.columnIndex, data.blockIndex, columnIndex, targetIndex)
    }
  } catch (error) {
    console.error('Error parsing drop data:', error)
  }
  
  handleDragEnd()
}

function handleDragEnd() {
  dropState.value.isDragging = false
  dropState.value.targetColumn = -1
  dropState.value.targetIndex = -1
  dropState.value.dragData = null
}

function updateBlock(columnIndex: number, blockIndex: number, updatedBlock: Block) {
  const newColumns = [...props.columns]
  newColumns[columnIndex].blocks[blockIndex] = updatedBlock
  emit('update-columns', newColumns)
}

function deleteBlock(columnIndex: number, blockIndex: number) {
  emit('delete-block', columnIndex, blockIndex)
}

function splitBlock(columnIndex: number, blockIndex: number, newBlock: Block) {
  emit('add-block', columnIndex, blockIndex + 1, newBlock)
}

function mergeBlocks(columnIndex: number, blockIndex: number) {
  // Implementation for merging with previous block
  if (blockIndex > 0) {
    const newColumns = [...props.columns]
    const column = newColumns[columnIndex]
    const currentBlock = column.blocks[blockIndex]
    const previousBlock = column.blocks[blockIndex - 1]
    
    // Merge content
    if (previousBlock.type === 'paragraph' && currentBlock.type === 'paragraph') {
      previousBlock.content = (previousBlock.content || '') + (currentBlock.content || '')
      column.blocks.splice(blockIndex, 1)
      emit('update-columns', newColumns)
    }
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>
.column-layout {
  position: relative;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.column-layout:hover {
  border-color: #e5e7eb;
}

.app-layout--dark .column-layout:hover {
  border-color: #374151;
}

/* Column Controls */
.column-controls {
  position: absolute;
  top: -50px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.15s ease;
  z-index: 10;
}

.column-controls--visible {
  opacity: 1;
  transform: translateY(0);
}

.app-layout--dark .column-controls {
  background: #1f2937;
  border-color: #374151;
}

.column-control-group {
  display: flex;
  gap: 4px;
}

.column-count-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.column-count-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.column-count-btn--active {
  border-color: #3b82f6;
  background: #dbeafe;
  color: #1d4ed8;
}

.app-layout--dark .column-count-btn {
  background: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

.app-layout--dark .column-count-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
}

.app-layout--dark .column-count-btn--active {
  background: #1e3a8a;
  border-color: #60a5fa;
  color: #93c5fd;
}

.column-preview {
  display: flex;
  gap: 2px;
  width: 24px;
  height: 16px;
}

.column-preview-item {
  flex: 1;
  background: currentColor;
  border-radius: 1px;
  opacity: 0.6;
}

.column-actions {
  display: flex;
  gap: 4px;
}

.column-action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.column-action-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.column-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.column-action-btn--danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.column-action-btn svg {
  width: 16px;
  height: 16px;
}

.app-layout--dark .column-action-btn {
  background: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

/* Column Grid */
.column-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.column-grid--1 { grid-template-columns: 1fr; }
.column-grid--2 { grid-template-columns: 1fr 1fr; }
.column-grid--3 { grid-template-columns: repeat(3, 1fr); }
.column-grid--4 { grid-template-columns: repeat(4, 1fr); }
.column-grid--5 { grid-template-columns: repeat(5, 1fr); }
.column-grid--6 { grid-template-columns: repeat(6, 1fr); }

/* Columns */
.column {
  position: relative;
  min-height: 120px;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.column--drop-target {
  border-color: #3b82f6;
  background: #dbeafe;
}

.app-layout--dark .column--drop-target {
  border-color: #60a5fa;
  background: #1e3a8a;
}

.column--empty {
  border-color: #e5e7eb;
  border-style: dashed;
}

.app-layout--dark .column--empty {
  border-color: #4b5563;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 8px;
}

.app-layout--dark .column-header {
  border-bottom-color: #374151;
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.app-layout--dark .column-title {
  color: #d1d5db;
}

.column-block-count {
  font-size: 12px;
  color: #9ca3af;
}

.app-layout--dark .column-block-count {
  color: #6b7280;
}

/* Drop Zones */
.column-drop-zone {
  min-height: 40px;
  border: 2px dashed transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.column-drop-zone--bottom {
  margin-top: 8px;
  min-height: 20px;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
}

.drop-zone-icon {
  font-size: 24px;
  opacity: 0.5;
}

.drop-zone-text {
  font-size: 14px;
  font-weight: 500;
}

.drop-indicator,
.drop-indicator-line {
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
  margin: 4px 0;
}

/* Column Blocks */
.column-block {
  position: relative;
  margin-bottom: 8px;
  cursor: grab;
}

.column-block:active {
  cursor: grabbing;
}

.block-wrapper {
  position: relative;
}

/* Responsive Design */
@media (max-width: 768px) {
  .column-grid--3,
  .column-grid--4,
  .column-grid--5,
  .column-grid--6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .column-grid--2,
  .column-grid--3,
  .column-grid--4,
  .column-grid--5,
  .column-grid--6 {
    grid-template-columns: 1fr;
  }
  
  .column-controls {
    position: static;
    margin-bottom: 16px;
    opacity: 1;
    transform: none;
  }
}
</style>