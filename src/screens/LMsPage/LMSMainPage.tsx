import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@models/Model';
import CourseCard from './CourseCard';
import ProgressService from '@services/Progress/ProgressService';
import { useAuth } from '@context/Authcontext';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ScormPlayer'>;
const LMSMainPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: "HTML & CSS",
      progress: 0,
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
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and sync course progress data (on mount, userId load, and screen focus)
  useEffect(() => {
    const fetchProgressData = async (isBackground = false) => {
      try {
        if (!userId) {
          console.log('[LMS] User not authenticated, skipping progress fetch');
          if (!isBackground) setLoading(false);
          return;
        }

        if (!isBackground) setLoading(true);
        console.log(`[LMS] Fetching progress for userId: ${userId} (Background: ${isBackground})`);
        const progressResponse = await ProgressService.getApplicantProgress(userId.toString());
        console.log('[LMS] Progress API response:', progressResponse);

        const dataArray = progressResponse?.data?.data || progressResponse?.data || progressResponse;
        if (dataArray && Array.isArray(dataArray)) {
          // Update courses with progress data from database
          setCourses(prevCourses =>
            prevCourses.map(course => {
              const courseProgress = dataArray.find(
                (progress: any) => 
                  Number(progress.courseId || progress.course_id) === Number(course.id) ||
                  (progress.courseName || progress.course_name || '').toLowerCase().trim() === course.name.toLowerCase().trim()
              );
              const progVal = courseProgress
                ? (courseProgress.overallProgress !== undefined 
                    ? Number(courseProgress.overallProgress) 
                    : (courseProgress.overall_progress !== undefined 
                        ? Number(courseProgress.overall_progress) 
                        : 0))
                : 0;
              return {
                ...course,
                progress: progVal
              };
            })
          );
        }
      } catch (err: any) {
        console.error('[LMS] Error fetching progress:', err);
        if (!isBackground) {
          setError(`Failed to load progress data: ${err.message}`);
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    // 1. Initial immediate load when userId is available
    if (userId) {
      fetchProgressData(false);
    } else {
      setLoading(false);
    }

    // 2. Setup navigation focus listener to refresh progress in the background when returning to this page
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[LMS] Screen focused, performing background progress refresh');
      fetchProgressData(true);
    });

    return unsubscribe;
  }, [userId, navigation]);

  const handleCoursePress = (courseName: string, courseId: number, courseProgress: number) => {
    navigation.navigate('ScormPlayer', {
      progress: courseProgress,
      courseId: courseId,
      courseName: courseName
    });
  };

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}
    >
      <View style={styles.container}>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>Loading progress data...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.coursesContainer}>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                courseName={course.name}
                progress={course.progress}
                imageSource={course.image}
                onPress={() => handleCoursePress(course.name, course.id, course.progress)}
              />
            ))}
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    marginTop: 90,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  coursesContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default LMSMainPage;
