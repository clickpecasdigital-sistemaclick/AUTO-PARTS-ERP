import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch, Company } from '@/types/user.types';

interface WorkspaceState {
  companies: Company[];
  branches: Branch[];
  activeCompanyId: string | null;
  activeBranchId: string | null;
  /** Popula a lista de empresas/filiais disponíveis (vinda da API de tenancy, Sprint 02). */
  setWorkspace: (companies: Company[], branches: Branch[]) => void;
  setActiveCompany: (companyId: string) => void;
  setActiveBranch: (branchId: string) => void;
}

/**
 * Contexto de Empresa/Filial ativa (multiempresa + multifilial — Sprint 02,
 * modelos `Company`/`Branch`). Persistido para que o usuário não precise
 * re-selecionar a filial a cada sessão. A população real de `companies`/
 * `branches` é responsabilidade do módulo de Autenticação/Tenancy (Sprint
 * 05+); aqui só a estrutura de estado já está pronta para consumi-la.
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      companies: [],
      branches: [],
      activeCompanyId: null,
      activeBranchId: null,
      setWorkspace: (companies, branches) => {
        const current = get();
        set({
          companies,
          branches,
          activeCompanyId: current.activeCompanyId ?? companies[0]?.id ?? null,
          activeBranchId: current.activeBranchId ?? branches[0]?.id ?? null,
        });
      },
      setActiveCompany: (companyId) => {
        const firstBranchOfCompany = get().branches.find((b) => b.companyId === companyId);
        set({ activeCompanyId: companyId, activeBranchId: firstBranchOfCompany?.id ?? null });
      },
      setActiveBranch: (branchId) => set({ activeBranchId: branchId }),
    }),
    { name: 'autocore:workspace' },
  ),
);
