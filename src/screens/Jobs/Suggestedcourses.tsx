import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Linking} from 'react-native';

type SuggestedCoursesProps = {
  suggestedCourses: string[];
};

const courseImages: Record<string, any> = {
  "HTML&CSS": { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Html&Css_Course.png"},
  JAVA: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java1_Course.png"},
  JAVASCRIPT: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/JavaScript_Course.png"},
  MYSQL: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Mysql_Course.png"},
  REACT: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/python_Course.png"},
  "SPRING BOOT": { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/React_Course.png"},
  PYTHON: { uri:"https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/SpringBoot_Course.png"},
};

const courseUrlMap: Record<string, any> = {
  'HTML&CSS': 'https://upskill.bitlabs.in/course/view.php?id=9',
  JAVA: 'https://upskill.bitlabs.in/course/view.php?id=22',
  PYTHON: 'https://upskill.bitlabs.in/course/view.php?id=7',
  MYSQL: 'https://upskill.bitlabs.in/course/view.php?id=8',
  JAVASCRIPT: 'https://upskill.bitlabs.in/course/view.php?id=47',
  REACT: 'https://upskill.bitlabs.in/course/view.php?id=21',
  'SPRING BOOT': 'https://upskill.bitlabs.in/course/view.php?id=23',
};

const SuggestedCourses: React.FC<SuggestedCoursesProps> = ({suggestedCourses}) => {
  return (
    <View style={styles.jobCard}>
      <Text style={styles.jobdestitle}>Suggested Courses</Text>
      <View>
        {suggestedCourses.map((course, index) => (
          <View key={index} style={styles.courseCard}>
            {courseImages[course] ? (
              <TouchableOpacity
                style={styles.imageRow}
                onPress={() => Linking.openURL(courseUrlMap[course])}
              >
                <Image source={courseImages[course]} style={styles.courseImage}  resizeMode="contain"/>
                <Image
                  source={require('@assests/Images/external-link2.png')}
                  style={styles.externalLinkIcon}
                />
              </TouchableOpacity>
            ) : (
              <Text style={styles.fallbackText}>Image not found</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 12,
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  jobdestitle: {
    color: '#F46F16',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 10,
  },
  courseImage: {
    width: '50%',
    height: 50,
    resizeMode: 'contain',
  },
  externalLinkIcon: {
    width: 24,
    height: 24,
  },
  fallbackText: {
    fontSize: 12,
    color: 'red',
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

export default SuggestedCourses;
