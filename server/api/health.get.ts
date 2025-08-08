export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.public.version,
    app: config.public.appName,
    uptime: process.uptime()
  }
})