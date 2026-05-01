import {useState, useEffect, useCallback, useContext} from 'react';
import {JobData} from '@models/Model';
import {useAuth} from '@context/Authcontext';
import apiClient from '../login/ApiClient';
import UserContext from '@context/UserContext';

export const useSavedJobs = () => {
  const {userId, userToken} = useAuth();
  const {jobCounts} = useContext(UserContext);
  const [savedJobs, setSavedJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  const fetchSavedJobs = useCallback(
    async (savedJobCount: number | null) => {
      setLoading(true);
      setError(false); // Reset error state before fetching
      try {
        const response = await apiClient.get(
          `/savedjob/getSavedJobs/${userId}?page=${0}&size=${savedJobCount}`,
        );
        setSavedJobs(response.data);
      } catch (err) {
        setError(true);
        console.error('Error fetching saved jobs:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId, userToken],
  );

  // Automatically fetch saved jobs on mount
  const savedJobsCount = jobCounts?.savedJobs ?? 300;
  useEffect(() => {
    fetchSavedJobs(savedJobsCount);
  }, [fetchSavedJobs]);

  return {savedJobs, loading, error, fetchSavedJobs};
};
