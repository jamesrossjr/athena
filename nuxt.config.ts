export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  modules: [
    '@nuxt/ui-pro',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  
  ui: {
    // pro configuration removed - not needed for regular ui
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
    experimental: {
      wasm: true
    },
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
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    
    // Public keys (exposed to frontend)
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Athena',
      version: process.env.NUXT_PUBLIC_VERSION || '0.1.0',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    }
  },
  
  // Build configuration
  vite: {
    build: {
      rollupOptions: {
        external: ['@prisma/client'],
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