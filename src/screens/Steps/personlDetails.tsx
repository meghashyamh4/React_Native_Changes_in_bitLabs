import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, Image, StyleSheet, ScrollView} from 'react-native';
import ProgressBar from '@components/progessBar/ProgressBar';
import GradientButton from '@components/styles/GradientButton';
import {getMobileNumber} from '@services/mobile';
import {useAuth} from '@context/Authcontext';

const Dummystep1: React.FC = ({route, navigation}: any) => {
  const {email} = route.params;
  const [currentStep, setCurrentStep] = useState(1);
  const {userId} = useAuth();
  const [touched, setTouched] = useState({
  firstName: false,
  lastName: false,
  whatsappNumber: false,
  address: false,
});


  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    whatsappNumber: '',
    address: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    whatsappNumber: '',
    address: '',
  });

  useEffect(() => {
    // Fetch mobile number from API
    const fetchMobileNumber = async () => {
      const mobileNumber = await getMobileNumber(userId);
      if (mobileNumber) {
        setFormData(prev => ({...prev, whatsappNumber: mobileNumber}));
      }
    };

    fetchMobileNumber();
  }, []);

const validateForm = () => {
  let isValid = true;
  const newErrors = {
    firstName: '',
    lastName: '',
    whatsappNumber: '',
    address: '',
  };

    // Validate first name
    (['firstName', 'lastName'] as Array<keyof typeof formData>).forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field === 'firstName' ? 'First' : 'Last'} name is required.`;
        isValid = false;
      } else if (formData[field].length < 3) {
        newErrors[field] = `${
          field === 'firstName' ? 'First' : 'Last'
        } name should be at least 3 characters long.`;
        isValid = false;
      }
    });

  const whatsappRegex = /^[6-9]\d{9}$/;
  if (!whatsappRegex.test(formData.whatsappNumber)) {
    newErrors.whatsappNumber = 'Should be 10 digits and start with 6, 7, 8, or 9.';
    isValid = false;
  }

  // Validate address
  const trimmedAddress = formData.address.trim();
  if (!trimmedAddress) {
    newErrors.address = 'Address is required.';
    isValid = false;
  } else if (trimmedAddress.length < 10) {
    newErrors.address = 'Address must be at least 10 characters long.';
    isValid = false;
  } else if (trimmedAddress.length > 200) {
    newErrors.address = 'Address must not exceed 200 characters.';
    isValid = false;
  }

    setErrors(newErrors);
    return isValid;
  };

const handleNext = () => {
  // Mark all fields as touched to show all errors if any
  setTouched({
    firstName: true,
    lastName: true,
    whatsappNumber: true,
    address: true,
  });

  if (validateForm()) {
    navigation.navigate('Step2', {
      ...route.params,
      firstName: formData.firstName,
      lastName: formData.lastName,
      whatsappNumber: formData.whatsappNumber,
      address: formData.address.trim(),
      email,
    });
  }
};


  

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Image
          style={styles.logo}
          source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }} // Replace with your actual logo path
        />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.completeProfile}>Complete Your Profile</Text>
            <Text style={styles.subHeader}>Fill the form fields to go to the next step</Text>
          </View>

          {/* ProgressBar with currentStep */}
          <ProgressBar initialStep={currentStep} />

          <TextInput
            placeholder="*First Name"
            placeholderTextColor="#B1B1B1"
            style={styles.input}
            value={formData.firstName}
            onChangeText={text => {
              setFormData(prev => ({...prev, firstName: text}));
              if (text.length >= 3) {
                setErrors(prev => ({...prev, firstName: ''}));
              }
            }}
          />
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

          <TextInput
            placeholder="*Last Name"
            placeholderTextColor="#B1B1B1"
            style={styles.input}
            value={formData.lastName}
            onChangeText={text => {
              setFormData(prev => ({...prev, lastName: text}));
              if (text.length >= 3) {
                setErrors(prev => ({...prev, lastName: ''}));
              }
            }}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

          {/* Prefilled, non-editable Email field */}
          <TextInput
            value={email}
            style={[styles.input, {backgroundColor: '#E5E4E2', color: 'gray'}]}
            editable={false}
          />
        <TextInput
  placeholder="WhatsApp Number"
   keyboardType="numeric"
   maxLength={10}
  placeholderTextColor="#B1B1B1"
  style={styles.input}
  value={formData.whatsappNumber}
  onChangeText={text => {
        const numericText = text.replace(/[^0-9]/g, ''); // only digits
    setFormData(prev => ({ ...prev, whatsappNumber: numericText }));
    setTouched(prev => ({ ...prev, whatsappNumber: true }));

    const whatsappRegex = /^[6-9]\d{9}$/;

    if (!numericText) {
      setErrors(prev => ({
        ...prev,
        whatsappNumber: 'WhatsApp number is required.',
      }));
    } else if (!whatsappRegex.test(numericText)) {
      setErrors(prev => ({
        ...prev,
        whatsappNumber: 'Should be 10 digits and start with 6, 7, 8, or 9.',
      }));
    } else {
      setErrors(prev => ({ ...prev, whatsappNumber: '' }));
    }
  }}
/>

{touched.whatsappNumber && errors.whatsappNumber ? (
  <Text style={styles.errorText}>{errors.whatsappNumber}</Text>
) : null}

<TextInput
  placeholder="*Address"
  placeholderTextColor="#B1B1B1"
  style={[styles.input, styles.textArea]}
  value={formData.address}
  onChangeText={text => {
    setFormData(prev => ({ ...prev, address: text }));
    setTouched(prev => ({ ...prev, address: true }));

    const trimmed = text.trim();
    if (!trimmed) {
      setErrors(prev => ({ ...prev, address: 'Address is required.' }));
    } else if (trimmed.length < 10) {
      setErrors(prev => ({ ...prev, address: 'Address must be at least 10 characters long.' }));
    } else if (trimmed.length > 200) {
      setErrors(prev => ({ ...prev, address: 'Address must not exceed 200 characters.' }));
    } else {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  }}
  multiline
  numberOfLines={4}
  textAlignVertical="top"
  maxLength={200}
/>
{touched.address && errors.address ? (
  <Text style={styles.errorText}>{errors.address}</Text>
) : null}

        </View>
      </ScrollView>

      {/* Footer with Back and Next Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Next"
            onPress={handleNext}
            style={[styles.applyButtonGradient]} // Custom styles if needed
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingBottom: 75,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 100, // Adds padding to avoid initial overlap
  },
  logo: {
    width: 150, // Decreased width
    height: 45,
    marginBottom: 20,
    alignSelf: 'center',
  },
  container: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    height: '98%',
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    borderTopColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 25,
  },

  header: {
    marginBottom: 20,
  },
  completeProfile: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: 'black',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    backgroundColor: '#F5F5F5',
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
    paddingTop: 10,
  },
  applyButtonGradient: {
    width: '100%', // Adjust this if necessary
  },
  gradientTouchable: {
    flex: 1,
    width: '50%',
  },
});

export default Dummystep1;
