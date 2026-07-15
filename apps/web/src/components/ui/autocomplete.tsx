import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, SearchX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { useDebounce } from '@/hooks/useDebounce';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface BaseProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: boolean;
}

/** Autocomplete síncrono — opções já carregadas em memória, filtro local. */
interface AutocompleteProps extends BaseProps {
  options: AutocompleteOption[];
}

function Autocomplete({ options, value, onChange, placeholder = 'Selecione...', emptyMessage = 'Nenhum resultado.', disabled, error }: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3',
            'text-sm disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
        >
          <span className={cn(!selected && 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b border-border p-2">
          <Input autoFocus placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
              <SearchX className="size-5" /> {emptyMessage}
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value === value ? null : option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Check className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
                <div>
                  <p>{option.label}</p>
                  {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Async Select — opções vêm de uma busca remota (debounced), com loading próprio. */
interface AsyncSelectProps extends BaseProps {
  loadOptions: (query: string) => Promise<AutocompleteOption[]>;
}

function AsyncSelect({ loadOptions, value, onChange, placeholder = 'Buscar...', emptyMessage = 'Nenhum resultado.', disabled, error }: AsyncSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    loadOptions(debouncedQuery)
      .then(setOptions)
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, open, loadOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3',
            'text-sm disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
        >
          <span className={cn(!selected && 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
          {isLoading ? <Loader2 className="size-4 animate-spin opacity-50" /> : <ChevronsUpDown className="size-4 opacity-50" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b border-border p-2">
          <Input autoFocus placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} isLoading={isLoading} />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
          {!isLoading && options.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
              <SearchX className="size-5" /> {emptyMessage}
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value === value ? null : option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Check className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
                {option.label}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { Autocomplete, AsyncSelect };
