import * as React from 'react';
import { File, UploadCloud, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface UploadFile {
  id: string;
  name: string;
  sizeLabel?: string;
  progress?: number; // 0-100, undefined = concluído
  previewUrl?: string;
}

interface UploadProps {
  files: UploadFile[];
  onFilesSelected: (files: FileList) => void;
  onRemove: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

/**
 * Dropzone de upload (fotos de produto, anexos de OS, comprovantes
 * financeiros). Estado de progresso por arquivo é controlado pelo módulo
 * de negócio que efetivamente sobe o arquivo ao Supabase Storage.
 */
function Upload({ files, onFilesSelected, onRemove, accept, multiple = true, className }: UploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) onFilesSelected(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-base',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50',
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-xs text-muted-foreground">PNG, JPG ou PDF — até 10MB por arquivo</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="size-10 rounded object-cover" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded bg-muted">
                  <File className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                {file.progress !== undefined ? (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all duration-base" style={{ width: `${file.progress}%` }} />
                  </div>
                ) : (
                  file.sizeLabel && <p className="text-xs text-muted-foreground">{file.sizeLabel}</p>
                )}
              </div>
              <button onClick={() => onRemove(file.id)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Remover arquivo">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { Upload };
