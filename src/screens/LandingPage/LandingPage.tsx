import React, { useState, useEffect, useContext } from 'react';

import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '@context/Authcontext';
import { useLoginViewModel, useSignupViewModel } from '@viewmodel/Authviewmodel';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@models/Model';
import useGoogleSignIn from '@services/google/google';
import GradientButton from '@components/styles/GradientButton';

const { height } = Dimensions.get('window');

const LandingPage = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    loginUserName,
    setLoginUserName,
    loginPassword,
    setLoginPassword,
    loginErrors,
    loginMessage,
    validateAndLogin,
    setLoginErrors,
  } = useLoginViewModel();

  const {
    signupName,
    setSignupName,
    signupEmail,
    setSignupEmail,
    signupNumber,
    setSignupNumber,
    signupPassword,
    setSignupPassword,
    signUpErrors,
    otp,
    setOtp,
    otpReceived,
    registration,
    isOtpExpired,
    timer,
    isOtpValid,
    validateAndSignup,
    handleOtp,
    validateSignup,
    setSignUpErrors,
    setOtpReceived,
  } = useSignupViewModel();

  const { signIn } = useGoogleSignIn();

  // After registration, switch to login tab (don't auto-login)
  useEffect(() => {
    if (registration) {
      // Switch to login tab so user can login manually
      setActiveButton('login');
      // Clear signup form
      setSignupEmail('');
      setSignupName('');
      setSignupNumber('');
      setSignupPassword('');
      setOtp('');
      setOtpReceived(false);
    }
  }, [registration]);

  const [activeButton, setActiveButton] = useState('login');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSignupPasswordVisible, SetIsSignupPasswordVisible] = useState(false);

  const handleChange = (field: 'name' | 'email' | 'whatsappnumber' | 'password', text: string) => {
    const updateFunctions: { [key: string]: React.Dispatch<React.SetStateAction<string>> } = {
      name: setSignupName,
      email: setSignupEmail,
      whatsappnumber: setSignupNumber,
      password: setSignupPassword,
    };

    updateFunctions[field](text);

    // Validate the current field with the updated text
    validateSignup(field, text);
  };

  useEffect(() => {
    if (activeButton === 'signup') {
      setLoginErrors({});
    }
    if (registration) {
      setSignUpErrors({});
      setSignupEmail('');
      setSignupName('');
      setSignupNumber('');
      setSignupPassword('');
      setOtp('');
      setOtpReceived(false);
      //   setTimeout(()=>{setRegistration(false)},3000)
    }
  }, [activeButton]);

  type LoginErrorParam = 'username' | 'password';
  const resetLoginErrors = (loginErrorParam: LoginErrorParam) => {
    if (Object.keys(loginErrors).length !== 0) {
      if (loginErrorParam == 'username') {
        loginErrors.username = '';
      } else if (loginErrorParam == 'password') {
        loginErrors.password = '';
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // keyboardVerticalOffset={30}
      // changed
      style={[styles.container, { flex: 1 ,paddingBottom:15}]}>
      <View style={{ flex: 1 }}>
        {/* changed */}
        <View style={styles.header}>
              <Image source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }} style={styles.logo} />
            </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.innercontainer}>

            <View style={styles.welcome}>
              <Text style={styles.welcomeText}>
                {activeButton === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={() => setActiveButton('login')}>
                {activeButton === 'login' ? (
                  <LinearGradient
                    colors={['#F97316', '#FAA729']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBackground}>
                    <Text style={[styles.buttonText, styles.activeButtonText]}>Login</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => setActiveButton('signup')}>
                {activeButton === 'signup' ? (
                  <LinearGradient
                    colors={['#F97316', '#FAA729']}
                                        start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBackground}>
                    <Text style={[styles.buttonText, styles.activeButtonText]}>Sign Up</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {registration && (
              <Text style={{ color: 'green', marginTop: 10, fontFamily: 'PlusJakartaSans-Regular' }}>
                Registration successful
              </Text>
            )}
            {activeButton === 'login' ? (
              <View style={styles.formContainer}>
                <View style={{display: 'flex',flexDirection: 'row',  justifyContent: 'flex-end'}}>
                                <Text style={{ color: 'red', marginTop  : 10,  marginRight: 30  }}>*</Text>
                          </View>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#B1B1B1"
                  style={styles.input}
                  value={loginUserName}
                  onChangeText={(text: string) => {
                    setLoginUserName(text.replace(/\s/g, ''));
                    resetLoginErrors('username');
                  }}
                  allowFontScaling={false}
                />
                {loginErrors.username && (
                  <Text style={{ color: 'red', fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 }}>
                    {loginErrors.username}
                  </Text>
                )}
                

                
                <View style={styles.passwordContainer}>
                  
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#B1B1B1"
                    style={styles.input}
                    secureTextEntry={!isPasswordVisible}
                    value={loginPassword}
                    onChangeText={(text: string) => {
                      setLoginPassword(text);
                      resetLoginErrors('password');
                    }}
                    onBlur={() => {
                      setIsPasswordVisible(false);
                    }}
                    allowFontScaling={false}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Image
                      source={
                        isPasswordVisible
                          ? require('../../assests/LandingPage/openeye.png')
                          : require('../../assests/LandingPage/closedeye.png')
                      }
                      style={styles.eyeContainer}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text
                    style={{
                      color: '#74A2FA',
                      fontFamily: 'PlusJakartaSans-Regular',
                      fontSize: 12,
                    }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                {loginErrors.password && (
                  <Text
                    style={{
                      color: 'red',
                      top: '-10%',
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans-Regular',
                    }}>
                    {loginErrors.password}
                  </Text>
                )}

                <View style={{ alignItems: 'center' }}>
                  {!!loginMessage && <Text style={styles.errorText}>{loginMessage}</Text>}
                </View>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="#B1B1B1"
                  style={styles.input}
                  value={signupName}
                  onChangeText={text => {
                    setSignupName(text);
                    handleChange("name", text);
                  }}
                  allowFontScaling={false}
                />
                {signUpErrors.name && <Text style={styles.errorText}>{signUpErrors.name}</Text>}
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#B1B1B1"
                  style={styles.input}
                  value={signupEmail}
                  onChangeText={text => {
                    setSignupEmail(text.replace(/\s/g, ''));
                    handleChange('email', text);
                  }}
                  allowFontScaling={false}
                />
                {signUpErrors.email && <Text style={styles.errorText}>{signUpErrors.email}</Text>}
                <TextInput
                  placeholder="WhatsApp Number"
                  placeholderTextColor="#B1B1B1"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={10}
                  value={signupNumber}
                  onChangeText={(text: string) => {
                    setSignupNumber(text.replace(/\D/g, ''));
                    handleChange('whatsappnumber', text);
                  }}
                  allowFontScaling={false}
                />
                {signUpErrors.whatsappnumber && (
                  <Text style={styles.errorText}>{signUpErrors.whatsappnumber}</Text>
                )}
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#B1B1B1"
                    style={styles.input}
                    secureTextEntry={!isSignupPasswordVisible}
                    value={signupPassword}
                    onChangeText={text => {
                      setSignupPassword(text);
                      handleChange("password", text);
                    }}
                    onBlur={() => {
                      SetIsSignupPasswordVisible(false);
                    }}
                    allowFontScaling={false}
                  />

                  <TouchableOpacity
                    onPress={() => SetIsSignupPasswordVisible(!isSignupPasswordVisible)}>
                    <Image
                      source={
                        isSignupPasswordVisible
                          ? require('../../assests/LandingPage/openeye.png')
                          : require('../../assests/LandingPage/closedeye.png')
                      }
                      style={styles.eyeContainer}
                    />
                  </TouchableOpacity>
                </View>
                {signUpErrors.password && (
                  <Text style={styles.errorText}>{signUpErrors.password}</Text>
                )}
                {otpReceived === true && (
                  <View>
                    <Text style={{ color: 'green', fontFamily: 'PlusJakartaSans-Regular' }}>
                      Otp sent to your mail.Please check and enter below:
                    </Text>

                    <TextInput
                      placeholder="Enter OTP"
                      placeholderTextColor="#B1B1B1"
                      style={styles.input}
                      value={otp}
                      onChangeText={setOtp}
                      allowFontScaling={false}
                    />

                    {!isOtpValid && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'red' }}>Invalid OTP</Text>
                      </View>
                    )}

                    {isOtpExpired && otpReceived ? (
                      <TouchableOpacity
                        style={[styles.forgotPassword, { zIndex: 10 }]}
                        onPress={validateAndSignup}>
                        <Text
                          style={{
                            color: '#0E8CFF',
                            fontFamily: 'PlusJakartaSans-Bold',
                            fontSize: 12,
                          }}>
                          Resend OTP
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'red', fontFamily: 'PlusJakartaSans-Regular' }}>
                          Please verify OTP within {timer} seconds
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {signUpErrors.userRegistered && (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.errorText}>{signUpErrors.userRegistered}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.googlePosition}>
              <View style={styles.dividerContainer}>
                <Text style={styles.dividerText}> or </Text>
              </View>
              <TouchableOpacity style={styles.googleContainer} onPress={signIn}>
                <Image
                  source={require('../../assests/LandingPage/googlelogo.png')}
                  style={styles.googlelogoStyle}
                />
                <Text style={styles.googleSignUp}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        
        <View style={styles.bottomContainer}>
          <GradientButton
            title={activeButton === 'login' ? 'Login' : otpReceived ? 'Verify OTP' : 'Send OTP'}
            onPress={
              activeButton === 'login'
                ? validateAndLogin
                : otpReceived
                  ? handleOtp
                  : validateAndSignup
            }
          />
        </View>
        </ScrollView> 
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  header: {
    height: 63,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'center',
  },
  logo: {
    height: 36,
    width: 122,
    resizeMode: 'contain',
  },
  notificationContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    padding: 10,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  notificationText: {
    color: 'black',
    fontSize: 16,
    marginLeft: 10,
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innercontainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  resendotp: {
    marginTop: 15,
    fontFamily: 'PlusJakartaSans-Regular',
  },

  welcome: {
    marginVertical: 15,
    alignSelf: 'flex-start',
    marginHorizontal: 10,
    color: '#000000',
  },
  welcomeText: {
    fontSize: 20,
    marginVertical: 10,
    marginHorizontal: 10,
    color: '#0D0D0D',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  buttonContainer: {
    flexDirection: 'row',

    width: '90%',
    borderRadius: 10,
    borderColor: '#d7dade',
    borderWidth: 1,
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  button: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  activeButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 14,
    padding: 4,
    marginVertical: 4,
    color: '#0D0D0D',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  formContainer: {
    width: '90%',
    marginTop: 10,
    position: 'relative',
  },
  googlePosition: {
    flex: 1,
    width: '90%',
    position: 'relative',

    marginTop: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeContainer: {
    height: 20,
    width: 20,
    right: 25,
    resizeMode: 'contain',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -1,
    zIndex: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,

    color: '#0D0D0D',
    fontSize: 13.34,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 15.29,
  },
  googleSignUp: {
    color: '#0D0D0D',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
  },
  login: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    bottom: 20,
  },

  orangeText: {
    color: '#f28907',

    fontFamily: 'PlusJakartaSans-Bold',
  },
  whiteText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  textlocation: {
    fontSize: height * 0.02,
    position: 'absolute',
    justifyContent: 'flex-end',
    bottom: '20%',
    left: '40%',
    textAlign: 'center',

    fontFamily: 'PlusJakartaSans-Regular',
  },
  googlelogoStyle: {
    marginRight: 10,
    height: 20,
    width: 20,
  },
  googleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    borderRadius: 5,
    padding: 10,
  },
  dividerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loginsubmit: {
    alignItems: 'flex-end',
  },

  dividerText: {
    marginHorizontal: 10,
    color: '#000',
    marginVertical: 10,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
  },
});

export default LandingPage;
