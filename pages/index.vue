<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <!-- Hero Section -->
    <div class="container mx-auto px-8 py-16">
      <div class="text-center mb-16">
        <h1 class="text-6xl font-bold text-gray-900 mb-6">
          Athena
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The next-generation collaborative workspace with real-time editing, AI assistance, and intelligent knowledge discovery.
        </p>
        <div class="flex items-center justify-center gap-4 mb-8">
          <UButton size="lg" @click="navigateTo('/demo')">
            Try Demo
          </UButton>
          <UButton size="lg" variant="outline" @click="openCommandPalette">
            Open Command Palette
          </UButton>
        </div>
        <div class="text-sm text-gray-500">
          Press <kbd class="px-2 py-1 bg-gray-100 rounded text-gray-700">Ctrl+K</kbd> or <kbd class="px-2 py-1 bg-gray-100 rounded text-gray-700">⌘K</kbd> anywhere to open the command palette
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <!-- Real-time Collaboration -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">🤝</div>
              <h3 class="text-lg font-semibold">Real-time Collaboration</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Edit documents together with live cursors, presence indicators, and conflict-free synchronization using cutting-edge CRDT technology.
          </p>
          <UBadge color="green" variant="soft">Live</UBadge>
        </UCard>

        <!-- AI Integration -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">🤖</div>
              <h3 class="text-lg font-semibold">AI-Powered Assistant</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Context-aware AI that can summarize content, improve writing, find related documents, and provide intelligent suggestions.
          </p>
          <UBadge color="purple" variant="soft">Smart</UBadge>
        </UCard>

        <!-- Knowledge Graph -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">🕸️</div>
              <h3 class="text-lg font-semibold">Knowledge Graph</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Visualize connections between your documents and discover hidden insights with an interactive network graph.
          </p>
          <UBadge color="blue" variant="soft">Visual</UBadge>
        </UCard>

        <!-- Polymorphic Documents -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">📄</div>
              <h3 class="text-lg font-semibold">Multiple Document Types</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Rich text pages, visual whiteboards, and structured databases - all in one unified workspace with seamless switching.
          </p>
          <UBadge color="orange" variant="soft">Flexible</UBadge>
        </UCard>

        <!-- Command Palette -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">⚡</div>
              <h3 class="text-lg font-semibold">Command Palette</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Lightning-fast access to any feature with fuzzy search and keyboard shortcuts. Think VS Code's command palette for documents.
          </p>
          <UBadge color="yellow" variant="soft">Fast</UBadge>
        </UCard>

        <!-- Modern Architecture -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">🏗️</div>
              <h3 class="text-lg font-semibold">Modern Stack</h3>
            </div>
          </template>
          <p class="text-gray-600 mb-4">
            Built with Nuxt 3, TypeScript, Prisma, WebSockets, and modern best practices for performance and scalability.
          </p>
          <UBadge color="gray" variant="soft">Robust 🛠️</UBadge>
        </UCard>
      </div>

      <!-- Quick Start -->
      <div class="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p class="text-gray-600 mb-6">
          Explore Athena's features and see why it's the future of collaborative workspaces.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <UButton @click="navigateTo('/demo')" size="lg">
            <template #leading>
              <div class="text-lg">🎯</div>
            </template>
            Create Demo Documents
          </UButton>
          <UButton @click="navigateTo('/templates')" variant="outline" size="lg">
            <template #leading>
              <div class="text-lg">📋</div>
            </template>
            Browse Templates
          </UButton>
          <UButton @click="navigateTo('/graph')" variant="outline" size="lg">
            <template #leading>
              <div class="text-lg">🕸️</div>
            </template>
            Explore Knowledge Graph
          </UButton>
          <UButton @click="openCommandPalette" variant="outline" size="lg">
            <template #leading>
              <div class="text-lg">⚡</div>
            </template>
            Open Command Palette
          </UButton>
          <UButton @click="navigateTo('/trust-center')" variant="outline" size="lg">
            <template #leading>
              <div class="text-lg">🛡️</div>
            </template>
            Visit Trust Center
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommandPaletteStore } from '~/stores/commandPalette'

const commandPaletteStore = useCommandPaletteStore()

function openCommandPalette() {
  commandPaletteStore.open()
}

useHead({
  title: 'Athena - Next-Generation Collaborative Workspace'
})
</script>