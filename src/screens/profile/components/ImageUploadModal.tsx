import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
} from 'react-native-image-picker';
import {ProfileService} from '@services/profile/ProfileService';
import {showToast} from '@services/login/ToastService';
import {useProfilePhoto} from '@context/ProfilePhotoContext';
import Toast from 'react-native-toast-message';
import {toastConfig} from '@components/Toast/toast_config';

interface ImageUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const {fetchProfilePhoto} = useProfilePhoto();

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const validatePhoto = (photoFile: any) => {
    console.log('[ImageUploadModal] Validating photo:', {
      uri: photoFile.uri ? 'present' : 'missing',
      fileName: photoFile.fileName,
      type: photoFile.type,
      fileSize: photoFile.fileSize,
    });

    if (!photoFile.uri) {
      console.warn('[ImageUploadModal] Missing photo URI');
      showToast('error', 'Please select a valid photo.');
      return false;
    }

    const fileExtension = photoFile.fileName?.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['jpeg', 'jpg', 'png'];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      console.warn('[ImageUploadModal] Invalid file extension:', fileExtension);
      showToast('error', 'Only JPEG and PNG files are allowed.');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (photoFile.fileSize && photoFile.fileSize > maxSize) {
      const fileSizeMB = (photoFile.fileSize / (1024 * 1024)).toFixed(2);
      console.warn('[ImageUploadModal] File size exceeds limit:', {
        fileSize: photoFile.fileSize,
        fileSizeMB,
        maxSizeMB: 5,
      });
      showToast('error', `File size must be less than 5 MB. Current size: ${fileSizeMB} MB`);
      return false;
    }

    console.log('[ImageUploadModal] Photo validation passed');
    return true;
  };

  const handleImagePicker = (response: ImagePickerResponse) => {
    console.log('[ImageUploadModal] Image picker response:', {
      didCancel: response.didCancel,
      errorCode: response.errorCode,
      errorMessage: response.errorMessage,
      hasAssets: !!response.assets?.length,
    });

    if (response.didCancel) {
      console.log('[ImageUploadModal] User cancelled image selection');
      return;
    }
    if (response.errorCode) {
      console.error('[ImageUploadModal] Image picker error:', {
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
      });
      showToast('error', response.errorMessage || 'Failed to pick image. Please try again.');
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      console.log('[ImageUploadModal] Selected asset:', {
        uri: asset.uri ? 'present' : 'missing',
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      });

      if (validatePhoto(asset)) {
        setSelectedImage(asset.uri || null);
        setImageFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || 'photo.jpg',
        });
        console.log('[ImageUploadModal] Photo selected and validated successfully');
      }
    } else {
      console.warn('[ImageUploadModal] No assets in response');
      showToast('error', 'No image selected. Please try again.');
    }
  };

  const handleCamera = async () => {
    console.log('[ImageUploadModal] Camera button pressed');
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.warn('[ImageUploadModal] Camera permission denied');
      showToast('error', 'Camera permission is required to take photos');
      return;
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    };

    console.log('[ImageUploadModal] Launching camera...');
    launchCamera(options, handleImagePicker);
  };

  const handleLibrary = () => {
    console.log('[ImageUploadModal] Library button pressed, launching image library...');
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      handleImagePicker,
    );
  };

  const handleUpload = async () => {
    console.log('[ImageUploadModal] Upload button pressed');
    
    if (!imageFile) {
      console.warn('[ImageUploadModal] No image file selected');
      showToast('error', 'Please select an image first');
      return;
    }

    console.log('[ImageUploadModal] Starting upload:', {
      userId,
      hasToken: !!userToken,
      imageType: imageFile.type,
      imageName: imageFile.fileName,
    });

    setLoading(true);
    try {
      const result = await ProfileService.uploadProfilePhoto(userToken, userId, imageFile);
      console.log('[ImageUploadModal] Upload result:', {
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        console.log('[ImageUploadModal] Upload successful');
        showToast('success', 'Profile photo successfully uploaded');
        
        // Fetch updated profile photo to refresh in navbar/home page
        console.log('[ImageUploadModal] Fetching updated profile photo...');
        await fetchProfilePhoto(userToken, userId);
        console.log('[ImageUploadModal] Profile photo refreshed');
        
        onSuccess();
        onClose();
        setSelectedImage(null);
        setImageFile(null);
      } else {
        const errorMessage = result.message || 
                            (typeof result === 'string' ? result : 'Failed to upload photo. Please try again.');
        console.error('[ImageUploadModal] Upload failed:', errorMessage);
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[ImageUploadModal] Upload error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message || 
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
            <Text style={styles.title}>Upload Profile Picture</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>JPG or PNG (≤ 5 MB)</Text>

            {selectedImage && (
              <View style={styles.previewContainer}>
                <Image source={{uri: selectedImage}} style={styles.previewImage} />
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.optionButton} onPress={handleCamera}>
                <MaterialIcons name="camera-alt" size={24} color="#F97316" />
                <Text style={styles.optionButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={handleLibrary}>
                <MaterialIcons name="photo-library" size={24} color="#F97316" />
                <Text style={styles.optionButtonText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, (!imageFile || loading) && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={!imageFile || loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
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
    gap: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#F4E7D6',
  },
  buttonContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  optionButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
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
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
});

export default ImageUploadModal;

