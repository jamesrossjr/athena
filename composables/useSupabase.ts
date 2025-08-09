import { createClient } from '@supabase/supabase-js'

export const useSupabase = () => {
  const config = useRuntimeConfig()
  
  const supabase = createClient(
    config.supabaseUrl || '',
    config.supabaseAnonKey || ''
  )
  
  return { supabase }
}