import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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

  // Fetch progress data when component mounts
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // Use actual userId from auth context
        if (!userId) {
          console.log('User not authenticated, skipping progress fetch');
          setLoading(false);
          return;
        }

        console.log('Fetching progress data for userId:', userId);
        const progressResponse = await ProgressService.getApplicantProgress(userId.toString());
        console.log('Progress API response:', progressResponse);

        if (progressResponse.data && Array.isArray(progressResponse.data)) {
          console.log('Updating courses with progress data:', progressResponse.data);
          // Update courses with progress data from database
          setCourses(prevCourses =>
            prevCourses.map(course => {
              const courseProgress = progressResponse.data.find(
                (progress: any) => progress.courseId === course.id || progress.course_id === course.id
              );
              console.log(`Course ${course.name} progress:`, courseProgress);
              return {
                ...course,
                progress: courseProgress ? (courseProgress.overallProgress || 0) : 0
              };
            })
          );
        } else {
          console.log('No progress data found or invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching progress data:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        setError(`Failed to load progress data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [userId]); // Trigger when userId becomes available

  // Also refresh data when page comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchProgressData = async () => {
        if (!userId) return;

        try {
          setLoading(true);
          console.log('Refreshing progress data for userId:', userId);
          const progressResponse = await ProgressService.getApplicantProgress(userId.toString());
          console.log('Progress API response (refresh):', progressResponse);

          if (progressResponse.data && Array.isArray(progressResponse.data)) {
            setCourses(prevCourses =>
              prevCourses.map(course => {
                const courseProgress = progressResponse.data.find(
                  (progress: any) => progress.courseId === course.id || progress.course_id === course.id
                );
                return {
                  ...course,
                  progress: courseProgress ? (courseProgress.overallProgress || 0) : 0
                };
              })
            );
          }
        } catch (err: any) {
          console.error('Error refreshing progress data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchProgressData();
    }, [userId])
  );

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