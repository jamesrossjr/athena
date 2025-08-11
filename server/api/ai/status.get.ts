export default defineEventHandler(async (event) => {
  try {
    // Check if Ollama is running
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      return {
        connected: false,
        error: 'Ollama service not available',
        models: []
      }
    }

    const data = await response.json()
    
    return {
      connected: true,
      models: data.models || [],
      version: data.version || 'unknown',
      recommended_model: 'llama3:8b',
      status: 'ready'
    }

  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Could not connect to Ollama',
      models: [],
      status: 'offline'
    }
  }
})