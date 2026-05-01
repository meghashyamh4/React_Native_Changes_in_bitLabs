import React from 'react';
import {TouchableOpacity, Text, StyleSheet, TextStyle, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors = ['#F97316', '#FAA729'], // Default gradient colors
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.gradientBackground, style]}>
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
});

export default GradientButton;
