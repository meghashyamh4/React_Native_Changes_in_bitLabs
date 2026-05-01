import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { showToast } from '@services/login/ToastService';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@components/Toast/toast_config';

interface EditBasicDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialData: {
    name: string;
    role: string;
    mobileNumber: string;
    email: string;
    passYear: number | null;
    address: string;
  };
}

interface FormData {
  name: string;
  role: string;
  mobileNumber: string;
  email: string;
  passYear: string;
  address: string;
}

const EditBasicDetailsModal: React.FC<EditBasicDetailsModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialData.name || '',
    role: initialData.role || '',
    mobileNumber: initialData.mobileNumber || '',
    email: initialData.email || '',
    passYear: initialData.passYear ? String(initialData.passYear) : '',
    address: initialData.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      console.log('[EditBasicDetailsModal] Resetting form data with:', initialData);
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        mobileNumber: initialData.mobileNumber || '',
        email: initialData.email || '',
        passYear: initialData.passYear ? String(initialData.passYear) : '',
        address: initialData.address || '',
      });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const validateField = (field: string, value: string): string => {
    const safeValue = value || '';
    switch (field) {
      case 'name': {
        const trimmedName = safeValue.trim();
        if (!trimmedName) {
          return 'Name is required';
        } else if (trimmedName.length < 3) {
          return 'Name must be at least 3 characters';
        } else if (trimmedName.length > 100) {
          return 'Name must not exceed 100 characters';
        } else if (/\s{2,}/.test(safeValue)) {
          return 'Only one space allowed between characters';
        } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
          return 'Name can only contain letters and spaces';
        }
        return '';
      }
      case 'role': {
        const trimmedRole = safeValue.trim();
        if (!trimmedRole) {
          return 'Role is required';
        } else if (trimmedRole.length < 3) {
          return 'Role must be at least 3 characters';
        } else if (trimmedRole.length > 100) {
          return 'Role must not exceed 100 characters';
        } else if (/\s{2,}/.test(safeValue)) {
          return 'Only one space allowed between characters';
        }
        return '';
      }
      case 'mobileNumber': {
        const trimmed = safeValue.trim();
        if (!trimmed) {
          return 'Mobile number is required';
        } else if (trimmed.length < 10) {
          return 'Mobile number must be 10 digits';
        } else if (!/^[6-9]\d{9}$/.test(trimmed)) {
          return 'Invalid mobile number. Must start with 6, 7, 8, or 9 and be 10 digits';
        }
        return '';
      }
      case 'passYear': {
        const trimmed = safeValue.trim();
        if (!trimmed) {
          return 'Pass year is required';
        } else {
          const year = parseInt(trimmed, 10);
          if (isNaN(year)) {
            return 'Pass year must be a valid number';
          } else if (year < 1900) {
            return 'Pass year must be 1900 or later';
          } else if (year > 2029) {
            return 'Pass year must be 2029 or earlier';
          }
        }
        return '';
      }
      case 'address': {
        const trimmedAddress = safeValue.trim();
        if (!trimmedAddress) {
          return 'Address is required';
        } else if (trimmedAddress.length < 3) {
          return 'Address must be at least 3 characters';
        } else if (trimmedAddress.length > 100) {
          return 'Address must not exceed 100 characters';
        } else if (/\s{2,}/.test(safeValue)) {
          return 'Only one space allowed between characters';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleChange = (field: string, value: string) => {
    // For name, role, and address, prevent multiple consecutive spaces
    if (field === 'name' || field === 'role' || field === 'address') {
      // Replace multiple spaces with single space
      value = value.replace(/\s+/g, ' ');
    }
    setFormData({ ...formData, [field]: value });

    // Validate field in real-time
    const error = validateField(field, value);
    if (error) {
      setErrors({ ...errors, [field]: error });
    } else {
      // Clear error if field is now valid
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Return errors object instead of boolean for synchronous checking
  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    console.log('[EditBasicDetailsModal] Validating form data:', formData);

    // Helper to safely get string values
    const safeFormData = {
      name: formData.name || '',
      role: formData.role || '',
      mobileNumber: formData.mobileNumber || '',
      address: formData.address || '',
      passYear: formData.passYear || '',
    };

    // Validate name: min 3, max 100, only one space between characters
    const trimmedName = safeFormData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
    } else if (/\s{2,}/.test(safeFormData.name)) {
      newErrors.name = 'Only one space allowed between characters';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    // Validate role: min 3, max 100, only one space between characters
    const trimmedRole = safeFormData.role.trim();
    if (!trimmedRole) {
      newErrors.role = 'Role is required';
    } else if (trimmedRole.length < 3) {
      newErrors.role = 'Role must be at least 3 characters';
    } else if (trimmedRole.length > 100) {
      newErrors.role = 'Role must not exceed 100 characters';
    } else if (/\s{2,}/.test(safeFormData.role)) {
      newErrors.role = 'Only one space allowed between characters';
    }

    // Validate mobile number (required)
    if (!safeFormData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(safeFormData.mobileNumber)) {
      newErrors.mobileNumber = 'Invalid mobile number. Must start with 6, 7, 8, or 9 and be 10 digits';
    }

    // Validate pass year (required)
    if (!safeFormData.passYear.trim()) {
      newErrors.passYear = 'Pass year is required';
    } else {
      const year = parseInt(safeFormData.passYear, 10);
      if (isNaN(year) || year < 1900 || year > 2029) {
        newErrors.passYear = 'Pass year must be between 1900 and 2029';
      }
    }

    // Validate address: min 3, max 100, only one space between characters
    const trimmedAddress = safeFormData.address.trim();
    if (!trimmedAddress) {
      newErrors.address = 'Address is required';
    } else if (trimmedAddress.length < 3) {
      newErrors.address = 'Address must be at least 3 characters';
    } else if (trimmedAddress.length > 100) {
      newErrors.address = 'Address must not exceed 100 characters';
    } else if (/\s{2,}/.test(safeFormData.address)) {
      newErrors.address = 'Only one space allowed between characters';
    }

    console.log('[EditBasicDetailsModal] Validation result:', newErrors);
    setErrors(newErrors);
    return newErrors;
  };

  const handleSave = async () => {
    console.log('[EditBasicDetailsModal] Save button pressed');

    // Get validation errors synchronously
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      // Get all error messages directly from the validation result
      const errorMessages = Object.values(validationErrors).filter(msg => msg && msg.trim() !== '');

      if (errorMessages.length > 0) {
        // Show all validation errors in snackbar
        const errorText = errorMessages.length === 1
          ? errorMessages[0]
          : `Please fill all highlighted required fields:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;

        console.warn('[EditBasicDetailsModal] Validation failed:', errorMessages);
        showToast('error', errorText);
      } else {
        showToast('error', 'Please fill all required fields');
      }
      return;
    }

    console.log('[EditBasicDetailsModal] Starting update:', {
      userId,
      hasToken: !!userToken,
      name: formData.name,
      role: formData.role,
    });

    setLoading(true);
    try {
      // Convert passYear to passOutyear for API (API expects passOutyear)
      const passOutyear = formData.passYear && formData.passYear.trim()
        ? parseInt(formData.passYear.trim(), 10)
        : 0;

      const dataToSend = {
        name: formData.name.trim(), // Trim whitespace before sending
        role: formData.role.trim(), // Trim whitespace before sending
        address: formData.address.trim(), // Changed from city to address
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        passOutyear: passOutyear, // API expects passOutyear (not passYear), must be a number (0 if not provided)
      };

      console.log('[EditBasicDetailsModal] Payload being sent:', JSON.stringify(dataToSend, null, 2));

      const result = await ProfileApiService.updateCard(userId, userToken, dataToSend);
      console.log('[EditBasicDetailsModal] Update result:', {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log('[EditBasicDetailsModal] Update successful');
        // Stop loading first
        setLoading(false);
        // Close modal immediately to prevent reopening
        onClose();
        // Show success snackbar after closing modal
        showToast('success', 'Basic details saved successfully');
        // Call onSuccess to trigger data refresh after closing modal
        // Use setTimeout to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        // Extract detailed error message from API response
        let errorMessage = 'Failed to update basic details. Please try again.';

        if (result.error) {
          // Handle object with field-specific errors
          if (typeof result.error === 'object' && !Array.isArray(result.error)) {
            const errorFields = Object.keys(result.error);
            if (errorFields.length > 0) {
              // Get first error field and message
              const firstField = errorFields[0];
              const firstError = result.error[firstField];
              errorMessage = typeof firstError === 'string'
                ? firstError
                : `${firstField}: ${JSON.stringify(firstError)}`;
            } else if (result.error.message) {
              errorMessage = result.error.message;
            } else if (result.error.error) {
              errorMessage = result.error.error;
            }
          } else if (typeof result.error === 'string') {
            errorMessage = result.error;
          }
        }

        console.error('[EditBasicDetailsModal] Update failed:', {
          error: result.error,
          errorMessage,
        });
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[EditBasicDetailsModal] Update error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred. Please try again.';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent} pointerEvents="box-none">
          <View style={styles.header}>
            <Text style={styles.title}>Edit Basic Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic details</Text>
            </View> */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError,
                    focusedField === 'name' && styles.inputFocused,
                  ]}
                  value={formData.name}
                  onChangeText={value => handleChange('name', value)}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.role && styles.inputError,
                    focusedField === 'role' && styles.inputFocused,
                  ]}
                  value={formData.role}
                  onChangeText={value => handleChange('role', value)}
                  placeholder="Enter role"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('role')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.mobileNumber && styles.inputError,
                    focusedField === 'mobileNumber' && styles.inputFocused,
                  ]}
                  value={formData.mobileNumber}
                  onChangeText={value => {
                    const numeric = value.replace(/[^0-9]/g, '');
                    if (numeric.length <= 10) {
                      handleChange('mobileNumber', numeric);
                    }
                  }}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={10}
                  onFocus={() => setFocusedField('mobileNumber')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.mobileNumber && (
                  <Text style={styles.errorText}>{errors.mobileNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text
                    style={styles.inputDisabledText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formData.email || 'Email'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pass Year <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.passYear && styles.inputError,
                    focusedField === 'passYear' && styles.inputFocused,
                  ]}
                  value={formData.passYear}
                  onChangeText={value => {
                    const numeric = value.replace(/[^0-9]/g, '');
                    if (numeric.length <= 4) {
                      handleChange('passYear', numeric);
                    }
                  }}
                  placeholder="Enter pass year"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={4}
                  onFocus={() => setFocusedField('passYear')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.passYear && <Text style={styles.errorText}>{errors.passYear}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.address && styles.inputError,
                    focusedField === 'address' && styles.inputFocused,
                  ]}
                  value={formData.address}
                  onChangeText={value => handleChange('address', value)}
                  placeholder="Enter address"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
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
    flex: 1,
    justifyContent: 'space-between',
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
    flex: 1,
    maxHeight: '70%',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
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
  inputError: {
    borderColor: '#d32f2f',
  },
  inputFocused: {
    borderColor: '#F97316',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
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
  required: {
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default EditBasicDetailsModal;

