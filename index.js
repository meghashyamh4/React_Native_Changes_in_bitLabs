/**
 * @format
 */

import { AppRegistry, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { handleNotificationNavigation } from '@services/NotificationNavigation';

// Global text styles
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.style = { fontFamily: 'PlusJakartaSans-Regular' };

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.style = { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13.3 };

// Firebase background message handling (modular style)
const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📩 [BACKGROUND HANDLER] Message handled in the background!', remoteMessage);
});

// Handle background notification press events (when app is completely closed)
// This must be registered at the root level, not in a component
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('📩 [BACKGROUND EVENT] Notification pressed while app was closed');
    // Delay to ensure app is initialized
    setTimeout(() => {
      handleNotificationNavigation();
    }, 1500);
  }
});

AppRegistry.registerComponent(appName, () => App);
