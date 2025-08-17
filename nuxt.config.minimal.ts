// Minimal Nuxt configuration to debug initialization issues
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  
  // Minimal modules
  modules: [],
  
  // Disable SSR
  ssr: false,
  
  // Disable experimental features
  experimental: {
    payloadExtraction: false,
    viewTransition: false,
    componentIslands: false
  },
  
  // Basic runtime config
  runtimeConfig: {
    public: {
      appUrl: 'http://localhost:3000'
    }
  },
  
  // Minimal Nitro config
  nitro: {
    experimental: {
      wasm: false
    }
  },
  
  // TypeScript configuration
  typescript: {
    strict: false,
    typeCheck: false
  }
})