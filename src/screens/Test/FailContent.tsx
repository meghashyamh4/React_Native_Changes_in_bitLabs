import React from 'react';
import {View, Text, Image, StyleSheet, BackHandler} from 'react-native';
import GradientButton from '@components/styles/GradientButton';
import {useFocusEffect} from '@react-navigation/native';
const FailureScreen = ({navigation}: any) => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true; // Returning true disables back action
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, []),
  );
  return (
    <View style={styles.container}>
      {/* Card Container */}
      <View style={styles.card}>
        {/* Illustration Image */}
        <Image
          source={require('../../assests/Images/Test/failed.png')} // Replace with your image path
          style={styles.image}
          resizeMode="contain"
        />

        {/* Failure Message */}
        <Text style={styles.message}>
          Unfortunately, you scored less than 70%, and have not passed the exam.
        </Text>

        {/* Retake Info */}
        <Text style={styles.retakeText}>You Can Retake The Test{'\n'}After 7 Days</Text>

        {/* Exit Button with Gradient */}
        <GradientButton
          title="Exit"
          onPress={() => {
            try {
              navigation.navigate('BottomTab', {screen: 'Badges'});
            } catch (error) {
              console.error('Navigation error:', error);
              // Fallback navigation
              navigation.reset({
                index: 0,
                routes: [{name: 'BottomTab', params: {screen: 'Badges'}}],
              });
            }
          }}
        />
      </View>
    </View>
  );
};

export default FailureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%', // Increased the width of the container
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: '95%',
    height: '90%',
  },
  image: {
    width: 228,
    height: 203,
    marginBottom: 15,
  },
  message: {
    marginBottom: 10,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold', // Ensure the font is linked properly
    fontSize: 22,
    fontStyle: 'normal',
    lineHeight: 34,
  },
  retakeText: {
    color: '#F97316',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    fontStyle: 'normal',
    marginBottom: 20,
    marginTop: 15,
    textTransform: 'capitalize',
  },
  buttonContainer: {
    borderRadius: 7.68,
    overflow: 'hidden',
    width: '100%',
    marginTop: 10,
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 7.68,
  },
});
