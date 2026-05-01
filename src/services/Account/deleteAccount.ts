import apiClient from '@services/login/ApiClient';

export const deleteAccount = async (userId: number) => {
  try {
    const response = await apiClient.put(`/applicant/closeAccount/${userId}`);
    console.log('Delete account response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};
