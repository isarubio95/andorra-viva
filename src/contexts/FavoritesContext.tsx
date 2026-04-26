import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesContextType {
  favorites: Set<string>;
  loading: boolean;
  /** `ownerId`: si coincide con el usuario autenticado, no se permite añadir a favoritos (sí quitar). */
  toggleFavorite: (businessId: string, ownerId?: string | null) => Promise<void>;
  isFavorite: (businessId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: new Set(),
  loading: true,
  toggleFavorite: async () => undefined,
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

  const toggleFavorite = useCallback(async (businessId: string, ownerId?: string | null) => {
    if (!user) return;

    const isFav = favorites.has(businessId);
    if (!isFav && ownerId && ownerId === user.id) return;

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(businessId); else next.add(businessId);
      return next;
    });

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('business_id', businessId);
      if (error) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(businessId);
          return next;
        });
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, business_id: businessId });
      if (error) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(businessId);
          return next;
        });
      }
    }
  }, [user, favorites]);

  const isFavorite = useCallback((businessId: string) => favorites.has(businessId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}
