import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Paginação genérica usada por todos os DataTables do ERP.
 */
function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <p className="text-sm text-muted-foreground">
        Página <span className="font-medium text-foreground">{page}</span> de{' '}
        <span className="font-medium text-foreground">{totalPages || 1}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => onPageChange(1)}>
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon" disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          <ChevronRight />
        </Button>
        <Button variant="outline" size="icon" disabled={!canNext} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

export { Pagination };
