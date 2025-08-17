<template>
  <div class="spatial-knowledge-graph h-full w-full relative overflow-hidden">
    <!-- WebXR Spatial Interface -->
    <div
      ref="spatialContainer"
      class="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @wheel="handleWheel"
    >
      <!-- 3D Canvas for Knowledge Graph -->
      <canvas
        ref="spatialCanvas"
        class="w-full h-full"
        :width="canvasWidth"
        :height="canvasHeight"
      />

      <!-- AR/VR Overlay UI -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Spatial Menu -->
        <div
          v-if="showSpatialMenu"
          class="absolute top-10 left-10 bg-black/80 backdrop-blur rounded-xl p-4 pointer-events-auto"
          style="transform: perspective(1000px) rotateX(-10deg) rotateY(5deg);"
        >
          <h3 class="text-white font-bold mb-3">Knowledge Navigator</h3>
          <div class="space-y-2">
            <button
              v-for="mode in spatialModes"
              :key="mode.id"
              class="w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              :class="{ 'bg-white/20 text-white': currentMode === mode.id }"
              @click="changeSpatialMode(mode.id)"
            >
              <div class="flex items-center gap-2">
                <UIcon :name="mode.icon" class="w-4 h-4" />
                <span class="text-sm">{{ mode.name }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Node Information Panel -->
        <div
          v-if="selectedNode"
          class="absolute top-10 right-10 bg-black/80 backdrop-blur rounded-xl p-6 max-w-md pointer-events-auto"
          style="transform: perspective(1000px) rotateX(-5deg) rotateY(-5deg);"
        >
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-white font-bold">{{ selectedNode.title }}</h3>
            <UButton variant="ghost" icon="i-heroicons-x-mark" @click="selectedNode = null" />
          </div>
          
          <div class="text-white/80 space-y-3">
            <div>
              <span class="text-xs uppercase tracking-wide text-white/60">Type</span>
              <div class="capitalize">{{ selectedNode.type }}</div>
            </div>
            
            <div v-if="selectedNode.content">
              <span class="text-xs uppercase tracking-wide text-white/60">Preview</span>
              <div class="text-sm line-clamp-3">{{ selectedNode.content }}</div>
            </div>
            
            <div v-if="selectedNode.connections.length > 0">
              <span class="text-xs uppercase tracking-wide text-white/60">Connections</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="conn in selectedNode.connections.slice(0, 5)"
                  :key="conn.id"
                  class="px-2 py-1 bg-white/10 rounded-full text-xs"
                >
                  {{ conn.title }}
                </span>
                <span
                  v-if="selectedNode.connections.length > 5"
                  class="px-2 py-1 bg-white/10 rounded-full text-xs"
                >
                  +{{ selectedNode.connections.length - 5 }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <UButton size="sm" @click="openInEditor(selectedNode)">
              <template #leading>
                <UIcon name="i-heroicons-pencil" />
              </template>
              Edit
            </UButton>
            <UButton size="sm" variant="ghost" @click="expandNode(selectedNode)">
              <template #leading>
                <UIcon name="i-heroicons-arrows-pointing-out" />
              </template>
              Expand
            </UButton>
          </div>
        </div>

        <!-- VR Hand Tracking Indicators -->
        <div
          v-if="vrMode && handTracking.enabled"
          class="absolute bottom-10 left-10 flex gap-4"
        >
          <div
            v-for="hand in ['left', 'right']"
            :key="hand"
            class="bg-black/60 backdrop-blur rounded-lg p-3"
          >
            <div class="text-white/80 text-xs uppercase tracking-wide mb-2">{{ hand }} Hand</div>
            <div class="flex items-center gap-2">
              <div 
                class="w-3 h-3 rounded-full"
                :class="handTracking[hand].detected ? 'bg-green-400' : 'bg-red-400'"
              />
              <span class="text-white text-sm">
                {{ handTracking[hand].detected ? 'Tracked' : 'Lost' }}
              </span>
            </div>
            <div v-if="handTracking[hand].gesture" class="text-white/60 text-xs mt-1">
              Gesture: {{ handTracking[hand].gesture }}
            </div>
          </div>
        </div>

        <!-- Spatial Search Interface -->
        <div
          v-if="showSpatialSearch"
          class="absolute bottom-10 right-10 bg-black/80 backdrop-blur rounded-xl p-4 w-80 pointer-events-auto"
        >
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-white" />
            <span class="text-white font-medium">Spatial Search</span>
          </div>
          
          <UInput
            v-model="spatialSearchQuery"
            placeholder="Search knowledge space..."
            class="mb-3"
            @keydown.enter="performSpatialSearch"
          />
          
          <div class="flex gap-2">
            <UButton size="sm" @click="performSpatialSearch">Search</UButton>
            <UButton size="sm" variant="ghost" @click="clearSpatialSearch">Clear</UButton>
          </div>

          <div v-if="spatialSearchResults.length > 0" class="mt-3 space-y-2">
            <div
              v-for="result in spatialSearchResults.slice(0, 5)"
              :key="result.id"
              class="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
              @click="navigateToNode(result)"
            >
              <div class="text-white font-medium text-sm">{{ result.title }}</div>
              <div class="text-white/60 text-xs">{{ result.type }}</div>
            </div>
          </div>
        </div>

        <!-- Controls Help -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur rounded-lg px-4 py-2">
          <div class="text-white/80 text-xs space-x-4">
            <span>🖱️ Click & Drag: Navigate</span>
            <span>🎯 Double Click: Select</span>
            <span>⚡ Scroll: Zoom</span>
            <span v-if="vrMode">👋 Hand Gestures: Interact</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enter VR Mode Button -->
    <UButton
      v-if="webXRSupported && !vrMode"
      class="absolute top-4 right-4 z-50"
      @click="enterVRMode"
    >
      <template #leading>
        <UIcon name="i-heroicons-eye" />
      </template>
      Enter VR
    </UButton>

    <!-- Exit VR Mode Button -->
    <UButton
      v-if="vrMode"
      class="absolute top-4 right-4 z-50"
      variant="ghost"
      @click="exitVRMode"
    >
      <template #leading>
        <UIcon name="i-heroicons-x-mark" />
      </template>
      Exit VR
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface SpatialNode {
  id: string
  title: string
  type: 'document' | 'concept' | 'person' | 'project' | 'tag'
  content?: string
  position: { x: number; y: number; z: number }
  scale: number
  color: string
  connections: Array<{
    id: string
    title: string
    type: string
    strength: number
  }>
  metadata: {
    lastModified: Date
    accessCount: number
    importance: number
  }
}

interface SpatialMode {
  id: string
  name: string
  icon: string
  description: string
}

// Reactive state
const spatialContainer = ref<HTMLElement>()
const spatialCanvas = ref<HTMLCanvasElement>()
const canvasWidth = ref(800)
const canvasHeight = ref(600)
const selectedNode = ref<SpatialNode | null>(null)
const showSpatialMenu = ref(true)
const showSpatialSearch = ref(false)
const spatialSearchQuery = ref('')
const spatialSearchResults = ref<SpatialNode[]>([])
const currentMode = ref('galaxy')

// WebXR state
const webXRSupported = ref(false)
const vrMode = ref(false)
const handTracking = ref({
  enabled: false,
  left: { detected: false, gesture: null },
  right: { detected: false, gesture: null }
})

// Camera and interaction state
const camera = ref({
  position: { x: 0, y: 0, z: 10 },
  rotation: { x: 0, y: 0, z: 0 },
  fov: 75
})

const interaction = ref({
  isDragging: false,
  lastPointer: { x: 0, y: 0 },
  dragStart: { x: 0, y: 0 }
})

// Knowledge graph data
const knowledgeNodes = ref<SpatialNode[]>([])

// Spatial modes
const spatialModes: SpatialMode[] = [
  {
    id: 'galaxy',
    name: 'Galaxy View',
    icon: 'i-heroicons-globe-alt',
    description: 'View knowledge as a cosmic galaxy'
  },
  {
    id: 'network',
    name: 'Network Graph',
    icon: 'i-heroicons-share',
    description: 'Traditional network visualization'
  },
  {
    id: 'timeline',
    name: 'Timeline Space',
    icon: 'i-heroicons-clock',
    description: 'Knowledge arranged by time'
  },
  {
    id: 'mindmap',
    name: 'Mind Palace',
    icon: 'i-heroicons-brain',
    description: 'Hierarchical mind map structure'
  },
  {
    id: 'room',
    name: 'Virtual Office',
    icon: 'i-heroicons-building-office',
    description: 'Knowledge as office furniture'
  }
]

// Initialize
onMounted(async () => {
  await initializeSpatialInterface()
  await checkWebXRSupport()
  await loadKnowledgeGraph()
  startRenderLoop()
})

onUnmounted(() => {
  cleanup()
})

// Methods
const initializeSpatialInterface = async () => {
  if (!spatialCanvas.value) return

  // Set up canvas dimensions
  updateCanvasSize()
  
  // Initialize 3D context (using mock 3D rendering for demo)
  const ctx = spatialCanvas.value.getContext('2d')
  if (!ctx) return

  // Set up event listeners
  window.addEventListener('resize', updateCanvasSize)
  document.addEventListener('keydown', handleKeyDown)
}

const checkWebXRSupport = async () => {
  try {
    if ('xr' in navigator) {
      const isSupported = await navigator.xr.isSessionSupported('immersive-vr')
      webXRSupported.value = isSupported
    }
  } catch (error) {
    console.log('WebXR not supported:', error)
    webXRSupported.value = false
  }
}

const loadKnowledgeGraph = async () => {
  // Mock knowledge graph data
  knowledgeNodes.value = [
    {
      id: '1',
      title: 'AI Strategy 2024',
      type: 'document',
      content: 'Comprehensive AI strategy document...',
      position: { x: 0, y: 0, z: 0 },
      scale: 1.2,
      color: '#3B82F6',
      connections: [
        { id: '2', title: 'Machine Learning', type: 'concept', strength: 0.9 },
        { id: '3', title: 'Ethics Framework', type: 'document', strength: 0.7 }
      ],
      metadata: {
        lastModified: new Date(),
        accessCount: 45,
        importance: 0.9
      }
    },
    {
      id: '2',
      title: 'Machine Learning',
      type: 'concept',
      position: { x: 3, y: 2, z: -1 },
      scale: 1.0,
      color: '#10B981',
      connections: [
        { id: '1', title: 'AI Strategy 2024', type: 'document', strength: 0.9 },
        { id: '4', title: 'Neural Networks', type: 'concept', strength: 0.8 }
      ],
      metadata: {
        lastModified: new Date(),
        accessCount: 32,
        importance: 0.8
      }
    },
    {
      id: '3',
      title: 'Ethics Framework',
      type: 'document',
      content: 'Ethical guidelines for AI development...',
      position: { x: -2, y: -3, z: 1 },
      scale: 0.9,
      color: '#8B5CF6',
      connections: [
        { id: '1', title: 'AI Strategy 2024', type: 'document', strength: 0.7 }
      ],
      metadata: {
        lastModified: new Date(),
        accessCount: 18,
        importance: 0.6
      }
    },
    {
      id: '4',
      title: 'Neural Networks',
      type: 'concept',
      position: { x: 5, y: 0, z: -2 },
      scale: 0.8,
      color: '#F59E0B',
      connections: [
        { id: '2', title: 'Machine Learning', type: 'concept', strength: 0.8 }
      ],
      metadata: {
        lastModified: new Date(),
        accessCount: 25,
        importance: 0.7
      }
    }
  ]

  // Arrange nodes based on current mode
  arrangeNodesForMode(currentMode.value)
}

const arrangeNodesForMode = (mode: string) => {
  switch (mode) {
    case 'galaxy':
      arrangeGalaxyView()
      break
    case 'network':
      arrangeNetworkView()
      break
    case 'timeline':
      arrangeTimelineView()
      break
    case 'mindmap':
      arrangeMindMapView()
      break
    case 'room':
      arrangeRoomView()
      break
  }
}

const arrangeGalaxyView = () => {
  knowledgeNodes.value.forEach((node, index) => {
    const angle = (index / knowledgeNodes.value.length) * Math.PI * 2
    const radius = 3 + node.metadata.importance * 2
    node.position = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: (Math.random() - 0.5) * 4
    }
  })
}

const arrangeNetworkView = () => {
  // Force-directed layout simulation
  knowledgeNodes.value.forEach((node, index) => {
    node.position = {
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 4
    }
  })
}

const arrangeTimelineView = () => {
  knowledgeNodes.value
    .sort((a, b) => a.metadata.lastModified.getTime() - b.metadata.lastModified.getTime())
    .forEach((node, index) => {
      node.position = {
        x: index * 3 - (knowledgeNodes.value.length * 1.5),
        y: 0,
        z: 0
      }
    })
}

const arrangeMindMapView = () => {
  // Hierarchical layout
  const rootNode = knowledgeNodes.value.find(n => n.metadata.importance > 0.8)
  if (rootNode) {
    rootNode.position = { x: 0, y: 0, z: 0 }
    
    const children = knowledgeNodes.value.filter(n => n.id !== rootNode.id)
    children.forEach((node, index) => {
      const angle = (index / children.length) * Math.PI * 2
      node.position = {
        x: Math.cos(angle) * 4,
        y: Math.sin(angle) * 4,
        z: 0
      }
    })
  }
}

const arrangeRoomView = () => {
  // Arrange as office furniture
  knowledgeNodes.value.forEach((node, index) => {
    const positions = [
      { x: -3, y: -2, z: 0 }, // Desk
      { x: 3, y: -2, z: 0 },  // Bookshelf
      { x: 0, y: 2, z: 0 },   // Whiteboard
      { x: -2, y: 0, z: 0 },  // Chair
      { x: 2, y: 0, z: 0 }    // Computer
    ]
    node.position = positions[index % positions.length]
  })
}

const updateCanvasSize = () => {
  if (!spatialContainer.value || !spatialCanvas.value) return
  
  const rect = spatialContainer.value.getBoundingClientRect()
  canvasWidth.value = rect.width
  canvasHeight.value = rect.height
  
  spatialCanvas.value.width = rect.width * devicePixelRatio
  spatialCanvas.value.height = rect.height * devicePixelRatio
  spatialCanvas.value.style.width = rect.width + 'px'
  spatialCanvas.value.style.height = rect.height + 'px'
}

const startRenderLoop = () => {
  const render = () => {
    renderSpatialScene()
    requestAnimationFrame(render)
  }
  render()
}

const renderSpatialScene = () => {
  if (!spatialCanvas.value) return
  
  const ctx = spatialCanvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // Apply camera transformations and render nodes
  ctx.save()
  ctx.scale(devicePixelRatio, devicePixelRatio)
  
  // Render connections first (behind nodes)
  renderConnections(ctx)
  
  // Render nodes
  renderNodes(ctx)
  
  ctx.restore()
}

const renderConnections = (ctx: CanvasRenderingContext2D) => {
  knowledgeNodes.value.forEach(node => {
    node.connections.forEach(connection => {
      const targetNode = knowledgeNodes.value.find(n => n.id === connection.id)
      if (!targetNode) return

      const start = projectTo2D(node.position)
      const end = projectTo2D(targetNode.position)

      ctx.strokeStyle = `rgba(255, 255, 255, ${connection.strength * 0.3})`
      ctx.lineWidth = connection.strength * 2
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    })
  })
}

const renderNodes = (ctx: CanvasRenderingContext2D) => {
  // Sort nodes by distance (far to near)
  const sortedNodes = [...knowledgeNodes.value].sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.position.x - camera.value.position.x, 2) +
      Math.pow(a.position.y - camera.value.position.y, 2) +
      Math.pow(a.position.z - camera.value.position.z, 2)
    )
    const distB = Math.sqrt(
      Math.pow(b.position.x - camera.value.position.x, 2) +
      Math.pow(b.position.y - camera.value.position.y, 2) +
      Math.pow(b.position.z - camera.value.position.z, 2)
    )
    return distB - distA
  })

  sortedNodes.forEach(node => {
    const projected = projectTo2D(node.position)
    const distance = Math.sqrt(
      Math.pow(node.position.x - camera.value.position.x, 2) +
      Math.pow(node.position.y - camera.value.position.y, 2) +
      Math.pow(node.position.z - camera.value.position.z, 2)
    )
    
    const scale = node.scale * (10 / (distance + 1))
    const radius = Math.max(10, 20 * scale)
    const opacity = Math.max(0.3, 1 - distance / 20)

    // Node circle
    ctx.fillStyle = node.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
    ctx.strokeStyle = selectedNode.value?.id === node.id ? '#FFFFFF' : 'transparent'
    ctx.lineWidth = 3
    
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2)
    ctx.fill()
    if (selectedNode.value?.id === node.id) {
      ctx.stroke()
    }

    // Node label
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.font = `${Math.max(10, 12 * scale)}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(node.title, projected.x, projected.y + radius + 15)

    // Type indicator
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`
    ctx.font = `${Math.max(8, 10 * scale)}px Inter, sans-serif`
    ctx.fillText(node.type, projected.x, projected.y + radius + 30)
  })
}

const projectTo2D = (position3D: { x: number; y: number; z: number }) => {
  // Simple perspective projection
  const fov = camera.value.fov * Math.PI / 180
  const distance = position3D.z - camera.value.position.z
  const scale = Math.tan(fov / 2) * distance
  
  return {
    x: canvasWidth.value / 2 + (position3D.x - camera.value.position.x) * (canvasWidth.value / scale),
    y: canvasHeight.value / 2 - (position3D.y - camera.value.position.y) * (canvasHeight.value / scale)
  }
}

// Event handlers
const handlePointerDown = (event: PointerEvent) => {
  interaction.value.isDragging = true
  interaction.value.lastPointer = { x: event.clientX, y: event.clientY }
  interaction.value.dragStart = { x: event.clientX, y: event.clientY }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!interaction.value.isDragging) return

  const deltaX = event.clientX - interaction.value.lastPointer.x
  const deltaY = event.clientY - interaction.value.lastPointer.y

  // Rotate camera
  camera.value.rotation.y += deltaX * 0.01
  camera.value.rotation.x += deltaY * 0.01

  // Update camera position based on rotation
  const radius = 10
  camera.value.position.x = Math.sin(camera.value.rotation.y) * Math.cos(camera.value.rotation.x) * radius
  camera.value.position.y = Math.sin(camera.value.rotation.x) * radius
  camera.value.position.z = Math.cos(camera.value.rotation.y) * Math.cos(camera.value.rotation.x) * radius

  interaction.value.lastPointer = { x: event.clientX, y: event.clientY }
}

const handlePointerUp = (event: PointerEvent) => {
  const dragDistance = Math.sqrt(
    Math.pow(event.clientX - interaction.value.dragStart.x, 2) +
    Math.pow(event.clientY - interaction.value.dragStart.y, 2)
  )

  // If it was a click (not a drag), check for node selection
  if (dragDistance < 5) {
    selectNodeAtPosition(event.clientX, event.clientY)
  }

  interaction.value.isDragging = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  // Zoom camera
  const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9
  const radius = Math.sqrt(
    camera.value.position.x ** 2 +
    camera.value.position.y ** 2 +
    camera.value.position.z ** 2
  )
  
  const newRadius = Math.max(2, Math.min(50, radius * zoomFactor))
  const scale = newRadius / radius
  
  camera.value.position.x *= scale
  camera.value.position.y *= scale
  camera.value.position.z *= scale
}

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      selectedNode.value = null
      break
    case 'm':
      showSpatialMenu.value = !showSpatialMenu.value
      break
    case 's':
      showSpatialSearch.value = !showSpatialSearch.value
      break
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      const modeIndex = parseInt(event.key) - 1
      if (spatialModes[modeIndex]) {
        changeSpatialMode(spatialModes[modeIndex].id)
      }
      break
  }
}

const selectNodeAtPosition = (x: number, y: number) => {
  // Find closest node to click position
  let closestNode: SpatialNode | null = null
  let closestDistance = Infinity

  knowledgeNodes.value.forEach(node => {
    const projected = projectTo2D(node.position)
    const distance = Math.sqrt(
      Math.pow(x - projected.x, 2) + Math.pow(y - projected.y, 2)
    )
    
    if (distance < 30 && distance < closestDistance) {
      closestDistance = distance
      closestNode = node
    }
  })

  selectedNode.value = closestNode
}

const changeSpatialMode = (mode: string) => {
  currentMode.value = mode
  arrangeNodesForMode(mode)
}

const performSpatialSearch = () => {
  if (!spatialSearchQuery.value.trim()) return

  const query = spatialSearchQuery.value.toLowerCase()
  spatialSearchResults.value = knowledgeNodes.value.filter(node =>
    node.title.toLowerCase().includes(query) ||
    node.type.toLowerCase().includes(query) ||
    node.content?.toLowerCase().includes(query)
  )
}

const clearSpatialSearch = () => {
  spatialSearchQuery.value = ''
  spatialSearchResults.value = []
}

const navigateToNode = (node: SpatialNode) => {
  // Animate camera to node position
  const targetPosition = {
    x: node.position.x + 5,
    y: node.position.y + 3,
    z: node.position.z + 5
  }

  // Simple animation to target
  animateCamera(targetPosition)
  selectedNode.value = node
}

const animateCamera = (targetPosition: { x: number; y: number; z: number }) => {
  const duration = 1000 // 1 second
  const startPosition = { ...camera.value.position }
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function
    const eased = 1 - Math.pow(1 - progress, 3)
    
    camera.value.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased
    camera.value.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased
    camera.value.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

const openInEditor = (node: SpatialNode) => {
  // Emit event to open in main editor
  const event = new CustomEvent('open-document', {
    detail: { documentId: node.id }
  })
  window.dispatchEvent(event)
}

const expandNode = (node: SpatialNode) => {
  // Expand node to show more connections
  console.log('Expanding node:', node.title)
}

// WebXR functions
const enterVRMode = async () => {
  if (!webXRSupported.value) return

  try {
    const session = await navigator.xr.requestSession('immersive-vr')
    vrMode.value = true
    
    // Set up VR session
    setupVRSession(session)
    
    // Enable hand tracking if available
    if ('requestSession' in navigator.xr) {
      try {
        const handSession = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['hand-tracking']
        })
        handTracking.value.enabled = true
        setupHandTracking(handSession)
      } catch (error) {
        console.log('Hand tracking not available')
      }
    }
  } catch (error) {
    console.error('Failed to enter VR mode:', error)
  }
}

const exitVRMode = () => {
  vrMode.value = false
  handTracking.value.enabled = false
  handTracking.value.left.detected = false
  handTracking.value.right.detected = false
}

const setupVRSession = (session: any) => {
  // Set up VR rendering loop
  console.log('VR session started')
}

const setupHandTracking = (session: any) => {
  // Set up hand tracking
  console.log('Hand tracking enabled')
  
  // Mock hand tracking updates
  setInterval(() => {
    if (handTracking.value.enabled) {
      handTracking.value.left.detected = Math.random() > 0.3
      handTracking.value.right.detected = Math.random() > 0.3
      
      if (handTracking.value.left.detected) {
        const gestures = ['point', 'grab', 'pinch', 'peace']
        handTracking.value.left.gesture = gestures[Math.floor(Math.random() * gestures.length)]
      }
      
      if (handTracking.value.right.detected) {
        const gestures = ['point', 'grab', 'pinch', 'peace']
        handTracking.value.right.gesture = gestures[Math.floor(Math.random() * gestures.length)]
      }
    }
  }, 1000)
}

const cleanup = () => {
  window.removeEventListener('resize', updateCanvasSize)
  document.removeEventListener('keydown', handleKeyDown)
}
</script>

<style scoped>
.spatial-knowledge-graph {
  user-select: none;
  font-family: 'Inter', sans-serif;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar for VR readability */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>