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

      if (!error && data && data.length > 0) {
        setUnits(data);
      } else {
        if (error) console.error('Error fetching dashboard view:', error);
        // Fallback: Fetch directly from 'units' if view fails or is empty
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('*')
          .order('id');
        
        if (!unitsError) {
          // Map to match the view's structure
          const mapped = (unitsData || []).map(u => ({
            ...u,
            unit_id: u.id,
            unit_title: u.title,
            unit_status: 'not_started'
          }));
          setUnits(mapped);
        }
      }
      setLoading(false);
    };

    getProgress();
  }, [userId]);

  return { units, loading };
};
