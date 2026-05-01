// /src/ViewModels/RecommendedJobsViewModel.ts
import {useState, useEffect, useContext} from 'react';
import {Alert} from 'react-native';
import {JobData} from '@models/Model';
import {fetchRecommendedJobs, fetchJobDetails} from '@services/Jobs/RecommendedJobs';
import {useAuth} from '@context/Authcontext';
import UserContext from '@context/UserContext';

const useRecommendedJobsViewModel = () => {
  const {userId, userToken} = useAuth();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const {jobCounts} = useContext(UserContext);
  // Function to load jobs from the API
  const loadJobs = async () => {
    setLoading(true); // Start loading
    try {
      const data = await fetchRecommendedJobs(userId, userToken, jobCounts);
      setJobs(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch job data');
    } finally {
      setLoading(false); // End loading
    }
  };

  // Initial load of jobs when the component is mounted
  useEffect(() => {
    loadJobs();
  }, []);

  const getJobDetails = async (jobId: number): Promise<JobData | null> => {
    try {
      return await fetchJobDetails(jobId, userId, userToken);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch job details');
      return null;
    }
  };
  const reloadJobs = async () => {
    loadJobs();
  };

  return {jobs, loading, getJobDetails, reloadJobs};
};

export default useRecommendedJobsViewModel;
