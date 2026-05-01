import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@models/Model';
import Navbar from '@components/styles/Head';
import ActionButtons from '@components/styles/ActionButton';
import { useForgotPasswordViewModal } from '@viewmodel/ForgotPasswordViewModal';
const ForgotPassword = () => {
  const {
    email,
    setEmail,
    errors,
    otp,
    setOtp,
    otpReceived,
    isOtpExpired,
    timer,
    isOtpValid,
    isOtpVerified,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    sendOTP,
    verifyOTP,
    resetUserPassword,
    isPasswordVisible,
    setIsPasswordVisible,
    isResetPasswordVisible,
    setIsResetPasswordVisible,
  } = useForgotPasswordViewModal();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}    style={{ flex: 1, paddingBottom:25 }} >
      <ScrollView
    contentContainerStyle={{ flexGrow: 1 }}
  >
      <View style={styles.container}>
        <Navbar title="Forgot Password" onBackPress={() => navigation.navigate('LandingPage')} />
          <View style={{display: 'flex',flexDirection: 'row',  justifyContent: 'flex-end'}}>
                <Text style={{ color: 'red', marginTop  : 10,  marginRight: 30  }}>*</Text>
          </View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B1B1B1"
          value={email}
          onChangeText={setEmail}
          editable={!isOtpVerified}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        {otpReceived ? (
          isOtpVerified ? (
            <View style={styles.form}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="New Password"
                  placeholderTextColor="#B1B1B1"
                  style={styles.passwordInput}
                  secureTextEntry={!isPasswordVisible}
                  onBlur={() => {
                    setIsPasswordVisible(false);
                  }}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Image
                    source={
                      isPasswordVisible
                        ? require('../../assests/LandingPage/openeye.png')
                        : require('../../assests/LandingPage/closedeye.png')
                    }
                    style={styles.eyeImage}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#B1B1B1"
                  style={styles.passwordInput}
                  secureTextEntry={!isResetPasswordVisible}
                  value={confirmPassword}
                  onBlur={() => {
                    setIsResetPasswordVisible(false);
                  }}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  onPress={() => setIsResetPasswordVisible(!isResetPasswordVisible)}>
                  <Image
                    source={
                      isResetPasswordVisible
                        ? require('../../assests/LandingPage/openeye.png')
                        : require('../../assests/LandingPage/closedeye.png')
                    }
                    style={styles.eyeImage}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor="#B1B1B1"
                value={otp}
                onChangeText={setOtp}
              />
              {!isOtpValid && <Text style={styles.errorText}>Invalid OTP</Text>}
              <View style={styles.otpContainer}>
                {isOtpExpired && (
                  <TouchableOpacity onPress={sendOTP}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
              {otpReceived && !isOtpExpired && (
                <Text style={styles.timerText}>Please verify OTP within {timer} seconds</Text>
              )}
            </View>
          )
        ) : null}
        <ActionButtons
          onPressAction={otpReceived ? (isOtpVerified ? resetUserPassword : verifyOTP) : sendOTP}
          actionTitle={otpReceived ? (isOtpVerified ? 'Save' : 'Verify OTP') : 'Send OTP'}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 2,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#D3D3D3',
    width: '100%',
    marginTop: 8,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    left: 15,
  },
  navbar: {
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#FFF',
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#495057',
    lineHeight: 25,
    marginLeft: 50,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: '95%',
    alignSelf: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'black',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',

    fontFamily: 'PlusJakartaSans-Medium',

    fontSize: 12,
  },
  otpContainer: {
    top: -4,
    alignItems: 'flex-end',
    marginVertical: 10,
    width: '95%',
  },
  timerText: {
    color: 'red',
    alignSelf: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  resendText: {
    color: '#74A2FA',
    fontFamily: 'PlusJakartaSans-Bold',
  },

  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    width: '50%', // Add consistent spacing
  },

  form: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: '95%',
    alignSelf: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 40,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  eyeImage: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },
});

export default ForgotPassword;
