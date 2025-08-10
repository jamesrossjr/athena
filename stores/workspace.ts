import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Document {
  id: string
  title: string
  type: 'page' | 'table' | 'whiteboard' | 'database' | 'pdf' | 'canvas'
  content?: any
  fileData?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  metadata?: Record<string, any>
  lastModified: Date
  created: Date
  isHibernated?: boolean
  hibernatedData?: any
}

export interface TabGroup {
  id: string
  name: string
  color?: string
  tabs: Tab[]
  isCollapsed?: boolean
}

export interface Tab {
  id: string
  documentId: string
  groupId?: string
  order: number
  isPinned?: boolean
  isActive?: boolean
}

export interface TilePane {
  id: string
  documentId?: string
  tabs: Tab[]
  activeTabId?: string
  width?: number // percentage for split views
  height?: number // percentage for grid views
}

export interface TileLayout {
  id: string
  type: 'single' | 'split-horizontal' | 'split-vertical' | 'grid-2x2' | 'grid-3x3' | 'custom'
  panes: TilePane[]
  customLayout?: {
    rows: number
    cols: number
    panePositions: Array<{ paneId: string; row: number; col: number; rowSpan?: number; colSpan?: number }>
  }
}

export interface Workspace {
  id: string
  name: string
  icon?: string
  color?: string
  documents: Document[]
  tabs: Tab[]
  tabGroups: TabGroup[]
  activeTabId?: string
  tileLayout?: TileLayout
  settings: WorkspaceSettings
  lastAccessed: Date
  created: Date
}

export interface WorkspaceSettings {
  tabLayout: 'horizontal' | 'vertical'
  enableTabStacking: boolean
  enableTabGroups: boolean
  enableTiling: boolean
  autoHibernate: boolean
  hibernateAfterMinutes: number
  theme?: 'light' | 'dark' | 'auto'
}

export const useWorkspaceStore = defineStore('workspace', () => {
  // State
  const workspaces = ref<Workspace[]>([])
  const activeWorkspaceId = ref<string>('')
  const globalSettings = ref({
    defaultTabLayout: 'horizontal' as 'horizontal' | 'vertical',
    maxOpenDocuments: 20,
    hibernationEnabled: true,
    hibernateAfterMinutes: 30
  })

  // Computed
  const activeWorkspace = computed(() => 
    workspaces.value.find(w => w.id === activeWorkspaceId.value)
  )

  const activeDocument = computed(() => {
    if (!activeWorkspace.value) return null
    const activeTab = activeWorkspace.value.tabs.find(t => t.id === activeWorkspace.value?.activeTabId)
    if (!activeTab) return null
    return activeWorkspace.value.documents.find(d => d.id === activeTab.documentId)
  })

  const openDocuments = computed(() => {
    if (!activeWorkspace.value) return []
    return activeWorkspace.value.documents.filter(d => !d.isHibernated)
  })

  const hibernatedDocuments = computed(() => {
    if (!activeWorkspace.value) return []
    return activeWorkspace.value.documents.filter(d => d.isHibernated)
  })

  // Workspace Management
  function createWorkspace(name: string, settings?: Partial<WorkspaceSettings>): Workspace {
    const workspace: Workspace = {
      id: generateId(),
      name,
      documents: [],
      tabs: [],
      tabGroups: [],
      settings: {
        tabLayout: settings?.tabLayout || globalSettings.value.defaultTabLayout,
        enableTabStacking: settings?.enableTabStacking ?? true,
        enableTabGroups: settings?.enableTabGroups ?? true,
        enableTiling: settings?.enableTiling ?? true,
        autoHibernate: settings?.autoHibernate ?? globalSettings.value.hibernationEnabled,
        hibernateAfterMinutes: settings?.hibernateAfterMinutes ?? globalSettings.value.hibernateAfterMinutes,
        theme: settings?.theme || 'auto'
      },
      lastAccessed: new Date(),
      created: new Date()
    }
    
    workspaces.value.push(workspace)
    return workspace
  }

  function switchWorkspace(workspaceId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (workspace) {
      activeWorkspaceId.value = workspaceId
      workspace.lastAccessed = new Date()
      checkAndHibernateDocuments(workspace)
    }
  }

  function deleteWorkspace(workspaceId: string) {
    const index = workspaces.value.findIndex(w => w.id === workspaceId)
    if (index !== -1) {
      workspaces.value.splice(index, 1)
      if (activeWorkspaceId.value === workspaceId && workspaces.value.length > 0) {
        switchWorkspace(workspaces.value[0].id)
      }
    }
  }

  // Document Management
  function openDocument(workspaceId: string, document: Omit<Document, 'id' | 'lastModified' | 'created'>): Document {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    // Check if document already exists
    let doc = workspace.documents.find(d => d.title === document.title && d.type === document.type)
    
    if (!doc) {
      doc = {
        ...document,
        id: generateId(),
        lastModified: new Date(),
        created: new Date(),
        isHibernated: false
      }
      workspace.documents.push(doc)
    } else if (doc.isHibernated) {
      // Restore hibernated document
      restoreDocument(workspaceId, doc.id)
    }

    // Create or activate tab
    let tab = workspace.tabs.find(t => t.documentId === doc.id)
    if (!tab) {
      tab = createTab(workspaceId, doc.id)
    }
    
    setActiveTab(workspaceId, tab.id)
    
    // Check if we need to hibernate other documents
    enforceDocumentLimit(workspace)
    
    return doc
  }

  function closeDocument(workspaceId: string, documentId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    // Remove all tabs for this document
    workspace.tabs = workspace.tabs.filter(t => t.documentId !== documentId)
    
    // Remove from tab groups
    workspace.tabGroups.forEach(group => {
      group.tabs = group.tabs.filter(t => t.documentId !== documentId)
    })
    
    // Remove from tile panes if tiling is enabled
    if (workspace.tileLayout) {
      workspace.tileLayout.panes.forEach(pane => {
        pane.tabs = pane.tabs.filter(t => t.documentId !== documentId)
        if (pane.activeTabId && !pane.tabs.find(t => t.id === pane.activeTabId)) {
          pane.activeTabId = pane.tabs[0]?.id
        }
      })
    }
    
    // Remove document
    const index = workspace.documents.findIndex(d => d.id === documentId)
    if (index !== -1) {
      workspace.documents.splice(index, 1)
    }
  }

  // Tab Management
  function createTab(workspaceId: string, documentId: string, groupId?: string): Tab {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const tab: Tab = {
      id: generateId(),
      documentId,
      groupId,
      order: workspace.tabs.length,
      isPinned: false,
      isActive: false
    }

    workspace.tabs.push(tab)
    
    if (groupId) {
      const group = workspace.tabGroups.find(g => g.id === groupId)
      if (group) {
        group.tabs.push(tab)
      }
    }

    return tab
  }

  function setActiveTab(workspaceId: string, tabId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    workspace.tabs.forEach(tab => {
      tab.isActive = tab.id === tabId
    })
    workspace.activeTabId = tabId

    // Update document last modified time
    const tab = workspace.tabs.find(t => t.id === tabId)
    if (tab) {
      const doc = workspace.documents.find(d => d.id === tab.documentId)
      if (doc) {
        doc.lastModified = new Date()
      }
    }
  }

  function moveTab(workspaceId: string, tabId: string, newOrder: number, newGroupId?: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    const tab = workspace.tabs.find(t => t.id === tabId)
    if (!tab) return

    // Update group if changed
    if (tab.groupId !== newGroupId) {
      // Remove from old group
      if (tab.groupId) {
        const oldGroup = workspace.tabGroups.find(g => g.id === tab.groupId)
        if (oldGroup) {
          const index = oldGroup.tabs.findIndex(t => t.id === tabId)
          if (index !== -1) oldGroup.tabs.splice(index, 1)
        }
      }

      // Add to new group
      if (newGroupId) {
        const newGroup = workspace.tabGroups.find(g => g.id === newGroupId)
        if (newGroup) {
          newGroup.tabs.push(tab)
        }
      }

      tab.groupId = newGroupId
    }

    // Update order
    tab.order = newOrder
    
    // Reorder other tabs
    workspace.tabs
      .filter(t => t.id !== tabId && t.order >= newOrder)
      .forEach(t => t.order++)
  }

  function pinTab(workspaceId: string, tabId: string, isPinned: boolean) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    const tab = workspace.tabs.find(t => t.id === tabId)
    if (tab) {
      tab.isPinned = isPinned
    }
  }

  // Tab Groups (Two-Level Stacking)
  function createTabGroup(workspaceId: string, name: string, color?: string): TabGroup {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const group: TabGroup = {
      id: generateId(),
      name,
      color,
      tabs: [],
      isCollapsed: false
    }

    workspace.tabGroups.push(group)
    return group
  }

  function toggleTabGroup(workspaceId: string, groupId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    const group = workspace.tabGroups.find(g => g.id === groupId)
    if (group) {
      group.isCollapsed = !group.isCollapsed
    }
  }

  // Tiling System
  function setTileLayout(workspaceId: string, layoutType: TileLayout['type']) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    let panes: TilePane[] = []
    
    switch (layoutType) {
      case 'single':
        panes = [{
          id: generateId(),
          tabs: [...workspace.tabs],
          activeTabId: workspace.activeTabId
        }]
        break
      
      case 'split-horizontal':
        panes = [
          {
            id: generateId(),
            tabs: workspace.tabs.slice(0, Math.ceil(workspace.tabs.length / 2)),
            width: 50
          },
          {
            id: generateId(),
            tabs: workspace.tabs.slice(Math.ceil(workspace.tabs.length / 2)),
            width: 50
          }
        ]
        break
      
      case 'split-vertical':
        panes = [
          {
            id: generateId(),
            tabs: workspace.tabs.slice(0, Math.ceil(workspace.tabs.length / 2)),
            height: 50
          },
          {
            id: generateId(),
            tabs: workspace.tabs.slice(Math.ceil(workspace.tabs.length / 2)),
            height: 50
          }
        ]
        break
      
      case 'grid-2x2':
        const quarter = Math.ceil(workspace.tabs.length / 4)
        panes = [
          { id: generateId(), tabs: workspace.tabs.slice(0, quarter), width: 50, height: 50 },
          { id: generateId(), tabs: workspace.tabs.slice(quarter, quarter * 2), width: 50, height: 50 },
          { id: generateId(), tabs: workspace.tabs.slice(quarter * 2, quarter * 3), width: 50, height: 50 },
          { id: generateId(), tabs: workspace.tabs.slice(quarter * 3), width: 50, height: 50 }
        ]
        break
    }

    workspace.tileLayout = {
      id: generateId(),
      type: layoutType,
      panes
    }
  }

  function moveToPanee(workspaceId: string, tabId: string, paneId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace || !workspace.tileLayout) return

    const tab = workspace.tabs.find(t => t.id === tabId)
    if (!tab) return

    // Remove from all panes
    workspace.tileLayout.panes.forEach(pane => {
      const index = pane.tabs.findIndex(t => t.id === tabId)
      if (index !== -1) pane.tabs.splice(index, 1)
    })

    // Add to target pane
    const targetPane = workspace.tileLayout.panes.find(p => p.id === paneId)
    if (targetPane) {
      targetPane.tabs.push(tab)
      targetPane.activeTabId = tabId
    }
  }

  // Document Hibernation
  function hibernateDocument(workspaceId: string, documentId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    const doc = workspace.documents.find(d => d.id === documentId)
    if (!doc || doc.isHibernated) return

    // Store document state before hibernation
    doc.hibernatedData = {
      content: doc.content,
      metadata: doc.metadata,
      fileData: doc.fileData
    }

    // Clear heavy data from memory
    doc.content = undefined
    doc.fileData = undefined
    doc.isHibernated = true

    console.log(`Document ${doc.title} hibernated`)
  }

  function restoreDocument(workspaceId: string, documentId: string) {
    const workspace = workspaces.value.find(w => w.id === workspaceId)
    if (!workspace) return

    const doc = workspace.documents.find(d => d.id === documentId)
    if (!doc || !doc.isHibernated) return

    // Restore document state
    if (doc.hibernatedData) {
      doc.content = doc.hibernatedData.content
      doc.metadata = doc.hibernatedData.metadata
      doc.fileData = doc.hibernatedData.fileData
      doc.hibernatedData = undefined
    }

    doc.isHibernated = false
    doc.lastModified = new Date()

    console.log(`Document ${doc.title} restored`)
  }

  function checkAndHibernateDocuments(workspace: Workspace) {
    if (!workspace.settings.autoHibernate) return

    const now = new Date()
    const hibernateThreshold = workspace.settings.hibernateAfterMinutes * 60 * 1000

    workspace.documents.forEach(doc => {
      if (!doc.isHibernated && 
          now.getTime() - doc.lastModified.getTime() > hibernateThreshold) {
        hibernateDocument(workspace.id, doc.id)
      }
    })
  }

  function enforceDocumentLimit(workspace: Workspace) {
    const openDocs = workspace.documents.filter(d => !d.isHibernated)
    
    if (openDocs.length > globalSettings.value.maxOpenDocuments) {
      // Hibernate least recently used documents
      const docsToHibernate = openDocs
        .sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
        .slice(0, openDocs.length - globalSettings.value.maxOpenDocuments)
      
      docsToHibernate.forEach(doc => {
        hibernateDocument(workspace.id, doc.id)
      })
    }
  }

  // Utility functions
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Persistence
  function saveToLocalStorage() {
    localStorage.setItem('athena-workspaces', JSON.stringify({
      workspaces: workspaces.value,
      activeWorkspaceId: activeWorkspaceId.value,
      globalSettings: globalSettings.value
    }))
  }

  function loadFromLocalStorage() {
    const stored = localStorage.getItem('athena-workspaces')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        workspaces.value = data.workspaces || []
        activeWorkspaceId.value = data.activeWorkspaceId || ''
        globalSettings.value = data.globalSettings || globalSettings.value
        
        // Convert date strings back to Date objects
        workspaces.value.forEach(workspace => {
          workspace.lastAccessed = new Date(workspace.lastAccessed)
          workspace.created = new Date(workspace.created)
          workspace.documents.forEach(doc => {
            doc.lastModified = new Date(doc.lastModified)
            doc.created = new Date(doc.created)
          })
        })
      } catch (error) {
        console.error('Failed to load workspaces from localStorage:', error)
      }
    }
  }

  // Initialize with default workspace if empty
  function initialize() {
    // Only load from localStorage on client-side
    if (process.client) {
      loadFromLocalStorage()
    }
    
    if (workspaces.value.length === 0) {
      const defaultWorkspace = createWorkspace('Main Workspace')
      activeWorkspaceId.value = defaultWorkspace.id
      
      // Only save to localStorage on client-side
      if (process.client) {
        saveToLocalStorage()
      }
    }
  }

  return {
    // State
    workspaces,
    activeWorkspaceId,
    globalSettings,
    
    // Computed
    activeWorkspace,
    activeDocument,
    openDocuments,
    hibernatedDocuments,
    
    // Actions
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
    openDocument,
    closeDocument,
    createTab,
    setActiveTab,
    moveTab,
    pinTab,
    createTabGroup,
    toggleTabGroup,
    setTileLayout,
    moveToPanee,
    hibernateDocument,
    restoreDocument,
    saveToLocalStorage,
    loadFromLocalStorage,
    initialize
  }
})