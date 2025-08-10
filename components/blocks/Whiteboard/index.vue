<template>
  <div class="whiteboard-block-editor">
    <!-- Whiteboard Interface -->
    <div class="whiteboard-container">
      <!-- Toolbar -->
      <div class="whiteboard-toolbar">
        <div class="toolbar-group">
          <button 
            v-for="tool in tools" 
            :key="tool.id"
            @click="setActiveTool(tool.id)"
            class="tool-btn"
            :class="{ 'tool-btn--active': activeTool === tool.id }"
            :title="tool.name"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
          </button>
        </div>
        
        <div class="toolbar-group">
          <input 
            type="color" 
            v-model="strokeColor" 
            class="color-picker"
            title="Stroke Color"
          />
          <input 
            type="range" 
            v-model="strokeWidth" 
            min="1" 
            max="20" 
            class="stroke-width-slider"
            title="Stroke Width"
          />
        </div>
        
        <div class="toolbar-group">
          <button @click="clearCanvas" class="action-btn" title="Clear Canvas">
            <span class="btn-icon">🗑️</span>
          </button>
          <button @click="undo" class="action-btn" title="Undo">
            <span class="btn-icon">↶</span>
          </button>
          <button @click="redo" class="action-btn" title="Redo">
            <span class="btn-icon">↷</span>
          </button>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="canvas-container" ref="canvasContainer">
        <canvas 
          ref="canvas"
          class="whiteboard-canvas"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
        ></canvas>
        
        <!-- Objects Layer -->
        <div class="objects-layer">
          <div 
            v-for="obj in objects" 
            :key="obj.id"
            class="canvas-object"
            :style="{
              left: obj.x + 'px',
              top: obj.y + 'px',
              width: obj.width + 'px',
              height: obj.height + 'px'
            }"
            @mousedown="selectObject(obj.id)"
          >
            <!-- Text Object -->
            <div 
              v-if="obj.type === 'text'"
              contenteditable
              @input="updateObject(obj.id, 'text', $event.target.textContent)"
              class="text-object"
              :style="{ 
                color: obj.color || '#000000',
                fontSize: obj.fontSize || 16 + 'px',
                fontFamily: obj.fontFamily || 'Arial'
              }"
            >
              {{ obj.text }}
            </div>
            
            <!-- Shape Object -->
            <div 
              v-else-if="obj.type === 'shape'"
              class="shape-object"
              :class="'shape-' + obj.shape"
              :style="{
                backgroundColor: obj.fillColor || 'transparent',
                borderColor: obj.strokeColor || '#000000',
                borderWidth: obj.strokeWidth || 2 + 'px'
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  blockId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update'])

// State
const canvas = ref(null)
const canvasContainer = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const activeTool = ref('pen')
const strokeColor = ref('#000000')
const strokeWidth = ref(2)
const objects = ref(props.data?.objects || [])
const strokes = ref(props.data?.strokes || [])
const history = ref([])
const historyStep = ref(-1)

const tools = ref([
  { id: 'select', name: 'Select', icon: '🖱️' },
  { id: 'pen', name: 'Pen', icon: '✏️' },
  { id: 'eraser', name: 'Eraser', icon: '🧹' },
  { id: 'text', name: 'Text', icon: 'T' },
  { id: 'rectangle', name: 'Rectangle', icon: '▭' },
  { id: 'circle', name: 'Circle', icon: '○' },
  { id: 'arrow', name: 'Arrow', icon: '→' }
])

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function setActiveTool(toolId) {
  activeTool.value = toolId
}

function initCanvas() {
  if (!canvas.value || !canvasContainer.value) return
  
  ctx.value = canvas.value.getContext('2d')
  
  // Set canvas size
  const container = canvasContainer.value
  canvas.value.width = container.clientWidth
  canvas.value.height = container.clientHeight
  
  // Load existing strokes
  redrawCanvas()
}

function startDrawing(event) {
  event.preventDefault()
  
  const rect = canvas.value.getBoundingClientRect()
  const x = (event.clientX || event.touches[0].clientX) - rect.left
  const y = (event.clientY || event.touches[0].clientY) - rect.top
  
  if (activeTool.value === 'pen' || activeTool.value === 'eraser') {
    isDrawing.value = true
    
    const newStroke = {
      id: generateId(),
      tool: activeTool.value,
      color: activeTool.value === 'eraser' ? '#ffffff' : strokeColor.value,
      width: strokeWidth.value,
      points: [{ x, y }]
    }
    
    strokes.value.push(newStroke)
    
    ctx.value.beginPath()
    ctx.value.moveTo(x, y)
    ctx.value.strokeStyle = newStroke.color
    ctx.value.lineWidth = newStroke.width
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
    
    if (activeTool.value === 'eraser') {
      ctx.value.globalCompositeOperation = 'destination-out'
    } else {
      ctx.value.globalCompositeOperation = 'source-over'
    }
  } else if (activeTool.value === 'text') {
    addTextObject(x, y)
  } else if (['rectangle', 'circle'].includes(activeTool.value)) {
    addShapeObject(activeTool.value, x, y)
  }
}

function draw(event) {
  if (!isDrawing.value) return
  
  event.preventDefault()
  
  const rect = canvas.value.getBoundingClientRect()
  const x = (event.clientX || event.touches[0].clientX) - rect.left
  const y = (event.clientY || event.touches[0].clientY) - rect.top
  
  const currentStroke = strokes.value[strokes.value.length - 1]
  currentStroke.points.push({ x, y })
  
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
}

function stopDrawing() {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  ctx.value.globalCompositeOperation = 'source-over'
  
  emitUpdate()
  saveHistory()
}

function addTextObject(x, y) {
  const textObject = {
    id: generateId(),
    type: 'text',
    x: x - 50,
    y: y - 10,
    width: 100,
    height: 20,
    text: 'Text',
    color: strokeColor.value,
    fontSize: 16,
    fontFamily: 'Arial'
  }
  
  objects.value.push(textObject)
  emitUpdate()
  saveHistory()
}

function addShapeObject(shape, x, y) {
  const shapeObject = {
    id: generateId(),
    type: 'shape',
    shape: shape,
    x: x - 50,
    y: y - 25,
    width: 100,
    height: 50,
    fillColor: 'transparent',
    strokeColor: strokeColor.value,
    strokeWidth: strokeWidth.value
  }
  
  objects.value.push(shapeObject)
  emitUpdate()
  saveHistory()
}

function selectObject(objectId) {
  // TODO: Implement object selection
  console.log('Selected object:', objectId)
}

function updateObject(objectId, property, value) {
  const obj = objects.value.find(o => o.id === objectId)
  if (obj) {
    obj[property] = value
    emitUpdate()
  }
}

function clearCanvas() {
  strokes.value = []
  objects.value = []
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  emitUpdate()
  saveHistory()
}

function undo() {
  if (historyStep.value > 0) {
    historyStep.value--
    restoreFromHistory(history.value[historyStep.value])
  }
}

function redo() {
  if (historyStep.value < history.value.length - 1) {
    historyStep.value++
    restoreFromHistory(history.value[historyStep.value])
  }
}

function saveHistory() {
  const state = {
    strokes: JSON.parse(JSON.stringify(strokes.value)),
    objects: JSON.parse(JSON.stringify(objects.value))
  }
  
  if (historyStep.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyStep.value + 1)
  }
  
  history.value.push(state)
  historyStep.value = history.value.length - 1
  
  if (history.value.length > 50) {
    history.value.shift()
    historyStep.value--
  }
}

function restoreFromHistory(state) {
  strokes.value = JSON.parse(JSON.stringify(state.strokes))
  objects.value = JSON.parse(JSON.stringify(state.objects))
  redrawCanvas()
  emitUpdate()
}

function redrawCanvas() {
  if (!ctx.value) return
  
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Redraw all strokes
  strokes.value.forEach(stroke => {
    if (stroke.points.length < 2) return
    
    ctx.value.beginPath()
    ctx.value.moveTo(stroke.points[0].x, stroke.points[0].y)
    ctx.value.strokeStyle = stroke.color
    ctx.value.lineWidth = stroke.width
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
    
    if (stroke.tool === 'eraser') {
      ctx.value.globalCompositeOperation = 'destination-out'
    } else {
      ctx.value.globalCompositeOperation = 'source-over'
    }
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.value.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    
    ctx.value.stroke()
  })
  
  ctx.value.globalCompositeOperation = 'source-over'
}

function emitUpdate() {
  emit('update', {
    strokes: toRaw(strokes.value),
    objects: toRaw(objects.value)
  })
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initCanvas()
    saveHistory()
  })
})

// Handle resize
function handleResize() {
  if (canvas.value && canvasContainer.value) {
    const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
    canvas.value.width = canvasContainer.value.clientWidth
    canvas.value.height = canvasContainer.value.clientHeight
    ctx.value.putImageData(imageData, 0, 0)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.whiteboard-block-editor {
  width: 100%;
  height: 100%;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.whiteboard-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.whiteboard-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background: #e9ecef;
}

.tool-btn--active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.tool-icon {
  font-size: 16px;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
}

.stroke-width-slider {
  width: 80px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
}

.btn-icon {
  font-size: 14px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
}

.whiteboard-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.objects-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.canvas-object {
  position: absolute;
  pointer-events: all;
}

.text-object {
  width: 100%;
  height: 100%;
  outline: none;
  border: 1px dashed transparent;
  padding: 2px;
}

.text-object:focus {
  border-color: #007bff;
}

.shape-object {
  width: 100%;
  height: 100%;
  border: 2px solid;
}

.shape-rectangle {
  /* Rectangle is default */
}

.shape-circle {
  border-radius: 50%;
}
</style>