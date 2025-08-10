export const useDocuments = () => {
  const workspaceStore = useWorkspaceStore()
  
  const importPDF = async (file: File, title?: string) => {
    const formData = new FormData()
    formData.append('pdf', file)
    if (title) {
      formData.append('title', title)
    }
    
    try {
      const response = await $fetch('/api/documents/import-pdf', {
        method: 'POST',
        body: formData
      })
      
      // Add document to current workspace
      if (response.success && response.document && workspaceStore.activeWorkspace) {
        const document = {
          title: response.document.title,
          type: 'pdf' as const,
          fileData: response.document.fileData,
          fileName: response.document.fileName,
          fileSize: response.document.fileSize,
          mimeType: 'application/pdf'
        }
        
        workspaceStore.openDocument(workspaceStore.activeWorkspaceId, document)
      }
      
      return response
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Failed to import PDF')
    }
  }
  
  const getDocument = async (id: string) => {
    try {
      const response = await $fetch(`/api/documents/${id}`)
      return response
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Failed to retrieve document')
    }
  }
  
  const listDocuments = async (type?: string) => {
    try {
      const query = type ? `?type=${type}` : ''
      const response = await $fetch(`/api/documents${query}`)
      return response
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Failed to list documents')
    }
  }
  
  const createTextDocument = async (title: string, content: string) => {
    try {
      // Create document in current workspace directly
      if (workspaceStore.activeWorkspace) {
        const document = {
          title,
          type: 'page' as const,
          content
        }
        
        return workspaceStore.openDocument(workspaceStore.activeWorkspaceId, document)
      }
      
      throw new Error('No active workspace')
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Failed to create document')
    }
  }
  
  const createDocument = (type: 'page' | 'table' | 'whiteboard' | 'database', title?: string) => {
    if (!workspaceStore.activeWorkspace) {
      throw new Error('No active workspace')
    }
    
    const document = {
      title: title || `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      content: type === 'page' ? '' : null
    }
    
    return workspaceStore.openDocument(workspaceStore.activeWorkspaceId, document)
  }
  
  return {
    importPDF,
    getDocument,
    listDocuments,
    createTextDocument,
    createDocument
  }
}