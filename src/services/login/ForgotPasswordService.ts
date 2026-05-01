import axios from 'axios';
import {AuthResponse} from './Authservice';
import apiClient from './ApiClient';

const convertToLowerCase = (email: string) => {
  return email.toLowerCase();
};
const sendOtp = async (forgotemail: string): Promise<AuthResponse> => {
  const lowercaseEmail = convertToLowerCase(forgotemail);
  try {
    const response = await apiClient.post(`/applicant/forgotpasswordsendotp`, {
      email: lowercaseEmail,
    });

    if (response.status === 200) {
      return {success: true, message: 'OTP sent to your email!'};
    } else {
      return {success: false, message: response.data};
    }
  } catch (error) {
    return {success: false, message: 'Error sending OTP. Please try again.'};
  }
};

const verifyOtp = async (otp: string, signupEmail: string): Promise<AuthResponse> => {
  const lowercaseEmail = convertToLowerCase(signupEmail);
  try {
    const response = await apiClient.post(`/applicant/applicantverify-otp`, {
      otp: otp,
      email: lowercaseEmail,
    });

    return {success: true, data: response.data};
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {success: false, data: error.response?.data};
    }
    return {success: false};
  }
};

const resetPassword = async (
  email: string,
  password: string,
  confirmedPassword: string,
): Promise<AuthResponse> => {
  try {
    // const {encryptedPassword,iv} = encryptPassword(password,secretkey)
    const response = await apiClient.post(`/applicant/applicantreset-password/${email}`, {
      password,
      confirmedPassword,
    });

    return {success: true, data: response.data};
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {success: false, data: error.response?.data};
    }

    return {success: false, message: 'error'};
  }
};

export {sendOtp, verifyOtp, resetPassword};
