import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. API calls will fail.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types
export interface CafeRow {
  id: string
  name: string
  location: string
  region: string
  features: string[]
  recommended: boolean
  image?: string
  rank: number
  created_at: string
  updated_at: string
}

// Helper functions for café operations
export const cafeService = {
  // Get all cafés ordered by rank
  async getAllCafes(): Promise<CafeRow[]> {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .order('rank', { ascending: true })

    console.log('Supabase query result:', { data: data?.length || 0, error });

    if (error) throw error
    return data || []
  },

  // Get recommended cafés only
  async getRecommendedCafes(): Promise<CafeRow[]> {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('recommended', true)
      .order('rank', { ascending: true })

    console.log('Supabase recommended query result:', { data: data?.length || 0, error });

    if (error) throw error
    return data || []
  }
}