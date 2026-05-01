import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { ProfileService } from '@services/profile/ProfileService';
import { showToast } from '@services/login/ToastService';
import { trackAnalyticsEvent } from '@services/Analytics/AnalyticsService';

interface ResumeUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  resumeAvailable: boolean;
  onViewResume?: () => void;
}

const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  resumeAvailable,
  onViewResume,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelectFile = async () => {
    console.log('[ResumeUploadModal] File selection started');
    try {
      const result: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      if (!result || result.length === 0) {
        console.log('[ResumeUploadModal] No file selected');
        return;
      }

      const file = result[0];
      const maxSize = 5 * 1024 * 1024; // 5MB

      console.log('[ResumeUploadModal] File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (file.size && file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.warn('[ResumeUploadModal] File size exceeds limit:', {
          fileSize: file.size,
          fileSizeMB,
          maxSizeMB: 5,
        });
        showToast('error', `File size must be less than 5 MB. Current size: ${fileSizeMB} MB`);
        return;
      }

      setSelectedFile(file);
      console.log('[ResumeUploadModal] File selected successfully');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('[ResumeUploadModal] User cancelled file selection');
        // User cancelled - no message needed
      } else {
        console.error('[ResumeUploadModal] File selection error:', err);
        showToast('error', 'Failed to select file. Please try again.');
      }
    }
  };

  const handleUpload = async () => {
    console.log('[ResumeUploadModal] Upload button pressed');

    if (!selectedFile) {
      console.warn('[ResumeUploadModal] No file selected');
      showToast('error', 'Please select a file first');
      return;
    }

    console.log('[ResumeUploadModal] Starting upload:', {
      userId,
      hasToken: !!userToken,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
    });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', {
        uri: selectedFile.uri,
        type: selectedFile.type || 'application/pdf',
        name: selectedFile.name || 'resume.pdf',
      } as any);

      const result = await ProfileService.uploadResume(userToken, userId, formData);
      console.log('[ResumeUploadModal] Upload result:', {
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        console.log('[ResumeUploadModal] Upload successful');
        trackAnalyticsEvent('MOBILE-RESUME UPLOAD', userId);
        showToast('success', 'Resume uploaded successfully');

        // Close modal first
        onClose();
        setSelectedFile(null);

        // Wait a bit for the server to process the resume, then refresh data (including summary)
        setTimeout(() => {
          console.log('[ResumeUploadModal] Triggering data refresh after resume upload');
          onSuccess();
        }, 500); // Small delay to ensure server has processed the resume
      } else {
        const errorMessage = result.message ||
          (typeof result === 'string' ? result : 'Failed to upload resume. Please try again.');
        console.error('[ResumeUploadModal] Upload failed:', errorMessage);
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[ResumeUploadModal] Upload error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred while uploading resume. Please try again.';
      showToast('error', errorMessage);
    } finally {
      setUploading(false);
    }
  };


  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload Resume</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Supported formats: PDF (Max 5MB)</Text>

            {resumeAvailable && onViewResume && (
              <TouchableOpacity style={styles.viewCurrentResumeButton} onPress={onViewResume}>
                <MaterialIcons name="description" size={20} color="#F97316" />
                <Text style={styles.viewCurrentResumeText}>View Current Resume</Text>
                <MaterialIcons name="chevron-right" size={20} color="#F97316" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.uploadArea} onPress={handleSelectFile}>
              <MaterialIcons name="upload-file" size={48} color="#F97316" />
              <Text style={styles.uploadText}>Select File</Text>
              <Text style={styles.uploadHint}>Tap to choose PDF file</Text>
            </TouchableOpacity>

            {selectedFile && (
              <View style={styles.fileInfo}>
                <MaterialIcons name="description" size={24} color="#F97316" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedFile.name || 'Selected file'}
                  </Text>
                  <Text style={styles.fileSize}>
                    {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, (!selectedFile || uploading) && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={!selectedFile || uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    maxWidth: 400,
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
  content: {
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  viewCurrentResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2C4',
    marginTop: 8,
  },
  viewCurrentResumeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D26B15',
    marginLeft: 8,
  },
  uploadArea: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F4A66A',
    backgroundColor: '#FFF7F0',
    borderRadius: 12,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  uploadHint: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    marginTop: 2,
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
  uploadButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#fff',
  },
});

export default ResumeUploadModal;

