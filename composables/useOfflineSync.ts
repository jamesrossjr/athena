interface OfflineChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'document' | 'workspace' | 'user'
  entityId: string
  data: any
  timestamp: number
  synced: boolean
}

interface OfflineDocument {
  id: string
  title: string
  type: string
  content: any
  workspaceId: string
  lastModified: number
  synced: boolean
}

export const useOfflineSync = () => {
  const isOnline = ref(navigator.onLine)
  const db = ref<IDBDatabase | null>(null)
  const syncInProgress = ref(false)
  const pendingChanges = ref<OfflineChange[]>([])

  // Initialize IndexedDB
  const initDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AthenaOfflineDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' })
          documentsStore.createIndex('workspaceId', 'workspaceId', { unique: false })
          documentsStore.createIndex('lastModified', 'lastModified', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('changes')) {
          const changesStore = db.createObjectStore('changes', { keyPath: 'id' })
          changesStore.createIndex('synced', 'synced', { unique: false })
          changesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  // Initialize on mount
  onMounted(async () => {
    try {
      db.value = await initDB()
      await loadPendingChanges()
      console.log('📱 Offline sync initialized')
    } catch (error) {
      console.error('Failed to initialize offline sync:', error)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    db.value?.close()
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  const handleOnline = async () => {
    isOnline.value = true
    console.log('🌐 Back online, starting sync...')
    await syncPendingChanges()
  }

  const handleOffline = () => {
    isOnline.value = false
    console.log('📱 Gone offline')
  }

  // Save document offline
  const saveDocumentOffline = async (document: any): Promise<void> => {
    if (!db.value) throw new Error('Database not initialized')

    const offlineDoc: OfflineDocument = {
      id: document.id,
      title: document.title,
      type: document.type,
      content: document.content,
      workspaceId: document.workspaceId,
      lastModified: Date.now(),
      synced: isOnline.value
    }

    const transaction = db.value.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(offlineDoc)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Track the change for syncing
    if (!isOnline.value) {
      await addPendingChange({
        id: `doc-${document.id}-${Date.now()}`,
        type: 'update',
        entityType: 'document',
        entityId: document.id,
        data: document,
        timestamp: Date.now(),
        synced: false
      })
    }

    console.log('💾 Document saved offline:', document.title)
  }

  // Load documents from offline storage
  const loadDocumentsOffline = async (workspaceId?: string): Promise<OfflineDocument[]> => {
    if (!db.value) return []

    const transaction = db.value.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = workspaceId 
        ? store.index('workspaceId').getAll(workspaceId)
        : store.getAll()
      
      request.onsuccess = () => {
        const docs = request.result.sort((a, b) => b.lastModified - a.lastModified)
        resolve(docs)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Add pending change
  const addPendingChange = async (change: OfflineChange): Promise<void> => {
    if (!db.value) return

    const transaction = db.value.transaction(['changes'], 'readwrite')
    const store = transaction.objectStore('changes')
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(change)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    pendingChanges.value.push(change)
  }

  // Load pending changes
  const loadPendingChanges = async (): Promise<void> => {
    if (!db.value) return

    const transaction = db.value.transaction(['changes'], 'readonly')
    const store = transaction.objectStore('changes')
    
    const changes = await new Promise<OfflineChange[]>((resolve, reject) => {
      const request = store.index('synced').getAll(false)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    pendingChanges.value = changes.sort((a, b) => a.timestamp - b.timestamp)
  }

  // Sync pending changes with server
  const syncPendingChanges = async (): Promise<void> => {
    if (!isOnline.value || syncInProgress.value || pendingChanges.value.length === 0) {
      return
    }

    syncInProgress.value = true
    console.log(`🔄 Syncing ${pendingChanges.value.length} pending changes...`)

    try {
      for (const change of pendingChanges.value) {
        try {
          await syncChange(change)
          await markChangeSynced(change.id)
          console.log('✅ Synced change:', change.id)
        } catch (error) {
          console.error('❌ Failed to sync change:', change.id, error)
          // Continue with other changes
        }
      }

      // Reload pending changes
      await loadPendingChanges()
      
      console.log('🎉 Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      syncInProgress.value = false
    }
  }

  // Sync individual change
  const syncChange = async (change: OfflineChange): Promise<void> => {
    const { type, entityType, entityId, data } = change

    switch (entityType) {
      case 'document':
        if (type === 'update') {
          await $fetch(`/api/documents/${entityId}`, {
            method: 'PUT',
            body: data
          })
        } else if (type === 'create') {
          await $fetch('/api/documents/create', {
            method: 'POST',
            body: data
          })
        } else if (type === 'delete') {
          await $fetch(`/api/documents/${entityId}`, {
            method: 'DELETE'
          })
        }
        break

      // Add other entity types as needed
      default:
        console.warn('Unknown entity type for sync:', entityType)
    }
  }

  // Mark change as synced
  const markChangeSynced = async (changeId: string): Promise<void> => {
    if (!db.value) return

    const transaction = db.value.transaction(['changes'], 'readwrite')
    const store = transaction.objectStore('changes')
    
    await new Promise<void>((resolve, reject) => {
      const getRequest = store.get(changeId)
      getRequest.onsuccess = () => {
        const change = getRequest.result
        if (change) {
          change.synced = true
          const putRequest = store.put(change)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })

    // Remove from pending changes
    pendingChanges.value = pendingChanges.value.filter(c => c.id !== changeId)
  }

  // Clean up old synced changes
  const cleanupSyncedChanges = async (): Promise<void> => {
    if (!db.value) return

    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days ago
    const transaction = db.value.transaction(['changes'], 'readwrite')
    const store = transaction.objectStore('changes')
    
    const index = store.index('timestamp')
    const range = IDBKeyRange.upperBound(cutoffTime)
    
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(range)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get offline storage stats
  const getStorageStats = async () => {
    if (!db.value) return { documents: 0, pendingChanges: 0, storageUsed: 0 }

    const transaction = db.value.transaction(['documents', 'changes'], 'readonly')
    
    const docsCount = await new Promise<number>((resolve) => {
      const request = transaction.objectStore('documents').count()
      request.onsuccess = () => resolve(request.result)
    })
    
    const changesCount = await new Promise<number>((resolve) => {
      const request = transaction.objectStore('changes').count()
      request.onsuccess = () => resolve(request.result)
    })

    // Estimate storage usage (rough calculation)
    const storageUsed = await navigator.storage?.estimate?.()?.then(estimate => estimate.usage || 0) || 0

    return {
      documents: docsCount,
      pendingChanges: changesCount,
      storageUsed: Math.round(storageUsed / 1024 / 1024 * 100) / 100 // MB
    }
  }

  return {
    isOnline: readonly(isOnline),
    syncInProgress: readonly(syncInProgress),
    pendingChanges: readonly(pendingChanges),
    saveDocumentOffline,
    loadDocumentsOffline,
    syncPendingChanges,
    cleanupSyncedChanges,
    getStorageStats
  }
}