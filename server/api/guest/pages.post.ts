/**
 * POST /api/guest/pages
 * Create a new page in guest session
 */

export default defineEventHandler(async (event) => {
  try {
    // Get guest session from cookie
    const sessionId = getCookie(event, 'guest-session-id')
    
    if (!sessionId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No guest session found'
      })
    }
    
    // Get request body
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.workspaceId || !body.title || !body.type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace ID, title, and type are required'
      })
    }
    
    // Get guest session workspaces
    const workspacesData = getCookie(event, `guest-workspaces-${sessionId}`)
    const workspaces = workspacesData ? JSON.parse(workspacesData) : []
    
    // Find the workspace
    const workspace = workspaces.find((w: any) => w.id === body.workspaceId)
    if (!workspace) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found'
      })
    }
    
    // Create the page
    const newPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: body.workspaceId,
      title: body.title,
      type: body.type || 'DOCUMENT',
      icon: body.icon || '📄',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: body.properties || {},
      blocks: []
    }
    
    // Get existing pages for this workspace
    const pagesKey = `guest-pages-${sessionId}-${body.workspaceId}`
    const existingPagesData = getCookie(event, pagesKey)
    const pages = existingPagesData ? JSON.parse(existingPagesData) : []
    
    // Add the new page
    pages.push(newPage)
    
    // Store updated pages in cookie
    setCookie(event, pagesKey, JSON.stringify(pages), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return {
      success: true,
      data: newPage
    }
    
  } catch (error: any) {
    console.error('Error creating guest page:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create page'
    })
  }
})