/**
 * User Data Manager Utility
 * 
 * Handles clearing all user data from Android storage
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCachedToken } from '@services/TokenManager';
import { removeInterceptors } from '@services/login/ApiClient';

/**
 * Clears ALL user data from Android storage
 * 
 * Clears:
 * - AsyncStorage (all keys)
 * - Keychain (userDetails, authToken)
 * - Cached token
 * - API interceptors
 */
export const clearAllUserData = async (): Promise<void> => {
  try {
    // 1. Clear AsyncStorage completely
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');

    // 2. Clear Keychain (secure storage)
    await Keychain.resetGenericPassword({ service: 'userDetails' });
    await Keychain.resetGenericPassword({ service: 'authToken' });
    console.log('✅ Keychain cleared');

    // 3. Clear cached token
    setCachedToken(null);
    console.log('✅ Cached token cleared');

    // 4. Remove API interceptors
    removeInterceptors();
    console.log('✅ API interceptors removed');

    console.log('✅ All user data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    throw error;
  }
};

