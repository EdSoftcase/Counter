
import { createClient } from '@supabase/supabase-js';

// Prioriza variáveis de ambiente, mas utiliza as chaves fornecidas pelo usuário como padrão funcional
const supabaseUrl = (process.env.VITE_SUPABASE_URL as string) || 'https://xxgnqhanhehtfbxtcjtc.supabase.co';
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Z25xaGFuaGVodGZieHRjanRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTM4MDUsImV4cCI6MjA4NjU2OTgwNX0.OqTnMp3xvFQStud_uqYsvBMQEFqLuxshsCmPasJTwBU';

// Verifica se as chaves são válidas e não são placeholders genéricos
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== '' &&
  !supabaseUrl.includes('placeholder-url') &&
  supabaseAnonKey.length > 50; // Chaves reais do Supabase são extensas e codificadas em JWT

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
