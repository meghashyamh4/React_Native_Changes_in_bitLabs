import {useState, useEffect} from 'react';
import {fetchJobCounts} from '@services/Home/apiService';
import {JobCounts} from '@models/model';
import {useIsFocused} from '@react-navigation/native';

export const useJobCounts = (applicantId: number | null, jwtToken: string | null) => {
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused(); // Hook to detect if the screen is focused

  useEffect(() => {
    let isActive = true;

    const getJobCounts = async () => {
      if (!applicantId || !jwtToken) {
        // Skip fetching if applicantId or jwtToken is null
        setJobCounts(null);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const counts = await fetchJobCounts(applicantId, jwtToken);

        if (isActive) {
          setJobCounts(counts); // Only update state if component is still active
        }
      } catch (err) {
        if (isActive) {
          setError('Failed to load job data');
          setJobCounts(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (isFocused && isActive) {
      getJobCounts(); // Fetch job counts when the screen is focused
    }

    return () => {
      isActive = false;
    };
  }, [applicantId, jwtToken, isFocused]); // Add isFocused as a dependency to trigger when screen is focused

  return {jobCounts, loading, error};
};
