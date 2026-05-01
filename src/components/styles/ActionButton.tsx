import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import GradientButton from './GradientButton';

interface ActionButtonsProps {
  onPressAction: () => void;
  actionTitle: string;
  isGradient?: boolean; // If true, use GradientButton
  onPressBack?: () => void; // Optional Back Button
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPressBack,
  onPressAction,
  actionTitle,
  isGradient = true,
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.buttonContainer}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButtonBottom} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Action Button */}
      {isGradient ? (
        <GradientButton
          title={actionTitle}
          onPress={onPressAction}
          style={styles.applyButtonGradient}
          textStyle={styles.buttonText}
        />
      ) : (
        <TouchableOpacity style={styles.backButtonBottom} onPress={onPressAction}>
          <Text style={styles.buttonText}>{actionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    bottom: 20,
    paddingHorizontal: 10,
  },
  backButtonBottom: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F46F16',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    width: '43%',
  },
  applyButtonGradient: {
    backgroundColor: '#fff',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  backButtonText: {
    color: '#F46F16',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default ActionButtons;
