import {API_BASE_URL} from '@env';
import apiClient from '@services/login/ApiClient';

export const fetchTestStatus = async (userId: number | null, userToken: string | null) => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/applicant1/tests/${userId}`);
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error fetching test status:", error);

  }
};

export const fetchSkillBadges = async (userId: number | null, userToken: string | null) => {
  try {
    const response = await apiClient.get(`${API_BASE_URL}/skill-badges/${userId}/skill-badges`);
    if (response.status !== 200) {
      throw new Error('Failed to fetch skill badges');
    }
    const data = response.data;
    return data.applicantSkillBadges || [];
  } catch (error) {
    console.error('Error fetching skill badges:', error);
    throw error;
  }
};

export const calculateRetakeDate = (testDateTimeArray: number[]) => {
  const testDateTime = new Date(
    testDateTimeArray[0], // Year
    testDateTimeArray[1] - 1, // Month (0-based index)
    testDateTimeArray[2], // Day
    testDateTimeArray[3], // Hours
    testDateTimeArray[4], // Minutes
    testDateTimeArray[5], // Seconds
  );

  const retakeDate = new Date(testDateTime);
  retakeDate.setDate(retakeDate.getDate() + 7); // Retake after 7 days
  retakeDate.setHours(retakeDate.getHours() + 5); // Add 5 hours
  retakeDate.setMinutes(retakeDate.getMinutes() + 30); // Add 30 minutes

  return retakeDate;
};
