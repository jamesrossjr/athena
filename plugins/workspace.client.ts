export default defineNuxtPlugin(() => {
  // This plugin runs only on client-side to initialize workspace data
  const { $pinia } = useNuxtApp()
  
  if (process.client) {
    // Initialize workspace store with saved data
    const workspaceStore = useWorkspaceStore($pinia)
    workspaceStore.initialize()
    
    // Set up periodic saves
    setInterval(() => {
      workspaceStore.saveToLocalStorage()
    }, 30000) // Save every 30 seconds
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      workspaceStore.saveToLocalStorage()
    })
  }
})