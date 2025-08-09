export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    transitions: {
      'enter-active-class': 'transition-all duration-200 ease-out',
      'leave-active-class': 'transition-all duration-150 ease-in',
      'enter-from-class': 'opacity-0 scale-95',
      'enter-to-class': 'opacity-100 scale-100',
      'leave-from-class': 'opacity-100 scale-100',
      'leave-to-class': 'opacity-0 scale-95'
    },
    notifications: {
      position: 'top-0 bottom-auto'
    }
  }
})