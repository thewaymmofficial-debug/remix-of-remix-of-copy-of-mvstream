// Custom types for CineGeek database entities

export type AppRole = 'admin' | 'premium' | 'free_user';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  director: string | null;
  actors: string[];
  year: number | null;
  category: string;
  resolution: string | null;
  file_size: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  stream_url: string | null;
  telegram_url: string | null;
  mega_url: string | null;
  is_premium: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovieInsert {
  title: string;
  description?: string | null;
  director?: string | null;
  actors?: string[];
  year?: number | null;
  category?: string;
  resolution?: string | null;
  file_size?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  stream_url?: string | null;
  telegram_url?: string | null;
  mega_url?: string | null;
  is_premium?: boolean;
  is_featured?: boolean;
}

export interface MovieUpdate extends Partial<MovieInsert> {}
