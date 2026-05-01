import { useState, useEffect, useCallback, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileService } from '@services/profile/ProfileService';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { showToast } from '@services/login/ToastService';
import { useProfilePhoto } from '@context/ProfilePhotoContext';
import { base64Image } from '@services/base64Image';
import axios from 'axios';
import UserContext from '@context/UserContext';
import resumeCall from '@services/profile/Resume';
import { useAuth } from '@context/Authcontext';
import { usePdf } from '../context/ResumeContext';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  CameraOptions,
  ImagePickerResponse,
  ImageLibraryOptions,
} from "react-native-image-picker";
import { updateLead } from "@services/ZohoCrm";
export const useProfileViewModel = (userToken: string | null, userId: number | null) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const userid = useAuth();
  const { refreshPdf } = usePdf();
  const [error, setError] = useState<string | null>(null);
  const [isProfessionalFormVisible, setProfessionalFormVisible] = useState(false);
  const [isCameraOptionsVisible, setCameraOptionsVisible] = useState(false);
  const [isPersonalDetailsFormVisible, setPersonalDetailsFormVisible] = useState(false);
  const [isResumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeFile, setResumeFile] = useState<DocumentPickerResponse | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBorder, setShowBorder] = useState(false);
  const [bgcolor, setbgcolor] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [hasResume, setHadResume] = useState(false);
  const [originalHasResume, setOriginalHasResume] = useState(false); // Track initial state
  const [isResumeRemoved, setIsResumeRemoved] = useState(false);
  const { fetchProfilePhoto, photo } = useProfilePhoto();
  const { setPersonalName } = useContext(UserContext);
  const leadId = useAuth();
  const DEFAULT_PROFILE_IMAGE = require("../assests/profile/profile.png");

  // Personal Details State
  const [personalDetails, setPersonalDetails] = useState({
    firstName: '',
    lastName: '',
    alternatePhoneNumber: '',
    email: '', // Non-editable, if needed
  });
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    alternatePhoneNumber: '',
    email: '', // Non-editable, if needed
  });
  const handlePermission = async () => {
    if (Platform.OS === 'android') {
      const permissions =
        Platform.Version >= 33
          ? [
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ]
          : [
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ];

      const grantedStatuses = await Promise.all(
        permissions.map(permission => PermissionsAndroid.check(permission)),
      );

      const allPermissionsGranted = grantedStatuses.every(status => status);

      if (!allPermissionsGranted) {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );
      }
      return true;
    }
  };
  const validatePhoto = (photoFile: any) => {
    console.log('[ProfileViewModel] Validating photo:', {
      type: photoFile.type,
      fileSize: photoFile.fileSize,
      fileName: photoFile.fileName,
      uri: photoFile.uri ? 'present' : 'missing',
    });

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5 MB in bytes

    if (!photoFile.type || !allowedTypes.includes(photoFile.type.toLowerCase())) {
      console.warn('[ProfileViewModel] Invalid file type:', photoFile.type);
      showToast('error', 'Only JPEG and PNG files are allowed.');
      return false;
    }

    if (photoFile.fileSize && photoFile.fileSize > maxSize) {
      const fileSizeMB = (photoFile.fileSize / (1024 * 1024)).toFixed(2);
      console.warn('[ProfileViewModel] File size exceeds limit:', {
        fileSize: photoFile.fileSize,
        fileSizeMB,
        maxSizeMB: 5,
      });
      showToast('error', `File size must be less than 5 MB. Current size: ${fileSizeMB} MB`);
      return false;
    }

    console.log('[ProfileViewModel] Photo validation passed');
    return true;
  };

  const uploadProfilePhoto = async (photoFile: any) => {
    console.log('[ProfileViewModel] Starting photo upload:', {
      userId,
      hasToken: !!userToken,
      photoType: photoFile.type,
      photoSize: photoFile.fileSize,
    });

    setIsLoading(true);
    try {
      // Validate before upload
      if (!validatePhoto(photoFile)) {
        console.warn('[ProfileViewModel] Photo validation failed, aborting upload');
        setIsLoading(false);
        return;
      }

      const result = await ProfileService.uploadProfilePhoto(userToken, userId, photoFile);
      console.log('[ProfileViewModel] Upload result:', {
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        console.log('[ProfileViewModel] Photo uploaded successfully, refreshing profile photo');
        await fetchProfilePhoto(userToken, userId);
        showToast('success', 'Profile photo uploaded successfully!');
      } else {
        const errorMsg = result.message || 'Failed to upload photo. Please try again.';
        console.error('[ProfileViewModel] Upload failed:', errorMsg);
        showToast('error', errorMsg);
      }
    } catch (error: any) {
      console.error('[ProfileViewModel] Error uploading photo:', {
        error: error?.message || error,
        stack: error?.stack,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMsg = error?.response?.data?.message ||
        error?.message ||
        'An unexpected error occurred. Please try again.';
      showToast('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCamera = async () => {
    const isPermissionGranted = await handlePermission();
    if (!isPermissionGranted) {
      console.log('Permission denied');
      return;
    }
    const options: CameraOptions = {
      mediaType: 'photo',
      saveToPhotos: true,
    };
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled');
      } else if (response.errorCode) {
        console.log('Image picker error');
      } else if (response.assets && response.assets.length > 0) {
        const photoFile = response.assets[0];
        if (validatePhoto(photoFile)) {
          uploadProfilePhoto(photoFile);
        } else {
          console.log('Invalid file type or size.');
        }
      } else {
        console.log('Error storing image');
      }
      setCameraOptionsVisible(false);
    });
  };
  const removePhoto = async () => {
    if (photo === DEFAULT_PROFILE_IMAGE) {
      showToast('error', 'No photo to remove.');
      return;
    }
    setIsLoading(true);
    try {
      // Prepare the default image file object
      const defaultImageFile = {
        uri: base64Image,
        type: 'image/png', // Correct MIME type
        fileName: 'default_profile.png',
      };

      // Upload the default image
      const result = await ProfileService.uploadProfilePhoto(userToken, userId, defaultImageFile);

      if (result.success) {
        await fetchProfilePhoto(userToken, userId); // Refresh profile photo after successful upload

        showToast('success', 'Default image set successfully!');
      } else {
        showToast('error', 'Failed to remove photo.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error setting default photo:', error.message);
      }
      showToast('error', 'Error removing photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLibrary = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
    };
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled');
      } else if (response.errorCode) {
        console.log(response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const photoFile = response.assets[0];
        if (validatePhoto(photoFile)) {
          uploadProfilePhoto(photoFile);
        } else {
          console.log('Invalid file type or size.');
        }
      }
      setCameraOptionsVisible(false);
    });
  };
  const handleCancelUpload = () => {
    setResumeFile(null); // Temporarily remove the file from the UI
    setResumeText('');
    setLoading(false);
    setProgress(0);
    setIsResumeRemoved(true); // Mark that the resume was removed temporarily
    showToast('error', 'Upload cancelled');
    setShowBorder(false);
  };

  const handleUploadResume = async () => {
    setIsUploadComplete(true);
    try {
      const result: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf], // Ensure only PDF files are shown
      });

      if (!result || result.length === 0) {
        showToast('error', 'No file selected.');
        return;
      }

      const selectedFile: DocumentPickerResponse = result[0];
      const maxSize = 5242880; // 1MB size limit

      // Validate file size
      if (selectedFile.size && selectedFile.size > maxSize) {
        showToast("error", "File size exceeds the 5MB limit.");
        setIsUploadComplete(false);
        return;
      }

      // Set selected file but do not upload yet
      setResumeFile(selectedFile);
      setResumeText(selectedFile.name || '');
      //showToast('Resume selected. Uploading...');
      setTimeout(() => {
        // Start the upload process
        setLoading(true);
        setProgress(0);
        setShowBorder(true);
        setbgcolor(false);

        // Simulate upload progress
        const interval = setInterval(() => {
          setProgress(prevProgress => {
            const newProgress = prevProgress + 0.3; // 1/8th of the total progress for 8 seconds
            if (newProgress >= 1) {
              clearInterval(interval);
              setLoading(false);
              setIsUploadComplete(false);
            }
            return newProgress;
          });
        }, 1000); // Update progress every 1 second
      }, 10); // 0.5 second delay before starting the progress bar
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        showToast('error', 'Upload cancelled.');
        setIsUploadComplete(false);
      } else if ((err as { message: string }).message === 'Network Error') {
        showToast('error', 'Network error. Please check your internet connection and try again.');
      } else {
        console.error('Unknown error: ', err);
        showToast('error', 'Error selecting file. Please try again.');
      }
    }
  };

  const handleSaveResume = async () => {
    // Case 1: A new file was manually selected (its URI will not be empty)
    if (resumeFile && resumeFile.uri !== '') {
      setbgcolor(false);
      const formData = new FormData();
      formData.append('resume', {
        uri: resumeFile.uri,
        type: resumeFile.type,
        name: resumeFile.name,
      } as any);
      const response = await ProfileService.uploadResume(userToken, userId, formData);
      if (response.success) {
        showToast('success', 'Resume uploaded successfully');
        setResumeModalVisible(false);
        setShowBorder(false);
        if (userid.userId !== null) {
          refreshPdf();
        } else {
          console.error('User ID is null');
        }
      } else {
        console.error(response.message);
        showToast('error', 'Error uploading resume. Please try again later.');
        setResumeModalVisible(false);
      }
    }
    // Case 2: No new file was selected, but the API already confirmed a resume exists and the user did not remove it.
    else if (hasResume && !isResumeRemoved) {
      setbgcolor(false);
      setResumeModalVisible(false);
      setShowBorder(false);
    }
    // Case 3: Neither a new file is selected nor does an API-confirmed resume exist
    // or the user has removed the file (isResumeRemoved === true)
    else {
      setbgcolor(true); // This will trigger the "No file selected" validation error.
      showToast('error', 'Please upload a resume before saving');
    }
  };

  const handleSaveChanges = async () => {
    const success = await updateBasicDetails();
    if (
      personalDetails.firstName.length <= 19 &&
      personalDetails.lastName.length <= 19 &&
      success
    ) {
      setPersonalName(personalDetails.firstName);

      setPersonalDetailsFormVisible(false);
      loadProfile();
      showToast('success', 'Personal details updated successfully');
    } else {
      showToast('error', 'Error updating, please try again later');
    }
  };

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  // this function is passed to child component professionalform, use usecallback
  //to memoize and  maintain reference

  const loadProfile = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await ProfileService.fetchProfile(userToken, userId);

      // Populate personal details from the profile data
      if (data?.basicDetails) {
        const newPersonalDetails = {
          firstName: data.basicDetails.firstName || '',
          lastName: data.basicDetails.lastName || '',
          alternatePhoneNumber: data.basicDetails.alternatePhoneNumber || '',
          email: data.basicDetails.email || '', // Non-editable
        };
        setPersonalDetails(newPersonalDetails);
        setPersonalData(newPersonalDetails);
      }

      setProfileData(data);
    } catch (err) {
      setError('Poor Network Connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  const resetPersonalDetails = () => {
    setPersonalDetails(personalData);
  };
  // Ensure function doesn't recreate on every render

  useFocusEffect(
    useCallback(() => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Reload timeout exceeded')), 4000),
      );

      const reloadWithTimeout = async () => {
        try {
          await Promise.race([loadProfile(), timeoutPromise]);
        } catch (error) {
          console.warn(); // Handle timeout error gracefully
        }
      };

      reloadWithTimeout();
    }, [userToken, userId]),
  );

  useEffect(() => {
    loadProfile();
  }, [userToken, userId]);

  // Validate Phone Number
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Adjust regex as needed
    return phoneRegex.test(phone);
  };

  // Validate Form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!personalDetails.firstName) errors.firstName = 'First name is required';
    else if (personalDetails.firstName.length < 3) {
      errors.firstName = 'First name must be at least 3 characters long';
    } else if (!nameRegex.test(personalDetails.firstName)) {
      errors.firstName = 'First name must only contain letters and spaces';
    }

    if (!personalDetails.lastName) errors.lastName = 'Last name is required';
    else if (personalDetails.lastName.length < 3) {
      errors.lastName = 'Last name must be at least 3 characters long';
    } else if (!nameRegex.test(personalDetails.lastName)) {
      errors.lastName = 'Last name must only contain letters and spaces';
    }

    if (!validatePhoneNumber(personalDetails.alternatePhoneNumber)) {
      errors.alternatePhoneNumber =
        'Mobile number must start with 6, 7, 8, or 9 and be 10 digits long';
    }
    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Update Basic Details
  const updateBasicDetails = async () => {
    // Trigger form validation
    const isValid = validateForm();
    if (!isValid) {
      // Prevent submission if there are validation errors
      return false;
    }

    try {
      const result = await ProfileService.updateBasicDetails(userToken, userId, personalDetails);
      if (result.success) {
        console.log("Basic details updated successfully:", result);
        try {
          const leadData = {
            data: [
              {
                Owner: { id: "4569859000019865042" },
                Last_Name: personalDetails.lastName,
                First_Name: personalDetails.firstName,
                Email: personalDetails.email,
                Phone: personalDetails.alternatePhoneNumber,
              },
            ],
          };
          console.log("Lead Data:", leadData);
          console.log("Lead Id:", leadId.leadId);
          const res = await updateLead(leadId.leadId, leadData);
          if (res?.status) {
            console.log("Lead updated status", res?.status);
          }

        } catch {
          console.log("Error updating lead");
        }
      } else {
        console.error("Error updating basic details:", result);
      }

      return result; // Indicate success
    } catch (error) {
      return false; // Indicate failure
    }
  };

  // Handle Input Changes
  const handleInputChange = (field: string, value: string) => {
    setPersonalDetails(prevState => ({ ...prevState, [field]: value }));
  };

  useEffect(() => {
    loadProfile();
  }, []);
  useEffect(() => {
    const uploadedFile = async () => {
      const result = await resumeCall(userId);
      if (result) {
        setHadResume(true);
        setOriginalHasResume(true); // Backup original API state
      }
    };
    uploadedFile();
  }, [userId]);

  useEffect(() => {
    if (isResumeModalVisible) {
      setbgcolor(false);
      setShowBorder(false);
      // If the API confirmed a resume exists and the user had removed it temporarily, restore it.
      if (hasResume && isResumeRemoved) {
        setResumeFile({
          uri: '',
          name: `${personalDetails?.firstName || 'user'}.pdf`,
          fileCopyUri: null,
          type: 'application/pdf',
          size: null,
        });
        setIsResumeRemoved(false); // Reset the removal flag
      }
    }
  }, [isResumeModalVisible]);

  useEffect(() => {
    if (userId && userToken) {
      fetchProfilePhoto(userToken, userId);
    }
  }, [userId, userToken]);
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const result = await ProfileService.checkVerified(userToken, userId);
        if (result) {
          setVerified(result);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    };

    checkVerification();
  }, [userId]);

  return {
    profileData,
    isLoading,
    setIsLoading,
    error,
    reloadProfile: loadProfile,
    personalDetails,
    formErrors,
    handleInputChange,
    updateBasicDetails,
    setFormErrors,
    resetPersonalDetails, // Add reset function to return object
    handleCamera,
    handlePermission,
    validatePhoto,
    uploadProfilePhoto,
    removePhoto,
    handleCancelUpload,
    handleUploadResume,
    handleSaveChanges,
    handleLibrary,
    handleSaveResume,
    isProfessionalFormVisible,
    setProfessionalFormVisible,
    isCameraOptionsVisible,
    setCameraOptionsVisible,
    isPersonalDetailsFormVisible,
    setPersonalDetailsFormVisible,
    isResumeModalVisible,
    setResumeModalVisible,
    loading,
    setLoading,
    progress,
    setProgress,
    resumeFile,
    setResumeFile,
    showBorder,
    bgcolor,
    verified,
    setShowBorder,
    isUploadComplete,
    setIsUploadComplete,
    hasResume,
    setHadResume,
    isResumeRemoved,
    photo,
  };
};

export const ProfileViewModel = {
  async saveProfessionalDetails(userToken: string | null, userId: number | null, updatedData: any) {
    const response = await ProfileService.updateProfessionalDetails(userToken, userId, updatedData);

    if (response.success) {
      return { success: true, profileData: response.profileData };
    } else {
      return { success: false, formErrors: response.formErrors };
    }
  },
};
