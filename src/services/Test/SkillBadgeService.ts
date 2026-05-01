import apiClient from '../login/ApiClient';
// Create Axios instance with base URL

export const submitSkillBadge = async (
  userId: number,
  testName: string,
  testStatus: string,
  jwtToken: string | null,
): Promise<any> => {
  try {
    const response = await apiClient.post(
      '/skill-badges/save',
      {
        applicantId: userId,
        skillBadgeName: testName,
        status: testStatus,
      },
      {},
    );
    if (response.status === 200 || response.status === 201) {
      return response.data;
    }
  } catch (error) {
    console.error('Error submitting the test result:', error);
    throw error;
  }
};
