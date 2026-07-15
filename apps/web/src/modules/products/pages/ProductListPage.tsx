import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { SearchInput } from '@/components/ui/masked-inputs';
import { DropdownButton } from '@/components/ui/dropdown-button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload as UploadWidget } from '@/components/ui/upload';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { useDeleteProduct, useImportProducts, useProducts } from '../hooks/useProducts';
import { productColumns } from '../components/columns';
import type { Product } from '../types/product.types';
import { env } from '@/config/env';

/**
 * Listagem de Produtos — "DataTable Enterprise" (briefing): busca
 * instantânea, paginação, ordenação, seleção múltipla, colunas
 * configuráveis e exportação já vêm de `AdvancedDataTable` (Design System,
 * Sprint 03); esta página só fornece dados e ações específicas do domínio
 * (excluir em massa, importar, exportar, ação rápida de editar).
 *
 * IMPORTANTE: o campo de busca abaixo é SERVER-SIDE (debounced, consulta a
 * API/Postgres em todo o catálogo — preparado para Full Text Search, ver
 * `prisma/sql/products_fulltext_search.sql`). O filtro de busca embutido no
 * `AdvancedDataTable` é apenas client-side, restrito à página atual de 20
 * itens — útil para refinar o que já está na tela, não substitui a busca
 * de catálogo completo.
 */
export default function ProductListPage() {
  const { can } = usePermissions();
  const { page, setPage, search, setSearch } = usePagination();
  const debouncedSearch = useDebounce(search, 350);
  const { data, isLoading } = useProducts({ page, perPage: 20, search: debouncedSearch });
  const deleteProduct = useDeleteProduct();
  const importProducts = useImportProducts();

  const [, setSelectedRows] = useState<Product[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFiles, setImportFiles] = useState<{ id: string; name: string }[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function handleImport() {
    if (!pendingFile) return;
    const format = pendingFile.name.endsWith('.xlsx') ? 'xlsx' : 'csv';
    await importProducts.mutateAsync({ file: pendingFile, format });
    setIsImportOpen(false);
    setImportFiles([]);
    setPendingFile(null);
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo comercial de peças — preços, estoque, fornecedores e aplicações veiculares."
        actions={
          <>
            {can('products', 'export') && (
              <DropdownButton
                variant="outline"
                menuContent={
                  <>
                    <DropdownMenuItem asChild>
                      <a href={`${env.apiUrl}/products/export?format=csv`} target="_blank" rel="noreferrer">
                        Exportar CSV
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`${env.apiUrl}/products/export?format=xlsx`} target="_blank" rel="noreferrer">
                        Exportar Excel
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`${env.apiUrl}/products/export?format=pdf`} target="_blank" rel="noreferrer">
                        Exportar PDF
                      </a>
                    </DropdownMenuItem>
                  </>
                }
              >
                <Download /> Exportar
              </DropdownButton>
            )}
            {can('products', 'create') && (
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload /> Importar
              </Button>
            )}
            {can('products', 'create') && (
              <Button asChild>
                <Link to="/produtos/novo">
                  <Plus /> Novo produto
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por código, código de barras, OEM, descrição, marca..."
        />
      </div>

      <AdvancedDataTable
        columns={productColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        enableRowSelection={can('products', 'delete')}
        onRowSelectionChange={setSelectedRows}
        exportFileName="produtos"
        emptyMessage="Nenhum produto encontrado."
        bulkActions={(rows) =>
          can('products', 'delete') ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await Promise.all(rows.map((row) => deleteProduct.mutateAsync(row.id)));
                setSelectedRows([]);
              }}
            >
              <Trash2 /> Excluir {rows.length} selecionado(s)
            </Button>
          ) : null
        }
      />

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar produtos</DialogTitle>
            <DialogDescription>
              Arquivos CSV ou Excel (.xlsx) com colunas: internalCode, barcode, manufacturerCode, originalCode,
              shortDescription, fullDescription, unitId, ncmCode, costPrice, salePrice, minStock, maxStock.
            </DialogDescription>
          </DialogHeader>
          <UploadWidget
            files={importFiles}
            accept=".csv,.xlsx"
            multiple={false}
            onFilesSelected={(fileList) => {
              const file = fileList[0];
              setPendingFile(file);
              setImportFiles([{ id: file.name, name: file.name }]);
            }}
            onRemove={() => {
              setPendingFile(null);
              setImportFiles([]);
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} isLoading={importProducts.isPending} disabled={!pendingFile}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
