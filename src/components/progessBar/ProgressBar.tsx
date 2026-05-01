import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
const screenWidth = Dimensions.get('window').width;

type ProgressBarProps = {
  initialStep: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({initialStep}) => {
  const currentStep = initialStep;

  const steps = [
    {id: 1, label: '  Personal   Info'},
    {id: 2, label: 'Professional Details'},
    // Step 3 (Upload Resume) removed - no longer needed during profile creation
  ];

  // Calculate dynamic line width based on screen size and number of steps
  const dynamicLineWidth = (screenWidth - steps.length * 130) / (steps.length - 1);
  // With justifyContent: 'space-between', steps are evenly distributed
  // Line should connect from center of current step to center of next step
  // Account for: container padding (40px total), step circles (40px each)
  const containerPadding = 40; // 20px padding on each side
  const stepCircleWidth = 40;
  const totalCirclesWidth = steps.length * stepCircleWidth;
  const availableSpace = screenWidth - containerPadding - totalCirclesWidth;
  // Line width = available space between steps (divided by gaps between steps)
  // For 2 steps: 1 gap, so line should span the available space
  // const dynamicLineWidth = steps.length > 1 
  //   ? Math.max(0, availableSpace / (steps.length - 1)) 
  //   : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLastStep = index === steps.length - 1;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              {/* Step Circle */}
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.activeStepCircle,
                  isCompleted && styles.completedStepCircle,
                  isActive || isCompleted ? {borderColor: 'transparent'} : {},
                ]}>
                <Text
                  style={[
                    styles.stepText,
                    isActive && styles.activeStepText,
                    isCompleted && styles.completedStepText,
                  ]}>
                  {isCompleted ? <Icon name="check" size={20} color="white" /> : step.id}
                </Text>
              </View>

              {/* Connecting Line */}
              {!isLastStep && (
                <View
                  style={[
                    styles.line,
                    {
                      width: dynamicLineWidth,
                      maxWidth: dynamicLineWidth, // Prevent line from extending too far
                    },
                    isCompleted && styles.completedLine,
                    isActive && styles.activeLine,
                  ]}
                />
              )}

              {/* Step Label */}
              <Text style={styles.stepLabel}>{step.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    overflow: 'hidden', // Prevent line from extending beyond container
  },
  stepWrapper: {
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'column',
    flex: 1, // Allow steps to distribute evenly
    minWidth: 0, // Prevent overflow
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
    zIndex: 1,
    alignSelf: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#F97316',
  },
  completedStepCircle: {
    backgroundColor: 'green',
  },
  stepText: {
    fontSize: 16,
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  activeStepText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
  completedStepText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    width: 80,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  line: {
    position: 'absolute',
    top: 20,
    left: '50%',
    height: 2,
    backgroundColor: '#F97316',
    zIndex: 0,
    transform: [{translateX: 0}], // Start from center of current circle
  },
  activeLine: {
    backgroundColor: '#F97316',
  },
  completedLine: {
    backgroundColor: 'green',
  },
});

export default ProgressBar;
