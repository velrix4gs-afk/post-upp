import { supabase } from '@/integrations/supabase/client';

const OFFLINE_PREFIX = 'offline_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Local storage with fallback
export const offlineStorage = {
  set: <T>(key: string, data: T, ttl = CACHE_DURATION) => {
    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };
      localStorage.setItem(OFFLINE_PREFIX + key, JSON.stringify(cached));
    } catch (e) {
      console.warn('[Offline] Storage failed:', e);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(OFFLINE_PREFIX + key);
      if (!item) return null;

      const cached: CachedData<T> = JSON.parse(item);
      if (Date.now() > cached.expiresAt) {
        offlineStorage.remove(key);
        return null;
      }
      return cached.data;
    } catch (e) {
      return null;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(OFFLINE_PREFIX + key);
    } catch (e) {
      console.warn('[Offline] Remove failed:', e);
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(OFFLINE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('[Offline] Clear failed:', e);
    }
  }
};

// Supabase cache sync
export const syncToSupabaseCache = async (
  cacheType: string,
  cacheKey: string,
  data: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('offline_cache').upsert({
      user_id: user.id,
      cache_type: cacheType,
      cache_key: cacheKey,
      cache_data: data,
      expires_at: new Date(Date.now() + CACHE_DURATION).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,cache_type,cache_key'
    });
  } catch (e) {
    // Silent fail
  }
};

export const getFromSupabaseCache = async (
  cacheType: string,
  cacheKey: string
): Promise<any | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('offline_cache')
      .select('cache_data, expires_at')
      .eq('user_id', user.id)
      .eq('cache_type', cacheType)
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (!data) return null;
    
    if (new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.cache_data;
  } catch (e) {
    return null;
  }
};
