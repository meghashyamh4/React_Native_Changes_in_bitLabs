import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@models/Model';
import CourseCard from './CourseCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ScormPlayer'>;
const LMSMainPage = () => {
  const navigation = useNavigation<NavigationProp>();


const courses = [
    {
      id: 1,
      name: "HTML & CSS",
      progress: 20,
      image: require("../../assests/Images/backgrounds/html&css.png"),
    },
    // {
    //   id: 2,
    //   name: "Python", 
    //   progress: 45,
    //   image: require('../assets/python.jfif'),
    // },
    // {
    //   id: 3,
    //   name: "JavaScript",
    //   progress: 75,
    //   image: require('../assets/javascript.jfif'),
    // },
    // {
    //   id: 4,
    //   name: "React Native",
    //   progress: 10,
    //   image: require('../assets/reactnative.jfif'),
    // },
  ];


   const handleCoursePress = (courseName: string, courseId: number) => {
    navigation.navigate('ScormPlayer', {
      url: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/introductiontowebapp_topic1/story.html'
    });
  };

  return (
     <ImageBackground
          source={require("../../assests/Images/backgrounds/image.png")}
          style={styles.background}
        >
    <View style={styles.container}>
      <Text>LMSMainPage</Text>
      <View style={styles.container}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          courseName={course.name}
          progress={course.progress}
          imageSource={course.image}
          onPress={() => navigation.navigate('ScormPlayer', {
            url: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/introductiontowebapp_topic1/story.html'
          })}
        />
      ))}
    </View>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default LMSMainPage;