import apiClient from '@services/login/ApiClient';
import {JobData, JobCounts} from '@models/Model';
import {fetchCompanyLogo} from './AppliedJob';
const API_URLS = {
  recommendedJobs: (userId: number | null, size: number = 300) =>
    `/recommendedjob/findrecommendedjob/${userId}?page=${0}&size=${size}`,
  jobDetails: (jobId: number, userId: number | null) =>
    `/viewjob/applicant/viewjob/${jobId}/${userId}`,
};

export const fetchRecommendedJobs = async (
  userId: number | null,
  userToken: string | null,
  jobCounts: JobCounts | null,
): Promise<JobData[]> => {
  const count = jobCounts?.recommendedJobs ?? 300;

  const response = await apiClient.get(API_URLS.recommendedJobs(userId, count), {});

  return response.data;
};

export const fetchJobDetails = async (
  jobId: number,
  userId: number | null,
  userToken: string | null,
): Promise<JobData> => {
  const response = await apiClient.get(API_URLS.jobDetails(jobId, userId));

  const jobData = response.data.body;

  // Fetch company logo using recruiterId
  if (jobData.recruiterId) {
    await fetchCompanyLogo(jobData.recruiterId, userToken);
  }

  return jobData;
};
