interface AccessibilitySettings {
  screenReader: boolean
  highContrast: boolean
  reducedMotion: boolean
  largeText: boolean
  keyboardNavigation: boolean
  colorBlindnessSupport: string
  announcements: boolean
  focusVisible: boolean
  skipLinks: boolean
  altTextDescriptions: boolean
}

interface FocusTrap {
  activate: () => void
  deactivate: () => void
  pause: () => void
  unpause: () => void
}

export const useAccessibility = () => {
  // Reactive accessibility settings
  const settings = ref<AccessibilitySettings>({
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    keyboardNavigation: true,
    colorBlindnessSupport: 'none',
    announcements: true,
    focusVisible: true,
    skipLinks: true,
    altTextDescriptions: true
  })

  // Live region for announcements
  const liveRegion = ref<HTMLElement | null>(null)
  const politeRegion = ref<HTMLElement | null>(null)

  // Focus management
  const focusStack = ref<HTMLElement[]>([])
  const currentFocusTrap = ref<FocusTrap | null>(null)

  // Initialize accessibility features
  const init = () => {
    if (!process.client) return

    // Load saved settings
    loadSettings()
    
    // Apply settings
    applySettings()
    
    // Create live regions
    createLiveRegions()
    
    // Setup keyboard navigation
    setupKeyboardNavigation()
    
    // Setup motion preferences
    setupMotionPreferences()
    
    // Setup high contrast detection
    setupHighContrastDetection()
    
    // Setup focus management
    setupFocusManagement()
  }

  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('athena-accessibility')
      if (saved) {
        Object.assign(settings.value, JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error)
    }
  }

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('athena-accessibility', JSON.stringify(settings.value))
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error)
    }
  }

  // Apply accessibility settings to DOM
  const applySettings = () => {
    if (!process.client) return

    const root = document.documentElement

    // High contrast
    root.classList.toggle('high-contrast', settings.value.highContrast)
    
    // Large text
    root.classList.toggle('large-text', settings.value.largeText)
    
    // Reduced motion
    root.classList.toggle('reduced-motion', settings.value.reducedMotion)
    
    // Color blindness support
    root.setAttribute('data-colorblind-support', settings.value.colorBlindnessSupport)
    
    // Focus visible
    root.classList.toggle('focus-visible', settings.value.focusVisible)
    
    // Screen reader optimizations
    root.classList.toggle('screen-reader-active', settings.value.screenReader)
  }

  // Create ARIA live regions for announcements
  const createLiveRegions = () => {
    if (!process.client) return

    // Assertive live region (interrupts screen reader)
    if (!liveRegion.value) {
      liveRegion.value = document.createElement('div')
      liveRegion.value.setAttribute('aria-live', 'assertive')
      liveRegion.value.setAttribute('aria-atomic', 'true')
      liveRegion.value.className = 'sr-only'
      document.body.appendChild(liveRegion.value)
    }

    // Polite live region (waits for screen reader to finish)
    if (!politeRegion.value) {
      politeRegion.value = document.createElement('div')
      politeRegion.value.setAttribute('aria-live', 'polite')
      politeRegion.value.setAttribute('aria-atomic', 'true')
      politeRegion.value.className = 'sr-only'
      document.body.appendChild(politeRegion.value)
    }
  }

  // Announce message to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.value.announcements || !process.client) return

    const region = priority === 'assertive' ? liveRegion.value : politeRegion.value
    if (region) {
      // Clear and then set the message to ensure it's announced
      region.textContent = ''
      setTimeout(() => {
        region.textContent = message
      }, 100)
    }
  }

  // Setup keyboard navigation
  const setupKeyboardNavigation = () => {
    if (!process.client) return

    document.addEventListener('keydown', (event) => {
      // Skip links with Alt + S
      if (event.altKey && event.key === 's') {
        event.preventDefault()
        showSkipLinks()
      }

      // Focus trap handling
      if (currentFocusTrap.value && event.key === 'Tab') {
        handleFocusTrap(event)
      }

      // Command palette with Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        // Emit event for command palette
        document.dispatchEvent(new CustomEvent('open-command-palette'))
      }

      // Help with F1
      if (event.key === 'F1') {
        event.preventDefault()
        // Emit event for help
        document.dispatchEvent(new CustomEvent('open-help'))
      }
    })

    // Focus visible handling
    document.addEventListener('mousedown', () => {
      document.body.classList.add('mouse-navigation')
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.remove('mouse-navigation')
      }
    })
  }

  // Setup motion preferences detection
  const setupMotionPreferences = () => {
    if (!process.client) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const updateMotionPreference = () => {
      if (mediaQuery.matches && !settings.value.reducedMotion) {
        updateSetting('reducedMotion', true)
      }
    }

    mediaQuery.addListener(updateMotionPreference)
    updateMotionPreference()
  }

  // Setup high contrast detection
  const setupHighContrastDetection = () => {
    if (!process.client) return

    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    
    const updateContrastPreference = () => {
      if (mediaQuery.matches && !settings.value.highContrast) {
        updateSetting('highContrast', true)
      }
    }

    mediaQuery.addListener(updateContrastPreference)
    updateContrastPreference()
  }

  // Setup focus management
  const setupFocusManagement = () => {
    if (!process.client) return

    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement
      if (target && target !== document.body) {
        focusStack.value.push(target)
        // Keep only last 10 focuses
        if (focusStack.value.length > 10) {
          focusStack.value.shift()
        }
      }
    })
  }

  // Update a specific setting
  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    settings.value[key] = value
    applySettings()
    saveSettings()
    
    // Announce setting change
    announce(`Accessibility setting ${key} ${value ? 'enabled' : 'disabled'}`)
  }

  // Show skip links
  const showSkipLinks = () => {
    if (!settings.value.skipLinks) return

    const skipLinks = document.querySelector('.skip-links') as HTMLElement
    if (skipLinks) {
      skipLinks.style.display = 'block'
      const firstLink = skipLinks.querySelector('a') as HTMLElement
      firstLink?.focus()
    }
  }

  // Create focus trap for modal/dialog
  const createFocusTrap = (element: HTMLElement): FocusTrap => {
    let isActive = false
    let isPaused = false
    let previousFocus: HTMLElement | null = null

    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex^="-"])'
      ].join(',')

      return Array.from(element.querySelectorAll(selector))
        .filter(el => {
          const element = el as HTMLElement
          return element.offsetWidth > 0 && 
                 element.offsetHeight > 0 && 
                 !element.hidden &&
                 getComputedStyle(element).visibility !== 'hidden'
        }) as HTMLElement[]
    }

    const handleTabKey = (event: KeyboardEvent) => {
      if (!isActive || isPaused) return

      const focusableElements = getFocusableElements()
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    const activate = () => {
      if (isActive) return

      previousFocus = document.activeElement as HTMLElement
      isActive = true

      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }

      document.addEventListener('keydown', handleTabKey)
    }

    const deactivate = () => {
      if (!isActive) return

      isActive = false
      document.removeEventListener('keydown', handleTabKey)
      
      if (previousFocus) {
        previousFocus.focus()
        previousFocus = null
      }
    }

    const pause = () => {
      isPaused = true
    }

    const unpause = () => {
      isPaused = false
    }

    return { activate, deactivate, pause, unpause }
  }

  // Handle focus trap tab navigation
  const handleFocusTrap = (event: KeyboardEvent) => {
    // This is handled by the individual focus trap
  }

  // Manage focus for route changes
  const manageFocusForRouteChange = (targetSelector = 'h1, [role="main"]') => {
    nextTick(() => {
      const target = document.querySelector(targetSelector) as HTMLElement
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  // Get ARIA attributes for component
  const getAriaAttributes = (config: {
    label?: string
    labelledby?: string
    describedby?: string
    expanded?: boolean
    selected?: boolean
    checked?: boolean
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    level?: number
    role?: string
  }) => {
    const attrs: Record<string, string | boolean | number> = {}

    if (config.label) attrs['aria-label'] = config.label
    if (config.labelledby) attrs['aria-labelledby'] = config.labelledby
    if (config.describedby) attrs['aria-describedby'] = config.describedby
    if (config.expanded !== undefined) attrs['aria-expanded'] = config.expanded
    if (config.selected !== undefined) attrs['aria-selected'] = config.selected
    if (config.checked !== undefined) attrs['aria-checked'] = config.checked
    if (config.disabled !== undefined) attrs['aria-disabled'] = config.disabled
    if (config.required !== undefined) attrs['aria-required'] = config.required
    if (config.invalid !== undefined) attrs['aria-invalid'] = config.invalid
    if (config.level !== undefined) attrs['aria-level'] = config.level
    if (config.role) attrs['role'] = config.role

    return attrs
  }

  // Generate unique IDs for accessibility
  const generateId = (prefix = 'athena-a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if user prefers reduced motion
  const prefersReducedMotion = computed(() => {
    return settings.value.reducedMotion || 
           (process.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  })

  // Check if high contrast is enabled
  const isHighContrast = computed(() => {
    return settings.value.highContrast ||
           (process.client && window.matchMedia('(prefers-contrast: high)').matches)
  })

  // Color blindness filters
  const colorBlindnessFilters = {
    none: '',
    protanopia: 'url(#protanopia-filter)',
    deuteranopia: 'url(#deuteranopia-filter)',
    tritanopia: 'url(#tritanopia-filter)',
    achromatopsia: 'url(#achromatopsia-filter)'
  }

  // Apply color blindness filter
  const applyColorBlindnessFilter = (type: keyof typeof colorBlindnessFilters) => {
    if (!process.client) return

    const filter = colorBlindnessFilters[type]
    document.documentElement.style.filter = filter
    updateSetting('colorBlindnessSupport', type)
  }

  // Create SVG filters for color blindness simulation
  const createColorBlindnessFilters = () => {
    if (!process.client) return

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.width = '0'
    svg.style.height = '0'
    svg.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="achromatopsia-filter">
          <feColorMatrix values="0.299,0.587,0.114,0,0 0.299,0.587,0.114,0,0 0.299,0.587,0.114,0,0 0,0,0,1,0"/>
        </filter>
      </defs>
    `
    document.body.appendChild(svg)
  }

  // Cleanup function
  const cleanup = () => {
    if (currentFocusTrap.value) {
      currentFocusTrap.value.deactivate()
    }
    
    if (liveRegion.value) {
      liveRegion.value.remove()
    }
    
    if (politeRegion.value) {
      politeRegion.value.remove()
    }
  }

  // Initialize on mount
  onMounted(() => {
    init()
    createColorBlindnessFilters()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    settings: readonly(settings),
    prefersReducedMotion,
    isHighContrast,
    
    // Settings management
    updateSetting,
    loadSettings,
    saveSettings,
    
    // Announcements
    announce,
    
    // Focus management
    createFocusTrap,
    manageFocusForRouteChange,
    
    // Utilities
    getAriaAttributes,
    generateId,
    applyColorBlindnessFilter,
    
    // Initialize
    init
  }
}