import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const useDashboardData = (userId: string) => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProgress = async () => {
      if (!userId) return;
      
      // Fetching from the VIEW we created in Supabase!
      // This view should join 'units' with 'student_progress'
      const { data, error } = await supabase
        .from('student_dashboard_view')
        .select('*')
        .eq('profile_id', userId);

      if (!error) {
        setUnits(data || []);
      } else {
        console.error('Error fetching dashboard view:', error);
      }
      setLoading(false);
    };

    getProgress();
  }, [userId]);

  return { units, loading };
};
