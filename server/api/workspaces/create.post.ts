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
    const { name, icon, color } = body

    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Workspace name is required'
      })
    }

    // Create workspace object
    const workspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      icon: icon || '🏠',
      color: color || '#3b82f6',
      userId: user.id,
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }

    // In a real app, you would save this to your database
    // For demo purposes, we'll just return the created workspace
    console.log('Created workspace for user:', user.email, workspace)

    return {
      success: true,
      message: 'Workspace created successfully',
      workspace
    }
  } catch (error: any) {
    console.error('Create workspace error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})