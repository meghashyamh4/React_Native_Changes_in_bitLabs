import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, BackHandler, TouchableOpacity, Text, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import ProgressService from '@services/Progress/ProgressService';
import { useAuth } from '@context/Authcontext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const COURSE_DATA: Record<string, any[]> = {
  "html & css": [
    { topic: "Introduction to Web App", videos: [{ title: "What is a Web Application?", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/introductiontowebapp_topic1/story.html" }] },
    { topic: "HTML for Beginners", videos: [{ title: "Basics of HTML Structure", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/htmlforbegginers_topic2/story.html" }] },
    { topic: "CSS Part 1", videos: [{ title: "Introduction to CSS Styling", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/csspart1_topic3/story.html" }] },
    { topic: "CSS Part 2", videos: [{ title: "Advanced CSS Concepts", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/csspart2_topic4/story.html" }] },
    { topic: "HTML Forms", videos: [{ title: "Creating Forms in HTML", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/HTML%20FORMS_topic5/story.html" }] },
  ],
  // "python": [
  //   { topic: "Introduction to python", videos: [{ title: "What is a python?", url: "/python for beginners/Introduction to Python_topic1/index_lms.html" }] },
  //   { topic: "Python variables and data types", videos: [{ title: "Variables and Data Types", url: "/python for beginners/python variables and data types_topic2/index_lms.html" }] },
  //   { topic: "Python Operators", videos: [{ title: "Operators", url: "/python for beginners/Python Operators_topic3/index_lms.html" }] },
  //   { topic: "Python conditional statements", videos: [{ title: "Conditional Statements", url: "/python for beginners/Python conditional statements_topic4/index_lms.html" }] },
  //   { topic: "Python Loops", videos: [{ title: "Loops", url: "/python for beginners/Python Loops_topic5/index_lms.html" }] },
  //   { topic: "Python Data Structures Part 1", videos: [{ title: "Data Structures Part 1", url: "/python for beginners/Python Data Structures Part 1_topic6/index_lms.html" }] },
  //   { topic: "Python Data Structures Part 2", videos: [{ title: "Data Structures Part 2", url: "/python for beginners/Python Data Structures Part 2_topic7/index_lms.html" }] },
  //   { topic: "Python Data Structures Part 3", videos: [{ title: "Data Structures Part 3", url: "/python for beginners/Python Data Structures Part 3_topic8/index_lms.html" }] },
  //   { topic: "Python functions", videos: [{ title: "Functions", url: "/python for beginners/python functions_topic9/index_lms.html" }] },
  //   { topic: "Python modules", videos: [{ title: "Modules", url: "/python for beginners/python modules_topic10/index_lms.html" }] },
  //   { topic: "Python OOPS", videos: [{ title: "OOPS concepts", url: "/python for beginners/Python OOPS_topic11/index_lms.html" }] },
  //   { topic: "Python Constructors", videos: [{ title: "Constructors", url: "/python for beginners/Python Constructors_topic12/index_lms.html" }] },
  //   { topic: "Python Inheritence", videos: [{ title: "Inheritence", url: "/python for beginners/Python Inheritence_topic13/index_lms.html" }] },
  // ],
  // "java": [
  //   { topic: "Java Basics", videos: [{ title: "Java Course", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/How+to+Set+Goals_web+2/story.html" }] },
  // ],
};

const getCourseId = (name: string): number => {
  const courseMap: Record<string, number> = {
    'html & css': 1,
    'python': 2,
    'java': 3,
    'sql': 4,
    'react': 5,
    'spring boot': 6,
  };
  return courseMap[name.toLowerCase()] || 0;
};

const ScormPlayer = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [isInteracted, setIsInteracted] = React.useState(false);
  const webViewRef = useRef<WebView>(null);
  const { url: initialUrl, progress: initialProgress, courseId, courseName } = route.params as { url?: string; progress: number; courseId: number; courseName: string };
  const [currentProgress, setCurrentProgress] = useState(initialProgress);
  const [totalCount, setTotalCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);

  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  // Topic-level progress state
  const [topicProgress, setTopicProgress] = useState<Record<number, number>>({});
  const [scormData, setScormData] = useState<Record<string, string>>({});
  const [courseProgressId, setCourseProgressId] = useState<number | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const selectedTopicRef = useRef(0);
  selectedTopicRef.current = selectedTopicIndex;

  const courseContent = COURSE_DATA[courseName?.toLowerCase()] || [];
  const currentUrl = courseContent[selectedTopicIndex]?.videos[0]?.url || initialUrl;

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -300 : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // Core reusable calculation from web implementation
  const updateProgressState = useCallback((visited: number, total: number) => {
    if (!total || total === 0) return;

    const progress = Math.min(Math.round((visited / total) * 100), 100);

    console.log("📊 VISITED:", visited, "TOTAL:", total, "PROGRESS:", progress);

    setCurrentProgress(progress);
    setVisitedCount(visited);
    setTotalCount(total);
  }, []);

  // Load initial progress from AsyncStorage for the active topic
  const loadInitialProgress = useCallback(async () => {
    try {
      const idx = selectedTopicRef.current;

      // 1. Load basic progress (visited/total)
      const progressKey = `articulate_course_${courseId}_topic_${idx}_progress`;
      const rawData = await AsyncStorage.getItem(progressKey);

      if (rawData) {
        const data = JSON.parse(rawData);
        const visited = typeof data.visited === "number" ? data.visited : data.visited?.length || 0;
        const total = data.total || visited || 1;
        updateProgressState(visited, total);
      }

      // 2. Load detailed SCORM data for resumption
      const scormKey = `scorm_data_${courseId}_topic_${idx}`;
      const savedScormData = await AsyncStorage.getItem(scormKey);
      if (savedScormData) {
        const parsedData = JSON.parse(savedScormData);
        setScormData(parsedData);

        // Inject into WebView if it's already loaded
        const injectScript = `
          if (window.API) {
            window.scormData = ${JSON.stringify(parsedData)};
            console.log('Restored SCORM data:', window.scormData);
          }
        `;
        webViewRef.current?.injectJavaScript(injectScript);
      }
    } catch (e) {
      console.log("Error parsing progress from AsyncStorage", e);
    }
  }, [courseId, updateProgressState]);

  // Save progress when exiting — includes topic-level data
  const saveProgress = async () => {
    try {
      if (!userId) return;

      const idx = selectedTopicRef.current;
      const topicProg = topicProgress[idx] || currentProgress;

      // Recalculate overall progress from all topics
      const updatedTopicProgress = { ...topicProgress, [idx]: topicProg };
      const totalProg = Object.values(updatedTopicProgress).reduce((a, b) => a + b, 0);
      const overall = courseContent.length > 0 ? Math.round(totalProg / courseContent.length) : topicProg;

      await ProgressService.saveProgress({
        applicantId: userId,
        courseId: getCourseId(courseName),
        courseName: courseName || `Course ${courseId}`,
        overallProgress: overall,
        totalProgress: overall,
        topicIndex: idx,
        topicName: courseContent[idx]?.topic || '',
        topicProgress: topicProg,
      });

      console.log('Progress saved successfully:', { courseId, idx, topicProg, overall });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // ── Load topic-level progress from backend on mount ──
  useEffect(() => {
    const loadTopicProgress = async () => {
      if (!userId) return;
      try {
        const applicantCourses = await ProgressService.getApplicantProgress(userId.toString());
        const courses = applicantCourses?.data || applicantCourses || [];
        const currentCourse = (Array.isArray(courses) ? courses : []).find(
          (c: any) => c.courseName?.toLowerCase() === courseName?.toLowerCase()
        );

        if (currentCourse) {
          setCourseProgressId(currentCourse.id);

          const topicsRes = await ProgressService.getCourseTopics(currentCourse.id);
          const topics = topicsRes?.data || topicsRes || [];
          const progressMap: Record<number, number> = {};
          (Array.isArray(topics) ? topics : []).forEach((t: any) => {
            progressMap[t.topicIndex] = t.topicProgress || 0;
          });
          setTopicProgress(progressMap);

          // Auto-select the first incomplete or unlocked topic
          const topicsList = Array.isArray(topics) ? topics : [];
          const sortedTopics = topicsList.sort((a: any, b: any) => a.topicIndex - b.topicIndex);

          let nextTopicIndex = 0;
          for (let i = 0; i < courseContent.length; i++) {
            const prog = progressMap[i] || 0;
            const isPrevComplete = i === 0 || (progressMap[i - 1] || 0) >= 100;

            if (prog < 100 && isPrevComplete) {
              nextTopicIndex = i;
              break;
            }
          }

          console.log("🎯 Auto-navigating to topic index:", nextTopicIndex);
          setSelectedTopicIndex(nextTopicIndex);
          setCurrentProgress(progressMap[nextTopicIndex] || 0);
        }
      } catch (err) {
        console.error('Error loading topic progress:', err);
      } finally {
        setProgressLoaded(true);
      }
    };
    loadTopicProgress();
  }, [userId, courseName]);

  // SCORM progress tracking effect (adapted from web implementation)
  useEffect(() => {
    loadInitialProgress();

    // Set up interval to check AsyncStorage periodically
    const interval = setInterval(loadInitialProgress, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [loadInitialProgress]);

  // Handle back button press
  useEffect(() => {
    const backHandler = () => {
      saveProgress();
      navigation.goBack();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
    return () => backHandlerSubscription.remove();
  }, [userId, currentProgress]);

  const saveProgressAndExit = async () => {
    await saveProgress();
    navigation.goBack();
  };

  const injectedJS = `
    (function() {
      var scormData = {};
      var isInitialized = false;
      var hasUserInteracted = false;
      window.parent = window;
      window.top = window;
      
      // User interaction tracking
      document.addEventListener('click', function() {
        hasUserInteracted = true;
        console.log('User interaction detected');
      }, { once: false });
      
      document.addEventListener('touchstart', function() {
        hasUserInteracted = true;
        console.log('Touch interaction detected');
      }, { once: false });
      
      // Simple audio enable function
      function enableAudio() {
        console.log('Enabling audio playback');
        var audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(function(element) {
          element.muted = false;
          element.volume = 1.0;
          element.play().then(function() {
            console.log('Audio playing successfully:', element.src);
          }).catch(function(error) {
            console.log('Audio play failed:', error);
          });
        });
      }
      
      // Auto-unmute and play after user interaction
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          var audioElements = document.querySelectorAll('audio, video');
          audioElements.forEach(function(element) {
            element.muted = false;
            element.volume = 1.0;
            console.log('Audio element found and unmuted:', element.src || element);
          });
          
          if (hasUserInteracted) {
            enableAudio();
          } else {
            console.log('Waiting for user interaction to enable audio');
            // Enable audio on first interaction
            var enableAudioOnce = function() {
              hasUserInteracted = true;
              enableAudio();
              document.removeEventListener('click', enableAudioOnce);
              document.removeEventListener('touchstart', enableAudioOnce);
            };
            document.addEventListener('click', enableAudioOnce, { once: true });
            document.addEventListener('touchstart', enableAudioOnce, { once: true });
          }
        }, 2000);
      });
      
      // Enhanced SCORM API implementation
      window.API = {
        LMSInitialize: function() {
          isInitialized = true;
          console.log('SCORM API Initialized');
          // Use restored data if available
          if (window.scormData) {
            scormData = Object.assign(scormData, window.scormData);
          }
          return "true";
        },

        LMSSetValue: function(key, value) {
          if (!isInitialized) return "false";
          
          scormData[key] = value;
          console.log('SCORM SetValue:', key, value);
          
          // Send data to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'setValue', key, value })
            );
          }
          
          return "true";
        },

        LMSGetValue: function(key) {
          if (!isInitialized) return "";
          const value = scormData[key] || "";
          console.log('SCORM GetValue:', key, value);
          return value;
        },

        LMSCommit: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Commit');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'commit', data: scormData })
            );
          }
          
          return "true";
        },

        LMSFinish: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Finish');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'finish', data: scormData })
            );
          }
          
          return "true";
        },

        LMSGetLastError: function() {
          return isInitialized ? "0" : "101"; // 101 = Not initialized
        },

        LMSGetDiagnostic: function(errorCode) {
          return errorCode === "101" ? "API not initialized" : "No error";
        }
      };

      // Also provide API_1484_11 for older SCORM versions
      window.API_1484_11 = window.API;
      
      console.log('SCORM API injected successfully');
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📥 SCORM Message:', data);

      // Handle different types of SCORM messages (adapted from web implementation)

      // ✅ BEST CASE → SCORM sends both values
      if (data.type === "SCORM_PROGRESS") {
        const visited = data.current || 0;
        const total = data.total || totalCount || 1;

        updateProgressState(visited, total);
      }

      // ✅ Articulate / LMS events
      else if (data.type === "SCORM_EVENT") {
        if (
          data.action === "SLIDE_VISIT" ||
          data.action === "PROGRESS_UPDATE"
        ) {
          const visited = data.slideNumber || data.visited || 0;
          const total = data.totalSlides || data.total || totalCount || visited || 1;

          updateProgressState(visited, total);
        }

        // fallback (only slide number comes)
        if (data.action === "LMSSetValue") {
          if (
            data.key === "cmi.core.lesson_location" ||
            data.key === "cmi.location"
          ) {
            const visited = parseInt(data.value) || 0;

            updateProgressState(visited, totalCount || visited || 1);
          }
        }
      }

      // ✅ fallback generic
      else if (data.type === "progress") {
        const progress = Math.round(data.value || 0);
        setCurrentProgress(progress);
        console.log("progress", progress);
      }

      // Original SCORM messages
      else {
        switch (data.type) {
          case 'setValue':
            console.log('SCORM Data Set:', data.key, data.value);
            // Persist SCORM data to AsyncStorage
            const idx = selectedTopicRef.current;
            const scormKey = `scorm_data_${courseId}_topic_${idx}`;
            setScormData(prev => {
              const updated = { ...prev, [data.key]: data.value };
              AsyncStorage.setItem(scormKey, JSON.stringify(updated));
              return updated;
            });
            break;
          case 'commit':
            console.log('SCORM Data Committed:', data.data);
            break;
          case 'finish':
            console.log('SCORM Session Finished:', data.data);
            saveProgressAndExit();
            break;
          default:
            console.log('SCORM Unknown Message:', data);
        }
      }
    } catch (error) {
      console.error('SCORM Message Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView Player */}
      <WebView
        ref={webViewRef}
        source={{
          uri: currentUrl || 'https://your-aws-url/index.html'
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode={'compatibility'}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsAirPlayForMediaPlayback={true}
        allowsPictureInPictureMediaPlayback={true}
        startInLoadingState={true}
        userAgent={'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onMessage={handleMessage}
        onTouchStart={() => {
          setIsInteracted(true);
          console.log('WebView touched');
        }}
        onLoad={() => {
          console.log('SCORM Loaded - triggering audio enable and setting progress');
          setTimeout(() => {
            const script = `
              var audioElements = document.querySelectorAll('audio, video');
              audioElements.forEach(function(element) {
                element.muted = false;
                element.volume = 1.0;
                if (element.play) {
                  element.play().catch(function(error) {
                    console.log('Post-load audio failed:', error);
                  });
                }
              });
            `;
            webViewRef.current?.injectJavaScript(script);
          }, 3000);
        }}
        onLoadStart={() => console.log('SCORM Loading started')}
        onError={(error) => console.error('SCORM WebView Error:', error)}
        onHttpError={(error) => console.error('SCORM HTTP Error:', error)}
      />

      {/* Sidebar Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
        <Ionicons name={sidebarVisible ? "close" : "menu"} size={28} color="#fff" />
      </TouchableOpacity>

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{courseName}</Text>
          <View style={styles.overallProgressContainer}>
            <View style={[styles.overallProgressFill, { width: `${courseContent.length > 0 ? Math.round(Object.values(topicProgress).reduce((a, b) => a + b, 0) / courseContent.length) : 0}%` }]} />
          </View>
          <Text style={styles.overallProgressText}>
            {courseContent.length > 0 ? Math.round(Object.values(topicProgress).reduce((a, b) => a + b, 0) / courseContent.length) : 0}% Overall
          </Text>
        </View>
        <ScrollView style={styles.topicList}>
          {courseContent.map((topic, index) => {
            const tProgress = index === selectedTopicIndex ? Math.max(topicProgress[index] || 0, currentProgress) : (topicProgress[index] || 0);
            const isLocked = index > 0 && (topicProgress[index - 1] || 0) < 100 && (topicProgress[index] || 0) === 0;
            const isActive = selectedTopicIndex === index;
            const isComplete = tProgress >= 100;

            return (
              <TouchableOpacity
                key={index}
                disabled={isLocked}
                style={[styles.topicItem, isActive && styles.activeTopicItem, isLocked && styles.lockedTopicItem]}
                onPress={() => {
                  if (!isLocked) {
                    setSelectedTopicIndex(index);
                    setCurrentProgress(topicProgress[index] || 0);
                    toggleSidebar();
                  }
                }}
              >
                <View style={styles.topicRow}>
                  <Text style={styles.topicIcon}>
                    {isLocked ? '🔒' : isComplete ? '✅' : '▶️'}
                  </Text>
                  <Text style={[styles.topicText, isActive && styles.activeTopicText, isLocked && styles.lockedTopicText]}>
                    {index + 1}. {topic.topic}
                  </Text>
                </View>
                {!isLocked && (
                  <View style={styles.miniProgressContainer}>
                    <View style={[styles.miniProgressFill, { width: `${tProgress}%` }]} />
                  </View>
                )}

                {!isLocked && (
                  <Text style={styles.topicProgressText}>{tProgress}%</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  toggleButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    paddingTop: 50,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  topicList: {
    flex: 1,
  },
  overallProgressContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginTop: 10,
    width: '100%',
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#E88D2A',
    borderRadius: 3,
  },
  overallProgressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  topicItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeTopicItem: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 3,
    borderLeftColor: '#E88D2A',
  },
  lockedTopicItem: {
    opacity: 0.5,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  topicText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  activeTopicText: {
    color: '#E88D2A',
    fontWeight: 'bold',
  },
  lockedTopicText: {
    color: '#bbb',
  },
  topicProgressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  miniProgressContainer: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});

export default ScormPlayer;