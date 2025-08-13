import { ref, computed, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'sepia' | 'high-contrast'
export type Layout = 'single' | 'split' | 'grid'

interface ThemeConfig {
  name: string
  displayName: string
  description: string
  icon: string
  cssClass: string
}

interface LayoutConfig {
  name: Layout
  displayName: string
  description: string
  icon: string
  cssClass: string
}

// Theme configurations
const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: 'Light',
    description: 'Clean and bright theme',
    icon: '☀️',
    cssClass: 'theme-light'
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    description: 'Easy on the eyes for long sessions',
    icon: '🌙',
    cssClass: 'theme-dark'
  },
  sepia: {
    name: 'sepia',
    displayName: 'Sepia',
    description: 'Warm, paper-like reading experience',
    icon: '📜',
    cssClass: 'theme-sepia'
  },
  'high-contrast': {
    name: 'high-contrast',
    displayName: 'High Contrast',
    description: 'Maximum readability for accessibility',
    icon: '🔲',
    cssClass: 'theme-high-contrast'
  }
}

// Layout configurations
const layoutConfigs: Record<Layout, LayoutConfig> = {
  single: {
    name: 'single',
    displayName: 'Single View',
    description: 'Focus on one document at a time',
    icon: '□',
    cssClass: 'layout-single'
  },
  split: {
    name: 'split',
    displayName: 'Split View',
    description: 'Two documents side by side',
    icon: '⚌',
    cssClass: 'layout-split'
  },
  grid: {
    name: 'grid',
    displayName: 'Grid View',
    description: 'Four documents in a grid',
    icon: '⊞',
    cssClass: 'layout-grid'
  }
}

// Global state
const currentTheme = ref<Theme>('light')
const currentLayout = ref<Layout>('single')
const isSystemDarkMode = ref(false)

// Storage keys
const THEME_STORAGE_KEY = 'athena-theme'
const LAYOUT_STORAGE_KEY = 'athena-layout'

export function useTheme() {
  // Computed properties
  const themeConfig = computed(() => themeConfigs[currentTheme.value])
  const layoutConfig = computed(() => layoutConfigs[currentLayout.value])
  
  const availableThemes = computed(() => Object.values(themeConfigs))
  const availableLayouts = computed(() => Object.values(layoutConfigs))
  
  const isDarkMode = computed(() => 
    currentTheme.value === 'dark' || currentTheme.value === 'high-contrast'
  )
  
  const isHighContrastMode = computed(() => 
    currentTheme.value === 'high-contrast'
  )

  // System dark mode detection
  function detectSystemTheme() {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      isSystemDarkMode.value = mediaQuery.matches
      
      mediaQuery.addEventListener('change', (e) => {
        isSystemDarkMode.value = e.matches
      })
    }
  }

  // Apply theme to document
  function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return
    
    // Remove all theme classes
    Object.values(themeConfigs).forEach(config => {
      document.documentElement.classList.remove(config.cssClass)
    })
    
    // Add current theme class
    document.documentElement.classList.add(themeConfigs[theme].cssClass)
    
    // Set CSS custom properties for dynamic theming
    const root = document.documentElement
    
    // Define comprehensive color palettes for each theme
    const themeColors = {
      light: {
        'color-background': '#FFFFFF',
        'color-surface': '#F9FAFB',
        'color-surface-secondary': '#F3F4F6',
        'color-text': '#111827',
        'color-text-secondary': '#6B7280',
        'color-text-muted': '#9CA3AF',
        'color-border': '#E5E7EB',
        'color-border-secondary': '#D1D5DB',
        'color-accent': '#3B82F6',
        'color-accent-hover': '#2563EB',
        'color-accent-light': '#EFF6FF',
        'color-success': '#059669',
        'color-warning': '#D97706',
        'color-error': '#DC2626',
        'color-shadow': 'rgba(0, 0, 0, 0.1)',
        'color-overlay': 'rgba(0, 0, 0, 0.5)'
      },
      dark: {
        'color-background': '#0F172A',
        'color-surface': '#1E293B',
        'color-surface-secondary': '#334155',
        'color-text': '#F8FAFC',
        'color-text-secondary': '#CBD5E1',
        'color-text-muted': '#94A3B8',
        'color-border': '#334155',
        'color-border-secondary': '#475569',
        'color-accent': '#60A5FA',
        'color-accent-hover': '#3B82F6',
        'color-accent-light': 'rgba(96, 165, 250, 0.1)',
        'color-success': '#10B981',
        'color-warning': '#F59E0B',
        'color-error': '#EF4444',
        'color-shadow': 'rgba(0, 0, 0, 0.3)',
        'color-overlay': 'rgba(0, 0, 0, 0.7)'
      },
      sepia: {
        'color-background': '#F4F1E8',
        'color-surface': '#EDE6D3',
        'color-surface-secondary': '#E4D5B7',
        'color-text': '#3C2415',
        'color-text-secondary': '#8B7355',
        'color-text-muted': '#A68B5B',
        'color-border': '#D4C4A8',
        'color-border-secondary': '#C7B299',
        'color-accent': '#B45309',
        'color-accent-hover': '#92400E',
        'color-accent-light': 'rgba(180, 83, 9, 0.1)',
        'color-success': '#059669',
        'color-warning': '#D97706',
        'color-error': '#DC2626',
        'color-shadow': 'rgba(60, 36, 21, 0.15)',
        'color-overlay': 'rgba(60, 36, 21, 0.5)'
      },
      'high-contrast': {
        'color-background': '#FFFFFF',
        'color-surface': '#FFFFFF',
        'color-surface-secondary': '#F0F0F0',
        'color-text': '#000000',
        'color-text-secondary': '#000000',
        'color-text-muted': '#333333',
        'color-border': '#000000',
        'color-border-secondary': '#333333',
        'color-accent': '#0000FF',
        'color-accent-hover': '#0000CC',
        'color-accent-light': '#E6E6FF',
        'color-success': '#008000',
        'color-warning': '#FF8000',
        'color-error': '#FF0000',
        'color-shadow': 'rgba(0, 0, 0, 0.5)',
        'color-overlay': 'rgba(0, 0, 0, 0.8)'
      }
    }
    
    // Apply theme colors
    const colors = themeColors[theme]
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value)
    })
    
    // Set theme meta tag for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', colors['color-background'])
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = colors['color-background']
      document.head.appendChild(meta)
    }
  }

  // Apply layout to document
  function applyLayout(layout: Layout) {
    if (typeof document === 'undefined') return
    
    // Remove all layout classes
    Object.values(layoutConfigs).forEach(config => {
      document.documentElement.classList.remove(config.cssClass)
    })
    
    // Add current layout class
    document.documentElement.classList.add(layoutConfigs[layout].cssClass)
  }

  // Theme management functions
  function setTheme(theme: Theme) {
    if (!themeConfigs[theme]) {
      console.warn(`Unknown theme: ${theme}`)
      return
    }
    
    currentTheme.value = theme
    applyTheme(theme)
    
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
    
    console.log(`🎨 Theme changed to: ${themeConfigs[theme].displayName}`)
  }

  function toggleTheme() {
    const themes: Theme[] = ['light', 'dark']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  function cycleTheme() {
    const themes: Theme[] = ['light', 'dark', 'sepia', 'high-contrast']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // Layout management functions
  function setLayout(layout: Layout) {
    if (!layoutConfigs[layout]) {
      console.warn(`Unknown layout: ${layout}`)
      return
    }
    
    currentLayout.value = layout
    applyLayout(layout)
    
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
    }
    
    console.log(`📐 Layout changed to: ${layoutConfigs[layout].displayName}`)
  }

  function cycleLayout() {
    const layouts: Layout[] = ['single', 'split', 'grid']
    const currentIndex = layouts.indexOf(currentLayout.value)
    const nextIndex = (currentIndex + 1) % layouts.length
    setLayout(layouts[nextIndex])
  }

  // Load saved preferences
  function loadPreferences() {
    if (typeof localStorage === 'undefined') return
    
    // Load theme
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme
    if (savedTheme && themeConfigs[savedTheme]) {
      setTheme(savedTheme)
    } else {
      // Default to system preference or light theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
    
    // Load layout
    const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY) as Layout
    if (savedLayout && layoutConfigs[savedLayout]) {
      setLayout(savedLayout)
    }
  }

  // Accessibility helpers
  function getThemeForAccessibility(): Theme {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast'
    }
    return currentTheme.value
  }

  function respectSystemPreferences() {
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setTheme('high-contrast')
      return
    }
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion')
    }
  }

  // Initialize theme system
  function initializeTheme() {
    detectSystemTheme()
    loadPreferences()
    respectSystemPreferences()
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a theme
      const hasManualTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (!hasManualTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    })
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      if (e.matches) {
        setTheme('high-contrast')
      }
    })
  }

  return {
    // State
    currentTheme: readonly(currentTheme),
    currentLayout: readonly(currentLayout),
    themeConfig,
    layoutConfig,
    availableThemes,
    availableLayouts,
    isDarkMode,
    isHighContrastMode,
    isSystemDarkMode: readonly(isSystemDarkMode),
    
    // Theme functions
    setTheme,
    toggleTheme,
    cycleTheme,
    
    // Layout functions
    setLayout,
    cycleLayout,
    
    // Utilities
    initializeTheme,
    loadPreferences,
    respectSystemPreferences,
    getThemeForAccessibility
  }
}

// Create global instance for app-wide usage
let globalThemeInstance: ReturnType<typeof useTheme> | null = null

export function createGlobalTheme() {
  if (!globalThemeInstance) {
    globalThemeInstance = useTheme()
  }
  return globalThemeInstance
}

export function getGlobalTheme() {
  if (!globalThemeInstance) {
    throw new Error('Global theme not initialized. Call createGlobalTheme() first.')
  }
  return globalThemeInstance
}