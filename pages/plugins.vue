<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Plugin Marketplace</h1>
        <p class="text-gray-600">
          Extend Athena's functionality with powerful plugins created by our community.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="mb-8 flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search plugins..."
            size="lg"
          />
        </div>
        <div class="flex gap-2">
          <USelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="All Categories"
            size="lg"
            class="w-48"
          />
          <UButton
            :loading="isLoading"
            @click="loadPlugins"
            size="lg"
            variant="outline"
          >
            Refresh
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="bg-white rounded-lg shadow-sm p-6">
          <div class="loading-skeleton h-6 w-3/4 mb-3"></div>
          <div class="loading-skeleton h-4 w-full mb-2"></div>
          <div class="loading-skeleton h-4 w-2/3 mb-4"></div>
          <div class="loading-skeleton h-10 w-24"></div>
        </div>
      </div>

      <!-- Plugins Grid -->
      <div v-else-if="filteredPlugins.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="selectPlugin(plugin)"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">{{ plugin.icon || '🧩' }}</div>
              <div class="flex-1">
                <h3 class="font-semibold text-lg">{{ plugin.name }}</h3>
                <p class="text-sm text-gray-500">v{{ plugin.version }} by {{ plugin.author }}</p>
              </div>
            </div>
          </template>
          
          <p class="text-gray-600 mb-4 line-clamp-3">{{ plugin.description }}</p>
          
          <div class="flex flex-wrap gap-1 mb-4">
            <UBadge
              v-for="keyword in plugin.keywords.slice(0, 3)"
              :key="keyword"
              size="sm"
              variant="soft"
            >
              {{ keyword }}
            </UBadge>
            <UBadge v-if="plugin.keywords.length > 3" size="sm" variant="soft">
              +{{ plugin.keywords.length - 3 }}
            </UBadge>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <div class="flex items-center gap-1">
                <span>{{ getCapabilityCount(plugin) }}</span>
                <span>features</span>
              </div>
            </div>
            <UButton
              size="sm"
              :loading="installingPlugins.has(plugin.id)"
              @click.stop="installPlugin(plugin)"
            >
              Install
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No plugins found</h3>
        <p class="text-gray-600 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms or filters.' : 'Check back later for new plugins.' }}
        </p>
        <UButton @click="clearFilters" variant="outline">Clear Filters</UButton>
      </div>

      <!-- Plugin Details Modal -->
      <UModal v-model="showPluginModal">
        <UCard v-if="selectedPluginData">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-3xl">{{ selectedPluginData.icon || '🧩' }}</div>
              <div class="flex-1">
                <h2 class="text-xl font-semibold">{{ selectedPluginData.name }}</h2>
                <p class="text-gray-500">v{{ selectedPluginData.version }} by {{ selectedPluginData.author }}</p>
              </div>
              <UButton
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showPluginModal = false"
              />
            </div>
          </template>
          
          <div class="space-y-6">
            <div>
              <h3 class="font-medium mb-2">Description</h3>
              <p class="text-gray-600">{{ selectedPluginData.description }}</p>
            </div>
            
            <div v-if="selectedPluginData.capabilities.commands?.length">
              <h3 class="font-medium mb-2">Commands</h3>
              <div class="space-y-2">
                <div
                  v-for="command in selectedPluginData.capabilities.commands"
                  :key="command.id"
                  class="flex items-center gap-3 p-2 bg-gray-50 rounded"
                >
                  <UIcon v-if="command.icon" :name="command.icon" />
                  <div>
                    <div class="font-medium text-sm">{{ command.label }}</div>
                    <div v-if="command.description" class="text-xs text-gray-500">
                      {{ command.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">Permissions</h3>
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="permission in selectedPluginData.permissions"
                  :key="permission"
                  size="sm"
                  variant="outline"
                >
                  {{ permission }}
                </UBadge>
              </div>
            </div>
            
            <div class="flex gap-3">
              <UButton
                class="flex-1"
                :loading="installingPlugins.has(selectedPluginData.id)"
                @click="installPlugin(selectedPluginData)"
              >
                Install Plugin
              </UButton>
              <UButton
                v-if="selectedPluginData.homepage"
                variant="outline"
                icon="i-heroicons-link"
                :to="selectedPluginData.homepage"
                external
              >
                View Source
              </UButton>
            </div>
          </div>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PluginManifest } from '~/types/plugin'

useHead({
  title: 'Plugin Marketplace - Athena'
})

const plugins = ref<PluginManifest[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')
const installingPlugins = ref(new Set<string>())
const showPluginModal = ref(false)
const selectedPluginData = ref<PluginManifest | null>(null)

const categoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'Journal', value: 'journal' },
  { label: 'Integration', value: 'integration' },
  { label: 'Theme', value: 'theme' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'AI', value: 'ai' }
]

const filteredPlugins = computed(() => {
  let filtered = plugins.value
  
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(plugin =>
      plugin.name.toLowerCase().includes(search) ||
      plugin.description.toLowerCase().includes(search) ||
      plugin.keywords.some(k => k.toLowerCase().includes(search))
    )
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(plugin =>
      plugin.keywords.includes(selectedCategory.value)
    )
  }
  
  return filtered
})

onMounted(() => {
  loadPlugins()
})

async function loadPlugins() {
  try {
    isLoading.value = true
    const response = await $fetch('/api/plugins', {
      query: {
        search: searchQuery.value,
        category: selectedCategory.value
      }
    })
    plugins.value = response.plugins
  } catch (error) {
    console.error('Failed to load plugins:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to load plugins. Please try again.',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

function selectPlugin(plugin: PluginManifest) {
  selectedPluginData.value = plugin
  showPluginModal.value = true
}

async function installPlugin(plugin: PluginManifest) {
  installingPlugins.value.add(plugin.id)
  
  try {
    await $fetch(`/api/plugins/${plugin.id}/install`, {
      method: 'POST',
      body: {
        userId: 'demo-user-id' // In production, this would be the authenticated user
      }
    })
    
    const toast = useToast()
    toast.add({
      title: 'Plugin Installed',
      description: `${plugin.name} has been installed successfully!`,
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })
    
    showPluginModal.value = false
  } catch (error: any) {
    console.error('Plugin installation failed:', error)
    const toast = useToast()
    toast.add({
      title: 'Installation Failed',
      description: error.data?.message || 'Failed to install plugin. Please try again.',
      color: 'red'
    })
  } finally {
    installingPlugins.value.delete(plugin.id)
  }
}

function getCapabilityCount(plugin: PluginManifest): number {
  const capabilities = plugin.capabilities
  return (
    (capabilities.commands?.length || 0) +
    (capabilities.editors?.length || 0) +
    (capabilities.panels?.length || 0) +
    (capabilities.themes?.length || 0)
  )
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  loadPlugins()
}

// Watch for search changes
watch([searchQuery, selectedCategory], () => {
  // Debounce search to avoid too many requests
  setTimeout(() => {
    loadPlugins()
  }, 300)
})
</script>

<style>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>