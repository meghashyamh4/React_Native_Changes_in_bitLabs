import React, { useEffect } from "react";
import { PermissionsAndroid, Platform, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@context/Authcontext";
import { UserProvider } from "@context/UserContext";
import AppWithProfileProvider from "@routes/New";

import {
  getMessaging,
  getToken,
  onMessage,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus,
} from "@react-native-firebase/messaging";

import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import { saveFcmToken } from "@services/PushNotifications/PushNotifications";
import { getApp } from "@react-native-firebase/app"; // ✅ modular import
import { handleNotificationNavigation } from "@services/NotificationNavigation";

// ✅ Get the default Firebase app safely
const app = getApp();
const messaging = getMessaging(app);

const NotificationsSetup = () => {
  const { userId } = useAuth();

  // ✅ Request user permission for notifications
  async function requestUserPermission() {
    if (Platform.OS === "ios") {
      const authStatus = await requestPermission(messaging);
      return (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      );
    } else if (Platform.OS === "android" && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async function setupChannel() {
    await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      importance: AndroidImportance.HIGH,
    });
  }

  // ✅ Register FCM and handle token storage
  async function registerFcm() {
    const permissionGranted = await requestUserPermission();
    if (!permissionGranted) return;

    const token = await getToken(messaging);
    console.log("📱 FCM Token:", token);

    if (userId) {
      await saveFcmToken(String(userId));
    }

    await setupChannel();
  }

  // ✅ Handle token refresh
  useEffect(() => {
    registerFcm();

    const unsubscribeRefresh = onTokenRefresh(messaging, async (newToken) => {
      console.log("♻️ Refreshed FCM Token:", newToken);
      if (userId) {
        await saveFcmToken(String(userId));
      }
    });

    return unsubscribeRefresh;
  }, [userId]);

  // ✅ Handle foreground messages
  useEffect(() => {
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      console.log("📩 [FOREGROUND] Message received:", remoteMessage);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || "No title",
        body: remoteMessage.notification?.body || "No body",
        data: remoteMessage.data,
        android: {
          channelId: "default",
          importance: AndroidImportance.HIGH,
          smallIcon: "ic_launcher",
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    // Handle foreground notification press (when app is in foreground)
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log("📩 [FOREGROUND] Notification pressed");
        handleNotificationNavigation();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeForeground();
    };
  }, []);

  // ✅ Handle background & opened messages
  useEffect(() => {
    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log("📩 [BACKGROUND] Message received:", remoteMessage);
    });

    // Handle notification opened when app is in background
    const unsubscribeOpen = onNotificationOpenedApp(messaging, (remoteMessage) => {
      console.log("📩 [BACKGROUND] Notification opened from background:", remoteMessage);
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        handleNotificationNavigation();
      }, 500);
    });

    // Handle notification opened when app was completely closed (quit state)
    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        console.log("📩 [QUIT STATE] Notification opened from quit state:", remoteMessage);
        // Longer delay for quit state to ensure app is fully initialized
        setTimeout(() => {
          handleNotificationNavigation();
        }, 1000);
      }
    });

    // Handle background notification press (when app is in background)
    const unsubscribeBackground = notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log("📩 [BACKGROUND] Notification pressed in background");
        handleNotificationNavigation();
      }
    });

    return () => {
      unsubscribeOpen();
    };
  }, []);

  return null;
};

const App = () => (
  <SafeAreaProvider>
    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    <AuthProvider>
      <UserProvider>
        <AppWithProfileProvider />
        <NotificationsSetup />
      </UserProvider>
    </AuthProvider>
  </SafeAreaProvider>
);

export default App;
