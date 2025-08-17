<script setup lang="ts">
import * as d3 from 'd3'

interface GraphNode {
  id: string
  title: string
  type: string
  content: string
  group: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: 'reference' | 'similarity'
  weight: number
}

interface Props {
  workspaceId: string
}

const props = defineProps<Props>()

const svgRef = ref<SVGElement>()
const isLoading = ref(true)
const error = ref<string | null>(null)

const width = 800
const height = 600

let simulation: d3.Simulation<GraphNode, undefined> | null = null

onMounted(async () => {
  await loadGraph()
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
})

async function loadGraph() {
  try {
    isLoading.value = true
    error.value = null

    const { data } = await $fetch(`/api/workspace/${props.workspaceId}/graph`)
    
    if (!data.nodes.length) {
      error.value = 'No documents found to visualize'
      return
    }

    createVisualization(data.nodes, data.links)
  } catch (err) {
    console.error('Failed to load graph:', err)
    error.value = 'Failed to load knowledge graph'
  } finally {
    isLoading.value = false
  }
}

function createVisualization(nodes: GraphNode[], links: GraphLink[]) {
  if (!svgRef.value) return

  // Clear any existing content
  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  // Add zoom behavior
  const zoom = d3.zoom<SVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      container.attr('transform', event.transform)
    })

  svg.call(zoom)

  const container = svg.append('g')

  // Create arrow markers for directed links
  svg.append('defs').selectAll('marker')
    .data(['reference', 'similarity'])
    .join('marker')
    .attr('id', d => `arrow-${d}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 15)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', d => d === 'reference' ? '#3b82f6' : '#10b981')

  // Create force simulation
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))

  // Create links
  const link = container.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', d => d.type === 'reference' ? '#3b82f6' : '#10b981')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.sqrt(d.weight * 3))
    .attr('marker-end', d => `url(#arrow-${d.type})`)

  // Create node groups
  const node = container.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag<SVGGElement, GraphNode>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))

  // Add circles for nodes
  node.append('circle')
    .attr('r', 20)
    .attr('fill', d => getNodeColor(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('click', (event, d) => {
      // Navigate to document
      navigateTo(`/document/${d.id}`)
    })
    .on('mouseover', function(event, d) {
      // Show tooltip
      d3.select(this).attr('r', 25)
      
      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'graph-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .html(`
          <strong>${d.title}</strong><br/>
          Type: ${d.type}<br/>
          ${d.content}
        `)

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('r', 20)
      d3.selectAll('.graph-tooltip').remove()
    })

  // Add labels
  node.append('text')
    .text(d => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title)
    .attr('text-anchor', 'middle')
    .attr('dy', 35)
    .attr('font-size', '10px')
    .attr('fill', '#374151')

  // Add type indicators
  node.append('text')
    .text(d => getTypeIcon(d.type))
    .attr('text-anchor', 'middle')
    .attr('dy', 5)
    .attr('font-size', '12px')
    .attr('fill', 'white')

  // Update positions on simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node
      .attr('transform', d => `translate(${d.x},${d.y})`)
  })
}

function getNodeColor(type: string): string {
  switch (type) {
    case 'PAGE': return '#3b82f6'
    case 'WHITEBOARD': return '#10b981' 
    case 'DATABASE': return '#8b5cf6'
    default: return '#6b7280'
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'PAGE': return '📄'
    case 'WHITEBOARD': return '🎨'
    case 'DATABASE': return '🗃️'
    default: return '📁'
  }
}

function dragStarted(event: any, d: GraphNode) {
  if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

function dragged(event: any, d: GraphNode) {
  d.fx = event.x
  d.fy = event.y
}

function dragEnded(event: any, d: GraphNode) {
  if (!event.active && simulation) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

function resetView() {
  if (!svgRef.value) return
  
  const svg = d3.select(svgRef.value)
  svg.transition()
    .duration(750)
    .call(
      d3.zoom<SVGElement, unknown>().transform,
      d3.zoomIdentity
    )
}
</script>

<template>
  <div class="knowledge-graph w-full h-full">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Knowledge Graph</h2>
      <div class="flex items-center gap-2">
        <UButton @click="loadGraph" size="sm" variant="outline" :loading="isLoading">
          Refresh
        </UButton>
        <UButton @click="resetView" size="sm" variant="outline">
          Reset View
        </UButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center h-96">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Building knowledge graph...</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center h-96">
      <div class="text-center">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <UButton @click="loadGraph" size="sm">Try Again</UButton>
      </div>
    </div>

    <div v-else class="border border-gray-200 rounded-lg overflow-hidden">
      <svg ref="svgRef" class="w-full h-96 bg-gray-50"></svg>
      
      <!-- Legend -->
      <div class="p-4 bg-white border-t border-gray-200">
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>📄 Pages</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bg-green-500"></div>
            <span>🎨 Whiteboards</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bg-purple-500"></div>
            <span>🗃️ Databases</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-0.5 bg-blue-500"></div>
            <span>References</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-0.5 bg-green-500"></div>
            <span>Similarity</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-4 text-sm text-gray-600">
      <p><strong>Tip:</strong> Drag nodes to rearrange, click to navigate, hover for details, zoom and pan to explore.</p>
    </div>
  </div>
</template>

<style>
.knowledge-graph .node {
  cursor: pointer;
}

.knowledge-graph .node:hover circle {
  stroke: #000;
  stroke-width: 3px;
}

.graph-tooltip {
  z-index: 1000;
}
</style>