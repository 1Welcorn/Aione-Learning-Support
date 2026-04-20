import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kiupusazmjmhtrlmulbe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXB1c2F6bWptaHRybG11bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjQ0NDAsImV4cCI6MjA5MTgwMDQ0MH0.N46IAPc0zWZGRDoXYJadyB7urNCH-VjsTvOYJTBd5_w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
