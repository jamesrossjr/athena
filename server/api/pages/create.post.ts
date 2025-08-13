export default defineEventHandler(async (event) => {
  try {
    // Get the Authorization header
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization required'
      })
    }

    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Verify the token with Supabase
    const { supabase } = useSupabase()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    // Get request body
    const body = await readBody(event)
    const { workspaceId, title, type, icon, content } = body

    if (!workspaceId || !title || !title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace ID and page title are required'
      })
    }

    // Create page object
    const page = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      type: type || 'DOCUMENT',
      icon: icon || '📄',
      content: content || null,
      workspaceId,
      userId: user.id,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    // In a real app, you would save this to your database
    console.log('Created page for user:', user.email, page)

    return {
      success: true,
      message: 'Page created successfully',
      page
    }
  } catch (error: any) {
    console.error('Create page error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})