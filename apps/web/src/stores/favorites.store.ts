import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (navItemId: string) => void;
  isFavorite: (navItemId: string) => boolean;
}

/** Módulos marcados como favoritos pelo usuário na Sidebar. */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (navItemId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(navItemId)
            ? state.favoriteIds.filter((id) => id !== navItemId)
            : [...state.favoriteIds, navItemId],
        })),
      isFavorite: (navItemId) => get().favoriteIds.includes(navItemId),
    }),
    { name: 'autocore:favorites' },
  ),
);
