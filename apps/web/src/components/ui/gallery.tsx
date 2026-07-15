import * as React from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

/**
 * Galeria com grid + lightbox — fotos de produto, fotos de checklist de
 * entrada de veículo, anexos de Ordem de Serviço.
 */
function Gallery({ images, className }: GalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <>
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4', className)}>
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
          >
            <img src={image.url} alt={image.alt ?? ''} className="size-full object-cover transition-transform duration-slow group-hover:scale-105" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-base group-hover:bg-black/30 group-hover:opacity-100">
              <ZoomIn className="size-5 text-white" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          {activeIndex !== null && (
            <div className="relative">
              <img src={images[activeIndex].url} alt={images[activeIndex].alt ?? ''} className="max-h-[80vh] w-full rounded-lg object-contain" />
              <button
                onClick={() => setActiveIndex(null)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X className="size-4" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveIndex((i) => (i! > 0 ? i! - 1 : images.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => setActiveIndex((i) => (i! < images.length - 1 ? i! + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { Gallery };
