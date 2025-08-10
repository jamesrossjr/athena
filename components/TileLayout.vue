<template>
  <div class="tile-layout" :class="`tile-layout--${layout.type}`">
    <!-- Single Pane -->
    <div v-if="layout.type === 'single'" class="tile-pane tile-pane--full">
      <TilePane
        :pane="layout.panes[0]"
        :documents="documents"
        :isActive="true"
        @select-tab="selectTab"
        @close-tab="closeTab"
        @move-tab="moveTab"
      />
    </div>
    
    <!-- Split Horizontal -->
    <div v-else-if="layout.type === 'split-horizontal'" class="tile-split tile-split--horizontal">
      <div
        v-for="(pane, index) in layout.panes"
        :key="pane.id"
        class="tile-pane"
        :style="{ width: `${pane.width || 50}%` }"
      >
        <TilePane
          :pane="pane"
          :documents="documents"
          :isActive="activePaneId === pane.id"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @focus="activePaneId = pane.id"
        />
        
        <!-- Resize Handle -->
        <div
          v-if="index < layout.panes.length - 1"
          class="tile-resize tile-resize--vertical"
          @mousedown="startResize('horizontal', index)"
        ></div>
      </div>
    </div>
    
    <!-- Split Vertical -->
    <div v-else-if="layout.type === 'split-vertical'" class="tile-split tile-split--vertical">
      <div
        v-for="(pane, index) in layout.panes"
        :key="pane.id"
        class="tile-pane"
        :style="{ height: `${pane.height || 50}%` }"
      >
        <TilePane
          :pane="pane"
          :documents="documents"
          :isActive="activePaneId === pane.id"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @focus="activePaneId = pane.id"
        />
        
        <!-- Resize Handle -->
        <div
          v-if="index < layout.panes.length - 1"
          class="tile-resize tile-resize--horizontal"
          @mousedown="startResize('vertical', index)"
        ></div>
      </div>
    </div>
    
    <!-- Grid 2x2 -->
    <div v-else-if="layout.type === 'grid-2x2'" class="tile-grid tile-grid--2x2">
      <div
        v-for="pane in layout.panes"
        :key="pane.id"
        class="tile-pane"
      >
        <TilePane
          :pane="pane"
          :documents="documents"
          :isActive="activePaneId === pane.id"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @focus="activePaneId = pane.id"
        />
      </div>
    </div>
    
    <!-- Grid 3x3 -->
    <div v-else-if="layout.type === 'grid-3x3'" class="tile-grid tile-grid--3x3">
      <div
        v-for="pane in layout.panes"
        :key="pane.id"
        class="tile-pane"
      >
        <TilePane
          :pane="pane"
          :documents="documents"
          :isActive="activePaneId === pane.id"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @focus="activePaneId = pane.id"
        />
      </div>
    </div>
    
    <!-- Custom Grid -->
    <div v-else-if="layout.type === 'custom' && layout.customLayout" class="tile-grid tile-grid--custom"
      :style="{
        '--grid-rows': layout.customLayout.rows,
        '--grid-cols': layout.customLayout.cols
      }"
    >
      <div
        v-for="position in layout.customLayout.panePositions"
        :key="position.paneId"
        class="tile-pane"
        :style="{
          gridRow: `${position.row} / span ${position.rowSpan || 1}`,
          gridColumn: `${position.col} / span ${position.colSpan || 1}`
        }"
      >
        <TilePane
          :pane="getPaneById(position.paneId)"
          :documents="documents"
          :isActive="activePaneId === position.paneId"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @move-tab="moveTab"
          @focus="activePaneId = position.paneId"
        />
      </div>
    </div>
    
    <!-- Tile Controls -->
    <div class="tile-controls">
      <button
        @click="$emit('change-layout', 'single')"
        class="tile-control"
        :class="{ 'tile-control--active': layout.type === 'single' }"
        title="Single View"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/>
        </svg>
      </button>
      
      <button
        @click="$emit('change-layout', 'split-horizontal')"
        class="tile-control"
        :class="{ 'tile-control--active': layout.type === 'split-horizontal' }"
        title="Split Horizontal"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-width="2" d="M12 4v16M4 4h16v16H4z"/>
        </svg>
      </button>
      
      <button
        @click="$emit('change-layout', 'split-vertical')"
        class="tile-control"
        :class="{ 'tile-control--active': layout.type === 'split-vertical' }"
        title="Split Vertical"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-width="2" d="M4 12h16M4 4h16v16H4z"/>
        </svg>
      </button>
      
      <button
        @click="$emit('change-layout', 'grid-2x2')"
        class="tile-control"
        :class="{ 'tile-control--active': layout.type === 'grid-2x2' }"
        title="Grid 2x2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-width="2" d="M4 4h16v16H4zM12 4v16M4 12h16"/>
        </svg>
      </button>
      
      <button
        @click="$emit('change-layout', 'grid-3x3')"
        class="tile-control"
        :class="{ 'tile-control--active': layout.type === 'grid-3x3' }"
        title="Grid 3x3"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-width="2" d="M4 4h16v16H4zM10 4v16M14 4v16M4 10h16M4 14h16"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TileLayout as TileLayoutType, TilePane as TilePaneType, Document } from '~/stores/workspace'
import TilePane from './TilePane.vue'

const props = defineProps<{
  layout: TileLayoutType
  documents: Document[]
}>()

const emit = defineEmits<{
  'change-layout': [type: TileLayoutType['type']]
  'resize-pane': [paneId: string, size: number]
  'select-tab': [tabId: string]
  'close-tab': [tabId: string]
  'move-tab': [tabId: string, toPaneId: string]
}>()

const activePaneId = ref<string>('')
const resizing = ref({
  active: false,
  direction: '' as 'horizontal' | 'vertical',
  paneIndex: 0,
  startPos: 0,
  startSize1: 0,
  startSize2: 0
})

function getPaneById(paneId: string): TilePaneType | undefined {
  return props.layout.panes.find(p => p.id === paneId)
}

function selectTab(tabId: string) {
  emit('select-tab', tabId)
}

function closeTab(tabId: string) {
  emit('close-tab', tabId)
}

function moveTab(tabId: string, toPaneId: string) {
  emit('move-tab', tabId, toPaneId)
}

function startResize(direction: 'horizontal' | 'vertical', paneIndex: number) {
  const pane1 = props.layout.panes[paneIndex]
  const pane2 = props.layout.panes[paneIndex + 1]
  
  resizing.value = {
    active: true,
    direction,
    paneIndex,
    startPos: direction === 'horizontal' ? event.clientX : event.clientY,
    startSize1: direction === 'horizontal' ? (pane1.width || 50) : (pane1.height || 50),
    startSize2: direction === 'horizontal' ? (pane2.width || 50) : (pane2.height || 50)
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', endResize)
  document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
}

function handleResize(event: MouseEvent) {
  if (!resizing.value.active) return
  
  const { direction, paneIndex, startPos, startSize1, startSize2 } = resizing.value
  const currentPos = direction === 'horizontal' ? event.clientX : event.clientY
  const delta = currentPos - startPos
  const containerSize = direction === 'horizontal' 
    ? document.querySelector('.tile-split')?.clientWidth || 800
    : document.querySelector('.tile-split')?.clientHeight || 600
  
  const deltaPercent = (delta / containerSize) * 100
  const newSize1 = Math.max(10, Math.min(90, startSize1 + deltaPercent))
  const newSize2 = Math.max(10, Math.min(90, startSize2 - deltaPercent))
  
  const pane1 = props.layout.panes[paneIndex]
  const pane2 = props.layout.panes[paneIndex + 1]
  
  if (direction === 'horizontal') {
    pane1.width = newSize1
    pane2.width = newSize2
  } else {
    pane1.height = newSize1
    pane2.height = newSize2
  }
}

function endResize() {
  resizing.value.active = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', endResize)
  document.body.style.cursor = ''
}
</script>

<style scoped>
.tile-layout {
  position: relative;
  height: 100%;
  display: flex;
}

/* Single Pane */
.tile-pane--full {
  width: 100%;
  height: 100%;
}

/* Split Layouts */
.tile-split {
  display: flex;
  width: 100%;
  height: 100%;
}

.tile-split--horizontal {
  flex-direction: row;
}

.tile-split--vertical {
  flex-direction: column;
}

.tile-pane {
  position: relative;
  overflow: hidden;
}

/* Grid Layouts */
.tile-grid {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 0.25rem;
}

.tile-grid--2x2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.tile-grid--3x3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
}

.tile-grid--custom {
  grid-template-columns: repeat(var(--grid-cols), 1fr);
  grid-template-rows: repeat(var(--grid-rows), 1fr);
}

/* Resize Handles */
.tile-resize {
  position: absolute;
  z-index: 10;
  background-color: rgb(209 213 219);
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tile-resize:hover {
  background-color: rgb(59 130 246);
}

.dark .tile-resize {
  background-color: rgb(75 85 99);
}

.dark .tile-resize:hover {
  background-color: rgb(59 130 246);
}

.tile-resize--vertical {
  top: 0;
  right: 0;
  width: 0.25rem;
  height: 100%;
  cursor: col-resize;
}

.tile-resize--horizontal {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  cursor: row-resize;
}

/* Tile Controls */
.tile-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 20;
  display: flex;
  gap: 0.25rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.25rem;
}

.dark .tile-controls {
  background-color: rgb(31 41 55);
}

.tile-control {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tile-control:hover {
  background-color: rgb(243 244 246);
}

.dark .tile-control:hover {
  background-color: rgb(55 65 81);
}

.tile-control--active {
  background-color: rgb(219 234 254);
  color: rgb(37 99 235);
}

.dark .tile-control--active {
  background-color: rgb(30 58 138);
  color: rgb(96 165 250);
}
</style>