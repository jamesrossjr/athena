<template>
  <div class="skip-links" @keydown.escape="hide">
    <a
      v-for="link in skipLinks"
      :key="link.id"
      :href="link.href"
      class="skip-link"
      @click="handleSkipClick"
      @focus="show"
      @blur="handleBlur"
    >
      {{ $t(link.label) }}
    </a>
  </div>
</template>

<script setup lang="ts">
interface SkipLink {
  id: string
  href: string
  label: string
}

// Skip links configuration
const skipLinks: SkipLink[] = [
  {
    id: 'skip-to-main',
    href: '#main-content',
    label: 'skipLinks.mainContent'
  },
  {
    id: 'skip-to-nav',
    href: '#main-navigation',
    label: 'skipLinks.navigation'
  },
  {
    id: 'skip-to-search',
    href: '#search',
    label: 'skipLinks.search'
  },
  {
    id: 'skip-to-footer',
    href: '#footer',
    label: 'skipLinks.footer'
  }
]

const isVisible = ref(false)
const timeoutId = ref<number | null>(null)

// Show skip links
const show = () => {
  isVisible.value = true
  clearTimeout(timeoutId.value)
}

// Hide skip links
const hide = () => {
  isVisible.value = false
}

// Handle blur with delay to allow navigation between links
const handleBlur = () => {
  timeoutId.value = setTimeout(() => {
    hide()
  }, 100)
}

// Handle skip link click
const handleSkipClick = (event: Event) => {
  const target = event.target as HTMLAnchorElement
  const targetId = target.getAttribute('href')?.substring(1)
  
  if (targetId) {
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      event.preventDefault()
      
      // Focus the target element
      targetElement.focus()
      
      // If the element can't receive focus, make it focusable temporarily
      if (document.activeElement !== targetElement) {
        targetElement.setAttribute('tabindex', '-1')
        targetElement.focus()
        
        // Remove tabindex after a short delay
        setTimeout(() => {
          targetElement.removeAttribute('tabindex')
        }, 100)
      }
      
      // Scroll to the element
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      
      // Hide skip links
      hide()
    }
  }
}

// Listen for Alt+S keyboard shortcut
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      show()
      
      // Focus the first skip link
      nextTick(() => {
        const firstLink = document.querySelector('.skip-link') as HTMLElement
        firstLink?.focus()
      })
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }
  })
})
</script>

<style scoped>
.skip-links {
  position: fixed;
  top: -100vh;
  left: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background-color: white;
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  transition: top 0.2s ease-in-out;
}

.skip-links:focus-within {
  top: 1rem;
}

.skip-link {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.25rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.skip-link:hover,
.skip-link:focus {
  background-color: #2563eb;
  outline: 2px solid #fbbf24;
  outline-offset: 2px;
}

/* High contrast mode */
.high-contrast .skip-links {
  background-color: #000000;
  border-color: #ffffff;
}

.high-contrast .skip-link {
  background-color: #000000;
  border: 1px solid #ffffff;
  color: #ffffff;
}

.high-contrast .skip-link:hover,
.high-contrast .skip-link:focus {
  background-color: #ffffff;
  color: #000000;
}

/* Reduced motion */
.reduced-motion .skip-links {
  transition: none;
}

.reduced-motion .skip-link {
  transition: none;
}

/* RTL support */
[dir="rtl"] .skip-links {
  left: auto;
  right: 0;
}
</style>

<i18n>
{
  "en": {
    "skipLinks": {
      "mainContent": "Skip to main content",
      "navigation": "Skip to navigation",
      "search": "Skip to search",
      "footer": "Skip to footer"
    }
  },
  "es": {
    "skipLinks": {
      "mainContent": "Saltar al contenido principal",
      "navigation": "Saltar a la navegación",
      "search": "Saltar a la búsqueda",
      "footer": "Saltar al pie de página"
    }
  },
  "ar": {
    "skipLinks": {
      "mainContent": "تخطي إلى المحتوى الرئيسي",
      "navigation": "تخطي إلى التنقل",
      "search": "تخطي إلى البحث",
      "footer": "تخطي إلى التذييل"
    }
  }
}
</i18n>