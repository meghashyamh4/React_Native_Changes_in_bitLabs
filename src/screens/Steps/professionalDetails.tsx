import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ProgressBar from '@components/progessBar/ProgressBar';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import LinearGradient from 'react-native-linear-gradient';
import { ProfileModel } from '@services/step/stepServices';
import { useAuth } from '@context/Authcontext';
import UserContext from '@context/UserContext';
import { updateLead, searchLead } from '@services/ZohoCrm';
import { showToast } from '@services/login/ToastService';
import { CommonActions } from '@react-navigation/native';

const getSpecializationOptions = (qualification: string | any): string[] => {
  switch (qualification) {
    case 'B.Tech':
      return [
        'Computer Science and Engineering (CSE)',
        'Electronics and Communication Engineering (ECE)',
        'Electrical and Electronics Engineering (EEE)',
        'Mechanical Engineering (ME)',
        'Civil Engineering (CE)',
        'Aerospace Engineering',
        'Information Technology (IT)',
        'Chemical Engineering',
        'Biotechnology Engineering',
      ];
    case 'MCA':
      return [
        'Software Engineering',
        'Data Science',
        'Artificial Intelligence',
        'Machine Learning',
        'Information Security',
        'Cloud Computing',
        'Mobile Application Development',
        'Web Development',
        'Database Management',
        'Network Administration',
        'Cyber Security',
        'IT Project Management',
      ];
    case 'Degree':
      return [
        'Bachelor of Science (B.Sc) Physics',
        'Bachelor of Science (B.Sc) Mathematics',
        'Bachelor of Science (B.Sc) Statistics',
        'Bachelor of Science (B.Sc) Computer Science',
        'Bachelor of Science (B.Sc) Electronics',
        'Bachelor of Science (B.Sc) Chemistry',
        'Bachelor of Commerce (B.Com)',
      ];
    case 'Intermediate':
      return ['MPC', 'BiPC', 'CEC', 'HEC'];
    case 'Diploma':
      return [
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics and Communication Engineering',
        'Computer Engineering',
        'Automobile Engineering',
        'Chemical Engineering',
        'Information Technology',
        'Instrumentation Engineering',
        'Mining Engineering',
        'Metallurgical Engineering',
        'Agricultural Engineering',
        'Textile Technology',
        'Architecture',
        'Interior Designing',
        'Fashion Designing',
        'Hotel Management and Catering Technology',
        'Pharmacy',
        'Medical Laboratory Technology',
        'Radiology and Imaging Technology',
      ];
    default:
      return [];
  }
};

const skillOptions = [
  'Java',
  'C',
  'C++',
  'C Sharp',
  'Python',
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'Angular',
  'React',
  'Vue',
  'JSP',
  'Servlets',
  'Spring',
  'Spring Boot',
  'Hibernate',
  '.Net',
  'Django',
  'Flask',
  'SQL',
  'MySQL',
  'SQL-Server',
  'Mongo DB',
  'Selenium',
  'Regression Testing',
  'Manual Testing',
];
const locationOptions = [
  'Chennai',
  'Thiruvananthapuram',
  'Bangalore',
  'Hyderabad',
  'Coimbatore',
  'Kochi',
  'Madurai',
  'Mysore',
  'Thanjavur',
  'Pondicherry',
  'Vijayawada',
  'Pune',
  'Gurgaon',
];
interface FormData {
  qualification: string;
  specialization: string;
  skills: string[];
  experience: string;
  preferredLocation: string[];
}

const { height } = Dimensions.get('window');
const Dummystep2: React.FC = ({ route, navigation }: any) => {
  const { setPersonalName, refreshPersonalName, refreshJobCounts, refreshVerifiedStatus } = useContext(UserContext);
  const { leadId } = useAuth();
  const { updateShouldShowStep1 } = route.params || {};
  const [openExperienceDropdown, setOpenExperienceDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState<FormData>({
    qualification: route.params?.formData?.qualification || '',
    specialization: route.params?.formData?.specialization || '',
    skills: route.params?.formData?.skills || [],
    experience: route.params?.formData?.experience || '',
    preferredLocation: route.params?.formData?.preferredLocation || [],
  });

  const [errors, setErrors] = useState({
    qualification: '',
    specialization: '',
    skills: '',
    experience: '',
    preferredLocation: '',
  });

  const [specialization, setSpecialization] = useState<string>(formData.specialization);
  const [qualification, setQualification] = useState<string>(formData.qualification);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(formData.skills);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(formData.preferredLocation);
  const [experience, setExperience] = useState(formData.experience);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      qualification,
      specialization,
      skills: selectedSkills,
      preferredLocation: selectedLocations,
    }));
  }, [qualification, specialization, selectedSkills, selectedLocations]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      qualification: '',
      specialization: '',
      skills: '',
      experience: '',
      preferredLocation: '',
    };

    if (!formData.qualification) {
      newErrors.qualification = 'Qualification is required.';
      isValid = false;
    }
    if (!formData.specialization) {
      newErrors.specialization = 'Specialization is required.';
      isValid = false;
    }
    if (selectedSkills.length === 0) {
      newErrors.skills = 'Skills are required.';
      isValid = false;
    }
    if (!formData.experience || isNaN(Number(formData.experience))) {
      newErrors.experience = 'Experience is required.';
      isValid = false;
    }
    if (selectedLocations.length === 0) {
      newErrors.preferredLocation = 'Preferred location is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const { userId, userToken } = useAuth();

  const handleSave = async () => {
    // Validate form - only console log validation errors, no snackbar
    if (!validateForm()) {
      console.log('[ProfessionalDetails] Validation failed');
      showToast('error', 'Please fill all required fields');
      return;
    }

    // Check if userId and userToken are available
    if (!userId || !userToken) {
      console.error('[ProfessionalDetails] Missing userId or userToken');
      showToast('error', 'Authentication error. Please try again.');
      return;
    }

    // Set loading state
    setIsSaving(true);

    try {
      // Get address from Step 1
      const addressValue = route.params.address || '';

      const requestData = {
        basicDetails: {
          firstName: route.params.firstName,
          lastName: route.params.lastName,
          email: route.params.email,
          alternatePhoneNumber: route.params.whatsappNumber,
          address: addressValue, // Address from Step 1
        },
        experience: formData.experience,
        qualification: formData.qualification,
        specialization: formData.specialization,
        preferredJobLocations: selectedLocations, // Array of preferred job locations
        skillsRequired: selectedSkills.map((skill) => ({
          skillName: skill,
        })),
      };

      // API 1: Search Zoho Lead
      console.log('📡 [API] Searching Zoho Lead for email:', requestData.basicDetails.email);
      const searchResponse = await searchLead(requestData.basicDetails.email);
      console.log('📥 [API] Zoho Lead Search Response:', searchResponse);

      let leadIdToUpdate = leadId;
      if (searchResponse) {
        leadIdToUpdate = searchResponse;
        console.log('✅ [API] Using Lead ID:', leadIdToUpdate);
      } else {
        console.log('⚠️ [API] No lead found, using leadId from context:', leadId);
      }

      // API 2: Update Zoho Lead
      if (leadIdToUpdate) {
        const leadData = {
          data: [
            {
              Owner: { id: "4569859000019865042" },
              Last_Name: requestData.basicDetails.lastName,
              First_Name: requestData.basicDetails.firstName,
              Email: requestData.basicDetails.email,
              Phone: requestData.basicDetails.alternatePhoneNumber,
              Lead_Status: "completed profile",
              Status_TS: "Completed Profile",
              Industry: "Software",
              Technical_Skills: requestData.skillsRequired.map((skill: any) => ({
                skillName: skill.skillName,
              })),
              Specialization: requestData.specialization,
              Education_Qualifications: requestData.qualification,
              Degree_level: requestData.qualification,
              Total_work_experience_in_years: requestData.experience,
              Preferred_Job_Locations: selectedLocations.join(", "), // Use preferred job locations array
              Platform: "mobile app",
            },
          ],
        };

        console.log('📡 [API] Updating Zoho Lead');
        console.log('📤 [API] Lead Update Payload:', JSON.stringify(leadData, null, 2));
        const leadUpdateResult = await updateLead(leadIdToUpdate, leadData);
        console.log('📥 [API] Lead Update Response:', JSON.stringify(leadUpdateResult, null, 2));
      }

      // API 3: Create Profile
      const response = await ProfileModel.createProfile(userId, userToken, requestData);

      // Handle response - check status or success flag
      const isSuccess = response.status === 200 || response.success === true || (response && !response.error);

      if (isSuccess) {
        console.log('✅ [SUCCESS] Profile created successfully');

        // Show success message
        showToast('success', 'Profile saved successfully!');

        // Refresh user data (like step3)
        if (route?.params?.firstName) {
          setPersonalName(route.params.firstName);
        }
        // await refreshJobCounts();
        await refreshVerifiedStatus();
        await refreshPersonalName();

        // Update parent navigation state to show BottomTab
        if (updateShouldShowStep1) {
          console.log('🔄 [NAVIGATION] Updating shouldShowStep1 to false');
          updateShouldShowStep1(false);
        }

        // Navigate to home after successful save
        // Use setTimeout to allow parent navigator to re-render first
        setTimeout(() => {
          console.log('🏠 [NAVIGATION] Navigating to Home page');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'BottomTab', params: { shouldShowStep1: false, screen: 'Home' } }],
            })
          );
        }, 100);
      } else {
        console.log('⚠️ [WARNING] Unexpected response format:', response);
        // Update parent navigation state
        if (updateShouldShowStep1) {
          updateShouldShowStep1(false);
        }
        // Still navigate to home if profile was created (even if response format is unexpected)
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'BottomTab', params: { shouldShowStep1: false, screen: 'Home' } }],
            })
          );
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ [ERROR] Error saving profile:', error);

      // If profile already exists, navigate to home without showing snackbar
      if (error?.isProfileExists) {
        console.log('ℹ️ [INFO] Profile already exists - navigating to Home without snackbar');
        // Refresh user data
        if (route?.params?.firstName) {
          setPersonalName(route.params.firstName);
        }
        await refreshJobCounts();
        await refreshVerifiedStatus();
        await refreshPersonalName();

        // Update parent navigation state
        if (updateShouldShowStep1) {
          updateShouldShowStep1(false);
        }

        // Navigate to home
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'BottomTab', params: { shouldShowStep1: false, screen: 'Home' } }],
            })
          );
        }, 100);
        return;
      }

      // Only show error snackbar for actual API failures (not "profile exists")
      let errorMessage = 'Failed to save profile. Please try again.';

      // Check for network errors
      if (!error?.response) {
        // Network error (no response from server)
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error?.response?.status >= 500) {
        // Server error
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.response?.status === 400) {
        // Bad request - use API error message
        errorMessage = error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Invalid data. Please check your inputs and try again.';
      } else {
        // Other errors - use API error message if available
        errorMessage = error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to save profile. Please try again.';
      }

      showToast('error', errorMessage);
    } finally {
      // Always reset loading state
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
    navigation.navigate('Step1', {
      formData: formData,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image style={styles.logo} source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }} />

      {/* Container with overflow visible to prevent dropdown clipping */}
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.completeProfile}>Complete Your Profile</Text>
          <Text style={styles.subHeader}>Fill the form fields to go next step</Text>
        </View>

        <ProgressBar initialStep={currentStep} />

        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.scrollView}
          style={{ flex: 1 }}
        >
          {/* Qualification Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Dropdown
              style={styles.dropdown}
              data={[
                { label: 'B.Tech', value: 'B.Tech' },
                { label: 'MCA', value: 'MCA' },
                { label: 'Degree', value: 'Degree' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Diploma', value: 'Diploma' },
              ]}
              labelField="label"
              valueField="value"
              value={qualification}
              onChange={item => {
                setQualification(item.value);
                setErrors(prev => ({ ...prev, qualification: '' }));
              }}
              placeholder="*Qualification"
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownText}
              itemContainerStyle={styles.itemContainerStyle}
              activeColor="#6B7280"
              containerStyle={styles.dropdownContainer}
            />
            {Boolean(errors.qualification) && <Text style={styles.errorText}>{errors.qualification}</Text>}
          </View>

          {/* Specialization Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Dropdown
              style={[styles.dropdown, !qualification && styles.disabledDropdown]}
              data={getSpecializationOptions(qualification).map(spec => ({
                label: spec,
                value: spec,
              }))}
              labelField="label"
              valueField="value"
              value={specialization}
              onChange={item => {
                setSpecialization(item.value);
                setErrors(prev => ({ ...prev, specialization: '' }));
              }}
              placeholder="*Specialization"
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownText}
              itemContainerStyle={styles.itemContainerStyle}
              activeColor="#6B7280"
              containerStyle={styles.dropdownContainer}
              disable={!qualification}
            />
            {Boolean(errors.specialization) && <Text style={styles.errorText}>{errors.specialization}</Text>}
          </View>

          {/* Skills Dropdown */}
          <View style={styles.dropdownWrapper}>
            <MultiSelect
              style={styles.dropdown}
              data={skillOptions.map(skill => ({ label: skill, value: skill }))}
              labelField="label"
              valueField="value"
              value={selectedSkills}
              onChange={value => {
                setSelectedSkills(value);
                setErrors(prev => ({
                  ...prev,
                  skills: value.length > 0 ? '' : 'Skills are required.',
                }));
              }}
              placeholder="*Skills"
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownText}
              itemContainerStyle={styles.itemContainerStyle}
              activeColor="#6B7280"
              containerStyle={styles.dropdownContainer}
              renderSelectedItem={(item, unSelect) => (
                <TouchableOpacity style={styles.selectedItem} onPress={() => unSelect && unSelect(item)}>
                  <Text style={styles.selectedItemText}>{item.label}</Text>
                  <AntDesign color="black" name="closecircle" size={17} />
                </TouchableOpacity>
              )}
            />
            {Boolean(errors.skills) && <Text style={styles.errorText}>{errors.skills}</Text>}
          </View>

          {/* Location Dropdown */}
          <View style={styles.dropdownWrapper}>
            <MultiSelect
              style={styles.dropdown}
              data={locationOptions.map(location => ({
                label: location,
                value: location,
              }))}
              labelField="label"
              valueField="value"
              value={selectedLocations}
              onChange={value => {
                setSelectedLocations(value);
                setErrors(prev => ({
                  ...prev,
                  preferredLocation: value.length > 0 ? '' : 'Preferred location is required.',
                }));
              }}
              placeholder="*Preferred Locations"
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownText}
              itemContainerStyle={styles.itemContainerStyle}
              activeColor="#6B7280"
              containerStyle={[styles.dropdownContainer, { maxHeight: 150 }]}
              renderSelectedItem={(item, unSelect) => (
                <TouchableOpacity style={styles.selectedItem} onPress={() => unSelect && unSelect(item)}>
                  <Text style={styles.selectedItemText}>{item.label}</Text>
                  <AntDesign color="black" name="closecircle" size={17} />
                </TouchableOpacity>
              )}
            />
            {Boolean(errors.preferredLocation) && (
              <Text style={styles.errorText}>{errors.preferredLocation}</Text>
            )}
          </View>

          {/* Experience Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Dropdown
              style={styles.dropdown}
              data={Array.from({ length: 16 }, (_, i) => ({
                label: `${i}`,
                value: `${i}`,
              }))}
              labelField="label"
              valueField="value"
              value={experience}
              onChange={item => {
                setExperience(item.value);
                setFormData(prev => ({ ...prev, experience: item.value }));
                setErrors(prev => ({ ...prev, experience: '' }));
              }}
              placeholder="*Total Experience"
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownText}
              itemContainerStyle={styles.itemContainerStyle}
              activeColor="#6B7280"
              containerStyle={styles.dropdownContainer}
            />
            {Boolean(errors.experience) && (
              <Text style={styles.errorText}>{errors.experience}</Text>
            )}
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { borderWidth: 0 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={isSaving ? ['#cccccc', '#aaaaaa'] : ['#F97316', '#FAA729']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.nextButton,
                { borderRadius: 6, opacity: isSaving ? 0.7 : 1 }
              ]}
            >
              {isSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.nextButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.nextButtonText}>Save</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  logo: {
    width: 150, // Decreased width
    height: 45,
    marginBottom: 20,
    alignSelf: 'center',
  },
  // Container with overflow visible to prevent dropdown clipping
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 0, // Leave room for absolute footer
    overflow: 'visible', // Critical: allows dropdowns to render outside container bounds
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 17,
    borderTopColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 13,
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
    fontFamily: 'PlusJakartaSans-Medium',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    color: 'black',
    backgroundColor: '#F5F5F5',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  backButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nextButton: {
    padding: 10,
    borderRadius: 6, // Consistent with backButton
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Ensure it fits the wrapping TouchableOpacity
  },
  gradientTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  // Wrapper for each dropdown to isolate z-index and prevent overflow clipping
  dropdownWrapper: {
    width: '100%',
    overflow: 'visible', // Critical: allows dropdown list to render outside wrapper
    marginBottom: 5,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 5,
    marginVertical: 10,
    backgroundColor: '#F5F5F5',
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  disabledDropdown: {
    backgroundColor: '#E0E0E0',
  },
  // Dropdown container style for react-native-element-dropdown
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F5F5F5',
    maxHeight: 200,
    borderRadius: 5,
  },
  placeholderText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
  },
  dropdownText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: 'black',
  },
  itemContainerStyle: {
    padding: 4,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  selectedItemText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    color: 'black',
    marginRight: 5,
  },
  // ScrollView with overflow visible to prevent dropdown clipping
  scrollView: {
    flexGrow: 1,
    paddingBottom: 250,
    overflow: 'visible', // Critical: allows dropdowns to render outside ScrollView bounds
  },
});
export default Dummystep2;

