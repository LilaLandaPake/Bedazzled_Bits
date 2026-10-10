import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null when env vars are missing: callers fall back to src/mocks instead of crashing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const hasSupabase = supabase !== null
