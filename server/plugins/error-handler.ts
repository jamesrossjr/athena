export default defineNitroPlugin((nitroApp) => {
  // Handle unhandled rejections in the server
  process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = reason?.message || String(reason)
    
    // Filter out the mysterious port 64328 errors
    if (errorMessage.includes('ECONNREFUSED') && errorMessage.includes('64328')) {
      // Log once and ignore
      if (!global._port64328Warning) {
        console.warn('⚠️ Server: Connection refused to port 64328. This may be from a monitoring tool or debugger.')
        global._port64328Warning = true
      }
      return
    }
    
    // Filter out Ollama connection errors (these are expected in dev)
    if (errorMessage.includes('ECONNREFUSED') && errorMessage.includes('11434')) {
      if (!global._ollamaWarning) {
        console.info('ℹ️ Server: Ollama service not available. AI endpoints will use mock responses.')
        global._ollamaWarning = true
      }
      return
    }
    
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    const errorMessage = error?.message || String(error)
    
    // Filter out connection errors
    if (errorMessage.includes('ECONNREFUSED')) {
      console.warn('⚠️ Server: Connection error -', errorMessage.substring(0, 100))
      return
    }
    
    console.error('Uncaught Exception:', error)
    // In production, you might want to gracefully shutdown here
  })
})