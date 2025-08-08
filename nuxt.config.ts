export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  
  ui: {
    pro: {
      license: process.env.NUXT_UI_PRO_LICENSE || '739C0067-5E6C-4D2F-A835-548A4820AF6F'
    }
  },
  
  css: ['~/assets/css/main.css'],
  
  colorMode: {
    preference: 'dark'
  },
  
  // Production optimizations
  nitro: {
    preset: 'node-server',
    minify: true,
    compressPublicAssets: true,
    routeRules: {
      '/**': {
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
        }
      }
    }
  },
  
  // Security headers
  ssr: true,
  
  // Runtime configuration
  runtimeConfig: {
    // Private keys (only available on server-side)
    googleGeminiApiKey: process.env.NUXT_GOOGLE_GEMINI_API_KEY,
    
    // Public keys (exposed to frontend)
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Athena',
      version: process.env.NUXT_PUBLIC_VERSION || '0.1.0',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    }
  },
  
  // Build configuration
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', '@headlessui/vue', '@heroicons/vue'],
            utils: ['@vueuse/core', 'pinia']
          }
        }
      }
    }
  }
})