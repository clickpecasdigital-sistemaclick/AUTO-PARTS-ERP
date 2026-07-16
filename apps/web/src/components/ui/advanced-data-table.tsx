import * as React from 'react';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, Inbox } from 'lucide-react';
import { SearchInput } from '@/components/ui/masked-inputs';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

interface AdvancedDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  /** Habilita checkbox de seleção múltipla na primeira coluna. */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /** Renderizado acima da tabela quando há linhas selecionadas (ex: "Excluir 3 itens"). */
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  /** Nome do arquivo gerado pelo botão de exportação CSV (sem extensão). */
  exportFileName?: string;
  className?: string;
}

/**
 * Versão "premium" do DataTable: busca embutida, ordenação client-side,
 * visibilidade de colunas, seleção múltipla com barra de ações em massa e
 * exportação CSV — usada nas listagens de alto volume do ERP (catálogo de
 * peças, movimentações de estoque, vendas).
 */
export function AdvancedDataTable<TData>({
  columns,
  data,
  isLoading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  emptyMessage = 'Nenhum registro encontrado.',
  enableRowSelection = false,
  onRowSelectionChange,
  bulkActions,
  exportFileName = 'export',
  className,
}: AdvancedDataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const tableColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableRowSelection) return columns;
    const selectionColumn: ColumnDef<TData, unknown> = {
      id: '__select__',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-[rgb(var(--primary))]"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-[rgb(var(--primary))]"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 36,
    };
    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // `table` mantém a mesma referência entre renders; `rowSelection` força o recálculo quando a seleção de fato muda.
  const selectedRows = React.useMemo(() => table.getSelectedRowModel().rows.map((r) => r.original), [table, rowSelection]);

  React.useEffect(() => {
    onRowSelectionChange?.(selectedRows);
  }, [selectedRows, onRowSelectionChange]);

  function handleExportCsv() {
    const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== '__select__');
    const header = visibleColumns.map((c) => String(c.columnDef.header ?? c.id)).join(';');
    const rows = table.getFilteredRowModel().rows.map((row) =>
      visibleColumns.map((c) => String(row.getValue(c.id) ?? '')).join(';'),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 /> Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().filter((c) => c.id !== '__select__').map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {String(column.columnDef.header ?? column.id)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download /> Exportar
          </Button>
        </div>
      </div>

      {bulkActions && selectedRows.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selectedRows.length} selecionado(s)</span>
          {bulkActions(selectedRows)}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="h-11 px-4 text-left align-middle font-medium text-muted-foreground">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn('flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer hover:text-foreground')}
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() &&
                            (sorted === 'asc' ? <ArrowUp className="size-3" /> : sorted === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />)}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {tableColumns.map((_, j) => (
                    <td key={j} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={cn('border-t border-border transition-colors hover:bg-muted/30', row.getIsSelected() && 'bg-primary/5')}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="size-8 opacity-40" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  );
}
