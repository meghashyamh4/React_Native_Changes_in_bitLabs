import apiClient from '../login/ApiClient';
export const fetchJobCounts = async (applicantId: number | null, jwtToken: string | null) => {
  try {
    const [recommendedResponse, appliedResponse, savedResponse] = await Promise.all([
      apiClient.get(`/recommendedjob/countRecommendedJobsForApplicant/${applicantId}`, {}),
      apiClient.get(`/applyjob/countAppliedJobs/${applicantId}`, {}),
      apiClient.get(`/savedjob/countSavedJobs/${applicantId}`, {}),
    ]);

    return {
      recommendedJobs: recommendedResponse.data,
      appliedJobs: appliedResponse.data,
      savedJobs: savedResponse.data,
    };
  } catch (error) {
    console.error('Error fetching job counts:', error);
    throw error;
  }
};
