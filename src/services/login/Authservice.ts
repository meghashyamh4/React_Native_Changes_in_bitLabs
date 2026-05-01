import axios from 'axios';
import apiClient from './ApiClient';
import encryptPassword from './EncryptionService';
import {SECRET_KEY} from '@env';

export interface AuthResponse {
  success: boolean;
  data?: {token: string; id: number} | string;
  message?: string;
}
const secretkey = SECRET_KEY;

export const handleLoginWithEmail = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post(`/applicant/applicantLogin`, {email: email});
    if (response.status === 200) {
      const token = response.data.data.jwt;
      const id = response.data.id;

      if (token && id) {
        return {success: true, data: {token, id}};
      }
      return {success: false, message: 'Invalid response data'};
    }
    return {success: false, message: 'Login failed'};
  } catch (error) {
    console.error('Error occurred during login:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error:', error.response.data);
      // Extract error message from response
      let errorMessage = 'Login failed. Please try again.';
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }
      return {success: false, message: errorMessage};
    } else {
      return {success: false, message: 'Network error. Please check your connection and try again.'};
    }
  }
};

export const handleLogin = async (
  loginemail: string,
  loginpassword: string,
): Promise<AuthResponse> => {
  try {
    const {encryptedPassword, iv} = encryptPassword(loginpassword, secretkey);

    const response = await apiClient.post(`/applicant/applicantLogin`, {
      email: loginemail.toLowerCase(),
      password: encryptedPassword,
      iv: iv,
    });

    if (response.status === 200) {
      const token = response.data.data.jwt;
      const id = response.data.id;
      if (token && id) {
        return {success: true, data: {token, id}};
      }
      return {success: true, data: response.data};
    } else {
      return {success: false, message: 'Login failed'};
    }
  } catch (error) {
    console.error('Error occurred:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.log('API Error:', error.response.data);
      console.error('API Error:', error.response.data);
      // Extract error message from response
      let errorMessage = 'Login failed. Please try again.';
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }
      return {success: false, message: errorMessage};
    } else {
      return {success: false, message: 'Network error. Please check your connection and try again.'};
    }
  }
};
export const handleSignup = async (
  signupEmail: string,
  signupNumber: string,
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post(`/applicant/applicantsendotp`, {
      email: signupEmail.toLowerCase(),
      mobilenumber: signupNumber,
    });

    if (response.status === 200) {
      return {success: true, data: response.data};
    } else {
      return {success: false, message: response.data};
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {success: false, message: error.response.data};
    } else {
      return {success: false, message: 'unknown error'};
    }
  }
};

export const handleOTP = async (
  otp: string,
  signupEmail: string,
  signupName: string,
  signupNumber: string,
  signupPassword: string,
): Promise<AuthResponse> => {
  const lowerCaseEmail = signupEmail.toLowerCase();
  try {
    const response = await apiClient.post(`/applicant/applicantverify-otp`, {
      otp: otp,
      email: lowerCaseEmail,
    });

    if (response.status === 200) {
      const registeruser = await apiClient.post(`/applicant/saveApplicant`, {
        name: signupName,
        email: lowerCaseEmail,
        mobilenumber: signupNumber,
        password: signupPassword,
      });

      if (registeruser.status === 200) {
        // Don't auto-login - let user login manually to trigger validation
        // This ensures new users go through proper validation flow
        return {success: true, data: registeruser.data};
      } else {
        return {success: false, message: registeruser.data};
      }
    } else {
      return {success: false, message: response.data};
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {success: false, message: error.response.data};
    } else {
      return {success: false, message: 'unknown error'};
    }
  }
};
