import axios from 'axios';
import apiClient from '../login/ApiClient';

interface TestData {
  testStatus: string;
}
export const ProfileService = {
  async fetchProfile(userToken: string | null, userId: number | null) {
    try {
      // Use the hook inside a function scope

      if (!userToken || !userId) {
        throw new Error('Authentication data is missing or incomplete.');
      }

      const response = await apiClient.get(`/applicantprofile/${userId}/profile-view`);

      return {
        applicant: response.data.applicant,
        basicDetails: response.data.basicDetails,
        skillsRequired: response.data.skillsRequired || [],
        qualification: response.data.qualification || '',
        specialization: response.data.specialization || '',
        preferredJobLocations: response.data.preferredJobLocations || [],
        experience: response.data.experience || '',
        applicantSkillBadges: response.data.applicant.applicantSkillBadges || '',
        formErrors: {}, // Initialize form errors as an empty object
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      throw error; // Re-throw the error to handle it in the caller
    }
  },
  async updateBasicDetails(
    userToken: string | null,
    userId: number | null,
    updatedProfileData: any,
  ) {
    try {
      if (!userToken || !userId) {
        throw new Error('Authentication data is missing or incomplete.');
      }

      const response = await apiClient.put(
        `/applicantprofile/${userId}/basic-details`,
        updatedProfileData,
      );
      if (response.status !== 200) {
        
        return false;
      } else if (response.data?.formErrors) {
        // If the API returns form errors, return them so that they can be displayed in the UI
        return {success: false, formErrors: response.data.formErrors};
      }

      // If update is successful, return the updated data
      return {success: true, profileData: response.data};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error?.response?.data;
      } else {
        throw new Error('An unexpected error occurred while updating profile data.');
      }
    }
  },
  async updateProfessionalDetails(
    userToken: string | null,
    userId: number | null,
    updatedProfileData: any,
  ) {
    try {
      if (!userToken || !userId) {
        throw new Error('Authentication data is missing or incomplete.');
      }

      const response = await apiClient.put(
        `/applicantprofile/${userId}/professional-details`,
        updatedProfileData,
      );

      if (response.data?.formErrors) {
        // If the API returns form errors, return them so that they can be displayed in the UI
        return {success: false, formErrors: response.data.formErrors};
      }

      return {success: true, profileData: response.data};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {success: false, formErrors: error.response?.data};
      } else {
        return {
          success: false,
          formErrors: {general: 'An unexpected error occurred while updating profile data.'},
        };
      }
    }
  },
  async uploadProfilePhoto(userToken: string | null, userId: number | null, photoFile: any) {
    console.log('[ProfileService] uploadProfilePhoto called:', {
      userId,
      hasToken: !!userToken,
      photoUri: photoFile.uri ? 'present' : 'missing',
      photoType: photoFile.type,
      photoName: photoFile.fileName,
      photoSize: photoFile.fileSize,
    });

    try {
      if (!userToken || !userId) {
        console.error('[ProfileService] Missing authentication:', {
          hasToken: !!userToken,
          userId,
        });
        throw new Error('Authentication data is missing or incomplete.');
      }

      if (!photoFile.uri) {
        console.error('[ProfileService] Missing photo URI');
        return {
          success: false,
          message: 'Photo file is missing. Please select a photo and try again.',
        };
      }

      const formData = new FormData();
      formData.append('photo', {
        uri: photoFile.uri,
        type: photoFile.type || 'image/jpeg',
        name: photoFile.fileName || 'photo.jpg',
      });

      console.log('[ProfileService] Sending upload request to API...');
      const response = await apiClient.post(`/applicant-image/${userId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[ProfileService] Upload successful:', {
        status: response.status,
        data: response.data,
      });

      return {success: true, data: response.data};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || error.message || 'Failed to upload photo.';

        console.error('[ProfileService] Upload error:', {
          status,
          message: errorMessage,
          errorData,
          isBadRequest: status === 400,
        });

        // Handle specific error cases
        if (status === 400) {
          // Bad Request - validation errors
          const validationMsg = errorData?.message || 
                               errorData?.error || 
                               'Invalid photo file. Please check file size (max 5MB) and format (JPEG/PNG only).';
          return {
            success: false,
            message: validationMsg,
          };
        } else if (status === 413) {
          // Payload Too Large
          return {
            success: false,
            message: 'File size is too large. Maximum size is 5 MB.',
          };
        } else if (status === 401 || status === 403) {
          return {
            success: false,
            message: 'Authentication failed. Please log in again.',
          };
        } else if (status === 500) {
          return {
            success: false,
            message: 'Server error. Please try again later.',
          };
        }

        return {
          success: false,
          message: errorMessage,
        };
      } else {
        console.error('[ProfileService] Unexpected error:', error);
        return {
          success: false,
          message: 'An unexpected error occurred while uploading photo. Please try again.',
        };
      }
    }
  },
  async fetchProfilePhoto(userToken: string | null, userId: number | null) {
    try {
      if (!userToken || !userId) {
        throw new Error('Authentication data is missing or incomplete.');
      }
      const response = await apiClient.get(`/applicant-image/getphoto/${userId}`, {
        responseType: 'arraybuffer',
        // Ensure the response is handled as an arraybuffer
      });
      const base64Image = btoa(
        new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      );
      const photoUrl = `data:${response.headers['content-type']};base64,${base64Image}`;
      return {success: true, photoUrl};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch photo.',
        };
      } else {
        return {success: false, message: 'An unexpected error occurred while fetching photo.'};
      }
    }
  },

  async uploadResume(userToken: string | null, userId: number | null, formData: FormData) {
    try {
      if (!userToken || !userId) {
        throw new Error('Authentication data is missing or incomplete.');
      }
      const response = await apiClient.post(`/applicant-pdf/${userId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {success: true, data: response.data};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to upload resume.',
        };
      } else {
        return {success: false, message: 'An unexpected error occurred while uploading resume.'};
      }
    }
  },
  async checkVerified(jwtToken: string | null, userId: number | null): Promise<boolean> {
    try {
      const response = await apiClient.get<TestData[]>(`/applicant1/tests/${userId}`);
      const data = response.data;

      // Check if both aptitude and technical tests have status "P" or "p"
      const allTestsPassed =
        data.length >= 2 && data.every(test => test.testStatus.toLowerCase() === 'p');

      return allTestsPassed;
    } catch (error) {
      console.error('Error fetching test data:', error);
      return false;
    }
  },
};
export default ProfileService;
