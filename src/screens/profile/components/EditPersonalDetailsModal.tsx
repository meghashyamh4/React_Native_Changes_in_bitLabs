import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import {ProfileApiService} from '@services/profile/ProfileApiService';
import {showToast} from '@services/login/ToastService';
import Toast from 'react-native-toast-message';
import {toastConfig} from '@components/Toast/toast_config';

interface EditPersonalDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialData: any;
}

const EditPersonalDetailsModal: React.FC<EditPersonalDetailsModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    pincode: '',
    address: '',
    knownLanguages: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [showLanguageInput, setShowLanguageInput] = useState(false);

  // Helper function to parse dateOfBirth and populate day/month/year
  const populateDateFields = (dob: string) => {
    if (!dob) {
      setDay('');
      setMonth('');
      setYear('');
      return;
    }

    // Handle both YYYY-MM-DD and DD/MM/YYYY formats
    if (dob.includes('-')) {
      // YYYY-MM-DD format
      const parts = dob.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    } else if (dob.includes('/')) {
      // DD/MM/YYYY format (legacy)
      const parts = dob.split('/');
      if (parts.length === 3) {
        setYear(parts[2]);
        setMonth(parts[1]);
        setDay(parts[0]);
      }
    }
  };

  useEffect(() => {
    if (visible && initialData) {
      const dob = initialData.dateOfBirth || '';
      setFormData({
        fullName: initialData.fullName || initialData.name || '', // Handle both fullName and name from API
        gender: initialData.gender || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        dateOfBirth: dob,
        pincode: initialData.pincode || '',
        address: initialData.address || '',
        knownLanguages: Array.isArray(initialData.knownLanguages)
          ? initialData.knownLanguages
          : [],
      });
      
      // Parse existing date of birth (YYYY-MM-DD format)
      // Don't populate day/month/year here - they will be populated when date picker opens
      
      setErrors({});
      setGenderOpen(false);
      setShowDatePicker(false);
    }
  }, [visible, initialData]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Full name is required';
        } else if (trimmed.length < 3) {
          return 'Full name must be at least 3 characters';
        } else if (trimmed.length > 100) {
          return 'Full name must not exceed 100 characters';
        } else if (/\s{2,}/.test(value)) {
          return 'Only one space allowed between characters';
        } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
          return 'Full name can only contain letters and spaces';
        }
        return '';
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Email is required';
        } else {
          const emailRegex = /^[^\s@]+@gmail\.com$/i;
          if (!emailRegex.test(trimmed)) {
            return 'Only @gmail.com email addresses are allowed';
          }
        }
        return '';
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Phone number is required';
        } else if (trimmed.length < 10) {
          return 'Phone number must be 10 digits';
        } else if (!/^[6-9]\d{9}$/.test(trimmed)) {
          return 'Invalid phone number. Must start with 6, 7, 8, or 9 and be 10 digits';
        }
        return '';
      }
      case 'pincode': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'PIN code is required';
        } else if (trimmed.length !== 6) {
          return 'PIN code must be 6 digits';
        } else if (trimmed === '000000') {
          return 'PIN code cannot be 000000';
        } else if (!/^\d{6}$/.test(trimmed)) {
          return 'PIN code must contain only digits';
        }
        return '';
      }
      case 'address': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Address is required';
        } else if (trimmed.length < 10) {
          return 'Address must be at least 10 characters';
        } else if (trimmed.length > 200) {
          return 'Address must not exceed 200 characters';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleChange = (field: string, value: string) => {
    // For text fields, prevent multiple consecutive spaces
    if (field === 'fullName' || field === 'address') {
      value = value.replace(/\s+/g, ' ');
    }
    setFormData({...formData, [field]: value});
    
    // Validate field in real-time
    const error = validateField(field, value);
    if (error) {
      setErrors({...errors, [field]: error});
    } else {
      // Clear error if field is now valid
      const newErrors = {...errors};
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Full Name - Required, min 3 characters
    const trimmedFullName = formData.fullName.trim();
    if (!trimmedFullName) {
      newErrors.fullName = 'Full name is required';
    } else if (trimmedFullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    } else if (trimmedFullName.length > 100) {
      newErrors.fullName = 'Full name must not exceed 100 characters';
    } else if (/\s{2,}/.test(formData.fullName)) {
      newErrors.fullName = 'Only one space allowed between characters';
    } else if (!/^[a-zA-Z\s]+$/.test(trimmedFullName)) {
      newErrors.fullName = 'Full name can only contain letters and spaces';
    }
    
    // Gender - Required
    if (!formData.gender) {
      newErrors.gender = 'Gender is required. Please select Male, Female, or Other';
    } else if (!['Male', 'Female', 'Other'].includes(formData.gender)) {
      newErrors.gender = 'Please select a valid gender (Male, Female, or Other)';
    }
    
    // Email - Required, validate format
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@gmail\.com$/i;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Only @gmail.com email addresses are allowed';
      }
    }
    
    // Phone - Required
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number. Must start with 6-9 and be 10 digits';
    }
    
    // Date of Birth - Required (YYYY-MM-DD format)
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Validate YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Invalid date format. Expected YYYY-MM-DD';
      } else {
        const parts = formData.dateOfBirth.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const d = parseInt(parts[2]);
        const date = new Date(y, m - 1, d);
        
        if (isNaN(date.getTime()) || date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) {
          newErrors.dateOfBirth = 'Invalid date. Please enter a valid date';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          date.setHours(0, 0, 0, 0);
          
          // Validate year must be greater than 1990
          if (y <= 1990) {
            newErrors.dateOfBirth = 'Year of birth must be greater than 1990';
          } else if (date > today) {
            newErrors.dateOfBirth = 'Date of birth cannot be in the future';
          } else {
            // Calculate accurate age considering month and day
            let age = today.getFullYear() - y;
            const monthDiff = today.getMonth() - date.getMonth();
            const dayDiff = today.getDate() - date.getDate();
            
            // Adjust age if birthday hasn't occurred this year
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              age--;
            }
            
            if (age < 16) {
              newErrors.dateOfBirth = 'You must be at least 16 years old';
            } else if (age > 100) {
              newErrors.dateOfBirth = 'Please enter a valid date of birth (age must be less than 100)';
            }
          }
        }
      }
    }
    
    // Pincode - Required
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'PIN code is required';
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = 'PIN code must be 6 digits';
    } else if (formData.pincode === '000000') {
      newErrors.pincode = 'PIN code cannot be 000000';
    }
    
    // Address - Required, min 3 characters
    const trimmedAddress = formData.address.trim();
    if (!trimmedAddress) {
      newErrors.address = 'Address is required';
    } else if (trimmedAddress.length < 3) {
      newErrors.address = 'Address must be at least 3 characters';
    } else if (trimmedAddress.length > 500) {
      newErrors.address = 'Address must not exceed 500 characters';
    } else if (/\s{2,}/.test(formData.address)) {
      newErrors.address = 'Only one space allowed between words';
    }
    
    // Known Languages - Required, at least one language, each min 3 characters
    if (formData.knownLanguages.length === 0) {
      newErrors.knownLanguages = 'At least one language is required';
    } else {
      const invalidLanguages = formData.knownLanguages.filter(lang => lang.trim().length < 3);
      if (invalidLanguages.length > 0) {
        newErrors.knownLanguages = 'Each language must be at least 3 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateSelect = () => {
    if (!day || !month || !year) {
      const errorMsg = 'Please fill all date fields (Day, Month, Year)';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }

    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    // Validate day
    if (isNaN(d) || d < 1 || d > 31) {
      const errorMsg = 'Day must be between 1 and 31';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    // Validate month
    if (isNaN(m) || m < 1 || m > 12) {
      const errorMsg = 'Month must be between 1 and 12';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    // Validate year - must be greater than 1990
    if (isNaN(y) || y <= 1990) {
      const errorMsg = 'Year of birth must be greater than 1990';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    // Validate year is not in the future
    const currentYear = new Date().getFullYear();
    if (y > currentYear) {
      const errorMsg = 'Year cannot be in the future';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    const date = new Date(y, m - 1, d);
    
    // Check if date is valid
    if (isNaN(date.getTime()) || date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) {
      const errorMsg = 'Please enter a valid date (e.g., 31 days not valid for February)';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: 'Please enter a valid date'});
      return;
    }
    
    // Check date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date > today) {
      const errorMsg = 'Date of birth cannot be in the future';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    // Calculate accurate age considering month and day
    let age = today.getFullYear() - y;
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    
    // Validate age must be at least 16 years
    if (age < 16) {
      const errorMsg = 'You must be at least 16 years old';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    } else if (age > 100) {
      const errorMsg = 'Please enter a valid date of birth (age must be less than 100)';
      showToast('error', errorMsg);
      setErrors({...errors, dateOfBirth: errorMsg});
      return;
    }
    
    // Format as YYYY-MM-DD for API
    const formattedDate = `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    setFormData({...formData, dateOfBirth: formattedDate});
    
    // Clear errors on success
    if (errors.dateOfBirth) {
      setErrors({...errors, dateOfBirth: ''});
    }
    
    // Close date picker modal
    setShowDatePicker(false);
    setFocusedField(null);
  };

  const handleSave = async () => {
    console.log('[EditPersonalDetailsModal] Save button pressed');
    
    if (!validate()) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        console.warn('[EditPersonalDetailsModal] Validation failed:', errorMessages);
        showToast('error', errorMessages[0]); // Show first error
      }
      return;
    }

    console.log('[EditPersonalDetailsModal] Starting update:', {
      userId,
      hasToken: !!userToken,
      fullName: formData.fullName,
    });

    setLoading(true);
    try {
      // Prepare payload matching API structure
      // API expects: address, dateOfBirth, email, gender, knownLanguages, name, phone, pincode
      const payload = {
        name: formData.fullName.trim(), // Map fullName to name for API
        gender: formData.gender,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth, // Already in YYYY-MM-DD format
        pincode: formData.pincode.trim(),
        address: formData.address.trim(),
        knownLanguages: formData.knownLanguages || [],
      };
      
      console.log('[EditPersonalDetailsModal] Sending payload:', JSON.stringify(payload, null, 2));
      
      const result = await ProfileApiService.updatePersonalDetails(userId, userToken, payload);
      console.log('[EditPersonalDetailsModal] Update result:', {
        success: result.success,
        error: result.error,
      });
      
      if (result.success) {
        console.log('[EditPersonalDetailsModal] Update successful');
        // Stop loading first
        setLoading(false);
        // Close modal immediately to prevent reopening
        onClose();
        // Show success snackbar after closing modal
        showToast('success', 'Personal details saved successfully');
        // Call onSuccess to trigger data refresh after closing modal
        // Use setTimeout to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        // Handle API error responses
        setLoading(false);
        let errorMessage = 'Failed to update personal details. Please try again.';
        
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error;
          } else if (result.error.message) {
            errorMessage = result.error.message;
          } else if (result.error.error) {
            errorMessage = result.error.error;
          } else if (result.error.errors) {
            // Handle multiple validation errors from API
            const validationErrors = result.error.errors;
            if (typeof validationErrors === 'object' && validationErrors !== null) {
              const errorMessages = Object.values(validationErrors).flat() as any[];
              errorMessage = Array.isArray(errorMessages) && errorMessages.length > 0 
                ? String(errorMessages[0]) 
                : String(errorMessages);
            }
          }
        } else if ((result as any).message) {
          errorMessage = (result as any).message;
        }
        
        console.error('[EditPersonalDetailsModal] Update failed:', errorMessage);
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      // Error case - show error snackbar with proper details and keep modal open
      console.error('[EditPersonalDetailsModal] Update error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      setLoading(false);
      
      // Handle network errors and API errors with detailed messages
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.response) {
        // API returned an error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          // Bad Request - validation errors - show detailed response
          if (data?.message) {
            errorMessage = data.message;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (data?.errors) {
            // Handle multiple validation errors - show first one or all if single
            const validationErrors = data.errors;
            if (typeof validationErrors === 'object' && validationErrors !== null) {
              const errorValues = Object.values(validationErrors);
              if (errorValues.length > 0) {
                const firstError = errorValues[0] as any;
                if (Array.isArray(firstError) && firstError.length > 0) {
                  errorMessage = String(firstError[0]);
                } else {
                  errorMessage = String(firstError);
                }
              } else {
                errorMessage = 'Invalid data. Please check all fields and try again.';
              }
            } else {
              errorMessage = String(validationErrors);
            }
          } else if (data?.data?.message) {
            errorMessage = data.data.message;
          } else if (data?.data?.error) {
            errorMessage = data.data.error;
          } else {
            errorMessage = 'Invalid data. Please check all fields and try again.';
          }
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (status === 404) {
          errorMessage = 'Resource not found. Please try again.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.data?.message) {
          errorMessage = data.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('[EditPersonalDetailsModal] Update error message:', errorMessage);
      showToast('error', errorMessage);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Personal Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.fullName && styles.inputError,
                    focusedField === 'fullName' && styles.inputFocused,
                  ]}
                  value={formData.fullName}
                  onChangeText={value => handleChange('fullName', value)}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
                <DropDownPicker
                  open={genderOpen}
                  value={formData.gender}
                  items={[
                    {label: 'Male', value: 'Male'},
                    {label: 'Female', value: 'Female'},
                    {label: 'Other', value: 'Other'},
                  ]}
                  setOpen={setGenderOpen}
                  setValue={value => {
                    const genderValue = typeof value === 'function' ? value(formData.gender) : value;
                    handleChange('gender', genderValue || '');
                    setErrors({...errors, gender: ''});
                  }}
                  placeholder="Select Gender"
                  style={[styles.dropdown, errors.gender && styles.inputError]}
                  dropDownContainerStyle={styles.dropdownContainer}
                  placeholderStyle={styles.placeholderText}
                  textStyle={styles.dropdownText}
                  listMode="SCROLLVIEW"
                  zIndex={3000}
                  zIndexInverse={1000}
                />
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text 
                    style={styles.inputDisabledText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formData.email || 'example@gmail.com'}
                  </Text>
                </View>
                {formData.email && (
                  <Text style={styles.hintText}>Email cannot be changed</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.phone && styles.inputError,
                    focusedField === 'phone' && styles.inputFocused,
                  ]}
                  value={formData.phone}
                  onChangeText={value => {
                    const numeric = value.replace(/[^0-9]/g, '');
                    if (numeric.length <= 10) {
                      handleChange('phone', numeric);
                    }
                  }}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 10-digit phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.dateInputContainer,
                    errors.dateOfBirth && styles.inputError,
                    focusedField === 'dateOfBirth' && styles.inputFocused,
                  ]}
                  onPress={() => {
                    setFocusedField('dateOfBirth');
                    setShowDatePicker(true);
                  }}>
                  <Text style={[styles.dateText, !formData.dateOfBirth && styles.placeholderText, styles.dateTextFlex]}>
                    {formData.dateOfBirth 
                      ? (() => {
                          // Display in DD/MM/YYYY format for user (e.g., 06/05/2000)
                          const parts = formData.dateOfBirth.split('-');
                          if (parts.length === 3) {
                            const day = parts[2].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            const year = parts[0];
                            return `${day}/${month}/${year}`;
                          }
                          return formData.dateOfBirth;
                        })()
                      : 'Select Date of Birth'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#666" />
                </TouchableOpacity>
                {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN Code <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.pincode && styles.inputError,
                    focusedField === 'pincode' && styles.inputFocused,
                  ]}
                  value={formData.pincode}
                  onChangeText={value => {
                    const numeric = value.replace(/[^0-9]/g, '');
                    if (numeric.length <= 6) {
                      handleChange('pincode', numeric);
                    }
                  }}
                  onFocus={() => setFocusedField('pincode')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter 6-digit PIN code"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Permanent Address <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.address && styles.inputError,
                    focusedField === 'address' && styles.inputFocused,
                  ]}
                  value={formData.address}
                  onChangeText={value => handleChange('address', value)}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter permanent address"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Known Languages <Text style={styles.required}>*</Text></Text>
                {errors.knownLanguages && <Text style={styles.errorText}>{errors.knownLanguages}</Text>}
                
                {/* Display existing languages as chips */}
                {formData.knownLanguages.length > 0 && (
                  <View style={styles.languagesContainer}>
                    {formData.knownLanguages.map((lang, index) => (
                      <View key={index} style={styles.languageChip}>
                        <Text style={styles.languageChipText}>{lang}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const updated = formData.knownLanguages.filter((_, i) => i !== index);
                            setFormData({...formData, knownLanguages: updated});
                          }}
                          style={styles.removeLanguageButton}>
                          <MaterialIcons name="close" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add new language input */}
                {showLanguageInput ? (
                  <View style={styles.addLanguageContainer}>
                    <TextInput
                      style={styles.languageInput}
                      value={newLanguage}
                      onChangeText={setNewLanguage}
                      placeholder="Enter language name"
                      placeholderTextColor="#9ca3af"
                      autoFocus
                      onSubmitEditing={() => {
                        if (newLanguage.trim()) {
                          const trimmed = newLanguage.trim();
                          if (trimmed.length < 3) {
                            showToast('error', 'Each language must be at least 3 characters');
                            return;
                          }
                          if (!formData.knownLanguages.includes(trimmed)) {
                            setFormData({
                              ...formData,
                              knownLanguages: [...formData.knownLanguages, trimmed],
                            });
                            if (errors.knownLanguages) {
                              setErrors({...errors, knownLanguages: ''});
                            }
                          }
                          setNewLanguage('');
                          setShowLanguageInput(false);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.addLanguageButton}
                      onPress={() => {
                        if (newLanguage.trim()) {
                          const trimmed = newLanguage.trim();
                          if (trimmed.length < 3) {
                            showToast('error', 'Each language must be at least 3 characters');
                            return;
                          }
                          if (!formData.knownLanguages.includes(trimmed)) {
                            setFormData({
                              ...formData,
                              knownLanguages: [...formData.knownLanguages, trimmed],
                            });
                            if (errors.knownLanguages) {
                              setErrors({...errors, knownLanguages: ''});
                            }
                          }
                          setNewLanguage('');
                          setShowLanguageInput(false);
                        }
                      }}>
                      <MaterialIcons name="check" size={20} color="#F97316" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelLanguageButton}
                      onPress={() => {
                        setNewLanguage('');
                        setShowLanguageInput(false);
                      }}>
                      <MaterialIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addLanguageButtonContainer}
                    onPress={() => setShowLanguageInput(true)}>
                    <MaterialIcons name="add" size={20} color="#F97316" />
                    <Text style={styles.addLanguageText}>Add Language</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Toast config={toastConfig} />
      </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.datePickerOverlay}>
          <Toast config={toastConfig} />
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => {
                setShowDatePicker(false);
                setFocusedField(null);
              }}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputRow}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Day</Text>
                <View style={styles.dateFieldContainer}>
                  <TextInput
                    style={styles.dateField}
                    value={day}
                    onChangeText={value => {
                      const numeric = value.replace(/[^0-9]/g, '');
                      if (numeric === '') {
                        setDay('');
                      } else if (numeric.length <= 2) {
                        setDay(numeric);
                      }
                    }}
                    placeholder="DD"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {day ? (
                    <TouchableOpacity
                      style={styles.dateFieldClearButton}
                      onPress={() => setDay('')}>
                      <MaterialIcons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Month</Text>
                <View style={styles.dateFieldContainer}>
                  <TextInput
                    style={styles.dateField}
                    value={month}
                    onChangeText={value => {
                      const numeric = value.replace(/[^0-9]/g, '');
                      if (numeric === '') {
                        setMonth('');
                      } else if (numeric.length <= 2) {
                        setMonth(numeric);
                      }
                    }}
                    placeholder="MM"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {month ? (
                    <TouchableOpacity
                      style={styles.dateFieldClearButton}
                      onPress={() => setMonth('')}>
                      <MaterialIcons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Year</Text>
                <View style={styles.dateFieldContainer}>
                  <TextInput
                    style={styles.dateField}
                    value={year}
                    onChangeText={value => {
                      const numeric = value.replace(/[^0-9]/g, '');
                      if (numeric === '') {
                        setYear('');
                      } else if (numeric.length <= 4) {
                        const numValue = parseInt(numeric);
                        if (!isNaN(numValue)) {
                          setYear(numeric);
                        }
                      }
                    }}
                    placeholder="YYYY"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {year ? (
                    <TouchableOpacity
                      style={styles.dateFieldClearButton}
                      onPress={() => setYear('')}>
                      <MaterialIcons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            <Text style={styles.dateFormatHint}>
              Enter date in format: DD/MM/YYYY (e.g., 06/05/2000)
            </Text>

            {/* Error Message Display */}
            {errors.dateOfBirth && (
              <View style={styles.datePickerErrorContainer}>
                <MaterialIcons name="error-outline" size={18} color="#d32f2f" />
                <Text style={styles.datePickerErrorText}>{errors.dateOfBirth}</Text>
              </View>
            )}

            {/* Clear All Button */}
            {(day || month || year) && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => {
                  setDay('');
                  setMonth('');
                  setYear('');
                  if (errors.dateOfBirth) {
                    setErrors({...errors, dateOfBirth: ''});
                  }
                }}>
                <MaterialIcons name="clear" size={16} color="#F97316" />
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}

            {day && month && year && (
              <View style={styles.selectedDateDisplay}>
                <MaterialIcons name="event" size={16} color="#F97316" />
                <Text style={styles.selectedDateText}>
                  Preview: {day.padStart(2, '0')}/{month.padStart(2, '0')}/{year}
                </Text>
              </View>
            )}

            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.dateCancelButton}
                onPress={() => {
                  // Reset to current dateOfBirth instead of clearing
                  if (formData.dateOfBirth) {
                    populateDateFields(formData.dateOfBirth);
                  } else {
                    setDay('');
                    setMonth('');
                    setYear('');
                  }
                  setShowDatePicker(false);
                  setFocusedField(null);
                  if (errors.dateOfBirth) {
                    setErrors({...errors, dateOfBirth: ''});
                  }
                }}>
                <Text style={styles.dateCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateConfirmButton} 
                onPress={handleDateSelect}>
                <Text style={styles.dateConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  scrollView: {
    maxHeight: 500,
    flexGrow: 0,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  inputDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.7,
    justifyContent: 'center',
  },
  inputDisabledText: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  inputFocused: {
    borderColor: '#F97316',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  hintText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    minHeight: 45,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  placeholderText: {
    color: '#9ca3af',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2B2B2B',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  dateTextFlex: {
    flex: 1,
  },
  clearDateButton: {
    position: 'absolute',
    right: 40,
    padding: 4,
    zIndex: 1,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2B2B2B',
    flex: 1,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  calendarContainer: {
    gap: 16,
  },
  calendarHint: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    textAlign: 'center',
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D26B15',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    gap: 6,
  },
  languageChipText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D26B15',
  },
  removeLanguageButton: {
    padding: 2,
  },
  addLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  languageInput: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  addLanguageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF7F0',
  },
  cancelLanguageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  addLanguageButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addLanguageText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#F97316',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  datePickerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateInputGroup: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  dateFieldContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateField: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    paddingRight: 32,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    flex: 1,
  },
  dateFieldClearButton: {
    position: 'absolute',
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  dateFormatHint: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  datePickerErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 16,
  },
  datePickerErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#d32f2f',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    marginBottom: 12,
    alignSelf: 'center',
  },
  clearAllButtonText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#F97316',
  },
  dateConfirmButtonDisabled: {
    opacity: 0.5,
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  dateCancelButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  dateConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  dateConfirmButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#fff',
  },
  required: {
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default EditPersonalDetailsModal;

