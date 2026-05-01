import apiClient from '../login/ApiClient';

export const submitTestResult = async (
  userId: number,
  testDetails: object,
  jwtToken: string | null,
) => {
  try {
    const response = await apiClient.post(
      `/applicant1/saveTest/${userId}`,
      JSON.stringify(testDetails),
    );
    if (response.status === 200) {
      console.log("Test name",testDetails)
      return {status: true};
      
    }
    return response.data;
  } catch (error) {
    console.error('Error submitting test result:', error);
    throw error;
  }
};

export const fetchTestData = async(testName : string)=>{
  const testData = apiClient.get(`/test/getTestByName/${testName}`);

  return testData;
}
