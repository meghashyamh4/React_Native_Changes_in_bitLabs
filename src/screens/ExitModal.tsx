import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/AntDesign';

const {width} = Dimensions.get('window');

interface ExitModalProps {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
}

const ExitModal: React.FC<ExitModalProps> = ({visible, onClose, onExit}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
          <Icon name="close" size={20} color="#0D0D0D" />
        </TouchableOpacity>

        <Image source={require('../assests/Images/Test/Warning.png')} style={styles.Warning} />

        <Text style={styles.modalText}>Do you really want to exit?</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              {
                backgroundColor: '#FFF',
                borderColor: '#9D9D9D',
                borderWidth: 0.96,
              },
            ]}
            onPress={onClose}>
            <Text style={[styles.modalButtonText, {color: 'grey'}]}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExit}>
            <LinearGradient
              colors={['#F97316', '#FAA729']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.modalButton, {borderRadius: 10, width: width * 0.41}]}>
              <Text style={styles.modalButtonText}>Yes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  modalContent: {
    width: '95%',
    height: 337,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F97316',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  modalText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 25,
    color: '#333333',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  Warning: {
    width: 85,
    height: 73,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
});

export default ExitModal;
