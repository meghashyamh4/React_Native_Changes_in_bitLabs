import {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList, ForgotErrors} from '@models/Model';
import {StackNavigationProp} from '@react-navigation/stack';
import useOtpManager from '../hooks/useOtpManager';
import {showToast} from '../services/login/ToastService';
import {sendOtp, verifyOtp, resetPassword} from '../services/login/ForgotPasswordService';

export const useForgotPasswordViewModal = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<ForgotErrors>({});
  const {
    otp,
    setOtp,
    otpReceived,
    setOtpReceived,
    isOtpExpired,
    setIsOtpExpired,
    timer,
    setTimer,
    isOtpValid,
    setIsOtpValid,
  } = useOtpManager();
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (otpReceived && !isOtpExpired) {
      const interval = setInterval(() => {
        if (timer > 0) {
          setTimer(prevTimer => prevTimer - 1);
        } else {
          setIsOtpExpired(true);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpReceived, timer, isOtpExpired, setTimer, setIsOtpExpired]);

  useEffect(() => {}, [errors]);

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prevErrors => ({...prevErrors, email: 'E-mail is required'}));
    } else if (!regex.test(email)) {
      setErrors(prevErrors => ({...prevErrors, email: 'Invalid E-mail'}));
    } else {
      setErrors(prevErrors => ({...prevErrors, email: undefined}));
    }
    return regex.test(email);
  };

  const sendOTP = async () => {
    if (isValidEmail(email)) {
      const result = await sendOtp(email);
      if (result.success) {
        setOtpReceived(true);
        setTimer(60);
        setIsOtpExpired(false);
        showToast('success', 'OTP sent successfully');
      } else {
        setErrors(prevErrors => ({...prevErrors, email: result.message}));
        showToast('error', 'Error sending OTP');
      }
    } else {
      console.log('Invalid ');
    }
  };

  const verifyOTP = async () => {
    const result = await verifyOtp(otp, email);
    if (result.success) {
      setIsOtpVerified(true);
      showToast('success', 'OTP verified successfully');
    } else {
      setIsOtpValid(false);
      setTimeout(() => setIsOtpValid(true), 3000);
    }
  };

  const validatePassword = () => {
    const newErrors: ForgotErrors = {}; // Create a new errors object

    if (!newPassword) {
      newErrors.password = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      newErrors.password = 'Password must contain at least one special character';
    } else if (!/\d/.test(newPassword)) {
      newErrors.password = 'Password must contain at least one digit';
    } else if (/\s/.test(newPassword)) {
      newErrors.password = 'Password cannot contain any spaces';
    }

    if (newPassword !== confirmPassword) {
      newErrors.password = 'Passwords do not match';
    }

    setErrors(newErrors); // Update state with the new errors object

    return Object.keys(newErrors).length === 0; // Return true if there are no errors
  };

  const resetUserPassword = async () => {
    if (validatePassword()) {
      const result = await resetPassword(email, newPassword, confirmPassword);
      if (result.success) {
        navigation.navigate('LandingPage');
        showToast('success', 'Password reset Successfully');
      } else {
        console.log(email,newPassword,confirmPassword)
        console.log(result)
        console.log(result.message)
        showToast('error', 'Error resetting Password');
      }
    }
  };

  return {
    errors,
    otp,
    setOtp,
    otpReceived,
    setOtpReceived,
    isOtpExpired,
    setIsOtpExpired,
    timer,
    setTimer,
    isOtpValid,
    setIsOtpValid,
    isOtpVerified,
    setIsOtpVerified,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    sendOTP,
    verifyOTP,
    resetUserPassword,
    isPasswordVisible,
    setIsPasswordVisible,
    email,
    setEmail,
    isResetPasswordVisible,
    setIsResetPasswordVisible,
  };
};
