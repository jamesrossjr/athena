<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Knowledge Graph</h1>
        <p class="text-gray-600">
          Visualize the connections between your documents and discover hidden insights in your workspace.
        </p>
      </div>

      <!-- Workspace Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Workspace
        </label>
        <USelect
          v-model="selectedWorkspace"
          :options="workspaceOptions"
          placeholder="Choose a workspace to visualize..."
          class="max-w-md"
        />
      </div>

      <!-- Graph Visualization -->
      <div v-if="selectedWorkspace" class="bg-white rounded-lg shadow-sm p-6">
        <AsyncGraphVisualizer :workspace-id="selectedWorkspace" />
      </div>

      <!-- Getting Started -->
      <div v-else class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="max-w-md mx-auto">
          <div class="text-6xl mb-4">🕸️</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            Explore Your Knowledge Network
          </h3>
          <p class="text-gray-600 mb-6">
            The knowledge graph reveals how your documents connect to each other, helping you discover patterns and relationships you might have missed.
          </p>
          <div class="grid gap-4 text-left">
            <div class="flex items-start gap-3">
              <div class="text-blue-500">🔗</div>
              <div>
                <div class="font-medium">Document References</div>
                <div class="text-sm text-gray-600">
                  See which documents link to each other
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="text-green-500">🎯</div>
              <div>
                <div class="font-medium">Content Similarity</div>
                <div class="text-sm text-gray-600">
                  Find documents with related topics
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="text-purple-500">📊</div>
              <div>
                <div class="font-medium">Visual Clusters</div>
                <div class="text-sm text-gray-600">
                  Identify knowledge clusters and gaps
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UButton
            @click="navigateTo('/demo')"
            variant="outline"
            class="justify-start"
            icon="i-heroicons-plus"
          >
            Create Demo Documents
          </UButton>
          
          <UButton
            @click="openCommandPalette"
            variant="outline"
            class="justify-start"
            icon="i-heroicons-magnifying-glass"
          >
            Search Documents (Ctrl+K)
          </UButton>
          
          <UButton
            variant="outline"
            class="justify-start"
            icon="i-heroicons-question-mark-circle"
            disabled
          >
            Help & Documentation
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommandPaletteStore } from '~/stores/commandPalette'

useHead({
  title: 'Knowledge Graph - Athena'
})

const selectedWorkspace = ref<string>('')

// Mock workspace data - in production, this would fetch from API
const workspaceOptions = [
  { label: 'Demo Workspace', value: 'demo-workspace-id' },
  { label: 'Personal Projects', value: 'personal-workspace-id' },
  { label: 'Research Notes', value: 'research-workspace-id' }
]

const commandPaletteStore = useCommandPaletteStore()

function openCommandPalette() {
  commandPaletteStore.open()
}

// Auto-select first workspace if available
onMounted(() => {
  if (workspaceOptions.length > 0) {
    selectedWorkspace.value = workspaceOptions[0].value
  }
})
</script>