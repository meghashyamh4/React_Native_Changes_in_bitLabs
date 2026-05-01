import apiClient from '@services/login/ApiClient';

export const fetchJobStatusByJobAndApplicant = async (
  jobId: number | string,
  userId: number | string,
  userToken: string
) => {
  if (!jobId) throw new Error('jobId is required');
  if (!userId) throw new Error('userId is required');
  if (!userToken) throw new Error('userToken is required');

  try {
    // Fetch job details to get applyJobId
    const jobDetailsResponse = await apiClient.get(
      `/viewjob/applicant/viewjob/${jobId}/${userId}`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    const { body } = jobDetailsResponse.data;
if (!body?.applyJobId) {
      throw new Error('applyJobId not found in job details response');
    }

    const applyJobId = body.applyJobId;

    // Fetch job status using applyJobId
    const jobStatusResponse = await apiClient.get(
      `/applyjob/recruiters/applyjob-status-history/${applyJobId}`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );
    return {
      applyJobId,
      jobStatus: jobStatusResponse.data,
      jobDetails: body,
    };
  } catch (error) {
    console.error('Error in fetchJobStatusByJobAndApplicant:', error);
    throw error;
  }
};
