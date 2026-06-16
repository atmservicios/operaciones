import { createClient } from "@supabase/supabase-js";

// Creamos un segundo cliente de Supabase apuntando exclusivamente a la BD de informes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_INFORME_URL
  || "https://ettvmrmuviugqbqyhltw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_INFORME_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0dHZtcm11dml1Z3FicXlobHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTc2NzUsImV4cCI6MjA5MzQ5MzY3NX0.n8tODn2tJR9PEtNFuY6fzKvP1Vx-udhrGbE3_yqgk_E";

export const supabaseInforme = createClient(supabaseUrl, supabaseAnonKey);
