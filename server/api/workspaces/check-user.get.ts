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

    // For demo purposes, check if user has workspaces
    // In a real app, you'd query your database
    // For now, we'll simulate by checking if user was created recently
    const userCreatedAt = new Date(user.created_at)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    // If user was created less than 5 minutes ago, consider them new
    const isNewUser = userCreatedAt > fiveMinutesAgo
    
    return {
      success: true,
      hasWorkspaces: !isNewUser,
      userId: user.id,
      userEmail: user.email
    }
  } catch (error: any) {
    console.error('Check user error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})