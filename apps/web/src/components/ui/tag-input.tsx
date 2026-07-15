import * as React from 'react';
import { X } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { cn } from '@/utils/cn';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  maxTags?: number;
}

/**
 * Tag Input — usado para multi-seleção de texto livre (ex: especialidades
 * de um mecânico, palavras-chave de busca de um produto). Enter ou vírgula
 * confirma a tag; Backspace em campo vazio remove a última.
 */
function TagInput({ value, onChange, placeholder = 'Digite e pressione Enter...', disabled, error, maxTags }: TagInputProps) {
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  function commitTag() {
    const tag = draft.trim();
    if (!tag) return;
    if (maxTags && value.length >= maxTags) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        error && 'border-destructive',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Chip key={tag} onRemove={disabled ? undefined : () => onChange(value.filter((t) => t !== tag))}>
          {tag}
        </Chip>
      ))}
      <input
        ref={inputRef}
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitTag}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[8ch] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      {value.length > 0 && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange([])}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Limpar tudo"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export { TagInput };
