import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@context/Authcontext';
import { useNavigation } from '@react-navigation/native';
import Navbar from '@components/styles/Head';
import ActionButtons from '@components/styles/ActionButton';
import { useChangePasswordViewModel } from '@viewmodel/ChangePasswordViewModel';

const ChangePasswordScreen = () => {
  const { userToken, userId } = useAuth();
  const navigation = useNavigation();
  const {
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    reEnterPassword,
    setReEnterPassword,
    message,
    oldMessage,
    newMessage,
    reEnterMessage,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showReEnterPassword,
    setShowReEnterPassword,
    handleFocus,
    validatePassword,
    handleChangePassword,
  } = useChangePasswordViewModel(userToken ?? '', userId?.toString() ?? '');

  const handleBackButton = (): void => {
    navigation.goBack();
  };

  const handleKeyboardDismiss = () => {
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowReEnterPassword(false); // Hide all password fields when dismissing the keyboard
    Keyboard.dismiss();
  };

  // Wrapper function to handle password change and navigation
  const handleSavePassword = async () => {
    const success = await handleChangePassword();
    if (success) {
      // Navigate back to BottomTab after successful password change
      // Add delay to allow success toast to be visible
      setTimeout(() => {
        navigation.navigate('BottomTab' as never);
      }, 1500);
    }
  };

  const renderPasswordField = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    field: 'old' | 'new' | 'reEnter',
    placeholder: string,
    showPassword: boolean,
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>,
  ) => (



    <View style={styles.inputContainer}>
      {/* for required field  CHANGED HERE 3 LINES */}
      {/* <View style={{display: 'flex',flexDirection: 'row',  justifyContent: 'flex-end'}}>
            <Text style={{ color: 'red', marginTop  : 0,marginBottom: -15,  marginRight: 30  }}>*</Text>
        </View> */}
      <TextInput
        style={styles.input}
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={text => {
          setValue(text);
          validatePassword(text, field); // Add validation here
        }}
        onFocus={() => handleFocus(field)}
        placeholder={placeholder}
        placeholderTextColor="#A9A9A9"
      />


      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
        <Image
          source={
            !showPassword
              ? require('../../assests/LandingPage/closedeye.png')
              : require('../../assests/LandingPage/openeye.png')
          }
          style={styles.eyeImage}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>                            
    {/* changed */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, paddingBottom:15}}>

        <View style={styles.container}>


          <Navbar title="Change Password" onBackPress={() => navigation.goBack()} />



          {renderPasswordField(
            oldPassword,
            setOldPassword,
            'old',
            // changed
            'Old Password *',

            showOldPassword,
            setShowOldPassword,
          )}
          {oldMessage ? (
            <Text
              style={[
                styles.message,
                oldMessage === 'Password changed successfully'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              {oldMessage}
            </Text>
          ) : null}


          {renderPasswordField(
            newPassword,
            setNewPassword,
            'new',
            // changed
            'New Password *',

            showNewPassword,
            setShowNewPassword,
          )}
          {newMessage ? (
            <Text
              style={[
                styles.message,
                newMessage === 'Password changed successfully'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              {newMessage}
            </Text>
          ) : null}

          {renderPasswordField(
            reEnterPassword,
            setReEnterPassword,
            'reEnter',
            // changed
            'Confirm Password *',

            showReEnterPassword,
            setShowReEnterPassword,
          )}
          {reEnterMessage ? (
            <Text
              style={[
                styles.message,
                reEnterMessage === 'Password changed successfully'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              {reEnterMessage}
            </Text>
          ) : null}

          {message ? (
            <Text
              style={[
                styles.message,
                message === 'Password changed successfully'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              {message}
            </Text>
          ) : null}

          <ActionButtons
            onPressAction={handleSavePassword}
            actionTitle="Save"
            onPressBack={handleBackButton} // Since the back button is needed here
          />

        </View>

      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 2,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginTop: 20,
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'left', // Align text to the left
    fontFamily: 'JakartaSans-Bold', // Assuming you have Jakarta Sans Bold
    color: '#000',
    fontWeight: 'bold',
  },
  labelContainer: {
    marginVertical: 10,
  },
  label: {
    marginBottom: 5,
    color: '#000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    height: 52,
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 15,
    margin: 15,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  eyeIcon: {
    padding: 5,
  },
  eyeImage: {
    width: 20,
    height: 20,
  },
  message: {
    color: 'red',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
  },
  successMessage: {
    color: 'green',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
  },
  errorMessage: {
    color: 'red',
    fontFamily: 'PlusJakartaSans-Medium',
    paddingLeft: 20,
    paddingRight: 20,
    textAlign: 'justify',
    marginTop: -6,
    fontSize: 12,
  },

  button: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderColor: '#F97316',
  },

  headerImage: {
    width: 20, // Adjust size as needed
    height: 20,
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
  },
});

export default ChangePasswordScreen;
