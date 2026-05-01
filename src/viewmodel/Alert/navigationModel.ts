import {useState} from 'react';
import {fetchJobDetails} from '@services/Alert/NotificationServieces';
import {JobData} from '@models/Model';
import {useAuth} from '@context/Authcontext';

export const useJobViewModel = () => {
  const [jobDetails, setJobDetails] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {userToken} = useAuth();

  const getJobDetails = async (jobId: number | null, apply: number) => {
    setIsLoading(true);
    try {
      const data = await fetchJobDetails(jobId, userToken, apply);

      setJobDetails(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job details');
    } finally {
      setIsLoading(false);
    }
  };

  return {jobDetails, isLoading, error, getJobDetails};
};
