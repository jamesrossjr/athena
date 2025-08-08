export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  
  ui: {
    pro: {
      license: '739C0067-5E6C-4D2F-A835-548A4820AF6F'
    }
  },
  
  css: ['~/assets/css/main.css'],
  
  colorMode: {
    preference: 'dark'
  },
  
  runtimeConfig: {
    public: {
      appName: 'Athena',
      version: '0.1.0'
    }
  }
})