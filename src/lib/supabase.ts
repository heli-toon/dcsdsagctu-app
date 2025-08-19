import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://aldjdvguuoeekatllweq.supabase.co",
  `${import.meta.env.VITE_SUPABASE_ANON_KEY}`
)

// Add admin emails here
export const ADMIN_EMAILS = [
    'abdulkanton2005@gmail.com',
    'vowusuansah98@gmail.com',
    'valovely2018@gmail.com',

]
