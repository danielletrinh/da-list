import { createClient } from '@supabase/supabase-js'
import type { CafeRow } from '@/types/cafe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. API calls will fail.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Simple in-memory cache for cafés to avoid hitting Supabase on every request.
// This lives per server process and is fine for dev / light traffic.
const CACHE_TTL_MS = 60_000 // 1 minute

let allCafesCache: { data: CafeRow[]; expiresAt: number } | null = null
let recommendedCafesCache: { data: CafeRow[]; expiresAt: number } | null = null

const cafeSelectColumns =
  'id,name,location,region,features,recommended,image,description,rank,created_at,updated_at'

// Helper functions for café operations
export const cafeService = {
  // Get all cafés ordered by rank
  async getAllCafes(): Promise<CafeRow[]> {
    const now = Date.now()
    if (allCafesCache && allCafesCache.expiresAt > now) {
      return allCafesCache.data
    }

    const { data, error } = await supabase
      .from('cafes')
      .select(cafeSelectColumns)
      .order('rank', { ascending: true })

    if (error) throw error

    const rows = (data || []) as CafeRow[]
    allCafesCache = { data: rows, expiresAt: now + CACHE_TTL_MS }
    return rows
  },

  // Get recommended cafés only
  async getRecommendedCafes(): Promise<CafeRow[]> {
    const now = Date.now()
    if (recommendedCafesCache && recommendedCafesCache.expiresAt > now) {
      return recommendedCafesCache.data
    }

    const { data, error } = await supabase
      .from('cafes')
      .select(cafeSelectColumns)
      .eq('recommended', true)
      .order('rank', { ascending: true })

    if (error) throw error

    const rows = (data || []) as CafeRow[]
    recommendedCafesCache = { data: rows, expiresAt: now + CACHE_TTL_MS }
    return rows
  }
}