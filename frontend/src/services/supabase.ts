import { createClient } from '@supabase/supabase-js';

// Captura as variáveis do .env injetadas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Blindagem de segurança: Alerta o desenvolvedor caso ele esqueça de configurar o .env
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO DE CONFIGURAÇÃO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não foram encontradas no arquivo .env");
}

/**
 * Instância global do cliente Supabase para o Frontend.
 * Utilizado para autenticação (OAuth, Session tracking) e chamadas diretas.
 */
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');