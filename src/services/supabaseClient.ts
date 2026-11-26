import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const supabaseUrl = rawUrl?.startsWith('//') ? `https:${rawUrl}` : rawUrl;

export const ARTWORKS_BUCKET = 'artworks';

export const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? 'Missing Supabase configuration. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting Environment Variables and redeploy.'
    : null;

export const supabase: SupabaseClient | null = supabaseConfigError
  ? null
  : createClient(supabaseUrl!, supabaseKey!);
