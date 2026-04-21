import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kiupusazmjmhtrlmulbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdXB1c2F6bWptaHRybG11bGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjQ0NDAsImV4cCI6MjA5MTgwMDQ0MH0.N46IAPc0zWZGRDoXYJadyB7urNCH-VjsTvOYJTBd5_w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function reorderUnits() {
  console.log('Fetching units...');
  const { data: units, error } = await supabase.from('units').select('id, title, sort_order');
  
  if (error) {
    console.error('Error fetching units:', error);
    return;
  }

  if (!units || units.length === 0) {
    console.log('No units found (check RLS).');
    return;
  }

  console.log('Current units:', units);

  for (const unit of units) {
    const match = unit.title.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      console.log(`Updating ${unit.title} to sort_order ${num}...`);
      const { error: updateError } = await supabase
        .from('units')
        .update({ sort_order: num })
        .eq('id', unit.id);
      
      if (updateError) {
        console.error(`Error updating unit ${unit.id}:`, updateError);
      }
    }
  }

  console.log('Reordering complete!');
}

reorderUnits();
