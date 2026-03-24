import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  toggleFavorite: (businessId: string) => Promise<void>;
  isFavorite: (businessId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: new Set(),
  loading: true,
  toggleFavorite: async () => {},
  isFavorite: () => false,
});

export const useFavorites = () => useContext(FavoritesContext);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('favorites')
        .select('business_id')
        .eq('user_id', user.id);

      setFavorites(new Set((data ?? []).map(f => f.business_id)));
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  const toggleFavorite = useCallback(async (businessId: string) => {
    if (!user) return;

    const isFav = favorites.has(businessId);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(businessId); else next.add(businessId);
      return next;
    });

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('business_id', businessId);
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, business_id: businessId });
    }
  }, [user, favorites]);

  const isFavorite = useCallback((businessId: string) => favorites.has(businessId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
