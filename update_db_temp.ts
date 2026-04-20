import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kiupusazmjmhtrlmulbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXB1c2F6bWptaHRybG11bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjQ0NDAsImV4cCI6MjA5MTgwMDQ0MH0.N46IAPc0zWZGRDoXYJadyB7urNCH-VjsTvOYJTBd5_w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateDatabase() {
  console.log('Updating database with student email...');
  const { error } = await supabase.from('settings').upsert({
    key: 'student_email',
    value: 'ione.ribeiro@escola.pr.gov.br'
  }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating settings:', error);
  } else {
    console.log('Database updated successfully!');
  }
}

updateDatabase();
