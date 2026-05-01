// /src/Services/JobService.ts
// import axios from 'axios';
import {JobData, JobCounts} from '@models/Model';
import apiClient from '../login/ApiClient';
import {Buffer} from 'buffer';

export const fetchCompanyLogo = async (
  recruiterId: number | null,
  userToken: string | null,
): Promise<string | null> => {
  if (!recruiterId) {
    console.error('Recruiter ID is null');
    return null;
  }

  try {
    const response = await apiClient.get(`/recruiters/companylogo/download/${recruiterId}`, {
      responseType: 'arraybuffer', // Specify binary data response
    });

    const base64Logo = `data:image/jpeg;base64,${Buffer.from(response.data, 'binary').toString(
      'base64',
    )}`;

    return base64Logo;
  } catch (error) {
    console.error('Error fetching or converting company logo:', error);
    return null;
  }
};

// API endpoint URL
export const fetchAppliedJobs = async (
  userId: number | null,
  userToken: string | null,
  jobCounts: JobCounts | null,
): Promise<JobData[]> => {
  try {
    const applyJobsCount = jobCounts?.appliedJobs ?? 300;
    const response = await apiClient.get(
      `/applyjob/getAppliedJobs/${userId}?page=${0}&size=${applyJobsCount}`,
      {},
    );
    return response.data;
  } catch (error) {
    throw new Error('');
  }
};
