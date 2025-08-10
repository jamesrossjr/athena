export const usePageLinks = () => {
  /**
   * Extract page links from document content
   * @param document - The document to scan for links
   * @returns Array of page names found in [[Page Name]] patterns
   */
  function extractPageLinksFromDocument(document: any): string[] {
    if (!document) return []
    
    const links: string[] = []
    
    // Handle blocks-based documents (like pages)
    if (document.blocks && Array.isArray(document.blocks)) {
      document.blocks.forEach((block: any) => {
        if (block.content) {
          const blockLinks = extractPageLinksFromContent(block.content)
          links.push(...blockLinks)
        }
        
        // Handle list items
        if (block.items && Array.isArray(block.items)) {
          block.items.forEach((item: string) => {
            const itemLinks = extractPageLinksFromContent(item)
            links.push(...itemLinks)
          })
        }
      })
    }
    
    // Handle plain content documents
    if (document.content && typeof document.content === 'string') {
      const contentLinks = extractPageLinksFromContent(document.content)
      links.push(...contentLinks)
    }
    
    // Remove duplicates and return
    return Array.from(new Set(links))
  }
  
  /**
   * Extract page links from text content
   * @param content - Text content to scan
   * @returns Array of page names found in [[Page Name]] patterns
   */
  function extractPageLinksFromContent(content: string): string[] {
    if (!content) return []
    
    const linkPattern = /\[\[([^\]]+)\]\]/g
    const links: string[] = []
    let match
    
    while ((match = linkPattern.exec(content)) !== null) {
      const pageName = match[1].trim()
      if (pageName) {
        links.push(pageName)
      }
    }
    
    return links
  }
  
  /**
   * Find document IDs by page names
   * @param pageNames - Array of page names to look up
   * @param documents - Array of documents to search in
   * @returns Array of document IDs
   */
  function findDocumentIdsByPageNames(pageNames: string[], documents: any[]): string[] {
    const ids: string[] = []
    
    pageNames.forEach(pageName => {
      const doc = documents.find(d => 
        d.title && d.title.toLowerCase() === pageName.toLowerCase()
      )
      if (doc && doc.id) {
        ids.push(doc.id)
      }
    })
    
    return ids
  }
  
  /**
   * Update links and backlinks for a document
   * @param documentId - ID of the document being updated
   * @param newLinks - Array of document IDs this document now links to
   * @param allDocuments - Array of all documents in the workspace
   * @returns Updated documents with corrected backlinks
   */
  function updateLinksAndBacklinks(
    documentId: string,
    newLinks: string[],
    allDocuments: any[]
  ): any[] {
    const updatedDocuments = [...allDocuments]
    
    // Find the current document
    const currentDocIndex = updatedDocuments.findIndex(d => d.id === documentId)
    if (currentDocIndex === -1) return updatedDocuments
    
    const currentDoc = updatedDocuments[currentDocIndex]
    const oldLinks = currentDoc.links || []
    
    // Update the current document's links
    currentDoc.links = newLinks
    
    // Remove backlinks from documents that are no longer linked
    const removedLinks = oldLinks.filter((link: string) => !newLinks.includes(link))
    removedLinks.forEach((removedLink: string) => {
      const linkedDocIndex = updatedDocuments.findIndex(d => d.id === removedLink)
      if (linkedDocIndex !== -1) {
        const linkedDoc = updatedDocuments[linkedDocIndex]
        linkedDoc.backlinks = (linkedDoc.backlinks || []).filter(
          (backlink: string) => backlink !== documentId
        )
      }
    })
    
    // Add backlinks to newly linked documents
    const addedLinks = newLinks.filter(link => !oldLinks.includes(link))
    addedLinks.forEach(addedLink => {
      const linkedDocIndex = updatedDocuments.findIndex(d => d.id === addedLink)
      if (linkedDocIndex !== -1) {
        const linkedDoc = updatedDocuments[linkedDocIndex]
        linkedDoc.backlinks = linkedDoc.backlinks || []
        if (!linkedDoc.backlinks.includes(documentId)) {
          linkedDoc.backlinks.push(documentId)
        }
      }
    })
    
    return updatedDocuments
  }
  
  /**
   * Process document save and update all links/backlinks
   * @param document - The document being saved
   * @param allDocuments - Array of all documents in the workspace
   * @returns Updated documents with corrected links and backlinks
   */
  function processDocumentLinksOnSave(document: any, allDocuments: any[]): any[] {
    if (!document || !document.id) return allDocuments
    
    // Extract page names from the document content
    const linkedPageNames = extractPageLinksFromDocument(document)
    
    // Convert page names to document IDs
    const linkedDocumentIds = findDocumentIdsByPageNames(linkedPageNames, allDocuments)
    
    // Update links and backlinks
    return updateLinksAndBacklinks(document.id, linkedDocumentIds, allDocuments)
  }
  
  /**
   * Get documents that link to the specified document
   * @param documentId - ID of the document to find backlinks for
   * @param allDocuments - Array of all documents in the workspace
   * @returns Array of documents that link to the specified document
   */
  function getBacklinksForDocument(documentId: string, allDocuments: any[]): any[] {
    const targetDoc = allDocuments.find(d => d.id === documentId)
    if (!targetDoc || !targetDoc.backlinks) return []
    
    return allDocuments.filter(doc => 
      targetDoc.backlinks.includes(doc.id)
    )
  }
  
  return {
    extractPageLinksFromDocument,
    extractPageLinksFromContent,
    findDocumentIdsByPageNames,
    updateLinksAndBacklinks,
    processDocumentLinksOnSave,
    getBacklinksForDocument
  }
}