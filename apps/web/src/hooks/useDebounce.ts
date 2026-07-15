import { useEffect, useState } from 'react';

/**
 * Útil para inputs de busca em DataTables de módulos com grandes volumes
 * (ex: catálogo de peças), evitando uma requisição por tecla digitada.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
