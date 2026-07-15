import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENTS = 6;

interface RecentsState {
  recentIds: string[];
  registerVisit: (navItemId: string) => void;
}

/** Últimos módulos visitados (mais recente primeiro), capado em MAX_RECENTS. */
export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      recentIds: [],
      registerVisit: (navItemId) =>
        set((state) => ({
          recentIds: [navItemId, ...state.recentIds.filter((id) => id !== navItemId)].slice(0, MAX_RECENTS),
        })),
    }),
    { name: 'autocore:recents' },
  ),
);
