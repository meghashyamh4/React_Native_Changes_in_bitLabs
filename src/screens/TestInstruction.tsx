import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import { useAuth } from "@context/Authcontext";
import Icon from "react-native-vector-icons/AntDesign";
import { TestData } from "@models/Model";
import { fetchTestStatus } from "@services/Home/BadgeService";
import ExitModal from "./ExitModal";
import { fetchTestData } from "@services/Test/testService";
const { width, height } = Dimensions.get("window");
const Test = ({ route, navigation }: any) => {
  const TABLET_BREAKPOINT = 768;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_BREAKPOINT;
  const { userId, userToken } = useAuth();
  const {
    testName: routeTestName,
    testStatus: routeTestStatus,
    testType,
    skillName,
  } = route.params || {};
  const [testName, setTestName] = useState(routeTestName || '');
  const [testStatus, setTestStatus] = useState(routeTestStatus || "F");
  const [step, setStep] = useState(1); // Default initial step
  const [testData, setTestData] = useState<TestData>({
    testName: '',
    duration: '',
    numberOfQuestions: 0,
    topicsCovered: [],
  });
  const [loading, setLoading] = useState(true);
  const [isTestStatusFetched, setTestStatusFetched] = useState(false);
  const [isTestDataFetched, setTestDataFetched] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (testType === "SkillBadge") {
      setTestStatusFetched(true)
      setLoading(false);
      return;
    }

    if (routeTestName) {
      setTestName(routeTestName);
      if (routeTestName === 'Technical Test') {
        setStep(2);
      } else {
        setStep(1);
      }
      setTestStatusFetched(true);
      setLoading(false);
      return;
    }

    const getTestStatus = async () => {
      setLoading(true);
      const data = await fetchTestStatus(userId, userToken);
      if (data && Array.isArray(data) && data.length > 0) {
        const { testStatus: fetchedStatus, testName: fetchedName } = data[0];
        setTestName(fetchedName || testName);
        setTestStatus(fetchedStatus || testStatus);
        setTestStatusFetched(true);
        adjustStep(fetchedName, fetchedStatus);
      } else {
        adjustStep(testName, testStatus);
        setTestStatusFetched(true);
      }
      setLoading(false)
    };
    getTestStatus();

    return () => {
      setTestStatusFetched(false)
    }

  }, [userId, userToken, testType, routeTestName]);

  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        setShowExitModal(true);
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, []),
  );
  const adjustStep = (name: string, status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'p' && name === 'General Aptitude Test') {
      setStep(2);
      setTestName('Technical Test');
    } else if (lowerStatus === "p" && name === "Technical Test") {
      setStep(3);
    } else if (lowerStatus === 'f' && name === 'Technical Test') {
      setStep(2);
      setTestName('Technical Test');
    } else {
      setStep(1);
      setTestName('General Aptitude Test');
    }
  };

  useEffect(() => {
    if (testType !== "SkillBadge" && step > 2) {
      setTestData({
        testName: "",
        duration: "",
        numberOfQuestions: 0,
        topicsCovered: [],
      });
      setLoading(false);
      setTestDataFetched(true);
      return;
    }

    const identifier = testType === 'SkillBadge' ? skillName : testName

    if (!identifier) {
      setLoading(false);
      return;
    }
    const fetchApiData = async (testName: string) => {
      console.log("test name : ", testName)
      const response = await fetchTestData(testName);
      const data: TestData = response.data;
      return data
    }

    fetchApiData(identifier).then((data) => {
      // Override duration for General Aptitude Test to 30 mins
      const testNameLower = (testName || '').toLowerCase();
      const identifierLower = (identifier || '').toLowerCase();
      if (testNameLower.includes('general aptitude') || identifierLower.includes('general aptitude')) {
        data.duration = '30 mins';
      }
      setTestData(data);
      console.log("data set : ", data)
      setTestDataFetched(true)
      setLoading(false);
    }).catch((error) => {
      console.log("error: ", error)
    })

    return () => {
      setTestDataFetched(false);
    }

  }, [step, testName]);

  const combinedLoading = loading || !isTestStatusFetched || !isTestDataFetched;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.backButton}>
          <Icon name="arrowleft" size={24} color="#495057" />

        </TouchableOpacity>
      </View>
      {combinedLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color="#F46F16"
            style={styles.loaderContainer}
          />
        </View>) : (
        <ScrollView style={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <View style={styles.container1}>
              <MaskedView
                style={styles.maskedView}
                maskElement={<Text style={styles.head}>{loading ? "Loading..." : testData.testName}</Text>}
              >
                <LinearGradient
                  colors={['#F97316', '#FAA729']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBackground1}
                />
              </MaskedView>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: -20 }}>
                <View style={styles.box1}>
                  <Text style={styles.text}>Duration</Text>
                  <Text style={styles.text1}>
                    {testData.duration || (testData.testName?.toLowerCase().includes('general aptitude') ? '30 mins' : 'N/A')}
                  </Text>
                </View>
                <View style={styles.box1}>
                  <Text style={styles.text}>Questions</Text>
                  <Text style={styles.text1}>{testData.numberOfQuestions || 0}</Text>
                </View>
              </View>
              <Text style={{ color: '#797979', fontFamily: 'PlusJakartaSans-Medium' }}>
                Topics Covered
              </Text>
              <Text style={{ lineHeight: 27, color: 'black', fontFamily: 'PlusJakartaSans-Bold' }}>
                {Array.isArray(testData.topicsCovered) && testData.topicsCovered.length > 0
                  ? `${testData.topicsCovered.join(', ')}`
                  : 'No topics available'}
              </Text>
            </View>
            <View style={styles.container2}>
              <Text style={styles.heading}>Instructions</Text>
              {[
                'You need to score at least 70% to pass the exam.',
                'Once started, the test cannot be paused or reattempted during the same session.',
                'If you score below 70%, you can retake the exam after 7 days.',
                'Ensure all questions are answered before submitting, as your first submission will be final.',
                'Please complete the test independently. External help is prohibited.',
                'Make sure your device is fully charged and has a stable internet connection before starting the test.',
              ].map((instruction, index) => (
                <View key={index} style={styles.point}>
                  <Text style={styles.bullet}>{'\u2022'}</Text>
                  <Text style={styles.instruction}>{instruction}</Text>
                </View>
              )

              )}
            </View>
          </View>

        </ScrollView>

      )}
      <ExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onExit={() => {
          setShowExitModal(false);
          setTimeout(() => {
            navigation.goBack();
          }, 300);
        }}
      />
      {!combinedLoading &&
        <View style={styles.footer}>
          <LinearGradient
            colors={['#F97316', '#FAA729']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}>
            <TouchableOpacity
              style={[styles.button, isTablet ? { width: '100%', height: height * 0.06, } : {}]}
              onPress={() => {
                const nameToSend = testType === "SkillBadge" ? skillName : testData.testName;
                console.log("Navigating with", nameToSend);
                navigation.navigate("TestScreen", { testName: nameToSend, testData: testData });
              }}
            >
              <Text style={styles.start}>Start</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      }



    </View>
  );
};
export default Test;

const styles = StyleSheet.create({
  container: {
    width: width * 0.93,
    height: 690,
    marginTop: 20,
    marginLeft: 13,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  container1: {
    width: '90%',
    height: 220,
    marginTop: 15,
    marginLeft: 20,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    padding: 15,
    justifyContent: 'space-around',
  },
  head: {
    color: 'orange',
    fontSize: 20,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  box1: {
    width: 98,
    height: 62,
    marginLeft: 20,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'space-evenly',
  },
  container2: {
    alignContent: 'center',
    marginLeft: 20,
  },
  text: {
    fontSize: 12,
    lineHeight: 20,
    color: '#9E9E9E',
    marginLeft: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  maskedView: {
    flexDirection: 'row',
    height: 40,
  },
  gradientBackground1: {
    flex: 1,
  },
  text1: {
    fontSize: 16,
    lineHeight: 20,
    marginLeft: 10,
    color: '#484848',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  heading: {
    fontSize: 18,
    marginBottom: 16,
    color: '#000',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 18,
    color: 'grey',
    marginRight: 8,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  instruction: {
    flex: 1,
    fontSize: 14,
    color: '#756E6E',
    lineHeight: 23,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  footer: {
    height: height * 0.075,
    gap: height * 0.015, // Responsive gap
    backgroundColor: '#FFF',
    justifyContent: 'center',
  },
  gradientBackground: {
    borderRadius: 10,
    width: width * 0.9,
    height: 40,
    marginLeft: 22.5,
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    height: height * 0.06,
    borderRadius: width * 0.02,
    marginLeft: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  start: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: width * 0.045,
    lineHeight: height * 0.03,
    marginRight: 40,
  },
  headerContainer: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    left: 15,
  },
  loaderContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
