import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kiupusazmjmhtrlmulbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXB1c2F6bWptaHRybG11bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjQ0NDAsImV4cCI6MjA5MTgwMDQ0MH0.N46IAPc0zWZGRDoXYJadyB7urNCH-VjsTvOYJTBd5_w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking tables...');
  const { data, error } = await supabase.from('units').select('count', { count: 'exact' });
  if (error) {
    console.error('Error querying units:', error);
  } else {
    console.log('Units count:', data);
  }
}

checkTables();
