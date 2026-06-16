import React, { createContext, useContext, useState, ReactNode } from 'react';
import { fetchStreakDetails, StreakDetails } from '@services/streak/StreakService';

type StreakContextType = {
  streakData: StreakDetails | null;
  streakLoading: boolean;
  refreshStreakData: () => Promise<void>;
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: ReactNode; userId: number | string | null }> = ({ children, userId }) => {
  const [streakData, setStreakData] = useState<StreakDetails | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);

  const refreshStreakData = async () => {
    if (!userId) return;
    setStreakLoading(true);
    try {
      const data = await fetchStreakDetails(userId);
      setStreakData(data);
    } catch (err) {
      console.error('Error fetching streak details:', err);
      // Set default values if API fails
      setStreakData({
        currentStreak: 0,
        monthlyRestoreRemaining: 0,
        longestStreak: 0,
        restoreAvailable: false,
        attemptedToday: false,
      });
    } finally {
      setStreakLoading(false);
    }
  };

  // Initial fetch
  React.useEffect(() => {
    if (userId) {
      refreshStreakData();
    }
  }, [userId]);

  return (
    <StreakContext.Provider value={{ streakData, streakLoading, refreshStreakData }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
