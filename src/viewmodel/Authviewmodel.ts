
import { useState, useRef } from "react";
import { handleSignup, handleOTP } from "../services/login/Authservice";
import { LoginErrors, SignupErrors } from "../models/Model";
import { useAuth } from "@context/Authcontext";
import useOtpManager from "../hooks/useOtpManager";
import Toast from "react-native-toast-message";
import { createLead, searchLead } from "@services/ZohoCrm";



const useLoginViewModel = () => {
  const {login} = useAuth();
  const [loginUserName, setLoginUserName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [loginMessage, setLoginMessage] = useState('');
  const notificationMessage = useRef('');
  const showNotification = useRef(false);
  const {setLeadId} = useAuth();
  //declare in a use ref
  const notificationType = useRef('');
  const showToast = (type: 'success' | 'error', message: string) => {
    Toast.show({
      type: type,
      text1: '',
      text2: message,
      position: 'bottom',
      visibilityTime: 5000,
      bottomOffset: 20, // Positioned near bottom, above chatbot icon
      text2Style: {
        fontFamily: 'PlusJakartaSans-Medium',
        fontSize: 12,
      },
    });
  };

  const validateLogin = () => {
    const errors: LoginErrors = {};
    if (!loginUserName) {
      errors.username = 'E-mail is required';
    } else if (!isValidEmail(loginUserName)) {
      errors.username = 'Invalid E-mail';
    }
    if (!loginPassword) {
      errors.password = 'Password is required';
    } else if (/\s/.test(loginPassword)) {
      errors.password = 'Password must not contain any spaces';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateAndLogin = async () => {
    try {
      if (validateLogin()) {
        const result = await login(loginUserName, loginPassword);
        if (result.success) {
          showToast("success", "Login successful");

        const leadId = await searchLead(loginUserName);

        if (leadId) {
          console.log("Lead exists");
        } 
        else {
          // If lead does not exist, create one
          const leadData = {
            data: [
              {
                Last_Name: loginUserName.split("@")[0].replace(/\d+/g, ""), // Extracting name from email
                Email: loginUserName,
                Phone: '',
                Status_TS: "Signed-Up",
                Lead_Source: '',  
                Industry: "Software",
                Mobile: '',
                Utm_Source_TS: '',
                Utm_Medium_TS: '',
                Utm_Campaign_TS: '',
                Utm_Content_TS: '',
                Utm_Term_TS: '',
                Platform:"mobile app"
              },
            ],
          };
          const leadId=await createLead(leadData);
          setLeadId(leadId);
        }
      
        } else {
          // Extract error message - handle both string and object responses
          let errorMessage = 'Login failed. Please try again.';
          if (result.message !== null && result.message !== undefined) {
            if (typeof result.message === 'string') {
              errorMessage = result.message;
            } else if (typeof result.message === 'object') {
              // Try to extract message from error object
              const messageObj = result.message as any;
              errorMessage = messageObj.message || messageObj.error || JSON.stringify(result.message);
            }
            setLoginMessage(errorMessage);
            // showToast("error", errorMessage);
          } else {
            // showToast("error", errorMessage);
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      // showToast("error", errorMessage);
      setLoginMessage(errorMessage);
    }
  };

  return {
    loginUserName,
    setLoginUserName,
    loginPassword,
    setLoginPassword,
    loginErrors,
    loginMessage,
    notificationMessage,
    showNotification,
    notificationType,
    validateLogin,
    validateAndLogin,
    setLoginErrors,

  };
};

const useSignupViewModel = () => {
  const {setLeadId} = useAuth();
  const otpManager = useOtpManager(); //Re-use otp states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupNumber, setSignupNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signUpErrors, setSignUpErrors] = useState<SignupErrors>({});

  const [registration, setRegistration] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    Toast.show({
      type: type,
      text1: '',
      text2: message,
      position: 'bottom',
      visibilityTime: 5000,
      bottomOffset: 20, // Positioned near bottom, above chatbot icon
      text2Style: {
        fontFamily: 'PlusJakartaSans-Medium',
        fontSize: 12,
      },
    });
  };

  const validateSignup = (
    field?: 'name' | 'email' | 'whatsappnumber' | 'password',
    text?: string,
  ): boolean => {
    const errors: SignupErrors = {...signUpErrors};

    // Remove the userRegistered error if it exists
    if (errors.userRegistered) delete errors.userRegistered;

    // Helper function for field-specific validation
    const validateField = (field: string, value: string) => {
      switch (field) {
        case 'name':
          if (!value) errors.name = 'Name is required';
          else if (value.length < 3)
            errors.name = 'Full name should be at least three characters long';
          else if (!/^[A-Za-z\s]+$/.test(value))
            errors.name = 'Name should only contain alphabetic characters';
          else delete errors.name;
          break;
        case 'email':
          if (!value) errors.email = 'E-mail is required';
          else if (!isValidEmail(value)) errors.email = 'Please enter a valid email address';
          else delete errors.email;
          break;
        case 'whatsappnumber':
          if (!value) errors.whatsappnumber = 'Whatsapp Number is required';
          else if (value.length < 10)
            errors.whatsappnumber = 'Please enter a valid 10 digit mobile number';
          else if (!/^[6-9][0-9]{9}$/.test(value))
            errors.whatsappnumber = 'Mobile number should begin with 6, 7, 8, or 9';
          else delete errors.whatsappnumber;
          break;
        case 'password':
          if (!value) errors.password = 'Password is required';
          else if (value.length < 6)
            errors.password = 'Password must be at least 6 characters long';
          else if (!/[A-Z]/.test(value))
            errors.password = 'Password must contain at least one uppercase letter';
          else if (!/[!@#$%^&*]/.test(value))
            errors.password = 'Password must contain at least one special character';
          else if (!/\d/.test(value)) errors.password = 'Password must contain at least one digit';
          else if (/\s/.test(value)) errors.password = 'Password cannot contain any spaces';
          else delete errors.password;
          break;
      }
    };

    // Field-specific validation if field and text are provided
    if (field && text !== undefined) {
      validateField(field, text);
    } else {
      // Full validation for all fields
      validateField('name', signupName);
      validateField('email', signupEmail);
      validateField('whatsappnumber', signupNumber);
      validateField('password', signupPassword);
    }

    setSignUpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateAndSignup = async () => {
    if (validateSignup()) {
      const result = await handleSignup(signupEmail, signupNumber);
      if (result.success) {
        otpManager.setOtpReceived(true);
        otpManager.setTimer(60);
        otpManager.setIsOtpExpired(false);
        showToast('success', 'OTP sent successfully');
      } else {
        setSignUpErrors({userRegistered: result.message});
      }
    }
  };

  const handleOtp = async () => {
    try {
      const result = await handleOTP(
        otpManager.otp,
        signupEmail,
        signupName,
        signupNumber,
        signupPassword,
      );
      if (result.success) {
        setRegistration(true);
        otpManager.setTimer(0);
        showToast("success", "User Registered Successfully. Please login to continue.");

        const leadData ={
        data : [
          {
            Last_Name: signupName,
            Email: signupEmail,  
            Phone: '',
            Status_TS: "Signed-Up",
            Lead_Source: '',  
            Industry: "Software",
            Mobile: signupNumber,
            Utm_Source_TS: '',
            Utm_Medium_TS: '',
            Utm_Campaign_TS: '',
            Utm_Content_TS: '',
            Utm_Term_TS: '',
            Platform:"mobile app"
          }
        ]
      };
      const newLeadId =  await createLead(leadData);
      console.log("New lead created with ID:", newLeadId);
      setLeadId(newLeadId);
      console.log("Lead ID set in AuthContext:", newLeadId);
      
      // Reset form and switch to login tab
      setSignupEmail('');
      setSignupName('');
      setSignupNumber('');
      setSignupPassword('');
      otpManager.setOtp('');
      otpManager.setOtpReceived(false);
      } else {
        otpManager.setIsOtpValid(false);
        setTimeout(() => otpManager.setIsOtpValid(true), 3000);
      }
    } catch (error) {
      console.error('Error occurred:', error);
      // showToast('error', 'An Error Occured');
    }
  };

  return {
    signupName,
    setSignupName,
    signupEmail,
    setSignupEmail,
    signupNumber,
    setSignupNumber,
    signupPassword,
    setSignupPassword,
    signUpErrors,
    setRegistration,
    setSignUpErrors,
    validateSignup,
    validateAndSignup,
    handleOtp,
    registration,
    ...otpManager,
  };
};

export {useLoginViewModel, useSignupViewModel};
