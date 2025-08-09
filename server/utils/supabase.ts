import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const config = useRuntimeConfig()
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    supabaseClient = createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    )
  }
  
  return supabaseClient
}