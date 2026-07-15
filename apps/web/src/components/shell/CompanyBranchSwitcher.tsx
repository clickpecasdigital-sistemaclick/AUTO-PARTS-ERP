import { Building2, Check, ChevronsUpDown, Store } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { cn } from '@/utils/cn';

/**
 * Seletor de Empresa + Filial ativas (multiempresa/multifilial — Sprint 02).
 * Lê/escreve em `useWorkspaceStore`; a população de `companies`/`branches`
 * é responsabilidade do módulo de Tenancy (Sprint 05+) — até lá, exibe um
 * estado vazio honesto em vez de inventar dados.
 */
export function CompanyBranchSwitcher() {
  const { companies, branches, activeCompanyId, activeBranchId, setActiveCompany, setActiveBranch } = useWorkspaceStore();

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const branchesOfActiveCompany = branches.filter((b) => b.companyId === activeCompanyId);

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5" /> Nenhuma empresa configurada
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="max-w-[140px] truncate font-medium">{activeCompany?.tradeName ?? activeCompany?.legalName}</span>
          {activeBranch && (
            <>
              <span className="text-muted-foreground">/</span>
              <Store className="size-3.5 text-muted-foreground" />
              <span className="max-w-[100px] truncate text-muted-foreground">{activeBranch.name}</span>
            </>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Empresa</DropdownMenuLabel>
        {companies.map((company) => (
          <DropdownMenuItem key={company.id} onClick={() => setActiveCompany(company.id)} className="justify-between">
            {company.tradeName ?? company.legalName}
            {company.id === activeCompanyId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {branchesOfActiveCompany.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filial</DropdownMenuLabel>
            {branchesOfActiveCompany.map((branch) => (
              <DropdownMenuItem key={branch.id} onClick={() => setActiveBranch(branch.id)} className={cn('justify-between')}>
                {branch.name}
                {branch.id === activeBranchId && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
