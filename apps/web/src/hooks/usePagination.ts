import { useState } from 'react';
import type { PaginationParams, SortDirection } from '@/types/api.types';

/**
 * Estado de paginação/ordenação/busca compartilhado por qualquer DataTable
 * do sistema, independente do módulo de negócio.
 */
export function usePagination(initial?: Partial<PaginationParams>) {
  const [page, setPage] = useState(initial?.page ?? 1);
  const [perPage, setPerPage] = useState(initial?.perPage ?? 20);
  const [sortBy, setSortBy] = useState<string | undefined>(initial?.sortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initial?.sortDirection ?? 'asc');
  const [search, setSearch] = useState(initial?.search ?? '');

  const params: PaginationParams = { page, perPage, sortBy, sortDirection, search };

  function toggleSort(column: string) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection('asc');
      return;
    }
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  return { params, page, perPage, search, setPage, setPerPage, setSearch, toggleSort };
}
