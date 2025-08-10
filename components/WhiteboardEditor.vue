<template>
  <div class="whiteboard-editor h-full flex flex-col bg-gray-100">
    <!-- Toolbar -->
    <div class="border-b border-gray-200 p-4 flex items-center gap-4 bg-white">
      <div class="flex items-center gap-2">
        <!-- Tools -->
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="[
            'p-2 rounded transition-colors',
            activeTool === tool.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
          ]"
          :title="tool.name"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" class="fill-current">
            <path :d="tool.icon"/>
          </svg>
        </button>
        
        <div class="h-6 w-px bg-gray-300 mx-2"></div>
        
        <!-- Colors -->
        <div class="flex items-center gap-1">
          <button 
            v-for="color in colors" 
            :key="color"
            @click="selectColor(color)"
            :class="[
              'w-6 h-6 rounded border-2 transition-transform hover:scale-110',
              selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
            ]"
            :style="{ backgroundColor: color }"
            :title="`Color: ${color}`"
          ></button>
        </div>
        
        <div class="h-6 w-px bg-gray-300 mx-2"></div>
        
        <!-- Stroke Width -->
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Size:</label>
          <input
            v-model="strokeWidth"
            type="range"
            min="1"
            max="20"
            class="w-20"
          />
          <span class="text-sm text-gray-600 w-8">{{ strokeWidth }}</span>
        </div>
      </div>
      
      <div class="ml-auto flex items-center gap-2">
        <!-- Actions -->
        <button 
          @click="undo"
          :disabled="!canUndo"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        
        <button 
          @click="redo"
          :disabled="!canRedo"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
        
        <button 
          @click="clearCanvas"
          class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          title="Clear Canvas"
        >
          Clear
        </button>
        
        <button 
          @click="exportImage"
          class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          title="Export as PNG"
        >
          Export
        </button>
      </div>
    </div>
    
    <!-- Canvas Container -->
    <div class="flex-1 relative overflow-hidden">
      <div 
        ref="canvasContainer" 
        class="absolute inset-0 overflow-auto"
        @scroll="handleScroll"
      >
        <div 
          class="relative"
          :style="{ 
            width: canvasWidth + 'px', 
            height: canvasHeight + 'px',
            minWidth: '100%',
            minHeight: '100%'
          }"
        >
          <canvas
            ref="canvas"
            :width="canvasWidth"
            :height="canvasHeight"
            class="absolute top-0 left-0 cursor-crosshair bg-white"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @wheel="handleWheel"
          ></canvas>
        </div>
      </div>
      
      <!-- Zoom Controls -->
      <div class="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded border border-gray-300 p-2">
        <button 
          @click="zoomOut"
          class="p-1 rounded hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            <path fill="currentColor" d="M7 9h5v1H7z"/>
          </svg>
        </button>
        
        <span class="text-sm text-gray-600 min-w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
        
        <button 
          @click="zoomIn"
          class="p-1 rounded hover:bg-gray-100 transition-colors"
          title="Zoom In"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            <path fill="currentColor" d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
          </svg>
        </button>
        
        <button 
          @click="resetZoom"
          class="p-1 rounded hover:bg-gray-100 transition-colors text-xs"
          title="Reset Zoom"
        >
          1:1
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  document: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

// Canvas refs
const canvas = ref(null)
const canvasContainer = ref(null)

// Canvas state
const canvasWidth = ref(2000)
const canvasHeight = ref(2000)
const zoom = ref(1)

// Drawing state
const isDrawing = ref(false)
const activeTool = ref('pen')
const selectedColor = ref('#000000')
const strokeWidth = ref(2)
const lastPoint = ref(null)
const currentPath = ref([])

// History for undo/redo
const history = ref([])
const historyStep = ref(-1)

// Tools configuration
const tools = [
  { id: 'pen', name: 'Pen', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' },
  { id: 'eraser', name: 'Eraser', icon: 'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l8.63-8.63c.79-.78 2.05-.78 2.84 0l1.96 1.97zm-1.41 1.41L12 7.8 4.22 15.58l3.54 3.54L15.54 11.3l-2.83-2.83 2.12-2.12z' },
  { id: 'line', name: 'Line', icon: 'M3 17h18v2H3v-2zM3 5v2h18V5H3z' },
  { id: 'rectangle', name: 'Rectangle', icon: 'M3 3h18v18H3V3zm2 2v14h14V5H5z' },
  { id: 'circle', name: 'Circle', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' }
]

const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff']

// Computed properties
const canUndo = computed(() => historyStep.value >= 0)
const canRedo = computed(() => historyStep.value < history.value.length - 1)

// Canvas context
let ctx = null

// Initialize canvas
onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Load saved canvas data if available
    loadCanvas()
    
    // Save initial state
    saveState()
  }
})

// Watch for document changes
watch(() => props.document.content, (newContent) => {
  if (newContent && newContent !== getCurrentCanvasState()) {
    loadCanvasFromContent(newContent)
  }
}, { deep: true })

// Methods
function selectTool(toolId) {
  activeTool.value = toolId
}

function selectColor(color) {
  selectedColor.value = color
}

function getCanvasPosition(event) {
  const rect = canvas.value.getBoundingClientRect()
  const container = canvasContainer.value
  
  return {
    x: (event.clientX - rect.left + container.scrollLeft) / zoom.value,
    y: (event.clientY - rect.top + container.scrollTop) / zoom.value
  }
}

function startDrawing(event) {
  if (!ctx) return
  
  isDrawing.value = true
  const point = getCanvasPosition(event)
  lastPoint.value = point
  currentPath.value = [point]
  
  ctx.globalCompositeOperation = activeTool.value === 'eraser' ? 'destination-out' : 'source-over'
  ctx.strokeStyle = selectedColor.value
  ctx.lineWidth = strokeWidth.value
  
  if (activeTool.value === 'pen' || activeTool.value === 'eraser') {
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }
}

function draw(event) {
  if (!isDrawing.value || !ctx) return
  
  const point = getCanvasPosition(event)
  
  if (activeTool.value === 'pen' || activeTool.value === 'eraser') {
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    currentPath.value.push(point)
  } else if (activeTool.value === 'line') {
    redrawCanvas()
    drawLine(lastPoint.value, point)
  } else if (activeTool.value === 'rectangle') {
    redrawCanvas()
    drawRectangle(lastPoint.value, point)
  } else if (activeTool.value === 'circle') {
    redrawCanvas()
    drawCircle(lastPoint.value, point)
  }
}

function stopDrawing() {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  
  if (currentPath.value.length > 0) {
    saveState()
    updateDocument()
  }
  
  currentPath.value = []
}

function drawLine(start, end) {
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
}

function drawRectangle(start, end) {
  const width = end.x - start.x
  const height = end.y - start.y
  
  ctx.strokeRect(start.x, start.y, width, height)
}

function drawCircle(start, end) {
  const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
  
  ctx.beginPath()
  ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
  ctx.stroke()
}

function saveState() {
  historyStep.value++
  
  if (historyStep.value < history.value.length) {
    history.value.length = historyStep.value
  }
  
  history.value.push(ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value))
  
  // Limit history to 50 steps
  if (history.value.length > 50) {
    history.value.shift()
    historyStep.value--
  }
}

function undo() {
  if (canUndo.value) {
    historyStep.value--
    restoreState()
  }
}

function redo() {
  if (canRedo.value) {
    historyStep.value++
    restoreState()
  }
}

function restoreState() {
  if (historyStep.value >= 0 && history.value[historyStep.value]) {
    ctx.putImageData(history.value[historyStep.value], 0, 0)
    updateDocument()
  }
}

function redrawCanvas() {
  if (historyStep.value >= 0 && history.value[historyStep.value]) {
    ctx.putImageData(history.value[historyStep.value], 0, 0)
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  saveState()
  updateDocument()
}

function exportImage() {
  const dataURL = canvas.value.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `${props.document.name || 'whiteboard'}.png`
  link.href = dataURL
  link.click()
}

function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.2, 5)
  updateCanvasTransform()
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.2, 0.1)
  updateCanvasTransform()
}

function resetZoom() {
  zoom.value = 1
  updateCanvasTransform()
}

function updateCanvasTransform() {
  if (canvas.value) {
    canvas.value.style.transform = `scale(${zoom.value})`
    canvas.value.style.transformOrigin = '0 0'
  }
}

function handleWheel(event) {
  if (event.ctrlKey) {
    event.preventDefault()
    
    if (event.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }
}

function handleScroll() {
  // Handle infinite canvas scrolling if needed
}

function getCurrentCanvasState() {
  if (!canvas.value) return null
  
  return {
    imageData: canvas.value.toDataURL('image/png'),
    width: canvasWidth.value,
    height: canvasHeight.value
  }
}

function loadCanvas() {
  const savedContent = props.document.content
  if (savedContent && savedContent.imageData) {
    loadCanvasFromContent(savedContent)
  }
}

function loadCanvasFromContent(content) {
  if (!ctx || !content.imageData) return
  
  const img = new Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    ctx.drawImage(img, 0, 0)
    saveState()
  }
  img.src = content.imageData
  
  if (content.width) canvasWidth.value = content.width
  if (content.height) canvasHeight.value = content.height
}

function updateDocument() {
  const content = getCurrentCanvasState()
  emit('update', { ...props.document, content })
}

// Keyboard shortcuts
function handleKeydown(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 'y':
        event.preventDefault()
        redo()
        break
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Auto-save functionality
let autoSaveTimeout = null
function debouncedUpdate() {
  clearTimeout(autoSaveTimeout)
  autoSaveTimeout = setTimeout(updateDocument, 1000)
}

watch([selectedColor, strokeWidth, activeTool], debouncedUpdate)
</script>

<style scoped>
.cursor-crosshair {
  cursor: crosshair;
}

/* Custom scrollbar for canvas container */
.overflow-auto::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.overflow-auto::-webkit-scrollbar-corner {
  background: #f1f1f1;
}
</style>