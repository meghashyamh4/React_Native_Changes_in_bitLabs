import axios, { AxiosError } from 'axios';
import * as Keychain from 'react-native-keychain';
import { showToast } from './ToastService';
import apiClient from './ApiClient';
import { encryptPassword } from './EncryptionService';
import { SECRET_KEY } from '@env';
const secretKey = SECRET_KEY;

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
  userToken: string,
  userId: string,
): Promise<boolean> => {
  const oldPasswordEncrypt = encryptPassword(oldPassword, secretKey);
  const newPasswordEncrypt = encryptPassword(newPassword, secretKey);

  const formData = {
    oldPassword: oldPasswordEncrypt.encryptedPassword,
    newPassword: newPasswordEncrypt.encryptedPassword,
    ivOld: oldPasswordEncrypt.iv,
    ivNew: newPasswordEncrypt.iv,
  };

  try {
    const result = await Keychain.getGenericPassword();

    const jwtToken = result ? result.password : null; // Retrieve JWT token from keychain

    if (!jwtToken) {
      const response = await apiClient.post(`/applicant/authenticateUsers/${userId}`, formData);

      if (response.status === 200 && response.data === 'Password updated and stored') {
        showToast('success', 'Password changed successfully');
        return true;
      } else {
        showToast('error', response.data.message || 'Old password is incorrect');
        return false;
      }
    } else {
      showToast('error', 'Retry after some time');
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errResponse = error as AxiosError;
      if (errResponse.response) {
        if (errResponse.response.status === 400) {
          showToast('error', 'Old password is incorrect');
        } else {
          showToast('error', 'An unexpected error occurred');
        }
      }
    } else {
      showToast('error', 'An unexpected error occurred');
    }
    return false;
  }
};

export const checkPasswordsMatch = (oldPassword: string, newPassword: string) => {
  if (oldPassword === newPassword && oldPassword) {
    showToast('error', 'Old password and new password cannot be the same');
    return false;
  }
  return true;
};
