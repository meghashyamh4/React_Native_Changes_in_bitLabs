import {
  getMessaging,
  getToken,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import apiClient from '@services/login/ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function saveFcmToken(applicantId: string) {
  try {
    const messaging = getMessaging();

    // 🔹 Request permission
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn(" Push notification permission not granted");
      return;
    }

    // 🔹 Get FCM token
    const fcmToken = await getToken(messaging);
    const deviceName = (await DeviceInfo.getDeviceName()) || Platform.OS;

    if (!fcmToken) {
      console.warn(" No FCM token retrieved");
      return;
    }

    const payload = {
      applicantId,
      fcmToken,
      deviceName,
    };

    console.log("📩 Saving FCM payload:", payload);

    // 🔹 Store FCM token in AsyncStorage (like localStorage in web)
    await AsyncStorage.setItem('fcmToken', fcmToken);

    // 🔹 Send to backend API
    const response = await apiClient.post(
      `/notification/saveFcmToken/${applicantId}`,
      payload
    );

    console.log("✅ FCM saved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(" Failed to save FCM:", error.response?.data || error.message);
    throw error;
  }
}
