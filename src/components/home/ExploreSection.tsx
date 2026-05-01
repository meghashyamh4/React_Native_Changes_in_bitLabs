import React, {useContext} from 'react';
import {View, Text, Image, ScrollView, StyleSheet, Dimensions, Linking, useWindowDimensions} from 'react-native';
import GradientButton from '../styles/GradientButton';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '@models/Model';
import UserContext from '../../context/UserContext';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Badges'>;

const ExploreSection = () => {
   const TABLET_BREAKPOINT = 768;
     const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const {verifiedStatus} = useContext(UserContext);
  const navigation = useNavigation<NavigationProp>();

  return (
    <View>
      <Text style={[styles.textBelowCard, isTablet && { fontSize: wp('4%')}]}>Explore</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}>
        {/* Second Section - Larger Cards */}
        {/* <View style={styles.largeCard}>
          <Text style={styles.cardTitle}>
            Build your professional{"\n"}
            {"        "}resume for free
          </Text>
          <Image
            source={{ uri: "https://d1sq67t1c2pewz.cloudfront.net/static/media/Resume.ec41b4fde8cfb61ed302.png" }}
            style={styles.cardImage}
          />
          <GradientButton
            title="Create Now"
            onPress={() => navigation.navigate('ResumeBuilder')}
            style={styles.cardButton}
           
          />
        </View> */}
        {!verifiedStatus && (
          <View style={[styles.largeCard ,isTablet && styles.tabletCard ]}>
            <View
              style={{
                borderColor: 'red',
                borderRadius: 10,
                borderWidth: 1.5,
                paddingHorizontal: 5,
                paddingVertical: 2,
                alignSelf: 'flex-end',
                marginBottom:2
              }}>
              <Text style={{fontFamily: 'PlusJakartaSans-Medium', color: 'red', fontSize: 12 }}>
                New
              </Text>
            </View>
            <Text style={[styles.cardTitle , isTablet && {fontSize: wp('3%')}]}>Earn Pre-Screened Badge</Text>
            <Image
              source={require("../../assests/Images/boyimage.png")}
              style={styles.cardImage}
            />

            <GradientButton
              title="Take Test"
              onPress={() => navigation.navigate('Badges')}
              style={[styles.cardButton, isTablet ? {width: wp('50%')}:{}]}
            />
          </View>
        )}

        <View style={[styles.largeCard, styles.lastCard, isTablet&& styles.tabletCard]}>
          <Text style={[styles.cardTitle ,isTablet && {fontSize: wp('3%')}]}>
            Get Certified on Advanced Technologies
          </Text>
          <Image
            source={require('../../assests/Images/Certificate.png')}
            style={styles.cardImage}
          />
          <GradientButton
            title="Start Learning"
            onPress={() => Linking.openURL('https://upskill.bitlabs.in/login/index.php')}
            style={[styles.cardButton, isTablet ? {width: wp('50%')} : {}]}
          />
        </View>
          {/*  Tech Buzz Shorts Card */}
        <View style={[styles.largeCard, isTablet && styles.tabletCard]}>
          <Text style={[styles.cardTitle, isTablet && { fontSize: wp('3%') }]}>
            Tech Buzz Shorts
          </Text>
          <Image
            source={require('../../assests/Images/MentorConnectLogo.png')} // 👈 Add an image to your assets
            style={styles.cardImage}
          />
         
          <GradientButton
            title="Watch Now"
            onPress={() => navigation.navigate('VerifiedVideosScreen')} // 👈 Navigate to videos
            style={[styles.cardButton, isTablet ? { width: wp('50%') } : {}]}
          />
        </View>
         <View
  style={[styles.largeCard, styles.lastCard, isTablet && styles.tabletCard]}
>
  <Text style={[styles.cardTitle, isTablet && { fontSize: wp('3%') }]}>
    Participate in Innovation Arena
  </Text>
  <Image
    source={require('../../assests/Images/HackathonLogo.png')} // add hackathon image in assets
    style={styles.cardImage}
  />
  <GradientButton
    title="Join Innovation Arena"
    onPress={() => navigation.navigate('BottomTab' as any, { screen: 'Hackathon' } as any)} // 👈 Navigates to Arena tab with bottom nav
    style={[styles.cardButton, isTablet ? { width: wp('50%') } : {}]}
  />
</View>

<View style={[styles.largeCard, isTablet && styles.tabletCard]}>
  <Text style={[styles.cardTitle, isTablet && { fontSize: wp('3%') }]}>
    Connect with Mentors
  </Text>
  <Image
    source={require('../../assests/Images/MentorConnectLogo.png')} // add mentor connect image in assets
    style={styles.cardImage}
  />
  <GradientButton
    title="Connect Now"
    onPress={() => navigation.navigate('BottomTab' as any, { screen: 'Mentor Sphere' } as any)} 
    style={[styles.cardButton, isTablet ? { width: wp('50%') } : {}]}
  />
</View>

<View style={[styles.largeCard, isTablet && styles.tabletCard]}>
  <Text style={[styles.cardTitle, isTablet && { fontSize: wp('3%') }]}>
    Interview Preparation
  </Text>
  <Image
    source={require('../../assests/Images/HackathonLogo.png')} // add mentor connect image in assets
    style={styles.cardImage}
  />
  <GradientButton
    title="Ask Now"
    onPress={() => navigation.navigate("InterviewPreparation")} 
    style={[styles.cardButton, isTablet ? { width: wp('50%') } : {}]}
  />
</View>
  
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  textBelowCard: {
    textAlign: 'left',
    fontSize: hp('2.5%'),
    color: '#000000',
    marginBottom: hp('2%'),
    marginLeft: wp('3%'),
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: hp('2%'),
  },
  scrollContainer: {
    width: '100%',
    paddingHorizontal: screenWidth * 0.05,
  },
  largeCard: {
    backgroundColor: '#FFFFFF',
    padding: wp('1%'),
    marginRight: wp('3%'),
    borderRadius: wp('4%'),
    fontFamily: 'PlusJakartaSans-Bold',
    width: wp('70%'),
    // alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: hp('34%'),
  },
  tabletCard:{
    width: wp('50%'),
    height: hp('40%'),
  },
  cardImage: {
    width: '85%',
    height: hp('15%'),
    borderRadius: screenWidth * 0.02,
    marginBottom: screenHeight * 0.08,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: hp('2%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000000',
    marginBottom: hp('1%'),
    marginTop:hp('1%'),
    width:'100%'
  },
  cardButton: {
    marginTop: screenHeight * 0.02,
    paddingVertical: screenHeight * 0.015,
    backgroundColor: '#fa9020',
    width: wp('70%'),
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    borderBottomLeftRadius: screenWidth * 0.03,
    borderBottomRightRadius: screenWidth * 0.025,
    height: screenHeight * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  lastCard: {
    marginRight: screenWidth * 0.09,
  },
  touchableContainer: {
    position: 'absolute', // Ensure the TouchableOpacity is positioned absolutely within the card
    bottom: 0, // Position it at the bottom of the card
    left: 0, // Align it to the left edge
    right: 0, // Align it to the right edge
    width: screenWidth * 0.7, // Match the width of the card
    height: screenHeight * 0.075, // Same height as the button
  },
});

export default ExploreSection;
