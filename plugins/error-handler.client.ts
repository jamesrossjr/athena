export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue error:', error, info)
    
    // You can send errors to a logging service here
    // Example: sendToLoggingService(error, info)
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // You can send errors to a logging service here
    // Example: sendToLoggingService(event.reason, 'unhandledrejection')
  })
})