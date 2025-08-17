interface LocaleMessage {
  [key: string]: string | LocaleMessage
}

interface I18nConfig {
  locale: string
  fallbackLocale: string
  messages: Record<string, LocaleMessage>
  rtlLocales: string[]
  dateFormats: Record<string, Intl.DateTimeFormatOptions>
  numberFormats: Record<string, Intl.NumberFormatOptions>
}

const i18nConfig: I18nConfig = {
  locale: 'en',
  fallbackLocale: 'en',
  messages: {},
  rtlLocales: ['ar', 'he', 'fa', 'ur'],
  dateFormats: {
    'en': {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    },
    'es': {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    },
    'ar': {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    }
  },
  numberFormats: {
    'en': {
      currency: { style: 'currency', currency: 'USD' },
      decimal: { style: 'decimal', minimumFractionDigits: 2 },
      percent: { style: 'percent' }
    },
    'es': {
      currency: { style: 'currency', currency: 'EUR' },
      decimal: { style: 'decimal', minimumFractionDigits: 2 },
      percent: { style: 'percent' }
    },
    'ar': {
      currency: { style: 'currency', currency: 'USD' },
      decimal: { style: 'decimal', minimumFractionDigits: 2 },
      percent: { style: 'percent' }
    }
  }
}

export const useI18n = () => {
  const locale = ref(i18nConfig.locale)
  const fallbackLocale = ref(i18nConfig.fallbackLocale)
  const messages = ref<Record<string, LocaleMessage>>(i18nConfig.messages)
  const isRTL = computed(() => i18nConfig.rtlLocales.includes(locale.value))

  // Load locale messages
  const loadLocaleMessages = async (targetLocale: string): Promise<void> => {
    if (messages.value[targetLocale]) {
      return // Already loaded
    }

    try {
      const response = await $fetch(`/locales/${targetLocale}.json`)
      messages.value[targetLocale] = response
    } catch (error) {
      console.warn(`Failed to load locale ${targetLocale}:`, error)
    }
  }

  // Get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined
    }, obj)
  }

  // Translate function
  const t = (key: string, params: Record<string, any> = {}): string => {
    // Try current locale first
    let message = getNestedValue(messages.value[locale.value], key)
    
    // Fallback to fallback locale
    if (!message && locale.value !== fallbackLocale.value) {
      message = getNestedValue(messages.value[fallbackLocale.value], key)
    }

    // Return key if no translation found
    if (!message) {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }

    // Replace parameters in the message
    return message.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? String(params[param]) : match
    })
  }

  // Pluralization
  const tc = (key: string, count: number, params: Record<string, any> = {}): string => {
    const pluralKey = count === 1 ? key : `${key}_plural`
    return t(pluralKey, { count, ...params })
  }

  // Date formatting
  const d = (date: Date | string | number, format = 'short'): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date

    const formatOptions = i18nConfig.dateFormats[locale.value]?.[format] || 
                         i18nConfig.dateFormats[fallbackLocale.value]?.[format] ||
                         { year: 'numeric', month: 'short', day: 'numeric' }

    return new Intl.DateTimeFormat(locale.value, formatOptions).format(dateObj)
  }

  // Number formatting
  const n = (number: number, format = 'decimal'): string => {
    const formatOptions = i18nConfig.numberFormats[locale.value]?.[format] || 
                         i18nConfig.numberFormats[fallbackLocale.value]?.[format] ||
                         { style: 'decimal' }

    return new Intl.NumberFormat(locale.value, formatOptions).format(number)
  }

  // Relative time formatting
  const rt = (date: Date | string | number): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSeconds < 60) {
      return diffSeconds <= 5 ? t('time.justNow') : t('time.secondsAgo', { count: diffSeconds })
    } else if (diffMinutes < 60) {
      return t('time.minutesAgo', { count: diffMinutes })
    } else if (diffHours < 24) {
      return t('time.hoursAgo', { count: diffHours })
    } else if (diffDays < 7) {
      return t('time.daysAgo', { count: diffDays })
    } else if (diffWeeks < 4) {
      return t('time.weeksAgo', { count: diffWeeks })
    } else if (diffMonths < 12) {
      return t('time.monthsAgo', { count: diffMonths })
    } else {
      return t('time.yearsAgo', { count: diffYears })
    }
  }

  // Set locale
  const setLocale = async (newLocale: string): Promise<void> => {
    await loadLocaleMessages(newLocale)
    locale.value = newLocale
    
    // Update document direction
    if (process.client) {
      document.documentElement.dir = isRTL.value ? 'rtl' : 'ltr'
      document.documentElement.lang = newLocale
      
      // Store in localStorage
      localStorage.setItem('athena-locale', newLocale)
    }
  }

  // Get available locales
  const getAvailableLocales = (): Array<{ code: string; name: string; flag: string }> => {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
    ]
  }

  // Initialize
  const init = async (): Promise<void> => {
    // Load saved locale from localStorage
    if (process.client) {
      const savedLocale = localStorage.getItem('athena-locale')
      if (savedLocale && savedLocale !== locale.value) {
        await setLocale(savedLocale)
        return
      }

      // Detect browser locale
      const browserLocale = navigator.language.split('-')[0]
      if (browserLocale !== locale.value && getAvailableLocales().some(l => l.code === browserLocale)) {
        await setLocale(browserLocale)
        return
      }
    }

    // Load default locale
    await loadLocaleMessages(locale.value)
    
    if (process.client) {
      document.documentElement.dir = isRTL.value ? 'rtl' : 'ltr'
      document.documentElement.lang = locale.value
    }
  }

  // Auto-detect user's preferred locale
  const detectLocale = (): string => {
    if (process.client) {
      // Check localStorage first
      const savedLocale = localStorage.getItem('athena-locale')
      if (savedLocale) return savedLocale

      // Check browser language
      const browserLocale = navigator.language.split('-')[0]
      const availableLocales = getAvailableLocales().map(l => l.code)
      if (availableLocales.includes(browserLocale)) {
        return browserLocale
      }
    }

    return fallbackLocale.value
  }

  // Text direction helpers
  const getTextDirection = (): 'ltr' | 'rtl' => {
    return isRTL.value ? 'rtl' : 'ltr'
  }

  const getTextAlign = (align: 'left' | 'right' | 'center' = 'left'): string => {
    if (align === 'center') return 'center'
    
    if (isRTL.value) {
      return align === 'left' ? 'right' : 'left'
    }
    
    return align
  }

  const getFlexDirection = (reverse = false): string => {
    if (isRTL.value) {
      return reverse ? 'row' : 'row-reverse'
    }
    
    return reverse ? 'row-reverse' : 'row'
  }

  // Accessibility helpers
  const getAriaLabel = (key: string, params: Record<string, any> = {}): string => {
    return t(`aria.${key}`, params) || t(key, params)
  }

  const getScreenReaderText = (key: string, params: Record<string, any> = {}): string => {
    return t(`sr.${key}`, params) || t(key, params)
  }

  // Currency formatting
  const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency
    }).format(amount)
  }

  // Percentage formatting
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat(locale.value, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  // List formatting
  const formatList = (items: string[], type: 'conjunction' | 'disjunction' = 'conjunction'): string => {
    if (items.length === 0) return ''
    if (items.length === 1) return items[0]

    try {
      return new Intl.ListFormat(locale.value, { type }).format(items)
    } catch {
      // Fallback for browsers that don't support Intl.ListFormat
      if (items.length === 2) {
        return type === 'conjunction' 
          ? `${items[0]} ${t('common.and')} ${items[1]}`
          : `${items[0]} ${t('common.or')} ${items[1]}`
      }
      
      const lastItem = items[items.length - 1]
      const otherItems = items.slice(0, -1).join(', ')
      const connector = type === 'conjunction' ? t('common.and') : t('common.or')
      
      return `${otherItems}, ${connector} ${lastItem}`
    }
  }

  return {
    // State
    locale: readonly(locale),
    fallbackLocale: readonly(fallbackLocale),
    isRTL: readonly(isRTL),
    
    // Translation functions
    t,
    tc,
    d,
    n,
    rt,
    
    // Locale management
    setLocale,
    getAvailableLocales,
    detectLocale,
    
    // Initialization
    init,
    
    // Direction helpers
    getTextDirection,
    getTextAlign,
    getFlexDirection,
    
    // Accessibility
    getAriaLabel,
    getScreenReaderText,
    
    // Formatting
    formatCurrency,
    formatPercent,
    formatList
  }
}