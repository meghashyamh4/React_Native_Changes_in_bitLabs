import * as Keychain from 'react-native-keychain';
import { navigate } from './NavigationService';

/**
 * Check if a valid authentication token exists in Keychain
 * @returns Promise<boolean> - true if token exists, false otherwise
 */
export async function checkSessionToken(): Promise<boolean> {
  try {
    console.log('🔐 [SESSION CHECK] Checking for token in Keychain...');
    const authToken = await Keychain.getGenericPassword({ service: 'authToken' });
    
    if (authToken && authToken.password) {
      console.log('✅ [SESSION CHECK] Token found in Keychain');
      return true;
    } else {
      console.log('❌ [SESSION CHECK] No token found in Keychain');
      return false;
    }
  } catch (error) {
    console.error('❌ [SESSION CHECK] Error checking token:', error);
    return false;
  }
}

/**
 * Handle navigation when a push notification is clicked
 * - Checks if session/token exists
 * - Navigates to NotificationScreen if token exists
 * - Navigates to LandingPage (Login) if token doesn't exist
 */
export async function handleNotificationNavigation(): Promise<void> {
  console.log('📱 [NOTIFICATION NAV] Notification clicked, handling navigation...');
  
  try {
    // Check if session token exists
    const hasToken = await checkSessionToken();
    
    if (hasToken) {
      console.log('✅ [NOTIFICATION NAV] Token found → Navigating to Notification screen');
      navigate('Notification');
    } else {
      console.log('❌ [NOTIFICATION NAV] No token found → Navigating to LandingPage (Login)');
      navigate('LandingPage');
    }
  } catch (error) {
    console.error('❌ [NOTIFICATION NAV] Error in handleNotificationNavigation:', error);
    // Fallback to login screen on error
    console.log('🔄 [NOTIFICATION NAV] Fallback: Navigating to LandingPage');
    navigate('LandingPage');
  }
}

