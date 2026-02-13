import { createClient } from '@supabase/supabase-js';

// Usando variáveis de ambiente injetadas pelo Vite através do process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xxgnqhanhehtfbxtcjtc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4Z25xaGFuaGVodGZieHRjanRjIiwicm9sZES6ImFub24iLCJpYXQiOjE3NzA5OTM4MDUsImV4cCI6MjA4NjU2OTgwNX0.OqTnMp3xvFQStud_uqYsvBMQEFqLuxshsCmPasJTwBU';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);