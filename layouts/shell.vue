<template>
  <div class="app-shell">
    <!-- Main Content Area (header removed for pure CommandPalette workflow) -->
    <main class="shell-content">
      <!-- Active Page Content -->
      <div v-if="activePage" class="page-container">
        <!-- Dynamic Page Renderer Based on Type -->
        <DocumentPage 
          v-if="activePage.type === 'DOCUMENT'"
          :page="activePage"
          @update="handlePageUpdate"
        />
        <DatabasePage 
          v-else-if="activePage.type === 'DATABASE'"
          :page="activePage"
          @update="handlePageUpdate"
        />
        <TablePage 
          v-else-if="activePage.type === 'TABLE'"
          :page="activePage"
          @update="handlePageUpdate"
        />
        <WhiteboardPage 
          v-else-if="activePage.type === 'WHITEBOARD'"
          :page="activePage"
          @update="handlePageUpdate"
        />
        <IdePage 
          v-else-if="activePage.type === 'IDE'"
          :page="activePage"
          @update="handlePageUpdate"
        />
        <!-- KanbanPage and CalendarPage components don't exist yet -->
        <div v-else-if="activePage.type === 'KANBAN'" class="coming-soon">
          <div class="coming-soon-content">
            <h3>📋 Kanban Page</h3>
            <p>Coming soon! This page type is not implemented yet.</p>
          </div>
        </div>
        <div v-else-if="activePage.type === 'CALENDAR'" class="coming-soon">
          <div class="coming-soon-content">
            <h3>📅 Calendar Page</h3>
            <p>Coming soon! This page type is not implemented yet.</p>
          </div>
        </div>
        
        <!-- Fallback for Unknown Types -->
        <div v-else class="unknown-page-type">
          <div class="error-content">
            <Icon name="i-heroicons-exclamation-triangle" class="error-icon" />
            <h3>Unknown Page Type</h3>
            <p>Page type "{{ activePage.type }}" is not supported yet.</p>
            <button @click="convertPageType" class="convert-button">
              Convert to Document
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">📄</div>
          <h2>No page open</h2>
          <p>Press <kbd>{{ isMac ? 'Cmd' : 'Ctrl' }}</kbd> + <kbd>K</kbd> to create a new page</p>
        </div>
      </div>
    </main>

    <!-- CommandPalette is now global in app.vue -->
  </div>
</template>

<script setup lang="ts">
import type { PageWithRelations, PageType } from '~/types/unified-data-layer'
import DocumentPage from '~/components/pages/DocumentPage.vue'
import DatabasePage from '~/components/pages/DatabasePage.vue'
import TablePage from '~/components/pages/TablePage.vue'
import WhiteboardPage from '~/components/pages/WhiteboardPage.vue'
import IdePage from '~/components/pages/IdePage.vue'

// State management
const openPages = ref<PageWithRelations[]>([])
const activePage = ref<PageWithRelations | null>(null)

// Use workspace composable directly  
const { currentWorkspace } = useWorkspace()
console.log('🏢 Shell: currentWorkspace:', currentWorkspace.value)

// Composables
const { hasWorkspace, createPage } = useWorkspace()
const { subscribeToPage } = useRealtime()

// Platform detection
const isMac = computed(() => {
  if (process.client) {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }
  return false
})

// Route watching to load page automatically
const route = useRoute()
watch(() => route.params.id, async (pageId) => {
  if (pageId && typeof pageId === 'string') {
    console.log('🔄 Shell: Route changed to page:', pageId)
    await openPage(pageId)
  }
}, { immediate: true })

// Page management
const setActivePage = async (page: PageWithRelations) => {
  activePage.value = page
  
  // Update URL without navigation
  await navigateTo(`/page/${page.id}`, { replace: true })
}

const openPage = async (pageId: string) => {
  console.log('📂 Shell: Opening page:', pageId)
  console.log('📋 Shell: Current open pages:', openPages.value.map(p => p.id))
  
  // Check if page is already open
  const existingPage = openPages.value.find(p => p.id === pageId)
  if (existingPage) {
    console.log('♻️ Shell: Page already open, switching to it')
    setActivePage(existingPage)
    return
  }

  try {
    console.log('🌐 Shell: Fetching page from API:', `/api/pages/${pageId}`)
    
    // Try authenticated endpoint first, fallback to guest if needed
    let response
    try {
      response = await $fetch(`/api/pages/${pageId}`, {
        query: { include_blocks: true }
      })
    } catch (authError) {
      console.log('🔄 Shell: Auth endpoint failed, trying guest mode')
      // For guest mode, we'll need to check the session modes service
      // For now, create a mock page for guest mode
      if (pageId.startsWith('tmp_')) {
        response = {
          success: true,
          data: {
            id: pageId,
            title: 'Getting Started',
            type: 'DOCUMENT',
            icon: '📝',
            content: 'Welcome to your new workspace!',
            blocks: [
              {
                id: `${pageId}_block_1`,
                type: 'HEADING',
                content: { text: 'Welcome to your new workspace!', level: 1 },
                position: 0
              },
              {
                id: `${pageId}_block_2`, 
                type: 'TEXT',
                content: { text: 'This is your first page. You can start writing, creating databases, or organizing your thoughts here.' },
                position: 1
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      } else {
        throw authError
      }
    }

    console.log('📤 Shell: API response:', response)

    if (response.success) {
      const page = response.data
      console.log('✅ Shell: Page loaded successfully:', page.title)
      openPages.value.push(page)
      setActivePage(page)

      // Subscribe to real-time updates
      subscribeToPage(pageId, (event) => {
        if (event.type === 'updated') {
          // Update the page in openPages
          const index = openPages.value.findIndex(p => p.id === pageId)
          if (index > -1) {
            openPages.value[index] = { ...openPages.value[index], ...event.data }
            if (activePage.value?.id === pageId) {
              activePage.value = openPages.value[index]
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('❌ Shell: Failed to open page:', error)
    // Show error notification
  }
}

const closePage = async (pageId: string) => {
  const index = openPages.value.findIndex(p => p.id === pageId)
  if (index === -1) return

  openPages.value.splice(index, 1)

  // If closing active page, switch to another or clear
  if (activePage.value?.id === pageId) {
    if (openPages.value.length > 0) {
      // Switch to the most recently opened page
      await setActivePage(openPages.value[openPages.value.length - 1])
    } else {
      activePage.value = null
      await navigateTo('/')
    }
  }
}

// createNewPage removed - all creation goes through CommandPalette

// Page type management
const getPageIcon = (type: PageType): string => {
  const icons = {
    DOCUMENT: '📄',
    DATABASE: '🗃️',
    TABLE: '📊',
    WHITEBOARD: '🎨',
    IDE: '💻',
    KANBAN: '📋',
    CALENDAR: '📅'
  }
  return icons[type] || '📄'
}

const convertPageType = async () => {
  if (!activePage.value) return

  try {
    const response = await $fetch(`/api/pages/${activePage.value.id}`, {
      method: 'PUT',
      body: { type: 'DOCUMENT' }
    })

    if (response.success) {
      activePage.value = response.data
      // Update in openPages as well
      const index = openPages.value.findIndex(p => p.id === activePage.value!.id)
      if (index > -1) {
        openPages.value[index] = response.data
      }
    }
  } catch (error) {
    console.error('Failed to convert page type:', error)
  }
}

// CommandPalette is now global - removed local handlers

// Page updates
const handlePageUpdate = (updatedPage: PageWithRelations) => {
  // Update the page in openPages
  const index = openPages.value.findIndex(p => p.id === updatedPage.id)
  if (index > -1) {
    openPages.value[index] = updatedPage
  }
  
  // Update active page if it's the same
  if (activePage.value?.id === updatedPage.id) {
    activePage.value = updatedPage
  }
}

// Note: route is already declared above in the "Route watching" section

// Initialize from route
onMounted(() => {
  console.log('🏁 Shell: Mounted, checking route for pageId')
  const pageId = route.params.id as string
  console.log('📍 Shell: Initial pageId from route:', pageId)
  if (pageId) {
    console.log('📂 Shell: Opening initial page:', pageId)
    openPage(pageId)
  }
})

// Keyboard shortcuts - minimal page management only
const handleKeydown = async (event: KeyboardEvent) => {
  // Close current page
  if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
    event.preventDefault()
    if (activePage.value) {
      await closePage(activePage.value.id)
    }
  }
}

const isInputFocused = () => {
  const activeElement = document.activeElement
  return activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  )
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

/* Header removed for pure CommandPalette workflow */

/* Main Content */
.shell-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.page-container {
  height: 100%;
  width: 100%;
}

/* Empty State */
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  max-width: 24rem;
  padding: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-content p {
  color: var(--theme-text-secondary);
  margin: 0 0 2rem 0;
}

/* Button styles removed - all interaction through CommandPalette */

kbd {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text-primary);
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: inline-block;
}

/* Unknown Page Type */
.unknown-page-type {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  text-align: center;
  padding: 2rem;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  color: #f59e0b;
  margin: 0 auto 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.error-content p {
  color: var(--theme-text-secondary);
  margin: 0 0 1.5rem 0;
}

.convert-button {
  background: var(--theme-accent);
  color: var(--theme-bg-primary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.convert-button:hover {
  opacity: 0.9;
}

/* Coming Soon Pages */
.coming-soon {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-primary);
}

.coming-soon-content {
  text-align: center;
  padding: 2rem;
  border: 1px dashed var(--theme-border);
  border-radius: 0.5rem;
  background: var(--theme-surface);
}

.coming-soon-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--theme-text-primary);
}

.coming-soon-content p {
  color: var(--theme-text-secondary);
  margin: 0;
}

/* Responsive styles removed with header */
</style>