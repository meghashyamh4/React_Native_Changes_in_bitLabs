import apiClient from '../login/ApiClient';

export const ProfileModel = {
  createProfile: async (userId: number | null, userToken: string | null, requestData: any) => {
    const endpoint = `/applicantprofile/createprofile/${userId}`;
    
    try {
      if (!userId || !userToken) {
        throw new Error('User ID or token is missing');
      }

      // Log API call details
      console.log('📡 [API] POST', endpoint);
      console.log('📤 [API] Payload:', JSON.stringify(requestData, null, 2));

      const response = await apiClient.post(endpoint, requestData);

      // Log successful response
      console.log('✅ [API] Response Status:', response.status);
      console.log('📥 [API] Response Data:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error: any) {
      // Log error details
      console.log('❌ [API] Error Status:', error?.response?.status);
      console.log('❌ [API] Error Response:', JSON.stringify(error?.response?.data, null, 2));
      console.log('❌ [API] Error Message:', error?.message);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to save profile. Please try again.';
      let isProfileExists = false;
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        
        // Check if profile already exists (case insensitive)
        if (errorString.toLowerCase().includes('profile') && 
            (errorString.toLowerCase().includes('already') || 
             errorString.toLowerCase().includes('exist'))) {
          isProfileExists = true;
        }
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData)) {
          const firstError = errorData[0];
          errorMessage = firstError?.message || firstError?.field || 'Please check all fields and try again.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Return special flag if profile already exists (don't show snackbar, just navigate)
      const customError: any = new Error(errorMessage);
      customError.isProfileExists = isProfileExists;
      customError.status = error?.response?.status;
      throw customError;
    }
  },

  uploadResume: async (userToken: string | null, userId: number | null, formData: FormData) => {
    try {
      const response = await apiClient.post(`/applicantprofile/uploadresume/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Error uploading resume');
    }
  },
};
