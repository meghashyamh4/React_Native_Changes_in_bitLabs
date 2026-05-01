import React, { useContext } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { deleteAccount } from '@services/Account/deleteAccount';
import { showToast } from '@services/login/ToastService';
import { useAuth } from '@context/Authcontext';
import UserContext from '@context/UserContext';
import useGoogleSignIn from '@services/google/google';
import { navigationRef } from '@services/NavigationService';
import { CommonActions } from '@react-navigation/native';

interface DeleteAccountModalProps {
  visible: boolean;
  onCancel: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onCancel }) => {
  const { userId, clearAllUserData, setIsAuthenticated, setAuthData, setLeadId } = useAuth();
  const { clearUserContext } = useContext(UserContext);
  const { signOut: googleSignOut } = useGoogleSignIn();

  const handleDelete = async () => {
    try {
      if (!userId) {
        console.error('User ID missing');
        return;
      }

      // 1. Delete the account via API
      await deleteAccount(userId);
      showToast('error', 'Account deleted successfully');

      // 2. Clear ALL user data (AsyncStorage, Keychain, tokens, interceptors)
      await clearAllUserData();

      // 3. Clear UserContext (clear user data)
      clearUserContext();

      // 4. Sign out from Google Sign-In (to show account picker next time)
      try {
        await googleSignOut();
        console.log('✅ Google Sign-In cleared');
      } catch (error) {
        console.error('Error signing out from Google:', error);
      }

      // 5. Reset auth state
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);

      // 6. Reset navigation to Login screen
      if (navigationRef.current?.isReady()) {
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'LandingPage' }],
          })
        );
      }

      onCancel(); // Close modal

    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Failed to delete account');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Delete Account?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to delete your account?{'\n'}This action cannot be undone.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteAccountModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#E53935',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ccc',
    minWidth: 100,
  },
  deleteBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E53935',
    minWidth: 100,
  },
  cancelText: {
    color: '#333',
    textAlign: 'center',
  },
  deleteText: {
    color: '#fff',
    textAlign: 'center',
  },
});
