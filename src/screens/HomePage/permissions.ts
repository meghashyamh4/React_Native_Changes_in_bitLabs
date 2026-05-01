import { PermissionsAndroid, Platform } from 'react-native';

export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true; // No need for iOS

  try {
    if (Platform.Version >= 33) {
      // Android 13+ does not require broad storage permissions for one-time/infrequent access.
      // System file pickers/savers handle their own permissions.
      return true;
    } else {
      // Android 12 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.warn('Permission error:', error);
    return false;
  }
};
