<template>
  <div class="whiteboard-page">
    <!-- Whiteboard Toolbar -->
    <div class="whiteboard-toolbar">
      <div class="toolbar-section">
        <input 
          v-model="localTitle" 
          @blur="updateTitle"
          class="whiteboard-title"
          placeholder="Untitled Whiteboard"
        />
        <span class="page-type">🎨 Whiteboard</span>
      </div>
      
      <div class="toolbar-section">
        <div class="tool-group">
          <button 
            v-for="tool in tools" 
            :key="tool.id"
            @click="selectedTool = tool.id"
            class="tool-button"
            :class="{ active: selectedTool === tool.id }"
            :title="tool.name"
          >
            {{ tool.icon }}
          </button>
        </div>
        
        <div class="zoom-controls">
          <button @click="zoomOut" class="zoom-button">−</button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button @click="zoomIn" class="zoom-button">+</button>
        </div>
      </div>
    </div>

    <!-- Whiteboard Canvas -->
    <div class="whiteboard-container" ref="container">
      <div 
        class="whiteboard-canvas"
        ref="canvas"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        :style="{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: '0 0'
        }"
      >
        <!-- Grid Background -->
        <div class="grid-background"></div>
        
        <!-- Whiteboard Elements -->
        <div 
          v-for="element in elements" 
          :key="element.id"
          class="whiteboard-element"
          :class="`element-${element.type.toLowerCase()}`"
          :style="getElementStyle(element)"
          @mousedown.stop="selectElement(element)"
        >
          <!-- Shape Elements -->
          <div v-if="element.type === 'SHAPE'" class="shape-element">
            <div 
              class="shape" 
              :class="`shape-${element.content.type}`"
              :style="getShapeStyle(element.content)"
            ></div>
          </div>
          
          <!-- Sticky Note Elements -->
          <div v-else-if="element.type === 'STICKY_NOTE'" class="sticky-note">
            <textarea
              v-model="element.content.text"
              @blur="updateElement(element)"
              class="sticky-text"
              placeholder="Type your note..."
            ></textarea>
          </div>
          
          <!-- Connector Elements -->
          <div v-else-if="element.type === 'CONNECTOR'" class="connector">
            <svg class="connector-svg" :viewBox="`0 0 ${element.content.width} ${element.content.height}`">
              <line
                x1="0"
                y1="0"
                :x2="element.content.width"
                :y2="element.content.height"
                :stroke="element.content.style?.stroke || '#000'"
                :stroke-width="element.content.style?.strokeWidth || 2"
                marker-end="url(#arrowhead)"
              />
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" 
                           :fill="element.content.style?.stroke || '#000'" />
                </marker>
              </defs>
            </svg>
          </div>
          
          <!-- Selection handles -->
          <div v-if="selectedElement?.id === element.id" class="selection-handles">
            <div class="handle handle-nw"></div>
            <div class="handle handle-ne"></div>
            <div class="handle handle-sw"></div>
            <div class="handle handle-se"></div>
          </div>
        </div>
        
        <!-- Drawing Preview -->
        <div v-if="isDrawing && currentElement" class="drawing-preview">
          <div 
            class="preview-element"
            :style="getElementStyle(currentElement)"
          >
            <div 
              v-if="selectedTool === 'rectangle' || selectedTool === 'circle'"
              class="shape"
              :class="`shape-${selectedTool}`"
              :style="getShapeStyle(currentElement.content)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Element Properties Panel -->
    <div v-if="selectedElement" class="properties-panel">
      <h3>Element Properties</h3>
      <div class="property-group">
        <label>Color:</label>
        <input 
          type="color" 
          v-model="selectedElement.content.style.fill"
          @change="updateElement(selectedElement)"
        />
      </div>
      <div class="property-group">
        <label>Border:</label>
        <input 
          type="color" 
          v-model="selectedElement.content.style.stroke"
          @change="updateElement(selectedElement)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PageWithRelations, Block } from '~/types/unified-data-layer'

interface Props {
  page: PageWithRelations
}

interface Emits {
  update: [page: PageWithRelations]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const localTitle = ref(props.page.title)
const elements = ref<Block[]>([])
const selectedElement = ref<Block | null>(null)
const selectedTool = ref('select')
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)

// Drawing state
const isDrawing = ref(false)
const isDragging = ref(false)
const isPanning = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentElement = ref<Block | null>(null)

// Refs
const container = ref<HTMLElement>()
const canvas = ref<HTMLElement>()

// Tools configuration
const tools = [
  { id: 'select', name: 'Select', icon: '↖️' },
  { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
  { id: 'circle', name: 'Circle', icon: '🔵' },
  { id: 'sticky', name: 'Sticky Note', icon: '📝' },
  { id: 'arrow', name: 'Arrow', icon: '➡️' }
]

// Watch for page changes
watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) {
    elements.value = newBlocks.filter(block => 
      ['SHAPE', 'STICKY_NOTE', 'CONNECTOR'].includes(block.type)
    )
  }
}, { immediate: true })

// Mouse event handlers
const handleMouseDown = (event: MouseEvent) => {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return

  const x = (event.clientX - rect.left) / zoom.value - panX.value
  const y = (event.clientY - rect.top) / zoom.value - panY.value

  if (selectedTool.value === 'select') {
    // Start panning if no element is clicked
    isPanning.value = true
    startPoint.value = { x: event.clientX, y: event.clientY }
  } else {
    // Start drawing
    isDrawing.value = true
    startPoint.value = { x, y }
    
    if (selectedTool.value === 'sticky') {
      createStickyNote(x, y)
    } else {
      createShape(x, y)
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isPanning.value) {
    const deltaX = event.clientX - startPoint.value.x
    const deltaY = event.clientY - startPoint.value.y
    panX.value += deltaX / zoom.value
    panY.value += deltaY / zoom.value
    startPoint.value = { x: event.clientX, y: event.clientY }
  } else if (isDrawing.value && currentElement.value) {
    const rect = canvas.value?.getBoundingClientRect()
    if (!rect) return

    const currentX = (event.clientX - rect.left) / zoom.value - panX.value
    const currentY = (event.clientY - rect.top) / zoom.value - panY.value

    const width = Math.abs(currentX - startPoint.value.x)
    const height = Math.abs(currentY - startPoint.value.y)
    const x = Math.min(startPoint.value.x, currentX)
    const y = Math.min(startPoint.value.y, currentY)

    currentElement.value.content = {
      ...currentElement.value.content,
      x,
      y,
      width,
      height
    }
  }
}

const handleMouseUp = () => {
  if (isDrawing.value && currentElement.value) {
    // Save the element
    saveElement(currentElement.value)
    currentElement.value = null
  }
  
  isDrawing.value = false
  isDragging.value = false
  isPanning.value = false
}

// Zoom and pan
const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  if (event.ctrlKey) {
    // Zoom
    const factor = event.deltaY > 0 ? 0.9 : 1.1
    zoom.value = Math.max(0.1, Math.min(3, zoom.value * factor))
  } else {
    // Pan
    panX.value -= event.deltaX / zoom.value
    panY.value -= event.deltaY / zoom.value
  }
}

const zoomIn = () => {
  zoom.value = Math.min(3, zoom.value * 1.2)
}

const zoomOut = () => {
  zoom.value = Math.max(0.1, zoom.value / 1.2)
}

// Element creation
const createShape = (x: number, y: number) => {
  currentElement.value = {
    id: `temp-${Date.now()}`,
    pageId: props.page.id,
    type: 'SHAPE',
    content: {
      type: selectedTool.value,
      x,
      y,
      width: 0,
      height: 0,
      style: {
        fill: '#e5e7eb',
        stroke: '#374151',
        strokeWidth: 2
      }
    },
    position: elements.value.length,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Block
}

const createStickyNote = async (x: number, y: number) => {
  try {
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'STICKY_NOTE',
        content: {
          text: '',
          x,
          y,
          width: 200,
          height: 150,
          style: {
            backgroundColor: '#fbbf24'
          }
        },
        position: elements.value.length
      }
    })

    if (response.success) {
      elements.value.push(response.data)
      selectedElement.value = response.data
    }
  } catch (error) {
    console.error('Failed to create sticky note:', error)
  }
}

// Element management
const selectElement = (element: Block) => {
  selectedElement.value = element
}

const saveElement = async (element: Block) => {
  try {
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: element.type,
        content: element.content,
        position: element.position
      }
    })

    if (response.success) {
      elements.value.push(response.data)
      selectedElement.value = response.data
    }
  } catch (error) {
    console.error('Failed to save element:', error)
  }
}

const updateElement = async (element: Block) => {
  try {
    await $fetch(`/api/blocks/${element.id}`, {
      method: 'PUT',
      body: { content: element.content }
    })
  } catch (error) {
    console.error('Failed to update element:', error)
  }
}

// Style helpers
const getElementStyle = (element: Block) => {
  const { x, y, width, height } = element.content
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`
  }
}

const getShapeStyle = (content: any) => {
  return {
    width: '100%',
    height: '100%',
    backgroundColor: content.style?.fill || '#e5e7eb',
    border: `${content.style?.strokeWidth || 2}px solid ${content.style?.stroke || '#374151'}`,
    borderRadius: content.type === 'circle' ? '50%' : '0'
  }
}

// Update page title
const updateTitle = async () => {
  if (localTitle.value === props.page.title) return

  try {
    const response = await $fetch(`/api/pages/${props.page.id}`, {
      method: 'PUT',
      body: { title: localTitle.value }
    })

    if (response.success) {
      emit('update', response.data)
    }
  } catch (error) {
    console.error('Failed to update title:', error)
    localTitle.value = props.page.title
  }
}
</script>

<style scoped>
.whiteboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme-bg-primary);
  overflow: hidden;
}

.whiteboard-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--theme-border);
  background: var(--theme-surface);
  flex-shrink: 0;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.whiteboard-title {
  font-size: 1.25rem;
  font-weight: 600;
  background: transparent;
  border: none;
  outline: none;
  color: var(--theme-text-primary);
}

.page-type {
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.tool-group {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--theme-hover);
  border-radius: 0.5rem;
}

.tool-button {
  padding: 0.5rem;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.tool-button:hover {
  background: var(--theme-surface);
}

.tool-button.active {
  background: var(--theme-accent);
  color: white;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--theme-border);
  border-radius: 0.25rem;
  background: var(--theme-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.zoom-level {
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 3rem;
  text-align: center;
}

.whiteboard-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #f8fafc;
}

.whiteboard-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: crosshair;
}

.whiteboard-canvas.panning {
  cursor: grab;
}

.whiteboard-canvas.panning:active {
  cursor: grabbing;
}

.grid-background {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
}

.whiteboard-element {
  position: absolute;
  cursor: move;
}

.shape-element,
.shape {
  width: 100%;
  height: 100%;
}

.sticky-note {
  background: #fbbf24;
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
}

.sticky-text {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.4;
}

.connector-svg {
  width: 100%;
  height: 100%;
}

.selection-handles {
  position: absolute;
  inset: -4px;
  pointer-events: none;
  border: 2px solid var(--theme-accent);
  border-radius: 0.25rem;
}

.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--theme-accent);
  border: 1px solid white;
  border-radius: 50%;
  pointer-events: auto;
  cursor: nw-resize;
}

.handle-nw { top: -4px; left: -4px; }
.handle-ne { top: -4px; right: -4px; }
.handle-sw { bottom: -4px; left: -4px; }
.handle-se { bottom: -4px; right: -4px; }

.properties-panel {
  position: absolute;
  top: 5rem;
  right: 1rem;
  width: 200px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: var(--shadow-lg);
}

.properties-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.property-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.property-group label {
  font-size: 0.875rem;
  font-weight: 500;
}

.property-group input[type="color"] {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}
</style>