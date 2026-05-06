import React, { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from '@services/NavigationService';
import { CommonActions } from '@react-navigation/native';
import LandingPage from '../screens/LandingPage/LandingPage'; // Replace with actual path
import BottomTab from './BottomNavigation';
import Dummystep1 from '../screens/Steps/personlDetails'; // Replace with actual path
import Dummystep2 from '../screens/Steps/professionalDetails';
import { useAuth } from '../context/Authcontext'; // Replace with actual path
import { validateUserProfile, ValidationResult } from '../utils/userProfileValidator';
import TestInstruction from '../screens/TestInstruction'; // Ensure the path is correct
import TestScreen from '../screens/TestScreen';
import ForgotPassword from '../screens/LandingPage/ForgotPassword';
import AppliedJobs from '../screens/Jobs/AppliedJobs';
import SavedJobs from '../screens/Jobs/SavedJobs';
import JobDetailsScreen from '../screens/Jobs/JobDetailsScreen';
import JobDetails from '../screens/Jobs/JobDetails';
import ProfileComponent from '../screens/profile/Profile';
import ImagePreviewScreen from '../screens/profile/ImagePreviewScreen';
import Pass from '../screens/Test/passContent';
import Fail from '../screens/Test/FailContent';
import Timeup from '../screens/Test/TimeUp';
import Toast from 'react-native-toast-message'; // Ensure this import is correct
import ChangePasswordScreen from '../screens/HomePage/ChangePassword';
import ViewJobDetails from '../screens/Jobs/ViewJobDetails';
import Notification from '../screens/alert/Notification';
import SavedDetails from '../screens/Jobs/SavedDetails';
import { ProfilePhotoProvider } from '../context/ProfilePhotoContext';
import Drives from '../screens/HomePage/Drives';
import { PdfProvider } from '../context/ResumeContext';

import { useMessageContext, MessageProvider } from '../context/welcome';
import { RootStackParamList } from '@models/Model';
import VerifiedVideosScreen from '../screens/Videos/videoScreen';
import Hackathon from '../screens/Hackathon/HackathonScreen';
import ApplicantHackathonDetails from '../screens/Hackathon/ApplicantHackatonDetails';
import ApplicantSubmitHackathon from '../screens/Hackathon/ApplicantSubmitHackaton';
import MentorConnect from '../screens/MentorConnect/MentorConnect';
import ApplicantBlogsList from '../screens/HomePage/ApplicantBlogList';
import InterviewPrepPageRN from '../screens/InterviewPreparation/InterviewPrepPageRN';
import Dashboard from '../screens/HomePage/Home';
import FeedbackFormsListScreen from '../screens/FeedbackForms/FeedbackFormsListScreen';
import FeedbackFormDetailScreen from '../screens/FeedbackForms/FeedbackFormDetailScreen';
import LMSMainPage from '../screens/LMsPage/LMSMainPage';
import ScormPlayer from '../screens/LMsPage/ScromPlayer';

import { toastConfig } from '@components/Toast/toast_config';
import AskNewtonButton from '@components/FixedButtons/AskNewtonButton';
import SplashScreen from '../screens/SplashScreen/SplashScreen';
import SafeAreaWrapper from '../components/SafeAreaWrapper/SafeAreaWrapper';
// // {Changed}
// import { useRoute } from '@react-navigation/native';  

// // {changed}
//  const route=useRoute();


const Stack = createStackNavigator<RootStackParamList>();

// Create context for navigation loading state
interface NavigationLoadingContextType {
  loading: boolean;
  profileChecked: boolean;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  loading: false,
  profileChecked: false,
});

export const useNavigationLoading = () => useContext(NavigationLoadingContext);

interface AppnavigatorProps {
  onLoadingChange?: (loading: boolean, profileChecked: boolean) => void;
}

const Appnavigator: React.FC<AppnavigatorProps> = ({ onLoadingChange }) => {
  const { isAuthenticated, userToken, userId, userEmail } = useAuth();
  const [profileChecked, setProfileChecked] = useState(!isAuthenticated);
  const [loading, setLoading] = useState(false); // Don't start with loading=true to avoid double loading
  const [shouldShowStep1, setShouldShowStep1] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Restore splash screen
  const { setSetmsg } = useMessageContext();

  // Hide splash screen after animation completes
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4500); // 4.5 seconds: 0.5s zoom + 3s stay + 1s move down

    return () => clearTimeout(splashTimer);
  }, []);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading, profileChecked);
  }, [loading, profileChecked, onLoadingChange]);

  useEffect(() => {
    const checkProfileId = async () => {
      // Only set loading if not already checked to prevent double loading
      if (profileChecked) {
        return; // Already checked, don't run again
      }

      console.log('🔄 [NAVIGATION] Starting validation check...');

      // Keep loading true during validation to prevent showing Home first
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Profile check timeout - proceeding anyway');
        setLoading(false);
        setProfileChecked(true);
        // Default to new user on timeout
        setShouldShowStep1(true);
        setSetmsg(true);
      }, 10000); // 10 second timeout

      try {
        if (isAuthenticated && userToken && userId) {
          try {
            console.log('🔍 [NAVIGATION] Starting profile validation...', { userId, hasToken: !!userToken });

            // Validate user profile and determine navigation route
            const validationResult: ValidationResult = await validateUserProfile(userId, userToken);

            console.log('✅ [NAVIGATION] Validation result:', validationResult);

            // Set navigation state based on validation result BEFORE setting loading to false
            switch (validationResult.route) {
              case 'step1':
                // New user (no profileId or no firstName) - navigate to Basic Form 1
                console.log('📝 [NAVIGATION] Navigating to Step1 - New user');
                setShouldShowStep1(true);
                setSetmsg(true);
                break;
              case 'home':
                // Complete user (has firstName and resume) - navigate to Home
                console.log('🏠 [NAVIGATION] Navigating to Home - Complete user');
                setShouldShowStep1(false);
                setSetmsg(false);
                break;
              default:
              // Default to new user flow
              // console.log('⚠️ [NAVIGATION] Defaulting to Step1 - Unknown route');
              // setShouldShowStep1(true);
              // setShouldShowStep3(false);
              // setSetmsg(true);
            }
          } catch (error) {
            console.error('❌ [NAVIGATION] Error in profile validation: ', error);
            // On error, default to new user flow
            setShouldShowStep1(true);
            setSetmsg(true);
          }
        } else {
          console.log('⚠️ [NAVIGATION] Missing auth data:', { isAuthenticated, hasToken: !!userToken, hasUserId: !!userId });
          // If not authenticated, don't show steps
          setShouldShowStep1(false);
        }
      } finally {
        clearTimeout(timeoutId);
        // Set loading to false and profileChecked to true AFTER setting navigation state
        // This ensures the correct screen is shown immediately
        setLoading(false);
        setProfileChecked(true);
      }
    };

    // Run validation when authenticated AND splash screen is done
    if (!showSplash && isAuthenticated && userToken && userId && !profileChecked) {
      console.log('🚀 [NAVIGATION] Starting profile check...');
      checkProfileId();
    } else if (!isAuthenticated) {
      // Reset when not authenticated
      setProfileChecked(false);
      setShouldShowStep1(false);
      setLoading(false);
    }
  }, [isAuthenticated, userToken, userId, setSetmsg, profileChecked, showSplash]);

  // Navigate directly to Step1 if needed (new user)
  useEffect(() => {
    if (shouldShowStep1 && !loading && profileChecked) {
      console.log('🎯 [NAVIGATION] Attempting to navigate to Step1...', {
        shouldShowStep1,
        loading,
        profileChecked,
        isReady: navigationRef.current?.isReady(),
      });

      if (navigationRef.current?.isReady()) {
        console.log('✅ [NAVIGATION] Navigation ready, resetting to Step1');
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Step1', params: { email: userEmail } }],
          })
        );
      } else {
        console.log('⏳ [NAVIGATION] Navigation not ready yet, will retry...');
        // Retry after a short delay
        const timer = setTimeout(() => {
          if (navigationRef.current?.isReady()) {
            console.log('✅ [NAVIGATION] Navigation ready on retry, resetting to Step1');
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Step1', params: { email: userEmail } }],
              })
            );
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [shouldShowStep1, loading, profileChecked, userEmail]);

  // Show splash screen first
  if (showSplash) {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  // Show loading screen while validation is in progress (only after splash is done)
  // Only show if loading is explicitly true to prevent double loading
  if (loading && !showSplash) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator
          size="large"
          color="#F46F16"
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaWrapper edges={['top']}>
        <Stack.Navigator>
          <Stack.Screen name="LandingPage" component={LandingPage} options={{ headerShown: false }} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InterviewPreparation"
            component={InterviewPrepPageRN}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </SafeAreaWrapper>
    );
  }

  // Debug log to see current state
  console.log('🔍 [NAVIGATION] Render state:', {
    shouldShowStep1,
    loading,
    profileChecked,
    isAuthenticated,
  });

  return (
    <SafeAreaWrapper edges={['top']}>
      <Stack.Navigator
        initialRouteName={
          shouldShowStep1 ? 'Step1' : 'BottomTab'
        }>
        {shouldShowStep1 ? (
          <>
            {shouldShowStep1 && (
              <>
                <Stack.Screen
                  name="Step1"
                  component={Dummystep1}
                  initialParams={{ email: userEmail }}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Step2"
                  component={Dummystep2}
                  options={{ headerShown: false }}
                  initialParams={{ updateShouldShowStep1: setShouldShowStep1 }}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="BottomTab" component={BottomTab} options={{ headerShown: false }} />

            {/* Test Instruction Screen */}
            <Stack.Screen
              name="TestInstruction"
              component={TestInstruction}
              options={{ headerShown: false }}
            />

            {/* Test Instruction Screen */}
            <Stack.Screen name="TestScreen" component={TestScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="JobDetails"
              component={JobDetails}
              options={{
                title: 'Job Details',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="AppliedJobs"
              component={AppliedJobs}
              options={{
                title: 'Applied Jobs',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="JobDetailsScreen"
              component={JobDetailsScreen}
              options={{
                title: 'Job Details',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="ViewJobDetails"
              component={ViewJobDetails}
              options={{
                title: 'View Job Details',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="SavedDetails"
              component={SavedDetails}
              options={{
                title: 'Job Details',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="Dashboard"
              component={Dashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SavedJobs"
              component={SavedJobs}
              options={{
                title: 'Saved Jobs',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileComponent}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ImagePreview"
              component={ImagePreviewScreen}
              options={{
                title: 'Image Preview',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 18,
                  color: '#000',
                },
              }}
            />
            <Stack.Screen name="passContent" component={Pass} options={{ headerShown: false }} />
            <Stack.Screen name="FailContent" component={Fail} options={{ headerShown: false }} />
            <Stack.Screen name="TimeUp" component={Timeup} options={{ headerShown: false }} />
            <Stack.Screen
              name="Notification"
              component={Notification}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Hackathon"
              component={Hackathon}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="TechVibes"
              component={ApplicantBlogsList}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="ApplicantHackathonDetails"
              component={ApplicantHackathonDetails}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="ApplicantSubmitHackathon"
              component={ApplicantSubmitHackathon}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="MentorConnect"
              component={MentorConnect}
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="InterviewPreparation"
              component={InterviewPrepPageRN}
              options={{
                headerShown: false,
              }}
            />

            {/* <Stack.Screen
              name="ResumeBuilder"
              component={ResumeBuilder}
              options={{
                title: 'Resume Builder',
                headerTitleStyle: {
                  fontFamily: 'PlusJakartaSans-Bold',
                  fontSize: 16, // Customize the font size
                },
              }}
            /> */}
            <Stack.Screen name="Drives" component={Drives} />
            <Stack.Screen
              name="VerifiedVideosScreen"
              component={VerifiedVideosScreen}
              options={{ headerShown: false }}
            />
            {/* Feedback Forms Screens */}
            <Stack.Screen
              name="FeedbackFormsList"
              component={FeedbackFormsListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FeedbackFormDetails"
              component={FeedbackFormDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LMSMainPage"
              component={LMSMainPage}
              options={{
                title: 'LMS Main Page',
                headerStyle: {
                  backgroundColor: '#f8f9fa',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="ScormPlayer"
              component={ScormPlayer}
              options={{
                title: 'SCORM Player',
                headerStyle: {
                  backgroundColor: '#f8f9fa',
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </SafeAreaWrapper>
  );
};

const AppWithProfileProvider = () => {
  const { userToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  return (
    <PdfProvider>
      <MessageProvider>
        <ProfilePhotoProvider userToken={userToken} userId={userId}>
          <NavigationLoadingContext.Provider value={{ loading, profileChecked }}>
            <NavigationContainer ref={navigationRef}>
              <View style={{ flex: 1 }}>
                <Appnavigator
                  onLoadingChange={(loading, profileChecked) => {
                    setLoading(loading);
                    setProfileChecked(profileChecked);
                  }}
                />

                {/* {changed} */}
                {!loading && profileChecked && <AskNewtonButton />}
              </View>
            </NavigationContainer>
            <Toast config={toastConfig} />
          </NavigationLoadingContext.Provider>
        </ProfilePhotoProvider>
      </MessageProvider>
    </PdfProvider>
  );
};

export default AppWithProfileProvider;
