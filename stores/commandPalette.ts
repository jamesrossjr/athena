import Fuse from 'fuse.js'

export const useCommandPaletteStore = defineStore('commandPalette', () => {
  const isOpen = ref(false)
  const searchQuery = ref('')
  const commands = ref([
    // Navigation Commands
    { id: 1, label: 'Create New Document', icon: 'i-heroicons-document-plus', action: 'create-document' },
    { id: 2, label: 'Switch Theme...', icon: 'i-heroicons-swatch', action: 'switch-theme' },
    { id: 3, label: 'Go to Demo', icon: 'i-heroicons-beaker', action: 'goto-demo' },
    { id: 4, label: 'Knowledge Graph', icon: 'i-heroicons-share', action: 'goto-graph' },
    { id: 5, label: 'Plugin Marketplace', icon: 'i-heroicons-puzzle-piece', action: 'goto-plugins' },
    { id: 6, label: 'Template Library', icon: 'i-heroicons-clipboard-document-list', action: 'goto-templates' },
    { id: 7, label: 'Import Data', icon: 'i-heroicons-arrow-down-tray', action: 'goto-import' },
    { id: 8, label: 'Pricing', icon: 'i-heroicons-currency-dollar', action: 'goto-pricing' },
    { id: 9, label: 'Admin Dashboard', icon: 'i-heroicons-cog-6-tooth', action: 'goto-admin' },
    
    // AI Commands
    { id: 10, label: 'AI: Summarize Document', icon: 'i-heroicons-sparkles', action: 'ai-summarize' },
    { id: 11, label: 'AI: Find Related Documents', icon: 'i-heroicons-magnifying-glass', action: 'ai-search' },
    { id: 12, label: 'AI: Improve Selected Text', icon: 'i-heroicons-pencil-square', action: 'ai-improve' },
    { id: 13, label: 'AI: Fix Grammar', icon: 'i-heroicons-check-circle', action: 'ai-grammar' },
    { id: 14, label: 'AI: Translate Text', icon: 'i-heroicons-language', action: 'ai-translate' },
    { id: 15, label: 'AI: Simplify Text', icon: 'i-heroicons-light-bulb', action: 'ai-simplify' },
    
    // Collaboration Commands
    { id: 20, label: 'Share Document', icon: 'i-heroicons-share', action: 'share-document' },
    { id: 21, label: 'View Document History', icon: 'i-heroicons-clock', action: 'document-history' },
  ])

  const fuse = new Fuse(commands.value, { keys: ['label'] })

  const filteredCommands = computed(() => {
    if (!searchQuery.value) return commands.value
    return fuse.search(searchQuery.value).map(result => result.item)
  })

  function open() { isOpen.value = true }
  function close() { isOpen.value = false }

  return { isOpen, commands, filteredCommands, searchQuery, open, close }
})