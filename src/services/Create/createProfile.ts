import apiClient from '../login/ApiClient';

export const fetchProfileId = async (
  id: number,
  token: string,
): Promise<{success: boolean; profileid?: number}> => {
  try {
    const response = await apiClient.get(`/applicantprofile/${id}/profileid`);
    
    if (response.status === 200) {
      return {success: true, profileid: response.data};
    } else {
      return {success: false};
    }
  } catch (error) {
    console.error('Error fetching profile ID:', error);
    return {success: false};
  }
};
