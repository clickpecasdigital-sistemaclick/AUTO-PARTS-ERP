import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

/**
 * Estado de colapso da Sidebar, persistido em localStorage — sobrevive a
 * reload de página e a trocas de aba (requisito: "Persistir estado").
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (value) => set({ collapsed: value }),
    }),
    { name: 'autocore:sidebar' },
  ),
);
