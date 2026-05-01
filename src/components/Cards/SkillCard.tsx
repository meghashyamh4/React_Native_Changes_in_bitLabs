import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

interface SkillCardProps {
  skillName: string;
  status: 'PASSED' | 'FAILED' | null;
  onPress: () => void | null;
  disabled?: boolean;
  timer?: {days: number; hours: number; minutes: number} | null;
}

const testImage: Record<string, any> = {
  Angular: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Angular.png"},
  Java: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java.png"},
  C: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/C.png"},
  "C++": { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CPlusPlus.png"},
  "C Sharp": { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CSharp.png"},
  CSS: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CSS.png"},
  Django: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Django.png"},
  ".Net": { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/DotNet.png"},
  Flask: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Flask.png"},
  Hibernate: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Hibernate.png"},
  HTML: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/HTML.png"},
  JavaScript: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/JavaScript.png"},
  JSP: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/JSP.png"},
  "Manual Testing": {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/ManualTesting.png"},
  "Mongo DB": {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MongoDB.png"},
  Python: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Python.png"},
  React: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/React.png"},
  "Regression Testing": {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/RegressionTesting.png"},
  Selenium: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Selenium.png"},
  Servlets: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Servlets.png"},
  "Spring Boot": {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/SpringBoot.png"},
  TypeScript: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java.png"},
  Typescript: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java.png"},
  Spring: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Spring.png"},
  SQL: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MySQL.png"},
  Css: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CSS.png"},
  MySQL: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MySQL.png"},
  Vue: {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Vue.png"},
  "SQL-Server": {uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/sqlserver.png"},
};

const SkillCard: React.FC<SkillCardProps> = ({
  skillName,
  status,
  onPress,
  disabled = false,
  timer = null,
}) => {
  // Try exact match first, then case-insensitive match
  const imageSource = testImage[skillName] || 
                      testImage[Object.keys(testImage).find(key => key.toLowerCase() === skillName?.toLowerCase()) || ''] ||
                      require('@assests/Images/Test/NotFound.png');

  return (
    <View style={styles.card}>
      {status && (
        <View style={styles.statusContainer}>
          <Text style={[styles.badgeStatus, status === 'PASSED' ? styles.passed : styles.failed]}>
            {status === 'PASSED' ? 'Passed' : status}
          </Text>
        </View>
      )}
      <Image source={imageSource} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{skillName}</Text>
      {status === 'FAILED' && timer ? (
        <LinearGradient
          colors={['#d3d3d3', '#d3d3d3']}
          style={[styles.gradientBackground, styles.timerContain]}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={styles.timerText1}>Retake test in</Text>
            <Text style={styles.timerText1}>
              {timer.days}d {timer.hours}h {timer.minutes}m
            </Text>
          </View>
        </LinearGradient>
      ) : status === 'PASSED' ? (
        // Verified button - not clickable
        <View style={[styles.button, styles.verifiedButton]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
            <Icon name="check-circle" size={16} color="white" style={{marginRight: 6}} />
            <Text style={styles.buttonText}>VERIFIED</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          disabled={disabled}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}>
            <Text style={styles.buttonText}>
              {status === 'FAILED' ? 'Retake Test' : 'Take test'}
            </Text>
            <Icon name="external-link" size={16} color="white" style={{marginRight: 4}} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SkillCard;

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 174,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: 65,
    height: 55,
    padding: 8,
    resizeMode: 'contain',
    borderRadius: 10,
    marginTop: 40,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 32,
    backgroundColor: '#000000',
    alignItems: 'center',
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 6,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  statusContainer: {
    position: 'absolute',
    top: 3,
    right: 5,
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  verifiedButton: {
    backgroundColor: 'green',
    justifyContent: 'center',
  },
  verifiedText: {
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlignVertical: 'center',
  },
  failed: {
    backgroundColor: '#f8d7da',
    color: 'red',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 10,
  },
  gradientBackground: {
    marginTop: 20,
    borderRadius: 10,
    height: 40,
  },
  timerContain: {
    bottom: 5,
    width: 140,
    height: 36,
    alignItems: 'center',
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    flexDirection: 'row',
  },
  timerText1: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: 'black',
    marginRight: 5,
    lineHeight: 20,
    marginBottom: 1,
  },
  badgeStatus: {
    fontSize: 14,
    padding: 5,
    borderRadius: 5,
    textTransform: 'capitalize',
  },
  passed: {
    backgroundColor: '#d4edda',
    color: 'green',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 10,
  },
});
