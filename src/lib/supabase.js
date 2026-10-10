import { createClient } from '@supabase/supabase-js'

// Accept the URL with or without a pasted-in "/rest/v1/" ending: the client adds that itself.
const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// null when env vars are missing: callers fall back to src/mocks instead of crashing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const hasSupabase = supabase !== null
