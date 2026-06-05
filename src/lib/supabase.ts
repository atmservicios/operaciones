import { createBrowserClient } from '@supabase/ssr';

// Cliente que usa cookies para que el proxy pueda leer la sesión
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
