import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface StepIndicatorProps {
  step: number;
  selectedStep: number;
  testName: string;
  testStatus: string;
  isLast?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  selectedStep,
  testName,
  testStatus,
  isLast,
}) => {
  const isCompleted = selectedStep >= step;
  const isPassed =
    (testName === 'General Aptitude Test' || testName === 'Technical Test') && testStatus === 'P';

  return (
    <View style={styles.container}>
      {/* Step Circle */}
      <View
        style={[
          styles.stepCircle,
          {
            backgroundColor: isCompleted ? '#219734' : '#BFBFBF',
            marginLeft: step === 1 ? 15 : 0,
            marginRight: isLast ? 15 : 0,
          },
        ]}>
        {step === 1 && (isPassed || selectedStep > 1) ? (
          <Icon name="check" size={16} color="white" />
        ) : step === 3 ? (
          <Icon name="flag" size={12} style={{color: '#6D6969'}} />
        ) : (
          <Text style={[styles.stepText, {color: isCompleted ? '#fff' : '#000'}]}>{step}</Text>
        )}
      </View>

      {/* Step Line (Except Last Step) */}
      {!isLast && (
        <View
          style={[
            styles.stepLine,
            {backgroundColor: selectedStep >= step + 1 ? '#219734' : '#BFBFBF'},
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  stepText: {
    color: '#6D6969',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  stepLine: {
    flex: 1,
    width: 100,
    height: 1,
    backgroundColor: '#BFBFBF',
  },
});

export default StepIndicator;
