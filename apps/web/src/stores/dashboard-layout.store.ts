import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardWidgetInstance {
  id: string;
  /** Chave do tipo de widget no registro (ver modules/shell/dashboard/widget-registry.ts). */
  widgetType: string;
  /** Posição no grid — coluna ocupa 1 a `span` de 12 colunas. */
  span: 3 | 4 | 6 | 12;
  order: number;
}

interface DashboardLayoutState {
  widgets: DashboardWidgetInstance[];
  addWidget: (widgetType: string, span: DashboardWidgetInstance['span']) => void;
  removeWidget: (id: string) => void;
  reorder: (id: string, newOrder: number) => void;
  resetToDefault: () => void;
}

const DEFAULT_WIDGETS: DashboardWidgetInstance[] = [];

/**
 * Layout do Dashboard salvo por usuário (requisito: "Layout salvo por
 * usuário", "Widgets removíveis", "Grid configurável"). Persistido em
 * localStorage nesta sprint — migrar para uma tabela `user_preferences`
 * via API é um passo natural quando o módulo de Configurações for
 * implementado, sem necessidade de mudar a API deste store.
 */
export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      addWidget: (widgetType, span) =>
        set((state) => ({
          widgets: [
            ...state.widgets,
            { id: `${widgetType}-${Date.now()}`, widgetType, span, order: state.widgets.length },
          ],
        })),
      removeWidget: (id) => set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) })),
      reorder: (id, newOrder) =>
        set((state) => {
          const widgets = [...state.widgets];
          const index = widgets.findIndex((w) => w.id === id);
          if (index === -1) return state;
          const [moved] = widgets.splice(index, 1);
          widgets.splice(newOrder, 0, moved);
          return { widgets: widgets.map((w, i) => ({ ...w, order: i })) };
        }),
      resetToDefault: () => set({ widgets: DEFAULT_WIDGETS }),
    }),
    { name: 'autocore:dashboard-layout' },
  ),
);
