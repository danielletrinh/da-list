export interface Cafe {
  id: string;
  name: string;
  location: string;
  region: string;
  features: string[];
  recommended: boolean;
  image?: string;
}

export interface GroupedCafe {
  id: string;
  name: string;
  locations: string[];
  region: string;
  features: string[];
  recommended: boolean;
  image?: string;
}

export type ViewMode = 'list' | 'grid' | 'map' | 'chart';