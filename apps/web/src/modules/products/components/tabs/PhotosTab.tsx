import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Upload } from '@/components/ui/upload';
import { Gallery } from '@/components/ui/gallery';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/utils/cn';
import {
  useRemoveProductPhoto,
  useReorderProductPhotos,
  useSetPrimaryProductPhoto,
  useUploadProductPhoto,
} from '../../hooks/useProducts';
import type { Product } from '../../types/product.types';

interface PhotosTabProps {
  product: Product;
}

/**
 * Aba 7 — Fotos: upload múltiplo para Supabase Storage (via API, que grava
 * em `product-photos` e registra `ProductPhoto`), foto principal, galeria
 * com lightbox e reordenação por drag-and-drop nativo (mesmo padrão HTML5
 * usado em `modules/dashboard/widgets/DashboardGrid.tsx`).
 */
export function PhotosTab({ product }: PhotosTabProps) {
  const uploadPhoto = useUploadProductPhoto(product.id);
  const removePhoto = useRemoveProductPhoto(product.id);
  const setPrimaryPhoto = useSetPrimaryProductPhoto(product.id);
  const reorderPhotos = useReorderProductPhotos(product.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sortedPhotos = [...product.photos].sort((a, b) => a.position - b.position);

  async function handleFilesSelected(fileList: FileList) {
    for (const file of Array.from(fileList)) {
      await uploadPhoto.mutateAsync({ file, isPrimary: product.photos.length === 0 });
    }
  }

  function handleDrop(targetIndex: number) {
    if (!draggingId) return;
    const reordered = sortedPhotos.filter((p) => p.id !== draggingId);
    const draggedPhoto = sortedPhotos.find((p) => p.id === draggingId);
    if (draggedPhoto) reordered.splice(targetIndex, 0, draggedPhoto);
    reorderPhotos.mutate(reordered.map((p) => p.id));
    setDraggingId(null);
  }

  return (
    <div className="space-y-6">
      <Upload files={[]} accept="image/*" onFilesSelected={handleFilesSelected} onRemove={() => {}} />

      {sortedPhotos.length === 0 ? (
        <EmptyState title="Nenhuma foto cadastrada" description="Envie fotos do produto para exibir no catálogo e na ficha técnica." />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Arraste as fotos para reordenar a galeria.</p>
          <div className="flex flex-wrap gap-3">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setDraggingId(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={cn(
                  'relative w-32 cursor-grab overflow-hidden rounded-lg border border-border transition-opacity duration-base active:cursor-grabbing',
                  draggingId === photo.id && 'opacity-40',
                )}
              >
                <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
                {photo.isPrimary && (
                  <Badge variant="warning" className="absolute left-1 top-1 text-[10px]">
                    <Star className="size-3" /> Principal
                  </Badge>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                  {!photo.isPrimary && (
                    <button
                      onClick={() => setPrimaryPhoto.mutate(photo.id)}
                      className="rounded p-1 text-white hover:bg-white/20"
                      aria-label="Definir como principal"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePhoto.mutate(photo.id)}
                    className="ml-auto rounded p-1 text-white hover:bg-white/20"
                    aria-label="Excluir foto"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Pré-visualização da galeria</p>
            <Gallery images={sortedPhotos.map((p) => ({ id: p.id, url: p.url }))} />
          </div>
        </div>
      )}
    </div>
  );
}
