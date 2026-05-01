import apiClient from '../login/ApiClient';

const getAuthHeader = (userToken: string | null) => {
  return {
    Authorization: `Bearer ${userToken}`,
  };
};

export const saveJob = async (
  applicantId: number | null,
  jobId: number,
  userToken: string | null,
) => {
  try {
    const response = await apiClient.post(
      `/savedjob/applicants/savejob/${applicantId}/${jobId}`,
      {},
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to save job:', error.response?.data || error.message);
    throw error; // Re-throw the error to let the caller handle it
  }
};

export const applyJob = async (
  applicantId: number | null,
  jobId: number,
  userToken: string | null,
) => {
  try {
    const response = await apiClient.post(
      `/applyjob/applicants/applyjob/${applicantId}/${jobId}`,
      {},
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to apply for job:', error.response?.data || error.message);
    throw error; // Re-throw the error to let the caller handle it
  }
};

export const removeSavedJob = async (
  jobId: number,
  applicantId: number | null,
  userToken: string | null,
) => {
  try {
    const response = await apiClient.delete(
      `/savedjob/applicants/deletejob/${applicantId}/${jobId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove job:', error.response?.data || error.message);
    throw error; // Re-throw the error to let the caller handle it
  }
};
