# 16 KB Page Size Compatibility for Play Store Deployment

## Overview

Google Play requires all apps targeting Android 15 (API 35) or higher to support 16 KB memory page sizes starting **November 1, 2025**. This document outlines the changes made and steps to verify compliance before Play Store deployment.

## Changes Made

### 1. Build Configuration (`android/gradle.properties`)
- ✅ `android.enableCMake16kPageSize=true` - Enables 16 KB page size support in CMake builds

### 2. App Build Configuration (`android/app/build.gradle`)
- ✅ Added NDK ABI filters for proper architecture support
- ✅ Configured packaging options with `useLegacyPackaging = false` for proper native library alignment
- ✅ Added resource exclusions to prevent conflicts

### 3. NDK Version
- ✅ Using NDK 26.1.10909125 (supports 16 KB page size)

## Important Notes

### Third-Party Libraries
Some third-party native libraries may still show warnings until their maintainers update them:
- `react-native-reanimated` (libreanimated.so)
- `react-native-screens` (librnscreens.so)
- `react-native-pdf` (libpdfium.so, libpdfiumandroid.so)
- Other native libraries

**These warnings are expected** and may not block Play Store deployment if:
1. The app runs correctly in "page size compatible mode"
2. The app doesn't crash on 16 KB page size devices
3. Most core React Native libraries are properly aligned

## Pre-Deployment Checklist

### 1. Build Release APK/AAB
```bash
cd android
./gradlew clean
./gradlew bundleRelease  # For AAB (recommended for Play Store)
# OR
./gradlew assembleRelease  # For APK
```

### 2. Check Alignment (Optional)
Use the provided script to check native library alignment:
```bash
./android/check-16kb-alignment.sh android/app/build/outputs/bundle/release/app-release.aab
```

### 3. Test on 16 KB Page Size Device
- Test your app on a device with 16 KB page size (if available)
- Verify the app doesn't crash
- Check that all features work correctly

### 4. Use Android Studio APK Analyzer
1. Open Android Studio
2. Build → Analyze APK...
3. Select your release APK/AAB
4. Check native libraries section
5. Look for alignment warnings

### 5. Play Console Pre-Launch Report
- Upload your AAB to Play Console (Internal Testing track)
- Check the pre-launch report for 16 KB compatibility issues
- Address any critical issues before production release

## If You Still See Warnings

### Option 1: Wait for Library Updates
Monitor and update these libraries when 16 KB-compatible versions are released:
- `react-native-reanimated`
- `react-native-screens`
- `react-native-pdf`
- Other native libraries showing warnings

### Option 2: Request Extension (if needed)
If you need more time, Google Play allows developers to request an extension:
- Go to Play Console → Policy → App content
- Request extension for 16 KB page size compliance

### Option 3: Test Compatibility Mode
The app will run in "page size compatible mode" which:
- ✅ Allows the app to run on 16 KB devices
- ✅ May have slight performance impact
- ✅ Should not block Play Store deployment if app functions correctly

## Verification Commands

### Check Build Configuration
```bash
# Verify gradle.properties settings
grep "enableCMake16kPageSize" android/gradle.properties

# Verify NDK version
grep "ndkVersion" android/build.gradle
```

### Build and Test
```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Build release
cd android && ./gradlew bundleRelease && cd ..

# Check output
ls -lh android/app/build/outputs/bundle/release/
```

## Resources

- [Android 16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [Google Play 16 KB Requirements](https://developer.android.com/guide/practices/page-sizes)
- [React Native 0.77 Release Notes](https://reactnative.dev/blog/2025/01/21/version-0.77)

## Support

If you encounter issues:
1. Check that all dependencies are up to date
2. Verify NDK version is 26.1 or higher
3. Ensure `android.enableCMake16kPageSize=true` is set
4. Test on actual 16 KB page size device if possible
5. Check Play Console pre-launch reports

---

**Last Updated:** November 2024
**React Native Version:** 0.77.3
**Target SDK:** 34 (will need to update to 35 for full compliance)

