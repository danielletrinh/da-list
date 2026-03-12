/** Client-facing café (subset of DB row). */
export interface Cafe {
  id: string;
  name: string;
  location: string;
  region: string;
  features: string[];
  recommended: boolean;
  image?: string;
  description?: string;
}

/** Full row from Supabase `cafes` table. */
export interface CafeRow extends Cafe {
  rank: number;
  created_at: string;
  updated_at: string;
}

export interface GroupedCafe {
  id: string;
  name: string;
  locations: string[];
  region: string;
  features: string[];
  recommended: boolean;
  image?: string;
  description?: string;
}

export type ViewMode = 'list' | 'grid' | 'map' | 'chart';