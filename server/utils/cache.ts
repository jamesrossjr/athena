import Redis from 'ioredis'

let redis: Redis | null = null

// Initialize Redis connection
function getRedisClient(): Redis | null {
  if (!redis) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })
      
      redis.on('error', (error) => {
        console.warn('Redis connection error:', error.message)
        redis = null
      })
    } catch (error) {
      console.warn('Failed to initialize Redis:', error)
      return null
    }
  }
  
  return redis
}

// Cache utility functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient()
    if (!client) return null
    
    try {
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  },

  async set(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false
    
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('Cache set error:', error)
      return false
    }
  },

  async del(key: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false
    
    try {
      await client.del(key)
      return true
    } catch (error) {
      console.warn('Cache delete error:', error)
      return false
    }
  },

  async invalidatePattern(pattern: string): Promise<boolean> {
    const client = getRedisClient()
    if (!client) return false
    
    try {
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
      return true
    } catch (error) {
      console.warn('Cache invalidation error:', error)
      return false
    }
  },

  // Helper to create cache keys
  key: {
    document: (id: string) => `doc:${id}`,
    workspace: (id: string) => `workspace:${id}`,
    user: (id: string) => `user:${id}`,
    graph: (workspaceId: string) => `graph:${workspaceId}`,
    search: (query: string, workspaceId: string) => `search:${workspaceId}:${Buffer.from(query).toString('base64')}`
  }
}