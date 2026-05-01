import apiClient from './login/ApiClient';
// Base URL for the API

// Function to fetch mobile number from API
export const getMobileNumber = async (id: number | null): Promise<string | null> => {
  try {
    // Construct the full API URL with the provided id
    const response = await apiClient.get(`/applicant/getApplicantById/${id}`);
    if (response.status === 200) {
      const applicantData = response.data;
      return applicantData.mobilenumber; // Assuming the mobilenumber field exists
    }
    return null;
  } catch (error) {
    console.error('Error fetching mobile number:', error);
    return null;
  }
};
