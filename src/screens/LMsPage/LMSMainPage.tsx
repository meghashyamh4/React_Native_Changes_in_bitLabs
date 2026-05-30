import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@models/Model';
import CourseCard from './CourseCard';
import ProgressService from '@services/Progress/ProgressService';
import { useAuth } from '@context/Authcontext';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

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
    {
      id: 2,
      name: "Python",
      progress: 45,
      image: require('../../assests/Images/backgrounds/python.png'),
    },
    // {
    //   id: 3,
    //   name: "JavaScript",
    //   progress: 75,
    //   image: require('../assets/javascript.jfif'),
    // },
    {
      id: 4,
      name: "SQL",
      progress: 10,
      image: require('../../assests/Images/backgrounds/sql.jpeg'),
    },
    // {
    //   id: 5,
    //   name: "JavaScript",
    //   progress: 75,
    //   image: require('../assets/javascript.jfif'),
    // },
    // {
    //   id: 6,
    //   name: "React Native",
    //   progress: 10,
    //   image: require('../assets/reactnative.jfif'),
    // },
    {
      id: 7,
      name: "Interview Preparedness",
      progress: 75,
      image: require('../../assests/Images/backgrounds/interview_preparedness.jpeg'),
    },
    // {
    //   id: 8,
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
        console.log('[LMS] Resolved progress dataArray:', dataArray);
        if (dataArray && Array.isArray(dataArray)) {
          console.log('[LMS] Database courses:', dataArray.map((c: any) => ({
            id: c.courseId || c.course_id,
            name: c.courseName || c.course_name,
            progress: c.overallProgress || c.overall_progress
          })));

          // Update courses with progress data from database
          setCourses(prevCourses => {
            const updated = prevCourses.map(course => {
              const courseProgress = dataArray.find(
                (progress: any) =>
                  Number(progress.courseId || progress.course_id) === Number(course.id) ||
                  (progress.courseName || progress.course_name || '').toLowerCase().trim() === course.name.toLowerCase().trim()
              );
              console.log(`[LMS] Matching progress for course "${course.name}" (ID: ${course.id}):`, courseProgress);
              const progVal = courseProgress
                ? (courseProgress.overallProgress !== undefined
                  ? Number(courseProgress.overallProgress)
                  : (courseProgress.overall_progress !== undefined
                    ? Number(courseProgress.overall_progress)
                    : 0))
                : 0;
              console.log(`[LMS] Course "${course.name}" calculated progress: ${progVal}%`);
              return {
                ...course,
                progress: progVal
              };
            });
            console.log('[LMS] Final updated courses array:', updated);
            return updated;
          });
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
    console.log('📚 [LMS] Navigating to ScormPlayer:', {
      courseName,
      courseId,
      courseProgress,
      courseNameLower: courseName.toLowerCase()
    });
    navigation.navigate('ScormPlayer', {
      progress: courseProgress,
      courseId: courseId,
      courseName: courseName.toLowerCase() // Ensure lowercase for consistent matching
    });
  };

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}
    >
      <ScrollView>
        <View style={styles.container}>
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navBackButton}
              >
                <MaterialIcon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.heading}>LMS Main Page</Text>
              <View style={styles.navBackButtonPlaceholder} />
            </View>
          </View>

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
      </ScrollView>
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
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBackButton: {
    padding: 4,
  },
  navBackButtonPlaceholder: {
    width: 32,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
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
