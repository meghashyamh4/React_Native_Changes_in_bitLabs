import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Navbar from '@components/Navigation/Navbar';
import NetInfo from '@react-native-community/netinfo';
import ExploreSection from "@components/home/ExploreSection"; // Hook for fetching job counts
import { useAuth } from '@context/Authcontext';
import { RootStackParamList } from '@models/Model';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMessageContext, } from '../../context/welcome';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native'; // Updated imports
import Icon5 from 'react-native-vector-icons/MaterialIcons'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import UserContext from '@context/UserContext';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';

import { LMSCard } from './LMSCard';
import ProfileCardsRow from './ProfileCardsRow';
import LinearGradient from 'react-native-linear-gradient';
import { useProfilePhoto } from '@context/ProfilePhotoContext';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { StreakQuiz } from './StreakQuiz';
import { useStreak, StreakProvider } from '@context/StreakContext';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// const baseScale = screenWidth < screenHeight ? screenWidth : screenHeight;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Jobs'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;


function Dashboard() {
  const TABLET_BREAKPOINT = 768;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const { refreshJobCounts, refreshVerifiedStatus } = useContext(UserContext)
  const { isAuthenticated, userId, userToken } = useAuth();
  const { resetPhoto } = useProfilePhoto();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [verified, setVerified] = useState(false)
  const [loading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [showSkeleton, setShowSkeleton] = useState(true); // Skeleton loading state

  const { verifiedStatus, isLoading, jobCounts, refreshScore } = useContext(UserContext);
  const route = useRoute<HomeScreenRouteProp>(); // Handle route params
  const [hasFetched, setHasFetched] = useState(false);
  const { streakData, streakLoading, refreshStreakData } = useStreak();
  const [quizDone, setQuizDone] = useState(false);

  // Ref to prevent duplicate refetch calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  useEffect(() => {
    if (!isAuthenticated) {
      resetPhoto(); // This resets the profile photo state
    }
  }, [isAuthenticated]);

  // Show skeleton for 0.5 seconds on initial load
  useEffect(() => {
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500); // 0.5 seconds

    return () => clearTimeout(skeletonTimer);
  }, []);

  // Remove NetInfo listener to prevent continuous re-fetching
  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener((state) => {
  //     if (state.isConnected && !isConnected) {
  //       refetchData();
  //     }
  //     setIsConnected(state.isConnected)
  //   })
  //   return () => {
  //     unsubscribe();
  //   }
  // }, [isConnected, refetchData])

  // Fetch applicant card to get user name
  const fetchUserName = async () => {
    if (!userId || !userToken) return;
    try {
      const result = await ProfileApiService.fetchCard(userId, userToken);
      if (result.success && result.data?.name) {
        setUserName(result.data.name);
      }
    } catch (error) {
      console.error('Error fetching applicant card:', error);
    }
  };

  const refetchData = useCallback(async () => {
    const now = Date.now();
    // Prevent duplicate calls within cooldown period
    if (isFetchingRef.current || (now - lastFetchTimeRef.current < FETCH_COOLDOWN)) {
      console.log('🔄 [HOME] Skipping refetch - cooldown or already fetching');
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('🔄 [HOME] Refetching data...');
      refreshJobCounts();
      refreshVerifiedStatus();
      await fetchUserName();
      // Streak data is now managed by StreakContext
      if (refreshScore) {
        await refreshScore();
      }
    } catch (error) {
      console.error('❌ [HOME] Error refetching data:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []); // Empty dependency array to prevent re-creation

  // Fetch data only once on mount using ref to prevent re-renders
  useEffect(() => {
    if (isAuthenticated && !hasFetched) {
      refetchData();
      setHasFetched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Use the useJobCounts hook to fetch job counts

  const { setmsg } = useMessageContext();

  const navigation = useNavigation<NavigationProp>();

  // Remove this useEffect to prevent re-renders caused by verifiedStatus changes
  // useEffect(() => {
  //   setVerified(verifiedStatus);
  // }, [verifiedStatus]);
  // Handle loading state
  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F46F16" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
        {/* <Text style={{ color: '#0D0D0D', fontFamily: 'PlusJakartaSans-Bold' }}>
        Loading job data...
      </Text> */}
      </View>
    );
  }


  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")} // your dummy path
      style={styles.background}
    >
      <View style={styles.container}>
        <Navbar />
        <ScrollView
          contentContainerStyle={{ paddingBottom: screenHeight * 0.04 }} // Add bottom padding
        >
          {showSkeleton ? (
            <>
              {/* Skeleton content ... */}
            </>
          ) : (
            <>
              <View style={{ display: 'flex', flexDirection: 'row', gap: 34, alignItems: 'center', }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.textBelowNavbar, isTablet && styles.tabletTextBelowNavBar]}>Hello, {userName
                      ? userName.charAt(0).toUpperCase() + userName.slice(1)
                      : 'Guest'}
                    </Text>
                    {verified && <Icon5 name="verified" size={25} color="#F46F16" style={{ marginLeft: 4, marginTop: screenHeight * 0.015, }} />}
                  </View>
                  <Text style={[styles.textBelowNavbar1, isTablet && { fontSize: wp('2%'), }]}>
                    {setmsg ? 'Welcome' : 'Welcome Back'} {/* Conditional rendering */}
                  </Text>
                </View>


                <TouchableOpacity
                  style={{ flex: 1, padding: 10, borderRadius: 8, marginRight: 16, alignItems: 'center', justifyContent: 'center', height: 55 }}
                  onPress={() => navigation.navigate('LMSMainPage')}
                >
                  {/* <LinearGradient
                    colors={["#FBBB5C", "#E66A0E"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    useAngle={true}
                    angle={225}
                    style={styles.cardGradient}
                  >
                    <Text style={{ color: 'white', height: 20 }}>LMS</Text>
                  </LinearGradient> */}
                </TouchableOpacity>

              </View>

              {/* Streak Quiz integration */}
              {streakData && !streakData.attemptedToday && !quizDone && userId && (
                <StreakQuiz
                  onComplete={async () => {
                    setQuizDone(true);
                    // Refresh streak data after completion using context
                    await refreshStreakData();
                  }}
                  onSkip={() => setQuizDone(true)}
                  userId={userId}
                />
              )}

              <LMSCard
                botImage={require("../../assests/Images/backgrounds/LMSLogo.png")}
                handleRedirect3={() => navigation.navigate("LMSMainPage")}
                loading={false}
              />

              <ProfileCardsRow />
            </>
          )}

          {/* <ExploreSection /> */}
        </ScrollView>
      </View>
    </ImageBackground>

  );
}

// Wrap Dashboard with StreakProvider
const DashboardWithStreak: React.FC = () => {
  const { userId } = useAuth();
  return (
    <StreakProvider userId={userId}>
      <Dashboard />
    </StreakProvider>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    // paddingTop: screenHeight * 0.01, // 2% of screen height
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#0D0D0D',

  },
  skeletonText: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonCircle: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12.5,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: screenWidth * 0.05, // 5% of screen width
    backgroundColor: '#fff',
    height: screenHeight * 0.095, // 10% of screen height
  },

  logo1Image: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.04,
    resizeMode: 'contain',

    top: screenHeight * 0.01,
    alignSelf: 'flex-start', // Aligns the logo to the left
  },

  logoContainer: {
    flex: 1,
    width: screenWidth * 0.1, // 10% of screen width
    height: screenWidth * 0.1, // 10% of screen width
    paddingRight: screenWidth * 0.05, // Reduce padding-right to move image more to the left
    marginLeft: -screenWidth * 0.05, // Adjust left margin to move further left
  },

  profilePic: {
    width: screenWidth * 0.08, // Reduced to 8% of screen width
    height: screenWidth * 0.08, // Match height to width for a square shape
    borderRadius: (screenWidth * 0.08) / 2, // Make it circular
    position: 'absolute',

    right: screenWidth * 0.05, // Adjust to 5% from the right
    top: screenHeight * 0.04, // Adjust to 3% from the top
    backgroundColor: '#ccc', // Optional: placeholder background for testing

  },

  textBelowNavbar: {
    textAlign: 'left',
    fontSize: hp('2.5%'), // Fixed font size of 24px
    color: '#2F2F2F',

    marginLeft: wp('3%'),
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: screenHeight * 0.015,
  },
  tabletTextBelowNavBar: {
    fontSize: wp('4%'),
  },
  textBelowNavbar1: {
    textAlign: 'left',
    fontSize: hp('1.5%'), // Fixed font size of 14px
    color: '#2F2F2F',
    marginBottom: screenHeight * 0.01,
    marginLeft: wp('3%'),
    fontFamily: 'PlusJakartaSans-Regular',

  },

  cardContainer: {
    flex: 1,
    paddingHorizontal: wp('2.5%'),
    alignItems: 'stretch', // Center align items in the column

  },

  row: {
    flexDirection: 'row', // Align cards horizontally
    justifyContent: 'space-between', // Space between cards in a row

    marginBottom: screenHeight * 0.02, // Dynamic spacing between rows
  },

  card: {
    width: '100%',             // full width
    aspectRatio: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: hp('2%'),
    backgroundColor: '#fff',

  },
  cardTablet: {
    aspectRatio: 6,              // wider, flatter on tablets
    paddingVertical: hp('1.2%'), // a bit less vertical padding
    paddingHorizontal: wp('6%'), // a bit more horizontal breathing room
    marginBottom: hp('2%'),
  },

  cardLogoContainer: {
    width: wp('15%'),         // 12% of screen width
    height: wp('15%'),
    borderRadius: wp('15%') / 2, // Circular logo container
    backgroundColor: '#f0f0f0',
    justifyContent: 'center', // Center the logo inside its container
    alignItems: 'center', // Align logo in the center of the container

    marginBottom: hp('1%'), // Space between logo and text/number
  },
  tabletLogoContainer: {
    width: wp('12%'),         // 12% of screen width
    height: wp('12%'),
    borderRadius: wp('12%') / 2, // Circular logo container
    backgroundColor: '#f0f0f0',
    justifyContent: 'center', // Center the logo inside its container
    alignItems: 'center', // Align logo in the center of the container

    marginBottom: hp('1%'), // Space between logo and text/number
  },

  cardLogo: {
    width: '40%', // Logo size within its container
    height: '40%',
    resizeMode: 'contain',

  },

  cardContent: {
    flexDirection: 'column', // Stack text and number vertically
    alignItems: 'flex-start', // Align content to the left
    justifyContent: 'flex-start', // Align text and number to the top

    marginLeft: screenWidth * 0.03, // Space between logo and text
    flex: 1, // Ensure the content takes available space
  },

  cardText: {
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'left',

    gap: 10,
    color: '#909090',

  },
  tabletText: {
    fontSize: hp('2%'),
  }
  ,
  cardNumber: {
    fontSize: 24, // Scales number size with screen width
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    textAlign: 'left', // Align number to the left

  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    flex: 1, // Allows content to expand properly
  },
  textContainer: {
    alignItems: 'flex-start',

    marginLeft: 20, // Space between image and text
  },
  cardGradient: {
    flex: 1,
    height: 20,
    width: 100,
    padding: 10,
    borderRadius: 8,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
});
export default DashboardWithStreak;