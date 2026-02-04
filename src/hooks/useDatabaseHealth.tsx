import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseHealth {
  isReady: boolean;
  isChecking: boolean;
  missingTables: string[];
  error: string | null;
}

const REQUIRED_TABLES = [
  'profiles',
  'user_roles',
  'movies',
  'categories',
  'seasons',
  'episodes',
  'watchlist',
  'watch_history',
  'movie_views',
  'ratings',
  'site_settings'
];

export function useDatabaseHealth() {
  const [health, setHealth] = useState<DatabaseHealth>({
    isReady: true, // Assume ready by default to prevent flash
    isChecking: true,
    missingTables: [],
    error: null
  });

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  async function checkDatabaseHealth() {
    try {
      // Try a simple query to each required table
      const missingTables: string[] = [];
      
      for (const table of REQUIRED_TABLES) {
        try {
          // Use a minimal query to check table existence
          const { error } = await supabase
            .from(table as any)
            .select('id')
            .limit(1);
          
          // If error contains "does not exist", table is missing
          if (error?.message?.includes('does not exist') || 
              error?.message?.includes('relation') ||
              error?.code === '42P01') {
            missingTables.push(table);
          }
        } catch {
          missingTables.push(table);
        }
      }

      setHealth({
        isReady: missingTables.length === 0,
        isChecking: false,
        missingTables,
        error: null
      });
    } catch (error) {
      setHealth({
        isReady: false,
        isChecking: false,
        missingTables: REQUIRED_TABLES,
        error: error instanceof Error ? error.message : 'Failed to connect to database'
      });
    }
  }

  return {
    ...health,
    recheck: checkDatabaseHealth
  };
}
