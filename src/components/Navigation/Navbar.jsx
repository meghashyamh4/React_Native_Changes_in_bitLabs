import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, Text, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@context/Authcontext';
import { useJobAlerts } from '@viewmodel/Alert/Notificationmodel';
import { useProfilePhoto } from '@context/ProfilePhotoContext';
import useGoogleSignIn from '@services/google/google';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BellsIcon from '../../assests/icons/BellsIcon';
import { FeedbackFormsService } from '@services/FeedbackFormsService';
import LinearGradient from 'react-native-linear-gradient';
import { useContext } from 'react';
import UserContext from '@context/UserContext';
import { deleteAccount } from '@services/Account/deleteAccount';
import { showToast } from '@services/login/ToastService';


const Navbar = () => {
  const TABLET_BREAKPOINT = 768;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  console.log('is this a tab: ', isTablet)
const { unseenCount, refreshJobAlerts, refreshUnseenCount } = useJobAlerts();
  const { photo } = useProfilePhoto();
  const { signOut } = useGoogleSignIn();
  const { userId, userToken, clearAllUserData, setIsAuthenticated, setAuthData, setLeadId } = useAuth();
  const { clearUserContext } = useContext(UserContext);
  const [showFeedback, setShowFeedback] = useState(false);
  // Safe area insets are now handled globally by SafeAreaWrapper in New.tsx

  useFocusEffect(
    useCallback(() => {
      refreshJobAlerts(); // Fetch when screen gains focus
      refreshUnseenCount();
    }, [])
  );

  useEffect(() => {
    refreshJobAlerts(); // Fetch on component mount
    checkFeedbackForms();
  }, [userId]);

  const checkFeedbackForms = async () => {
    if (!userId) return;
    try {
      const result = await FeedbackFormsService.getAllForms(Number(userId));
      if (result.success && Array.isArray(result.data)) {
        const hasActiveForms = result.data.some((form) => form.isActive);
        setShowFeedback(hasActiveForms);
      }
    } catch (error) {
      console.error('Navbar: Error in checkFeedbackForms:', error);
      setShowFeedback(false);
    }
  };

  const handleProfilePress = () => {
    checkFeedbackForms();
    setModalVisible(true);
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await clearAllUserData();
      clearUserContext();
      try {
        await signOut();
      } catch (e) {
        console.log('Google signout error:', e);
      }
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);
      refreshJobAlerts();
      setLogoutModalVisible(false);
      navigation.navigate('LandingPage');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      if (!userId) {
        console.error('User ID missing');
        return;
      }

      // 1. Delete the account via API
      await deleteAccount(userId);
      showToast('error', 'Account deleted successfully');

      // 2. Perform same cleanup as logout
      await confirmLogout();
      setDeleteModalVisible(false);

    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Failed to delete account');
    }
  };
  console.log('isTablet?', isTablet, screenWidth);



  return (
    <View style={[styles.navbar, { height: wp('15%') }]}>
      <View style={[styles.logoContainer]}>
        <Image source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }}
          style={[styles.logo1Image, isTablet && {
            width: wp('20%'),
            height: hp('8%'),
            marginLeft: 0,        // remove that left margin on tablets
          }]} />
      </View>
      <View style={styles.rightContainer}>
        {/* Feedback Button */}
        {showFeedback && (
          <TouchableOpacity
            onPress={() => navigation.navigate('FeedbackFormsList')}
            style={styles.feedbackBtnContainer}
          >
            <LinearGradient
              colors={['#FBBB5C', '#E66A0E']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.feedbackGradient}
            >
              <Text style={styles.feedbackBtnText}>Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Notification Bell */}
        <View style={styles.notificationContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <BellsIcon
              width={isTablet ? wp('5%') : wp('6%')}
              height={isTablet ? hp('4%') : hp('3%')}
            />
          </TouchableOpacity>
          {unseenCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{unseenCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={[
            styles.profilePicContainer,
            isTablet && { borderRadius: wp('8%') / 2 }
          ]}
        >
          <Image
            source={photo ? { uri: photo } : require('../../assests/profile/profile.png')}
            style={[styles.profilePic, isTablet && styles.profilePicTablet]}
            resizeMode="cover"
          />
        </TouchableOpacity>
        {/* Modal */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownCard}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    navigation.navigate('Profile');
                    setModalVisible(false);
                  }}>
                  <Text style={styles.dropdownText}>View Portfolio</Text>
                </TouchableOpacity>



                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    navigation.navigate('ChangePassword');
                    setModalVisible(false);
                  }}>
                  <Text style={styles.dropdownText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setModalVisible(false);
                    handleDeleteAccount();
                  }}>
                  <Text style={[styles.dropdownText, { color: '#E35D6A' }]}>Delete Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dropdownOption, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    handleLogout();
                    setModalVisible(false);
                    navigation.navigate('LandingPage');
                  }}>
                  <Text style={[styles.dropdownText, { color: '#E35D6A' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.confirmModalBackground}>
            <View style={styles.confirmModalContainer}>
              <Text style={styles.confirmModalTitle}>
                Are you sure you want to{'\n'}delete your account?
              </Text>
              <Text style={styles.confirmModalMessage}>
                This action is permanent and cannot be undone.
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(false)}
                  style={[styles.confirmModalButton, styles.confirmCancelButton]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#F46F16' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log("Account deletion confirmed");
                    confirmDeleteAccount();
                  }}
                  style={[styles.confirmModalButton]}
                >
                  <LinearGradient colors={['#F46F16', '#F8A44C']} style={styles.confirmGradientButton}>
                    <Text style={[styles.confirmButtonText, { color: '#FFF' }]}>Delete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={logoutModalVisible}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.confirmModalBackground}>
            <View style={styles.confirmModalContainer}>
              <Text style={styles.confirmModalTitle}>
                Are you sure you want to{'\n'}logout?
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  onPress={() => setLogoutModalVisible(false)}
                  style={[styles.confirmModalButton, styles.confirmCancelButton]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#F46F16' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmLogout}
                  style={[styles.confirmModalButton]}
                >
                  <LinearGradient colors={['#F46F16', '#F8A44C']} style={styles.confirmGradientButton}>
                    <Text style={[styles.confirmButtonText, { color: '#FFF' }]}>Logout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    borderRadius: 1,
    // borderWidth:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('1%'),
    // backgroundColor: '#fff',
    height: wp('15%'),
  },
  logo1Image: {
    width: wp('30%'),
    height: hp('9%'),
    marginLeft: wp('0.9%'),
    resizeMode: 'contain',

  },
  logo1ImageTablet: {
    width: wp('12%'),
    height: hp('4%'),
    resizeMode: 'contain',
  },
  logoContainer: {
    borderRadius: 1,
    // borderWidth:1,
    // paddingLeft:wp('0.5%')
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    position: 'relative',
    marginRight: 15, // Space between notification and profile picture
  },
  notification: {
    width: wp('20%'),
    height: wp('20%'),
    resizeMode: 'contain',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5, // Adjust position of the badge
    right: -5,
    backgroundColor: '#FFA726', // Orange color
    borderRadius: wp('4%') / 2, // Circular shape
    height: wp('4%'),
    width: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff', // Optional: Border to make it stand out
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profilePicContainer: {
    overflow: 'hidden',
    borderRadius: wp('11%') / 2, // Half of width/height for perfect circle
  },
  profilePic: {
    width: wp('10%'),
    height: wp('10%'), // Make height equal to width for perfect circle
    borderRadius: wp('10%') / 2, // Half of width/height for perfect circle
    backgroundColor: '#ccc',
  },
  profilePicTablet: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('8%') / 2, // Already round
  },
  modalView5: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard5: {
    width: '95%',
    marginHorizontal: '5%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 3,
    paddingLeft: 5,
  },
  modalCard6: {
    width: '95%',
    marginHorizontal: '5%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 3,
    marginBottom: 10,
    paddingLeft: 5,
  },
  customButton: {
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
  },
  customButton1: {
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    borderColor: '#ccc',
    justifyContent: 'center',
  },
  modalButton7: {
    width: '100%',
    fontSize: 18,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  modalButtonText7: {
    color: '#E35D6A', // Text color for the Cancel button
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium', // Set font to Jakarta Sans
  },

  buttonText1: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium', // Set font to Jakarta Sans
    color: '#2f2f2f',
  },
  buttonText: {
    color: 'black',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: hp('7.5%'), // Adjusted based on navbar height
    right: wp('2%'),
    width: wp('45%'),
  },
  dropdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2f2f2f',
  },
  feedbackBtnContainer: {
    marginRight: 10,
  },
  feedbackGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  feedbackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  // Confirmation Modal Styles (Logout/Delete Theme)
  confirmModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmModalContainer: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 26,
    textAlign: 'center',
    color: '#0D0D0D',
  },
  confirmModalMessage: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmCancelButton: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#F46F16',
    borderWidth: 1,
    paddingVertical: 10,
  },
  confirmGradientButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    paddingVertical: 10,
  },
  confirmButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
  },
});

export default Navbar;
