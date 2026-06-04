import { createClient } from "@supabase/supabase-js";

// Creamos un segundo cliente de Supabase apuntando exclusivamente a la BD de informes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_INFORME_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_INFORME_ANON_KEY!;

export const supabaseInforme = createClient(supabaseUrl, supabaseAnonKey);
