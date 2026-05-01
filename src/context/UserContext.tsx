// UserContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './Authcontext';
import ProfileService from '../services/profile/ProfileService';
import { fetchJobCounts } from '../services/Home/apiService';
import { JobCounts } from '@models/Model';
import { ProfileApiService } from '../services/profile/ProfileApiService';

interface UserContextProps {
  verifiedStatus: boolean;
  isJobsLoaded: boolean;
  setIsJobsLoaded: (value: React.SetStateAction<boolean>) => void;
  personalName: string;
  refreshVerifiedStatus: () => Promise<void>;
  setPersonalName: (value: React.SetStateAction<string>) => void;
  isLoading: boolean;
  refreshJobCounts: () => Promise<void>;
  refreshPersonalName: () => Promise<void>;
  jobCounts: JobCounts | null;
  reset: () => Promise<void>;
  clearUserContext: () => void;
  lastViewedJobIndex: number | null;
  setLastViewedJobIndex: (value: React.SetStateAction<number | null>) => void;
  totalScore: number;
  refreshScore: () => Promise<void>;
  scoreDetails: any;
}

const UserContext = createContext<UserContextProps>({
  verifiedStatus: false,
  personalName: '',
  jobCounts: null,
  isJobsLoaded: false,
  setIsJobsLoaded: () => { },
  refreshVerifiedStatus: async () => { },
  refreshJobCounts: async () => { },
  setPersonalName: () => { },
  isLoading: true,
  reset: async () => { },
  clearUserContext: () => { },
  refreshPersonalName: async () => { },
  lastViewedJobIndex: null,
  setLastViewedJobIndex: () => { },
  totalScore: 0,
  refreshScore: async () => { },
  scoreDetails: null,
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [isJobsLoaded, setIsJobsLoaded] = useState(false);
  const [lastViewedJobIndex, setLastViewedJobIndex] = useState<number | null>(null);
  const { userId, userToken } = useAuth();
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const [personalName, setPersonalName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [scoreDetails, setScoreDetails] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Don't fetch data if userId or userToken is missing
    if (!userId || !userToken) {
      // Reset context to default values
      clearUserContext();
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const [status, user, jobs, scoreResult] = await Promise.all([
          ProfileService.checkVerified(userToken, userId),
          ProfileService.fetchProfile(userToken, userId),
          fetchJobCounts(userId, userToken),
          ProfileApiService.fetchApplicantScoreDetails(userId, userToken),
        ]);
        console.log("score",scoreResult)
        if (isMounted) {
          if (typeof status === 'boolean') {
            setVerifiedStatus(status);
          } else {
            console.error('Invalid verified status:', status);
          }

          const name = user?.basicDetails?.firstName; // Note the capital "N"

          if (name) {
            setPersonalName(name);
          } else {
            // firstName is missing - this is expected for new users
            // Set empty string instead of logging error
            setPersonalName('');
          }

          // Set job counts
          if (jobs) {
            setJobCounts(jobs);
          } else {
            console.error('Failed to fetch job counts');
          }

          // Set initial score
          if (scoreResult.success) {
            setScoreDetails(scoreResult.data);
            setTotalScore(scoreResult.data?.total_score || 0);
          }

          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setIsLoading(false);
        }
        console.error('Failed to fetch user data:', error);
      }
    };
    if (isMounted) {
      fetchUserData();
    }

    return () => {
      isMounted = false;
    };
  }, [userId, userToken]);

  //refresh function

  const refreshVerifiedStatus = async () => {
    try {
      const status = await ProfileService.checkVerified(userToken, userId);
      if (typeof status === 'boolean') {
        setVerifiedStatus(status);
      } else {
        console.error('Invalid verified status:', status);
      }
    } catch (error) {
      console.error('Failed to refresh verified status:', error);
    }
  };
  const refreshJobCounts = async () => {
    try {
      const jobs = await fetchJobCounts(userId, userToken);
      if (jobs) {
        setJobCounts(jobs);
      } else {
        console.error('Failed to fetch job counts');
      }
    } catch (error) {
      console.error('Failed to refresh job counts:', error);
    }
  };

  const refreshPersonalName = async () => {
    try {
      const user = await ProfileService.fetchProfile(userToken, userId);
      const name = user?.basicDetails?.firstName;

      if (name) {
        setPersonalName(name);
      } else {
        console.error('Error fetching name in usercontext ');
      }
    } catch (error) {
      console.error('Error fetching name :', error);
    }
  };

  const refreshScore = async () => {
    if (!userId || !userToken) return;
    try {
      console.log('🔄 [USER CONTEXT] Refreshing score details...');
      const result = await ProfileApiService.fetchApplicantScoreDetails(userId, userToken);
      if (result.success) {
        setScoreDetails(result.data);
        setTotalScore(result.data?.total_score || 0);
        console.log('✅ [USER CONTEXT] Score details updated:', result.data?.total_score);
      } else {
        console.warn('⚠️ [USER CONTEXT] Failed to fetch score details');
      }
    } catch (error) {
      console.error('❌ [USER CONTEXT] Error refreshing score details:', error);
    }
  };

  // Reset the information before logging out
  const reset = async () => {
    setPersonalName('');
    setVerifiedStatus(false);
    setJobCounts(null);
    setIsJobsLoaded(false);
    setLastViewedJobIndex(null);
    setTotalScore(0);
    setScoreDetails(null);
    setIsLoading(true);
  };

  // Clear all user context data (for delete account)
  const clearUserContext = () => {
    setPersonalName('');
    setVerifiedStatus(false);
    setJobCounts(null);
    setIsJobsLoaded(false);
    setLastViewedJobIndex(null);
    setTotalScore(0);
    setScoreDetails(null);
    setIsLoading(true);
  };
  return (
    <UserContext.Provider
      value={{
        verifiedStatus,
        personalName,
        jobCounts,
        setPersonalName, // Expose setPersonalName to update name after API call
        refreshVerifiedStatus,
        refreshJobCounts,
        isLoading,
        reset,
        clearUserContext,
        isJobsLoaded,
        setIsJobsLoaded,
        refreshPersonalName,
        lastViewedJobIndex,
        setLastViewedJobIndex,
        totalScore,
        refreshScore,
        scoreDetails,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
