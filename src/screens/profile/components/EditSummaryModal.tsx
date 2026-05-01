import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { showToast } from '@services/login/ToastService';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@components/Toast/toast_config';

interface EditSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialSummary: string;
}

const EditSummaryModal: React.FC<EditSummaryModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialSummary,
}) => {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setSummary(initialSummary);
      setError('');
    }
  }, [visible, initialSummary]);

  const handleSave = async () => {
    console.log('[EditSummaryModal] Save button pressed');

    const trimmedSummary = summary.trim();

    if (!trimmedSummary) {
      setError('Summary cannot be empty');
      showToast('error', 'Summary cannot be empty');
      return;
    }

    if (trimmedSummary.length < 30) {
      const errorMsg = `Summary must be at least 30 characters. Currently ${trimmedSummary.length} characters.`;
      setError(errorMsg);
      showToast('error', errorMsg);
      return;
    }

    if (trimmedSummary.length > 2000) {
      const errorMsg = `Summary cannot exceed 2000 characters. Currently ${trimmedSummary.length} characters.`;
      setError(errorMsg);
      showToast('error', errorMsg);
      return;
    }

    setError('');

    console.log('[EditSummaryModal] Starting update:', {
      userId,
      hasToken: !!userToken,
      summaryLength: trimmedSummary.length,
    });

    setLoading(true);
    try {
      const result = await ProfileApiService.updateSummary(userId, userToken, summary);
      console.log('[EditSummaryModal] Update result:', {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log('[EditSummaryModal] Update successful');
        // Stop loading first
        setLoading(false);
        // Close modal immediately to prevent reopening
        onClose();
        // Show success snackbar after closing modal
        showToast('success', 'Resume summary saved successfully');
        // Call onSuccess to trigger data refresh after closing modal
        // Use setTimeout to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        // Error case - show error snackbar and keep modal open
        const errorMessage = result.error?.message ||
          result.error?.error ||
          (typeof result.error === 'string' ? result.error : 'Failed to update summary. Please try again.');
        console.error('[EditSummaryModal] Update failed:', errorMessage);
        showToast('error', errorMessage);
        setLoading(false);
      }
    } catch (error: any) {
      // Error case - show error snackbar and keep modal open
      console.error('[EditSummaryModal] Update error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred. Please try again.';
      showToast('error', errorMessage);
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Resume Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        
          <View style={styles.form}>
            <Text style={styles.label}>Resume Summary <Text style={styles.required}>*</Text></Text>
            <Text style={styles.hint}>Minimum 30 characters, maximum 2000 characters</Text>
            <TextInput
              style={[
                styles.textArea,
                error && styles.textAreaError,
                isFocused && styles.textAreaFocused,
              ]}
              value={summary}
              onChangeText={value => {
                // Replace multiple consecutive spaces with single space
                const processedValue = value.replace(/\s+/g, ' ');
                if (processedValue.length <= 2000) {
                  setSummary(processedValue);
                  if (error) {
                    setError('');
                  }
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Try adding a resume summary — it helps employers quickly understand your strengths, tech stack, and professional goals."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <View style={styles.charCountContainer}>
              <Text style={[
                styles.charCount,
                summary.trim().length < 30 && summary.trim().length > 0 && styles.charCountWarning,
                summary.length >= 1900 && summary.length <= 2000 && styles.charCountMaxWarning
              ]}>
                {summary.length} / 2000 characters {summary.trim().length < 30 && summary.trim().length > 0 && '(minimum 30 required)'}
              </Text>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (loading || summary.trim().length < 30 || summary.trim().length > 2000) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading || summary.trim().length < 30 || summary.trim().length > 2000}>
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
    minHeight:450,
    maxHeight: '100%',
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
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
    minHeight: 150,
    maxHeight: 200,
  },
  textAreaError: {
    borderColor: '#d32f2f',
    backgroundColor: '#FFF5F5',
  },
  textAreaFocused: {
    borderColor: '#F97316',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  charCountWarning: {
    color: '#d32f2f',
  },
  charCountMaxWarning: {
    color: '#F97316',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
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

export default EditSummaryModal;

