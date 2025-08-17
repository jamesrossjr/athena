// Athena Service Worker for Offline Support
const CACHE_NAME = 'athena-v1'
const OFFLINE_URL = '/offline'

// Files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/offline',
  '/demo',
  '/templates',
  '/ai/dashboard',
  // Add critical CSS and JS files
  '/_nuxt/entry.css',
  '/_nuxt/entry.js',
  // Add fonts and icons
  '/favicon.ico'
]

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching critical resources')
        return cache.addAll(CACHE_URLS)
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('📱 Service Worker: Serving from cache:', event.request.url)
          return cachedResponse
        }

        // Try to fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cache successful responses for future use
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Network failed, check if we have a fallback page
            if (event.request.mode === 'navigate') {
              console.log('🔌 Service Worker: Network failed, showing offline page')
              return caches.match(OFFLINE_URL)
            }
            
            // For other requests, we could return a default response
            return new Response('Offline - Content unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered')
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Push notifications
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New activity in Athena',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Athena', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('🔔 Service Worker: Notification clicked')
  
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Function to handle background sync
async function doBackgroundSync() {
  try {
    // Sync pending changes when connection is restored
    console.log('🔄 Service Worker: Performing background sync')
    
    // Get pending data from IndexedDB
    const pendingChanges = await getPendingChanges()
    
    // Sync each pending change
    for (const change of pendingChanges) {
      try {
        await syncChange(change)
        await removePendingChange(change.id)
        console.log('✅ Service Worker: Synced change:', change.id)
      } catch (error) {
        console.error('❌ Service Worker: Failed to sync change:', change.id, error)
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed:', error)
  }
}

// Helper functions for offline data management
async function getPendingChanges() {
  // This would integrate with IndexedDB to get pending changes
  // For now, return empty array
  return []
}

async function syncChange(change) {
  // This would sync the change with the server
  // Implementation depends on the specific change type
  console.log('Syncing change:', change)
}

async function removePendingChange(changeId) {
  // This would remove the change from IndexedDB
  console.log('Removing pending change:', changeId)
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('💬 Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})