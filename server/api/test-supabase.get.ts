import { getSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = getSupabaseClient()
    
    // Test the connection by getting the current session/user
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      message: 'Supabase connection successful',
      connected: true,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Supabase connection failed',
      error: error.message,
      connected: false,
      timestamp: new Date().toISOString()
    }
  }
})