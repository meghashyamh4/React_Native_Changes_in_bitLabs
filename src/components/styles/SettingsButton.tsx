



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@context/Authcontext';
import useGoogleSignIn from '@services/google/google';
import Icon from 'react-native-vector-icons/Feather';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import DeleteAccountModal from '../../screens/DeleteAccountModal';
import { FeedbackFormsService } from '@services/FeedbackFormsService';

type RootStackParamList = {
  ChangePassword: undefined;
  LandingPage: undefined;
  FeedbackFormsList: undefined;
};

const SettingsButton = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { logout, userId } = useAuth();
  const { signOut } = useGoogleSignIn();
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    checkFeedbackForms();
  }, [userId]);

  const checkFeedbackForms = async () => {
    console.log('SettingsButton: Checking feedback forms for userId:', userId);

    if (!userId) {
      console.log('SettingsButton: No userId found, skipping check');
      return;
    }

    try {
      // We only need to check if there is at least one active form
      // The service returns all forms, we filter for active ones
      const result = await FeedbackFormsService.getAllForms(Number(userId));

      console.log('SettingsButton: Feedback API result:', JSON.stringify(result, null, 2));

      if (result.success && Array.isArray(result.data)) {
        const hasActiveForms = result.data.some((form: any) => form.isActive);
        console.log("SettingsButton: hasActiveForms calculation:", hasActiveForms);
        setShowFeedback(hasActiveForms);
      } else {
        console.log('SettingsButton: Failed to fetch forms or invalid data format', result);
        setShowFeedback(false);
      }
    } catch (error) {
      console.error('SettingsButton: Error in checkFeedbackForms:', error);
      setShowFeedback(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
    setModalVisible(false);
  };

  const handleFeedbackPress = () => {
    navigation.navigate('FeedbackFormsList');
    setModalVisible(false);
  };

  const handleLogout = () => {
    logout();      // Clears session
    signOut();     // Google sign-out
    setModalVisible(false);
    navigation.navigate('LandingPage');  // Navigate directly
  };

  const handleDeletePress = () => {
    setModalVisible(false);
    setDeleteModalVisible(true);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => {
          checkFeedbackForms();
          setModalVisible(true);
        }}
        style={styles.cardButton}
        activeOpacity={0.8}
      >
        <Icon
          name="settings"
          size={isTablet ? wp('4.5%') : wp('6%')}
          color="#F97316"
          style={styles.icon}
        />
        <Text style={styles.cardText}>Settings</Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <View style={styles.modalCard}>
              {showFeedback && (
                <TouchableOpacity style={styles.optionButton} onPress={handleFeedbackPress}>
                  <Text style={styles.optionText}>Feedback Forms</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.optionButton} onPress={handleChangePassword}>
                <Text style={styles.optionText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={handleLogout}>
                <Text style={styles.optionText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={handleDeletePress}>
                <Text style={[styles.optionText, { color: '#E53935' }]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
};

export default SettingsButton;


const styles = StyleSheet.create({
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    flex: 1,
    gap: 8,
  },
  icon: {
    marginRight: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2f2f2f',
  },
});
