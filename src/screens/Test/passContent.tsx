import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import {useProfileViewModel} from '@viewmodel/Profileviewmodel';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '@context/Authcontext';
import MaskedView from '@react-native-masked-view/masked-view';

const {width, height} = Dimensions.get('window');

const TestCompletionMessage = ({
  message,
  buttonText,
  onPress,
  showLaterButton,
  navigation,
}: any) => (
  <>
    <View style={styles.messageContainer}>
      <Text style={styles.message}>{message}</Text>
    </View>
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <LinearGradient
        colors={['#F97316', '#FAA729']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.button, {borderRadius: 10}]}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </LinearGradient>
    </TouchableOpacity>
    {showLaterButton && (
      <TouchableOpacity
        onPress={() => navigation.navigate('BottomTab', {screen: 'Badges', isTestComplete: true})}
        style={styles.later}>
        <Text style={styles.laterText}>I’ll take later</Text>
      </TouchableOpacity>
    )}
  </>
);

const Pass = ({navigation}: any) => {
  const route = useRoute();
  const {userId, userToken} = useAuth();
  const {finalScore, testName}: any = route.params;
  const {profileData} = useProfileViewModel(userToken, userId);
  const {basicDetails} = profileData || {};
  const roundedScore = Math.round(finalScore);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, []),
  );

  if (!profileData) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.Items}>
        <View style={styles.centeredView}>
          <Text style={styles.nameText}>
            Hi{' '}
            {basicDetails.firstName
              ? basicDetails.firstName.charAt(0).toUpperCase() + basicDetails.firstName.slice(1)
              : 'Guest'}
            ,
          </Text>
          <View style={styles.score}>
            <MaskedView
              maskElement={
                <Text style={[styles.scoreText, styles.maskedText]}>
                  You scored {roundedScore}%
                </Text>
              }>
              <LinearGradient
                colors={['#F97316', '#FAA729']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.gradientBackground}
              />
            </MaskedView>
          </View>
        </View>
        <Image source={require('../../assests/Images/Test/passed.png')} style={styles.Image} />
        {testName === 'General Aptitude Test' && (
          <TestCompletionMessage
            message="Congratulations! You have successfully completed the General Aptitude Test"
            buttonText="Take Test"
            onPress={() => navigation.navigate('TestInstruction', {testName: 'Technical Test'})}
            showLaterButton={true}
            navigation={navigation}
          />
        )}
        {testName === 'Technical Test' && (
          <TestCompletionMessage
            message="Congratulations! You are now verified."
            buttonText="Exit"
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
            showLaterButton={false}
            navigation={navigation}
          />
        )}
        {testName !== 'General Aptitude Test' && testName !== 'Technical Test' && (
          <TestCompletionMessage
            message={`Congratulations! You are now verified for ${testName} test`}
            buttonText="Exit"
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
            showLaterButton={false}
            navigation={navigation}
          />
        )}
      </View>
    </View>
  );
};

export default Pass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  Items: {
    backgroundColor: '#fff',
    padding: width * 0.05,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.95,
    height: height * 0.9,
  },

  nameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 26,
    lineHeight: 27,
    color: '#000000',
  },
  score: {
    width: width * 0.6,
    height: 30,
    marginTop: 15,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 28,
    lineHeight: 28,
    color: 'orange',
    marginLeft: 10,
    justifyContent: 'center',
  },
  Image: {
    width: width * 0.5,
    height: width * 0.48,
    marginTop: 30,
    alignSelf: 'center',
  },
  messageContainer: {
    width: 292,
    height: 62,

    alignItems: 'center',
  },
  message: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
    lineHeight: 31,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    width: width * 0.9,
    height: 42,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    lineHeight: 14.4,
    color: '#FFFFFF',
    marginTop: 15,
  },
  later: {
    width: width * 0.9,
    height: 14,
    alignSelf: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  laterText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14,
    lineHeight: 14.4,
    color: '#4D82D1',
  },
  maskedText: {
    color: 'black',
    backgroundColor: 'transparent',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  gradientBackground: {
    height: 25,
  },
  text: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'center',
    color: '#000000',
    marginTop: 10,
  },
  centeredView: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100%',
  },
});
