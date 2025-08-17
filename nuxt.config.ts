// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  // Modules
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  // UI Configuration
  ui: {
    icons: ['heroicons', 'simple-icons'],
    safelistColors: ['primary', 'gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
  },

  // CSS
  css: [
    '~/assets/css/main.css',
    '~/assets/css/accessibility.css'
  ],

  // App configuration
  app: {
    head: {
      title: 'Athena - Collaborative Workspace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Next-generation collaborative workspace with real-time editing, AI assistance, and intelligent knowledge discovery.' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Athena' },
        { property: 'og:title', content: 'Athena - Collaborative Workspace' },
        { property: 'og:description', content: 'Transform how your team creates, collaborates, and discovers knowledge.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Athena - Collaborative Workspace' },
        { name: 'twitter:description', content: 'Transform how your team creates, collaborates, and discovers knowledge.' },
        { name: 'twitter:image', content: '/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }
      ],
      script: [
        {
          innerHTML: `
            // Service Worker Registration
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
                    console.log('SW registered: ', registration);
                  })
                  .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }
      ]
    }
  },

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    openaiApiKey: process.env.OPENAI_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    
    // Public keys (exposed to client-side)
    public: {
      nuxtUiProLicense: process.env.NUXT_UI_PRO_LICENSE,
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      wsUrl: process.env.WS_URL || 'ws://localhost:3001'
    }
  },

  // Server-side rendering
  ssr: false,

  // Nitro configuration for WebSocket support
  nitro: {
    experimental: {
      wasm: true
    },
    plugins: ['~/server/plugins/websocket.ts'],
    compressPublicAssets: true,
    minify: true,
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

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    viewTransition: true,
    componentIslands: false
  },

  // Build configuration
  build: {
    transpile: ['@tiptap/core', '@tiptap/pm', 'yjs', 'y-websocket', '@headlessui/vue']
  },

  // Vite configuration
  vite: {
    define: {
      global: 'globalThis'
    },
    optimizeDeps: {
      include: ['yjs', 'y-websocket', 'y-indexeddb', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/extension-collaboration']
    },
    server: {
      hmr: {
        port: 24678
      }
    }
  },

  // Route optimization
  router: {
    options: {
      hashMode: false,
      linkActiveClass: 'router-link-active',
      linkExactActiveClass: 'router-link-exact-active'
    }
  },

  // TypeScript configuration
  typescript: {
    strict: false,
    typeCheck: false
  }
})
