import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Loader2, Star } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useCommandPaletteStore } from '@/stores/command-palette.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useRecentsStore } from '@/stores/recents.store';
import { useDebounce } from '@/hooks/useDebounce';
import { flatNavItems } from '@/navigation/nav-items';
import { searchCategoryLabels, searchService, type SearchResult } from '@/services/search.service';

/**
 * Busca Global (Ctrl+K / Cmd+K). Sem digitação: mostra Favoritos e
 * Recentes (navegação rápida). Com digitação: consulta `searchService`
 * (módulos hoje; entidades de negócio plugarão no Supabase nas próximas
 * sprints sem qualquer mudança neste componente).
 */
export function CommandPalette() {
  const isOpen = useCommandPaletteStore((s) => s.isOpen);
  const close = useCommandPaletteStore((s) => s.close);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const recentIds = useRecentsStore((s) => s.recentIds);
  const navigate = useNavigate();

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const debouncedQuery = useDebounce(query, 200);

  React.useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    searchService
      .search(debouncedQuery)
      .then(setResults)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  function goTo(path: string) {
    close();
    navigate(path);
  }

  const favoriteItems = flatNavItems.filter((item) => favoriteIds.includes(item.id));
  const recentItems = recentIds.map((id) => flatNavItems.find((item) => item.id === id)).filter(Boolean) as typeof flatNavItems;

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    acc[result.category] = acc[result.category] ?? [];
    acc[result.category].push(result);
    return acc;
  }, {});

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => (open ? useCommandPaletteStore.getState().open() : close())}>
      <CommandInput placeholder="Buscar módulos, produtos, clientes, notas, pedidos..." value={query} onValueChange={setQuery} />
      <CommandList>
        {isSearching && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Buscando...
          </div>
        )}

        {!query && (
          <>
            {favoriteItems.length > 0 && (
              <CommandGroup heading="Favoritos">
                {favoriteItems.map((item) => (
                  <CommandItem key={item.id} onSelect={() => goTo(item.path)}>
                    <Star className="size-4 text-warning" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {recentItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Recentes">
                  {recentItems.map((item) => (
                    <CommandItem key={item.id} onSelect={() => goTo(item.path)}>
                      <LayoutGrid className="size-4 text-muted-foreground" />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {favoriteItems.length === 0 && recentItems.length === 0 && (
              <CommandEmpty>Digite para buscar em todo o sistema.</CommandEmpty>
            )}
          </>
        )}

        {query && !isSearching && results.length === 0 && <CommandEmpty>Nenhum resultado para "{query}".</CommandEmpty>}

        {query &&
          Object.entries(groupedResults).map(([category, items]) => (
            <CommandGroup key={category} heading={searchCategoryLabels[category as keyof typeof searchCategoryLabels]}>
              {items.map((result) => (
                <CommandItem key={`${result.category}-${result.id}`} onSelect={() => goTo(result.path)}>
                  {result.title}
                  {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
      <div className="flex items-center justify-end gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CommandShortcut className="ml-0 rounded border border-border px-1.5 py-0.5">↑↓</CommandShortcut> navegar
        </span>
        <span className="flex items-center gap-1">
          <CommandShortcut className="ml-0 rounded border border-border px-1.5 py-0.5">↵</CommandShortcut> selecionar
        </span>
        <span className="flex items-center gap-1">
          <CommandShortcut className="ml-0 rounded border border-border px-1.5 py-0.5">esc</CommandShortcut> fechar
        </span>
      </div>
    </CommandDialog>
  );
}
