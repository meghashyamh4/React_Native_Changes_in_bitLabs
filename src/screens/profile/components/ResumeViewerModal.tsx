import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Pdf from 'react-native-pdf';
import {Buffer} from 'buffer';
import resumeCall from '@services/profile/Resume';

interface ResumeViewerModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userToken: string;
}

const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  visible,
  onClose,
  userId,
  userToken,
}) => {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      fetchResume();
    } else {
      // Reset state when modal closes
      setPdfUri(null);
      setLoading(true);
      setError(null);
    }
  }, [visible, userId]);

  const fetchResume = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 ResumeViewerModal: Fetching resume for userId:', userId);
      const response = await resumeCall(userId);
      
      console.log('📥 ResumeViewerModal: Received response:', {
        hasResponse: !!response,
        status: response?.status,
        statusText: response?.statusText,
        dataType: response?.data ? typeof response.data : 'no data',
        dataSize: response?.data ? `${(response.data.byteLength / 1024).toFixed(2)} KB` : 'no data',
      });
      
      if (!response || response.status !== 200) {
        console.warn('⚠️ ResumeViewerModal: Invalid response status:', response?.status);
        setError('Resume not found');
        setLoading(false);
        return;
      }

      const arrayBuffer = response.data; // ArrayBuffer from axios
      console.log('📄 ResumeViewerModal: Converting ArrayBuffer to base64...');
      const base64Pdf = arrayBufferToBase64(arrayBuffer);
      console.log('✅ ResumeViewerModal: Base64 conversion complete, length:', base64Pdf.length);
      setPdfUri(`data:application/pdf;base64,${base64Pdf}`);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ ResumeViewerModal: Error in fetchResume:', {
        message: err?.message,
        status: err?.response?.status,
        error: err,
      });
      setError(err?.message || 'Failed to load resume');
      setLoading(false);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    return Buffer.from(new Uint8Array(buffer)).toString('base64');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>My Resume</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Loading resume...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#F97316" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : pdfUri ? (
              <Pdf source={{uri: pdfUri}} style={styles.pdf} />
            ) : (
              <View style={styles.errorContainer}>
                <MaterialIcons name="description" size={48} color="#999" />
                <Text style={styles.errorText}>No resume available</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.95,
    height: height * 0.9,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    textAlign: 'center',
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
  },
});

export default ResumeViewerModal;

