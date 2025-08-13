/**
 * Theme Plugin - Initialize theme system on client side
 * Handles theme persistence, system preference detection, and setup
 */

export default defineNuxtPlugin({
  name: 'theme-initialization',
  parallel: true,
  hooks: {
    'app:mounted': () => {
      // Initialize theme after app is mounted
      const { initializeTheme } = useTheme()
      initializeTheme()
    }
  },
  setup() {
    // Early theme detection to prevent flash of unstyled content
    if (process.client) {
      // Load saved theme preference immediately
      const savedTheme = localStorage.getItem('athena-theme')
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme) as any
          if (theme && theme.theme) {
            document.documentElement.classList.add(`theme-${theme.theme}`)
          }
        } catch (error) {
          // Fallback to system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
        }
      } else {
        // Default to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
      }
      
      // Add transition class after a frame to prevent initial transition flash
      requestAnimationFrame(() => {
        document.documentElement.classList.add('theme-transitions-enabled')
      })
    }
  }
})