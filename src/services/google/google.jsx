import { useState, useEffect } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  getIdToken,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import { useAuth } from '@context/Authcontext';
import { showToast } from '../login/ToastService';
import { CLIENT_ID } from '@env';

/**
 * useGoogleSignIn
 * ---------------
 * Handles Google OAuth + Firebase Authentication sign-in flow.
 *
 * Flow:
 *  1. GoogleSignin.signIn()      → get Google ID token
 *  2. auth().signInWithCredential(googleCredential) → sign into Firebase
 *  3. firebaseUser.getIdToken(true)  → get verified Firebase ID token
 *  4. firebaseGlogin(firebaseIdToken) → POST to /applicant/google on the backend
 *
 * The webClientId is sourced from the .env file:
 *   - DEBUG builds  → debug CLIENT_ID (debug.keystore SHA1 registered in Firebase/GCP)
 *   - RELEASE builds → production CLIENT_ID (my-release-key.keystore SHA1 registered in Firebase/GCP)
 *
 * When swapping Firebase projects:
 *   1. Replace android/app/google-services.json with the new file.
 *   2. Get the new web client_id from Firebase Console → Project Settings
 *      → Your Android App → OAuth 2.0 client IDs (type: Web).
 *   3. Update CLIENT_ID in .env accordingly.
 */
const useGoogleSignIn = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { firebaseGlogin } = useAuth();

  useEffect(() => {
    // configure() MUST be called before any signIn() call.
    // webClientId must be the Web OAuth client (client_type: 3) from google-services.json,
    // NOT the Android client ID.
    GoogleSignin.configure({
      webClientId: CLIENT_ID,
      offlineAccess: false, // set true if your backend needs a server auth code
    });
    console.log('[GoogleSignIn] GoogleSignin configured successfully.');
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      let googleUser = null;

      // ── Step 1: Google Sign-In ──────────────────────────────────────────────
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        googleUser = await GoogleSignin.signIn();
        console.log('[GoogleSignIn] Google user signed in successfully:', googleUser);
        setUserInfo(googleUser);
        setIsSignedIn(true);
      } catch (error) {
        const isCancel =
          error.code === statusCodes.SIGN_IN_CANCELLED ||
          error.code === '12501' ||
          error.code === 12501 ||
          error.message?.toLowerCase().includes('cancel') ||
          error.message?.includes('12501');

        const isInProgress =
          error.code === statusCodes.IN_PROGRESS ||
          error.code === '12502' ||
          error.code === 12502 ||
          error.message?.toLowerCase().includes('in progress') ||
          error.message?.includes('12502');

        const isPlayServicesNotAvailable =
          error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ||
          error.code === '2' ||
          error.code === 2 ||
          error.message?.toLowerCase().includes('play services');

        if (isCancel) {
          console.log('[GoogleSignIn] Sign-in/email selection cancelled by user.');
          // Do not show an error toast when user intentionally cancels
        } else if (isInProgress) {
          showToast('error', 'Google sign-in is already in progress. Please wait.');
        } else if (isPlayServicesNotAvailable) {
          showToast('error', 'Google Play Services not available.');
        } else {
          console.error('[GoogleSignIn] Unexpected Google Sign-In error:', error);
          showToast('error', 'Google Sign-In failed. Please try again.');
        }
        return; // Stop flow here
      }

      // ── Step 2: Sign into Firebase with the Google credential ───────────────
      let firebaseUser = null;
      try {
        const googleIdToken = googleUser?.data?.idToken ?? googleUser?.idToken;
        if (!googleIdToken) {
          throw new Error('[GoogleSignIn] No Google ID token received from GoogleSignin.signIn()');
        }

        const googleCredential = GoogleAuthProvider.credential(googleIdToken);
        const firebaseUserCredential = await signInWithCredential(getAuth(), googleCredential);
        firebaseUser = firebaseUserCredential.user;
        console.log('[GoogleSignIn] Firebase sign-in successful, uid:', firebaseUser?.uid);
      } catch (error) {
        console.error('[GoogleSignIn] Firebase credential sign-in failed:', error);
        showToast('error', 'Google Sign-In failed. Please try again.');
        try { await GoogleSignin.signOut(); } catch (e) { }
        setUserInfo(null);
        setIsSignedIn(false);
        return;
      }

      // ── Step 3: Get the verified Firebase ID token ──────────────────────────
      let firebaseIdToken = null;
      try {
        firebaseIdToken = await getIdToken(firebaseUser, true);
        console.log('[GoogleSignIn] Firebase ID token obtained successfully.');
      } catch (error) {
        console.error('[GoogleSignIn] Failed to get Firebase ID token:', error);
        showToast('error', 'Authentication failed. Please try again.');
        try { await GoogleSignin.signOut(); } catch (e) { }
        setUserInfo(null);
        setIsSignedIn(false);
        return;
      }

      // ── Step 4: Send Firebase ID token to the backend ───────────────────────
      try {
        const response = await firebaseGlogin(firebaseIdToken);
        if (response && response.success) {
          showToast('success', 'Login Successful');
        } else {
          const errorMsg =
            response?.message || 'We could not process your request at this time. Please try again.';
          showToast('error', errorMsg);
          try { await GoogleSignin.signOut(); } catch (e) { }
          setUserInfo(null);
          setIsSignedIn(false);
        }
      } catch (backendError) {
        console.error('[GoogleSignIn] Backend login failed with error:', backendError);
        showToast('error', 'Connection to server failed. Please check your network and try again.');
        try { await GoogleSignin.signOut(); } catch (e) { }
        setUserInfo(null);
        setIsSignedIn(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await firebaseSignOut(getAuth()); // modular sign-out from Firebase
      setIsSignedIn(false);
      setUserInfo(null);
    } catch (error) {
      console.error('[GoogleSignIn] Sign-out error:', error);
      showToast('error', 'Sign-out failed. Please try again.');
    }
  };

  return {
    userInfo,
    isSignedIn,
    isLoading,
    signIn,
    signOut,
  };
};

export default useGoogleSignIn;
