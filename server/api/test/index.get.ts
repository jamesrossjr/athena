export default defineEventHandler(async (event) => {
  return {
    message: 'API test endpoint working',
    timestamp: new Date().toISOString()
  }
})