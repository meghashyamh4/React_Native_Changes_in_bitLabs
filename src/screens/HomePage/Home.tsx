// import React, {useState, useEffect, useContext, useCallback} from 'react';
// import Navbar from '@components/Navigation/Navbar';
// import NetInfo from '@react-native-community/netinfo';
// import ExploreSection from "@components/home/ExploreSection"; // Hook for fetching job counts
// import { useAuth } from '@context/Authcontext';
// import { RootStackParamList } from '@models/Model';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { useMessageContext, } from '../../context/welcome';
// import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native'; // Updated imports
// import Icon5 from 'react-native-vector-icons/MaterialIcons'
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import UserContext from '@context/UserContext';
// import {
//   View,
//   Image,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   ScrollView,
//   Dimensions,
//   useWindowDimensions,
// } from 'react-native';


// import LinearGradient from 'react-native-linear-gradient';
// import { useProfilePhoto } from '@context/ProfilePhotoContext';
// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// // const baseScale = screenWidth < screenHeight ? screenWidth : screenHeight;

// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Jobs'>;

// type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;


// function Dashboard() {
//   const TABLET_BREAKPOINT = 768;
//    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
//   const isTablet = screenWidth >= TABLET_BREAKPOINT;
//   console.log(isTablet ," is this a tablet ")
//   const {refreshJobCounts , refreshPersonalName , refreshVerifiedStatus} = useContext(UserContext)
//   const {isAuthenticated} = useAuth();
//   const {resetPhoto} = useProfilePhoto();
//   const [isConnected, setIsConnected] = useState<boolean | null>(true);
//   const [verified, setVerified] = useState(false)
//   const [loading,setIsLoading] = useState(false);

//   const { verifiedStatus, personalName, isLoading , jobCounts } = useContext(UserContext);
//   const route = useRoute<HomeScreenRouteProp>(); // Handle route params
// const [hasFetched, setHasFetched] = useState(false);

// useFocusEffect(
//   useCallback(() => {
//     if (!hasFetched && isAuthenticated) {
//       refetchData().then(() => setHasFetched(true));
//     }
//   }, [isAuthenticated, hasFetched])
// );


//   useEffect(()=>{
//     const unsubscribe = NetInfo.addEventListener((state)=>{
//       if(state.isConnected && !isConnected){
//         // Internet is back online, refetch data

//         refetchData();
//       }

//       setIsConnected(state.isConnected)
//     })
//     return () => {
//       unsubscribe();
//     }

//   },[isConnected])

//   useEffect(() => {
//     if (!isAuthenticated) {
//       resetPhoto(); // This resets the profile photo state
//     }
//   }, [isAuthenticated]);

//   useEffect(() => {
//     refetchData(); // Fetch on initial mount
//   }, []); // Empty dependency: runs once on mount

//   useEffect(() => {
//     if (isAuthenticated) {
//       refetchData(); // Refetch whenever auth status changes (e.g., post-signup)
//     }
//   }, [isAuthenticated]);


//   const refetchData = async ()=>{
//     refreshJobCounts();
//     refreshPersonalName();
//     refreshVerifiedStatus();
//   }

//   // Use the useJobCounts hook to fetch job counts

//   const { setmsg } = useMessageContext();

//   const navigation = useNavigation<NavigationProp>();

//   useEffect(() => {
//     setVerified(verifiedStatus);
//   }, [verifiedStatus]);
//   // Handle loading state
//  if (loading || isLoading) {
//   return (
//     <View style={styles.loadingContainer}>
//  <ActivityIndicator size="large" color="#F46F16" style={{flex:1,justifyContent:'center',alignItems:'center'}} />
//        <Text style={{ color: '#0D0D0D', fontFamily: 'PlusJakartaSans-Bold' }}>
//         Loading job data...
//       </Text>
//     </View>
//   );
// }


//   return (
//     <View style={styles.container}>
//       <Navbar />
//       <ScrollView
//         contentContainerStyle={{paddingBottom: screenHeight * 0.04}} // Add bottom padding
//       >
//         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//           <Text style={[styles.textBelowNavbar , isTablet && styles.tabletTextBelowNavBar]}>Hello, {personalName
//             ? personalName.charAt(0).toUpperCase() + personalName.slice(1)
//             : 'Guest'}
//           </Text>
//           {verified && <Icon5 name="verified" size={25} color="#F46F16" style={{ marginLeft: 4, marginTop: screenHeight * 0.025, }} />}
//         </View>
//         <Text style={[styles.textBelowNavbar1 , isTablet && { fontSize: wp('2%'), }]}>
//           {setmsg ? 'Welcome' : 'Welcome back'} {/* Conditional rendering */}
//         </Text>


//         <View style={styles.cardContainer}>
//           <TouchableOpacity
//             onPress={() => navigation.navigate('Jobs', { tab: 'recommended' })}
//           >
//             <LinearGradient
//               colors={['#E6F5FF', '#E1EEFF']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }} // 90-degree (horizontal) gradient
//               style={[styles.card, isTablet && styles.cardTablet,   {borderColor:'#B5DAFF',borderWidth:1}]}
//             >
//               {/* Row container for Image and Text */}
//               <View style={styles.rowContainer}>
//                 {/* Image */}
//                 <View style={[styles.cardLogoContainer,isTablet&& styles.tabletLogoContainer, { backgroundColor: '#D3EDFE' }]}>
//                   <Image
//                     source={require('../../assests/Images/Recommendedjobs.png')}

//                     style={styles.cardLogo}
//                   />
//                 </View>

//                 {/* Column container for Texts */}
//                 <View style={styles.textContainer}>
//                   <Text style={[styles.cardText , isTablet && styles.tabletText]}>
//                     Recommended Jobs
//                   </Text>
//                   <Text style={styles.cardNumber}>{jobCounts?.recommendedJobs ?? '0'}</Text>
//                 </View>
//               </View>
//             </LinearGradient>
//           </TouchableOpacity>


//           <TouchableOpacity
//             onPress={() => navigation.navigate('Jobs', { tab: 'saved' })}
//           >
//             <LinearGradient
//               colors={['#FFF9EE', '#FFECE7']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }} // 90-degree (horizontal) gradient
//               style={[styles.card, isTablet && styles.cardTablet,   {borderColor:'#FECBB6',borderWidth:1}]}
//             >

//               <View style={styles.rowContainer}>
//                 <View style={[styles.cardLogoContainer,isTablet&& styles.tabletLogoContainer, { backgroundColor: '#FFF3E0' }]}>
//                   <Image
//                     source={require('../../assests/Images/Savedjobs.png')}

//                     style={styles.cardLogo}
//                   />
//                 </View>

//                 <View style={styles.textContainer}>
//                   <Text style={[styles.cardText, { color: '#F08F6E' }, isTablet && styles.tabletText]}>Saved Jobs</Text>
//                   <Text style={styles.cardNumber}>{jobCounts?.savedJobs ?? '0'}</Text>
//                 </View>
//               </View>
//             </LinearGradient>
//           </TouchableOpacity>


//           <TouchableOpacity
//             onPress={() => navigation.navigate('Jobs', { tab: 'applied' })}
//           >
//             <LinearGradient
//               colors={['#F7FFED', '#E4FFED']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }} // 90-degree (horizontal) gradient
//               style={[styles.card, isTablet && styles.cardTablet,   {borderColor:'#A6D995',borderWidth:1}]}
//             >
//               <View style={[styles.rowContainer,]}>
//                 <View style={[styles.cardLogoContainer, isTablet&& styles.tabletLogoContainer,{ backgroundColor: '#EEF9D5' }]}>
//                   <Image
//                     source={require('../../assests/Images/Apply.png')}

//                     style={styles.cardLogo}
//                   />
//                 </View>

//                 <View style={styles.textContainer}>
//                   <Text style={[styles.cardText, { color: '#228950' }, isTablet && styles.tabletText]}>Applied Jobs</Text>
//                   <Text style={styles.cardNumber}>{jobCounts?.appliedJobs ?? '0'}</Text>
//                 </View>
//               </View>
//             </LinearGradient>
//           </TouchableOpacity>

//         </View>
//         <ExploreSection />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     // paddingTop: screenHeight * 0.01, // 2% of screen height
//     backgroundColor: '#f8f9fa',
//   },

//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     color: '#0D0D0D',

//   },
//   navbar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: screenWidth * 0.05, // 5% of screen width
//     backgroundColor: '#fff',
//     height: screenHeight * 0.095, // 10% of screen height
//   },

//   logo1Image: {
//     width: screenWidth * 0.4,
//     height: screenHeight * 0.04,
//     resizeMode: 'contain',

//     top: screenHeight * 0.01,
//     alignSelf: 'flex-start', // Aligns the logo to the left
//   },

//   logoContainer: {
//     flex: 1,
//     width: screenWidth * 0.1, // 10% of screen width
//     height: screenWidth * 0.1, // 10% of screen width
//     paddingRight: screenWidth * 0.05, // Reduce padding-right to move image more to the left
//     marginLeft: -screenWidth * 0.05, // Adjust left margin to move further left
//   },

//   profilePic: {
//     width: screenWidth * 0.08, // Reduced to 8% of screen width
//     height: screenWidth * 0.08, // Match height to width for a square shape
//     borderRadius: (screenWidth * 0.08) / 2, // Make it circular
//     position: 'absolute',

//     right: screenWidth * 0.05, // Adjust to 5% from the right
//     top: screenHeight * 0.04, // Adjust to 3% from the top
//     backgroundColor: '#ccc', // Optional: placeholder background for testing

//   },

//   textBelowNavbar: {
//     textAlign: 'left',
//     fontSize: hp('2.5%'), // Fixed font size of 24px
//     color: '#2F2F2F',

//     marginLeft: wp('3%'),
//     fontFamily: 'PlusJakartaSans-Bold',
//     marginTop: screenHeight * 0.025,
//   },
//   tabletTextBelowNavBar:{
//     fontSize: wp('4%'), 
//   },
//   textBelowNavbar1: {
//     textAlign: 'left',
//     fontSize: hp('1.5%'), // Fixed font size of 14px
//     color: '#2F2F2F',
//     marginBottom: screenHeight * 0.01,
//     marginLeft: wp('3%'),
//     fontFamily: 'PlusJakartaSans-Regular',

//   },

//   cardContainer: {
//     flex: 1,
//      paddingHorizontal: wp('2.5%'),
//     alignItems: 'stretch', // Center align items in the column

//   },

//   row: {
//     flexDirection: 'row', // Align cards horizontally
//     justifyContent: 'space-between', // Space between cards in a row

//     marginBottom: screenHeight * 0.02, // Dynamic spacing between rows
//   },

//   card: {
//     width: '100%',             // full width
//     aspectRatio:4,  
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: hp('1.5%'), 
//     paddingVertical: hp('2%'),
//     paddingHorizontal: wp('4%'),
//     borderRadius: hp('2%'),
//     backgroundColor: '#fff',

//   },
//     cardTablet: {
//     aspectRatio: 6,              // wider, flatter on tablets
//     paddingVertical: hp('1.2%'), // a bit less vertical padding
//     paddingHorizontal: wp('6%'), // a bit more horizontal breathing room
//     marginBottom: hp('2%'),
//   },

//   cardLogoContainer: {
//     width: wp('15%'),         // 12% of screen width
//     height:wp('15%'),
//     borderRadius: wp('15%')/2, // Circular logo container
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center', // Center the logo inside its container
//     alignItems: 'center', // Align logo in the center of the container

//     marginBottom: hp('1%'), // Space between logo and text/number
//   },
//   tabletLogoContainer:{
//     width: wp('12%'),         // 12% of screen width
//     height:wp('12%'),
//     borderRadius: wp('12%')/2, // Circular logo container
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center', // Center the logo inside its container
//     alignItems: 'center', // Align logo in the center of the container

//     marginBottom: hp('1%'), // Space between logo and text/number
//   },

//   cardLogo: {
//     width: '40%', // Logo size within its container
//     height: '40%',
//     resizeMode: 'contain',

//   },

//   cardContent: {
//     flexDirection: 'column', // Stack text and number vertically
//     alignItems: 'flex-start', // Align content to the left
//     justifyContent: 'flex-start', // Align text and number to the top

//     marginLeft: screenWidth * 0.03, // Space between logo and text
//     flex: 1, // Ensure the content takes available space
//   },

//   cardText: {
//     fontSize: hp('1.5%'),
//     fontFamily: 'PlusJakartaSans-Bold',
//     textAlign: 'left',

//     gap: 10,
//     color: '#909090',

//   },
//   tabletText:{
//     fontSize: hp('2%'),
//   }
//  ,
//   cardNumber: {
//     fontSize: 24, // Scales number size with screen width
//     fontFamily: 'PlusJakartaSans-Bold',
//     color: '#000',
//     textAlign: 'left', // Align number to the left

//   },
//   rowContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',

//     flex: 1, // Allows content to expand properly
//   },
//   textContainer: {
//     alignItems: 'flex-start',

//     marginLeft: 20, // Space between image and text
//   },
// });
// export default Dashboard;







import React, { useState, useEffect, useContext, useCallback } from 'react';
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

import { AskNewtonCard } from './AskNewton';
import ProfileCardsRow from './ProfileCardsRow';
import LinearGradient from 'react-native-linear-gradient';
import { useProfilePhoto } from '@context/ProfilePhotoContext';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { fetchStreakDetails, StreakDetails } from '@services/streak/StreakService';
import { StreakQuiz } from './StreakQuiz';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// const baseScale = screenWidth < screenHeight ? screenWidth : screenHeight;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Jobs'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;


function Dashboard() {
  const TABLET_BREAKPOINT = 768;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  console.log(isTablet, " is this a tablet ")
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
  const [streakData, setStreakData] = useState<StreakDetails | null>(null);
  const [quizDone, setQuizDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        // Always refresh data when screen comes into focus to get latest updates
        refetchData();
        if (!hasFetched) {
          setHasFetched(true);
        }
      }
    }, [isAuthenticated, hasFetched])
  );


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !isConnected) {
        // Internet is back online, refetch data

        refetchData();
      }

      setIsConnected(state.isConnected)
    })
    return () => {
      unsubscribe();
    }

  }, [isConnected])

  useEffect(() => {
    if (!isAuthenticated) {
      resetPhoto(); // This resets the profile photo state
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetchData(); // Fetch on initial mount
  }, []); // Empty dependency: runs once on mount

  // Show skeleton for 0.5 seconds on initial load
  useEffect(() => {
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500); // 0.5 seconds

    return () => clearTimeout(skeletonTimer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetchData(); // Refetch whenever auth status changes (e.g., post-signup)
    }
  }, [isAuthenticated]);


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

  const refetchData = async () => {
    refreshJobCounts();
    refreshVerifiedStatus();
    await fetchUserName();
    if (userId) {
      try {
        const data = await fetchStreakDetails(userId);
        console.log("Home component - Streak Details Success:", data);
        setStreakData(data);
      } catch (err) {
        console.error('Error fetching streak details in Home:', err);
      }
    }
    if (refreshScore) {
      await refreshScore();
    }
  }

  // Use the useJobCounts hook to fetch job counts

  const { setmsg } = useMessageContext();

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    setVerified(verifiedStatus);
  }, [verifiedStatus]);
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
            <View style={{ display: 'flex', flexDirection: 'row', gap: 34,  alignItems: 'center', }}>
                <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.textBelowNavbar, isTablet && styles.tabletTextBelowNavBar]}>Hello, {userName
                          ? userName.charAt(0).toUpperCase() + userName.slice(1)
                          : 'Guest'}
                        </Text>
                        {verified && <Icon5 name="verified" size={25} color="#F46F16" style={{ marginLeft: 4, marginTop: screenHeight * 0.015, }} />}
                      </View>
                      <Text style={[styles.textBelowNavbar1, isTablet && { fontSize: wp('2%'), }]}>
                        {setmsg ? 'Welcome' : 'Welcome back'} {/* Conditional rendering */}
                      </Text>
                  </View>

                   
                  <TouchableOpacity 
                    style={{ flex: 1 ,padding: 10, borderRadius: 8, marginRight: 16,alignItems:'center',justifyContent:'center',height:55}}
                    onPress={() => navigation.navigate('LMSMainPage')}
                  >
                    <LinearGradient
                          colors={["#FBBB5C", "#E66A0E"]}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          useAngle={true}
                          angle={225}
                          style={styles.cardGradient}
                        >
                    <Text style={{ color: 'white' ,height:20}}>LMS</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
              </View>

              {/* Streak Quiz integration */}
              {/* {streakData && !streakData.attemptedToday && !quizDone && (
                <StreakQuiz
                  onComplete={() => setQuizDone(true)}
                  onSkip={() => setQuizDone(true)}
                />
              )} */}

              <AskNewtonCard
                botImage={require("../../assests/Images/Asknewton/robo.png")}
                handleRedirect3={() => navigation.navigate("InterviewPreparation")}
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
    alignItems:'center',
    justifyContent:'center'
  },
});
export default Dashboard;