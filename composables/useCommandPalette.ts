export const useCommandPalette = () => {
  const isOpen = ref(false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  // Global keyboard shortcut handler
  const handleKeyDown = (event: KeyboardEvent) => {
    // Check if we're in an input field
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || 
                   target.tagName === 'TEXTAREA' || 
                   target.contentEditable === 'true'

    // Open command palette with "/" key (when not in input)
    if (event.key === '/' && !isInput && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      open()
      return
    }

    // Also allow Ctrl+Shift+P or Cmd+Shift+P
    if (event.key === 'P' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault()
      toggle()
      return
    }

    // Close with Escape (only if command palette is open and not handled by component)
    if (event.key === 'Escape' && isOpen.value) {
      close()
      return
    }
  }

  // Set up global event listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    isOpen: readonly(isOpen),
    open,
    close,
    toggle
  }
}