import { createBrowserClient } from '@supabase/ssr';

// Cliente que usa cookies para que el proxy pueda leer la sesión
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Obtiene todos los registros de una tabla en bloques de 1000 filas,
 * superando el límite por defecto de 1000 registros de Supabase/PostgREST.
 */
export async function fetchAllFromTable<T = any>(
  table: string,
  columns = '*',
  buildQuery?: (query: any) => any
): Promise<{ data: T[]; error: any }> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;

  while (true) {
    let query: any = supabase.from(table).select(columns);
    if (buildQuery) {
      query = buildQuery(query);
    }
    query = query.order('id', { ascending: true }).range(from, from + PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) {
      return { data: allData, error };
    }
    if (!data || data.length === 0) {
      break;
    }

    allData = allData.concat(data as T[]);
    if (data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return { data: allData, error: null };
}
