export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  homepage?: string
  repository?: string
  keywords: string[]
  
  // Plugin capabilities
  capabilities: {
    documentTypes?: string[]
    commands?: PluginCommand[]
    editors?: PluginEditor[]
    panels?: PluginPanel[]
    themes?: PluginTheme[]
  }
  
  // Runtime requirements
  runtime: {
    nuxt?: string
    athena?: string
    node?: string
  }
  
  // Security and permissions
  permissions: PluginPermission[]
  
  // Entry points
  main?: string
  client?: string
  server?: string
}

export interface PluginCommand {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string[]
  context?: 'global' | 'document' | 'selection'
}

export interface PluginEditor {
  id: string
  name: string
  fileTypes: string[]
  component: string
}

export interface PluginPanel {
  id: string
  name: string
  position: 'sidebar' | 'bottom' | 'right'
  component: string
}

export interface PluginTheme {
  id: string
  name: string
  colors: Record<string, string>
}

export type PluginPermission = 
  | 'read:documents'
  | 'write:documents'
  | 'read:workspace'
  | 'write:workspace'
  | 'network:external'
  | 'filesystem:read'
  | 'filesystem:write'
  | 'ai:access'

export interface PluginContext {
  // Document context
  document?: {
    id: string
    title: string
    type: string
    content: any
  }
  
  // Workspace context
  workspace?: {
    id: string
    name: string
  }
  
  // User context
  user?: {
    id: string
    email: string
  }
  
  // Selection context
  selection?: {
    text: string
    range: { start: number; end: number }
  }
}

export interface PluginAPI {
  // Core functionality
  showToast(message: string, options?: { type?: 'success' | 'error' | 'warning' | 'info' }): void
  showModal(component: any, props?: Record<string, any>): Promise<any>
  openCommandPalette(): void
  
  // Document operations
  documents: {
    create(data: { title: string; type: string; content?: any }): Promise<any>
    read(id: string): Promise<any>
    update(id: string, data: any): Promise<any>
    delete(id: string): Promise<void>
    list(workspaceId: string): Promise<any[]>
  }
  
  // AI integration
  ai: {
    summarize(content: string): Promise<string>
    improve(text: string, action: string): Promise<string>
    search(query: string, workspaceId: string): Promise<any[]>
  }
  
  // Storage for plugin data
  storage: {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
  }
  
  // Event system
  events: {
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    emit(event: string, data?: any): void
  }
}

export interface InstalledPlugin {
  id: string
  manifest: PluginManifest
  enabled: boolean
  installedAt: Date
  version: string
  settings?: Record<string, any>
}