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

interface EditProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialData: any;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    projectTitle: '',
    specialization: '',
    technologiesUsed: '',
    teamSize: '',
    roleInProject: '',
    roleDescription: '',
    projectDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        projectTitle: initialData.projectTitle || '',
        specialization: initialData.specialization || '',
        technologiesUsed: initialData.technologiesUsed || '',
        teamSize: initialData.teamSize ? String(initialData.teamSize) : '',
        roleInProject: initialData.roleInProject || '',
        roleDescription: initialData.roleDescription || '',
        projectDescription: initialData.projectDescription || '',
      });
      setErrors({});
    }
  }, [visible, initialData]);

  const handleChange = (field: string, value: string) => {
    // For text fields, prevent multiple consecutive spaces
    if (field !== 'teamSize') {
      value = value.replace(/\s+/g, ' ');
    }
    setFormData({ ...formData, [field]: value });

    // Real-time validation for specific fields
    if (errors[field]) {
      const trimmedValue = value.trim();
      let isValid = true;

      // Clear error if field meets minimum requirements
      if (field === 'roleDescription' || field === 'projectDescription') {
        isValid = trimmedValue.length >= 15;
      } else if (field !== 'teamSize') {
        isValid = trimmedValue.length >= 3;
      } else if (field === 'teamSize') {
        const teamSizeNum = parseInt(trimmedValue, 10);
        isValid = !isNaN(teamSizeNum) && teamSizeNum >= 1 && teamSizeNum <= 1000;
      }

      if (isValid || trimmedValue.length === 0) {
        setErrors({ ...errors, [field]: '' });
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Project Title - Required, minimum 3 characters
    const projectTitle = formData.projectTitle.trim();
    if (!projectTitle) {
      newErrors.projectTitle = 'Project title is required';
    } else if (projectTitle.length < 3) {
      newErrors.projectTitle = 'Project title must be at least 3 characters';
    } else if (projectTitle.length > 100) {
      newErrors.projectTitle = 'Project title must not exceed 100 characters';
    }

    // Specialization - Required, minimum 3 characters
    const specialization = formData.specialization.trim();
    if (!specialization) {
      newErrors.specialization = 'Specialization is required';
    } else if (specialization.length < 3) {
      newErrors.specialization = 'Specialization must be at least 3 characters';
    } else if (specialization.length > 100) {
      newErrors.specialization = 'Specialization must not exceed 100 characters';
    }

    // Technologies Used - Required, minimum 3 characters
    const technologiesUsed = formData.technologiesUsed.trim();
    if (!technologiesUsed) {
      newErrors.technologiesUsed = 'Technologies used is required';
    } else if (technologiesUsed.length < 3) {
      newErrors.technologiesUsed = 'Technologies used must be at least 3 characters';
    } else if (technologiesUsed.length > 200) {
      newErrors.technologiesUsed = 'Technologies used must not exceed 200 characters';
    }

    // Team Size - Required, must be a valid number between 1 and 1000
    const teamSize = formData.teamSize.trim();
    if (!teamSize) {
      newErrors.teamSize = 'Team size is required';
    } else {
      const teamSizeNum = parseInt(teamSize, 10);
      if (isNaN(teamSizeNum) || teamSizeNum < 1) {
        newErrors.teamSize = 'Team size must be a valid number greater than 0';
      } else if (teamSizeNum > 1000) {
        newErrors.teamSize = 'Team size must not exceed 1000';
      }
    }

    // Role In Project - Required, minimum 3 characters
    const roleInProject = formData.roleInProject.trim();
    if (!roleInProject) {
      newErrors.roleInProject = 'Your role is required';
    } else if (roleInProject.length < 3) {
      newErrors.roleInProject = 'Your role must be at least 3 characters';
    } else if (roleInProject.length > 100) {
      newErrors.roleInProject = 'Your role must not exceed 100 characters';
    }

    // Role Description - Required, minimum 15 characters
    const roleDescription = formData.roleDescription.trim();
    if (!roleDescription) {
      newErrors.roleDescription = 'Role description is required';
    } else if (roleDescription.length < 15) {
      newErrors.roleDescription = 'Role description must be at least 15 characters';
    } else if (roleDescription.length > 1000) {
      newErrors.roleDescription = 'Role description must not exceed 1000 characters';
    }

    // Project Description - Required, minimum 15 characters
    const projectDescription = formData.projectDescription.trim();
    if (!projectDescription) {
      newErrors.projectDescription = 'Project description is required';
    } else if (projectDescription.length < 15) {
      newErrors.projectDescription = 'Project description must be at least 15 characters';
    } else if (projectDescription.length > 1000) {
      newErrors.projectDescription = 'Project description must not exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('[EditProjectModal] Save button pressed');

    // Validate all fields
    const isValid = validate();

    if (!isValid) {
      // Get all error messages
      const errorMessages = Object.values(errors).filter(msg => msg && msg.trim() !== '');

      if (errorMessages.length > 0) {
        // Show all validation errors in snackbar
        const errorText = errorMessages.length === 1
          ? errorMessages[0]
          : `Please fill all highlighted required fields:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;

        console.warn('[EditProjectModal] Validation failed:', errorMessages);
        showToast('error', errorText);
      } else {
        showToast('error', 'Please fill all required fields');
      }
      return;
    }

    console.log('[EditProjectModal] Starting update:', {
      userId,
      hasToken: !!userToken,
      projectTitle: formData.projectTitle,
      isEdit: !!initialData?.projectId || !!initialData?.id,
      projectId: initialData?.projectId || initialData?.id
    });

    setLoading(true);
    try {
      // API expects: projectDescription, projectTitle, roleDescription, roleInProject, specialization, teamSize, technologiesUsed
      const dataToSend = {
        projectTitle: formData.projectTitle.trim(),
        specialization: formData.specialization.trim(),
        technologiesUsed: formData.technologiesUsed.trim(),
        teamSize: formData.teamSize ? parseInt(formData.teamSize, 10) : 0,
        roleInProject: formData.roleInProject.trim(),
        roleDescription: formData.roleDescription.trim(),
        projectDescription: formData.projectDescription.trim(),
      };

      console.log('[EditProjectModal] Payload being sent:', JSON.stringify(dataToSend, null, 2));

      let result;
      const projectId = initialData?.projectId || initialData?.id;

      if (projectId) {
        // Update existing project
        result = await ProfileApiService.updateProjectById(userId, userToken, projectId, dataToSend);
      } else {
        // Create new project
        result = await ProfileApiService.createProject(userId, userToken, dataToSend);
      }

      console.log('[EditProjectModal] Operation result:', {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log('[EditProjectModal] Operation successful');
        // Stop loading first
        setLoading(false);
        // Close modal immediately
        onClose();
        // Show success snackbar
        showToast('success', projectId ? 'Project details updated successfully' : 'New project added successfully');
        // Call onSuccess to trigger data refresh
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        // Extract detailed error message from API response
        let errorMessage = 'Failed to save project details. Please try again.';

        if (result.error) {
          console.log('[EditProjectModal] Handling error object:', JSON.stringify(result.error));

          if (typeof result.error === 'object' && !Array.isArray(result.error)) {
            const errorFields = Object.keys(result.error);
            if (errorFields.length > 0) {
              const firstField = errorFields[0];
              const firstError = result.error[firstField];
              errorMessage = typeof firstError === 'string'
                ? firstError
                : `${firstField}: ${firstError?.toString()}`;
            } else if (result.error.message) {
              errorMessage = result.error.message;
            } else if (result.error.error) {
              errorMessage = result.error.error;
            }
          } else if (typeof result.error === 'string') {
            errorMessage = result.error;
          }
        }

        console.error('[EditProjectModal] Operation failed:', {
          error: result.error,
          errorMessage,
        });
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[EditProjectModal] Exception during operation:', error);
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
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Project Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Project Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.projectTitle && styles.inputError,
                    focusedField === 'projectTitle' && styles.inputFocused,
                  ]}
                  value={formData.projectTitle}
                  onChangeText={value => handleChange('projectTitle', value)}
                  placeholder="Enter project title (min 3 characters)"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('projectTitle')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.projectTitle && (
                  <Text style={styles.errorText}>{errors.projectTitle}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.specialization && styles.inputError,
                    focusedField === 'specialization' && styles.inputFocused,
                  ]}
                  value={formData.specialization}
                  onChangeText={value => handleChange('specialization', value)}
                  placeholder="Enter specialization (min 3 characters)"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('specialization')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.specialization && (
                  <Text style={styles.errorText}>{errors.specialization}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Technologies Used <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.technologiesUsed && styles.inputError,
                    focusedField === 'technologiesUsed' && styles.inputFocused,
                  ]}
                  value={formData.technologiesUsed}
                  onChangeText={value => handleChange('technologiesUsed', value)}
                  placeholder="Enter technologies (min 3 characters)"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('technologiesUsed')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.technologiesUsed && (
                  <Text style={styles.errorText}>{errors.technologiesUsed}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Team Size <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.teamSize && styles.inputError,
                    focusedField === 'teamSize' && styles.inputFocused,
                  ]}
                  value={formData.teamSize}
                  onChangeText={value => {
                    const numeric = value.replace(/[^0-9]/g, '');
                    handleChange('teamSize', numeric);
                  }}
                  placeholder="Enter team size (1-1000)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('teamSize')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.teamSize && (
                  <Text style={styles.errorText}>{errors.teamSize}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Role <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.roleInProject && styles.inputError,
                    focusedField === 'roleInProject' && styles.inputFocused,
                  ]}
                  value={formData.roleInProject}
                  onChangeText={value => handleChange('roleInProject', value)}
                  placeholder="Enter your role (min 3 characters)"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => setFocusedField('roleInProject')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.roleInProject && (
                  <Text style={styles.errorText}>{errors.roleInProject}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Role Description <Text style={styles.required}>*</Text></Text>
                  <Text style={[
                    styles.charCount,
                    formData.roleDescription.trim().length < 15 && formData.roleDescription.trim().length > 0 && styles.charCountWarning
                  ]}>
                    {/* {changed} */}
                    {formData.roleDescription.trim().length}/1000 max
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.roleDescription && styles.inputError,
                    focusedField === 'roleDescription' && styles.inputFocused,
                  ]}
                  value={formData.roleDescription}
                  onChangeText={value => handleChange('roleDescription', value)}
                  placeholder="Enter role description (minimum 15 characters)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('roleDescription')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.roleDescription && (
                  <Text style={styles.errorText}>{errors.roleDescription}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Project Description <Text style={styles.required}>*</Text></Text>
                  <Text style={[
                    styles.charCount,
                    formData.projectDescription.trim().length < 15 && formData.projectDescription.trim().length > 0 && styles.charCountWarning
                  ]}>
                    {/* {changed} */}
                    {formData.projectDescription.trim().length}/1000 max
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.projectDescription && styles.inputError,
                    focusedField === 'projectDescription' && styles.inputFocused,
                  ]}
                  value={formData.projectDescription}
                  onChangeText={value => handleChange('projectDescription', value)}
                  placeholder="Enter project description (minimum 15 characters)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('projectDescription')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.projectDescription && (
                  <Text style={styles.errorText}>{errors.projectDescription}</Text>
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
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  charCountWarning: {
    color: '#d32f2f',
  },
  required: {
    color: '#F97316',
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
  textArea: {
    minHeight: 100,
    maxHeight: 150,
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
    fontFamily: 'PlusJakartaSans-Medium',
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
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#fff',
  },
});

export default EditProjectModal;

