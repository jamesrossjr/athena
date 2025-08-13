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

    // In a real app, you would fetch workspaces from your database
    // For demo purposes, we'll return some mock workspaces for returning users
    const mockWorkspaces = [
      {
        id: `ws_${Date.now()}_main`,
        name: 'Main Workspace',
        icon: '🏠',
        color: '#3b82f6',
        userId: user.id,
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      }
    ]

    // For demo, only return workspaces for users who aren't brand new
    const userCreatedAt = new Date(user.created_at)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const isNewUser = userCreatedAt > fiveMinutesAgo

    console.log('List workspaces for user:', user.email, 'is new user:', isNewUser)

    return {
      success: true,
      workspaces: isNewUser ? [] : mockWorkspaces
    }
  } catch (error: any) {
    console.error('List workspaces error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})