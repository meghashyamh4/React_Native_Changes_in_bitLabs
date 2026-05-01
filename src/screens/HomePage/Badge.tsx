
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '@context/Authcontext';
import { useProfileViewModel } from '@viewmodel/Profileviewmodel';
import { fetchTestStatus, calculateRetakeDate } from '@services/Home/BadgeService';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import UserContext from '@context/UserContext';
import SkillCard from '@components/Cards/SkillCard';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icon images - using require for local assets or URIs for remote
const aptitudeIcon = require('@assests/Images/Test/problem-solve.png');
const technicalIcon = require('@assests/Images/Test/coding.png');
const verificationIcon = require('@assests/Images/Test/Verified3.png');
const badgeImage = require('@assests/Images/Test/Badge.png');
const boyImage = require('@assests/Images/boyimage.png');

interface TestData {
  testName: string;
  testStatus: string;
  testScore: number;
  testDateTime: number[];
}

interface SkillBadgeData {
  skillsRequired: Array<{ id: number; skillName: string }>;
  applicantSkillBadges: Array<{
    id: number;
    skillBadge: { id: number; name: string };
    status: string;
    testTaken: number[];
    flag?: string;
  }>;
}

const Badge = ({ navigation }: any) => {
  const { userId, userToken } = useAuth();
  const { profileData } = useProfileViewModel(userToken, userId);
  const { skillsRequired = [] } = profileData || {};
  const { personalName } = useContext(UserContext);
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // State management
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData[]>([]);
  const [skillBadges, setSkillBadges] = useState<SkillBadgeData>({
    skillsRequired: [],
    applicantSkillBadges: [],
  });

  // Step and progress state
  const [currentStep, setCurrentStep] = useState(1);
  const [hideSteps, setHideSteps] = useState(false);
  const [passedBothTests, setPassedBothTests] = useState(false);
  const [aptitudeScore, setAptitudeScore] = useState(0);
  const [technicalScore, setTechnicalScore] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [timer, setTimer] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds?: number;
  } | null>(null);
  const [timerState, setTimerState] = useState<Record<number, any>>({});

  // Fetch test data
  const fetchTestData = async () => {
    if (!userId || !userToken) return;
    try {
      const data = await fetchTestStatus(userId, userToken);
      setTestData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching test data:', error);
      setTestData([]);
    }
  };

  // Fetch skill badges
  const fetchSkillBadgeData = async () => {
    if (!userId || !userToken) return;
    try {
      const result = await ProfileApiService.fetchSkillBadges(userId, userToken);
      const badges = result.badges || [];

      // Get all skill names from badges
      const badgeSkillNames = new Set(
        badges
          .map((badge: any) => badge.skillBadge?.name?.toLowerCase())
          .filter((name: string) => name) // Remove undefined/null
      );

      // Get current skillsRequired from profileData
      const currentSkillsRequired = skillsRequired || [];

      // Get skill names that are in skillsRequired but not in badges
      // These are skills that haven't been attempted yet (no badge record exists)
      const unattemptedSkills = currentSkillsRequired.filter(
        (skill: any) => skill?.skillName && !badgeSkillNames.has(skill.skillName.toLowerCase()),
      );

      console.log('Fetched badges count:', badges.length);
      console.log('Skills required count:', currentSkillsRequired.length);
      console.log('Unattempted skills count:', unattemptedSkills.length);

      setSkillBadges({
        skillsRequired: unattemptedSkills,
        applicantSkillBadges: badges, // This includes ALL badges (attempted or not)
      });
    } catch (error) {
      console.error('Error fetching skill badges:', error);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTestData(), fetchSkillBadgeData()]);
    } finally {
      setLoading(false);
    }
  };

  // Update skill badges when skillsRequired changes (after profile data loads)
  useEffect(() => {
    if (skillsRequired && skillsRequired.length >= 0 && userId && userToken) {
      // Re-process skill badges when skillsRequired is available/updated
      fetchSkillBadgeData();
    }
  }, [skillsRequired, userId, userToken]);

  // Calculate timer for retake
  const startTimer = useCallback(
    (retakeDate: Date, badgeId?: number) => {
      const calculateTimeLeft = () => {
        const now = new Date();
        const diff = retakeDate.getTime() - now.getTime();

        if (diff > 0) {
          const timeLeft = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % 1000) / 1000),
          };

          if (badgeId) {
            setTimerState(prev => ({ ...prev, [badgeId]: timeLeft }));
          } else {
            setTimer(timeLeft);
            setIsDisabled(true);
          }
        } else {
          if (badgeId) {
            setTimerState(prev => ({ ...prev, [badgeId]: null }));
          } else {
            setTimer(null);
            setIsDisabled(false);
          }
        }
      };

      calculateTimeLeft();
      return setInterval(calculateTimeLeft, 1000);
    },
    [],
  );

  // Process test data and set step/progress
  useEffect(() => {
    if (!testData || testData.length === 0) {
      setCurrentStep(1);
      setHideSteps(false);
      setPassedBothTests(false);
      setIsDisabled(false);
      setTimer(null);
      return;
    }

    const aptitudeTest = testData.find(test =>
      test.testName?.toLowerCase().includes('aptitude'),
    );
    const technicalTest = testData.find(test =>
      test.testName?.toLowerCase().includes('technical'),
    );

    // Store scores
    setAptitudeScore(aptitudeTest ? aptitudeTest.testScore || 0 : 0);
    setTechnicalScore(technicalTest ? technicalTest.testScore || 0 : 0);

    // Check if both tests passed (status 'P' OR score >= 60)
    const bothPassed =
      aptitudeTest &&
      technicalTest &&
      ((aptitudeTest.testStatus?.toUpperCase() === 'P' ||
        (aptitudeTest.testScore && aptitudeTest.testScore >= 60)) &&
        (technicalTest.testStatus?.toUpperCase() === 'P' ||
          (technicalTest.testScore && technicalTest.testScore >= 60)));

    if (bothPassed) {
      setPassedBothTests(true);
      setCurrentStep(3);
      setHideSteps(true);
      setTimer(null);
      setIsDisabled(false);
      return;
    }

    // Aptitude failed
    if (aptitudeTest && aptitudeTest.testStatus?.toUpperCase() === 'F') {
      setCurrentStep(1);
      setHideSteps(false);
      setIsDisabled(false);

      if (aptitudeTest.testDateTime && Array.isArray(aptitudeTest.testDateTime)) {
        const retakeDate = calculateRetakeDate(aptitudeTest.testDateTime);
        const timerInterval = startTimer(retakeDate);
        return () => clearInterval(timerInterval);
      }
    }

    // Aptitude passed
    if (aptitudeTest && aptitudeTest.testStatus?.toUpperCase() === 'P') {
      // Technical not taken yet
      if (!technicalTest || !technicalTest.testStatus) {
        setCurrentStep(2);
        setHideSteps(false);
        setTimer(null);
        setIsDisabled(false);
        return;
      }

      // Technical failed
      if (technicalTest.testStatus?.toUpperCase() === 'F') {
        setCurrentStep(2);
        setHideSteps(false);

        if (technicalTest.testDateTime && Array.isArray(technicalTest.testDateTime)) {
          const retakeDate = calculateRetakeDate(technicalTest.testDateTime);
          const timerInterval = startTimer(retakeDate);
          return () => clearInterval(timerInterval);
        }
      }
    }

    // Default
    setCurrentStep(1);
    setHideSteps(false);
    setTimer(null);
    setIsDisabled(false);
  }, [testData, startTimer]);

  // Update button state based on timer and step
  useEffect(() => {
    if (timer && (currentStep === 1 || currentStep === 2)) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [currentStep, timer]);

  // Handle timer for skill badges
  useEffect(() => {
    skillBadges.applicantSkillBadges.forEach(badge => {
      if (badge.status === 'FAILED' && badge.testTaken && Array.isArray(badge.testTaken)) {
        const retakeDate = calculateRetakeDate(badge.testTaken);
        const timerInterval = startTimer(retakeDate, badge.skillBadge.id);
        return () => clearInterval(timerInterval);
      }
    });
  }, [skillBadges.applicantSkillBadges, startTimer]);

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [userId, userToken]),
  );

  const handleTakeTest = (testName: string) => {
    navigation.navigate('TestInstruction', { testName });
  };

  const steps = [
    { id: 1, label: 'General aptitude test', icon: aptitudeIcon },
    { id: 2, label: 'Technical test', icon: technicalIcon },
    { id: 3, label: 'Verification done', icon: verificationIcon },
  ];

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assests/Images/backgrounds/image.png')}
        style={styles.background}>
        <View style={styles.container}>
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Skeleton */}
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <View style={styles.skeletonBackButton} />
                <View style={styles.skeletonTitle} />
                <View style={styles.backButtonPlaceholder} />
              </View>
            </View>

            {/* Step Progress Section Skeleton */}
            <View style={styles.stepperContainer}>
              <View style={styles.progressStepper}>
                {[1, 2, 3].map((i, index) => (
                  <View key={i} style={styles.stepColumn}>
                    {index > 0 && (
                      <View style={[styles.skeletonProgressLine, { left: 0, right: '50%' }]} />
                    )}
                    {index < 2 && (
                      <View style={[styles.skeletonProgressLine, { left: '50%', right: 0 }]} />
                    )}
                    <View style={styles.skeletonStepCircle} />
                  </View>
                ))}
              </View>

              <View style={styles.stepCardsContainer}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonStepCard}>
                    <View style={styles.skeletonStepCardContent}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepButton} />
                    </View>
                    <View style={styles.skeletonStepLabel} />
                  </View>
                ))}
              </View>
            </View>

            {/* Skills Badges Section Skeleton */}
            <View style={styles.skillBadgesSection}>
              <View style={styles.skeletonSkillBadgeHeading} />
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.skillBadgesContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.skeletonSkillCard}>
                    {/* Status Badge Skeleton (top right) */}
                    <View style={styles.skeletonStatusBadge} />

                    {/* Image Skeleton */}
                    <View style={styles.skeletonCardImage} />

                    {/* Title Skeleton */}
                    <View style={styles.skeletonCardTitle} />

                    {/* Button Skeleton */}
                    <View style={styles.skeletonCardButton} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assests/Images/backgrounds/image.png')}
      style={styles.background}>
      <View style={styles.container}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header with Back Button */}
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#495057" />
              </TouchableOpacity>
              <Text style={styles.title}>Skill Validation</Text>
              <View style={styles.backButtonPlaceholder} />
            </View>
          </View>

          {/* Skill Validation Section */}
          {passedBothTests ? (
            // Congratulations Card
            <View style={styles.congratulationsCard}>
              <Image source={verificationIcon} style={styles.verificationIcon} />
              <Text style={styles.congratulationsTitle}>Congratulations!</Text>
              <Text style={styles.congratulationsMessage}>
                You have successfully passed the Aptitude and Technical tests. Your profile is now verified.
              </Text>
            </View>
          ) : (
            // Step Progress Section
            !hideSteps && (
              <View style={styles.stepperContainer}>
                {/* Progress Stepper */}
                <View style={styles.progressStepper}>
                  {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const isActive = step.id <= currentStep;
                    const activeColor = '#E66A0E';
                    const inactiveColor = '#bdbdbd';

                    // Line logic
                    const leftLineActive = step.id <= currentStep;
                    const rightLineActive = steps[index + 1]?.id <= currentStep;

                    return (
                      <View key={step.id} style={styles.stepColumn}>
                        {/* Connecting Lines */}
                        {index > 0 && (
                          <View
                            style={[
                              styles.progressLine,
                              {
                                left: 0,
                                right: '50%',
                                backgroundColor: leftLineActive ? activeColor : '#e0e0e0',
                              },
                            ]}
                          />
                        )}
                        {!isLast && (
                          <View
                            style={[
                              styles.progressLine,
                              {
                                left: '50%',
                                right: 0,
                                backgroundColor: rightLineActive ? activeColor : '#e0e0e0',
                              },
                            ]}
                          />
                        )}

                        {/* Step Circle */}
                        <View
                          style={[
                            styles.stepCircle,
                            {
                              backgroundColor: isActive ? activeColor : '#fff',
                              borderColor: isActive ? activeColor : inactiveColor,
                            },
                          ]}>
                          {isLast ? (
                            <MaterialIcons
                              name="flag"
                              size={wp('5%')}
                              color={isActive ? '#fff' : '#bdbdbd'}
                            />
                          ) : isActive && step.id < currentStep ? (
                            <Icon name="check" size={wp('4%')} color="#fff" />
                          ) : (
                            <Text
                              style={[
                                styles.stepNumber,
                                { color: isActive ? '#fff' : inactiveColor },
                              ]}>
                              {step.id}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Step Cards */}
                <View style={styles.stepCardsContainer}>
                  {steps.map((step) => (
                    <View key={step.id} style={styles.stepCard}>
                      <View style={styles.stepCardContent}>
                        <Image source={step.icon} style={styles.stepIcon} />
                        <View style={styles.stepCardFooter}>
                          {step.id !== 3 ? (
                            currentStep > step.id ? (
                              <LinearGradient
                                colors={['#FCAA45', '#E66A0E']}
                                style={styles.scoreFooter}>
                                <Text style={styles.scoreText}>
                                  Score:{' '}
                                  {step.id === 1
                                    ? `${aptitudeScore.toFixed(0)}%`
                                    : `${technicalScore.toFixed(0)}%`}
                                </Text>
                              </LinearGradient>
                            ) : (
                              <TouchableOpacity
                                style={[
                                  styles.stepButton,
                                  {
                                    backgroundColor:
                                      isDisabled && currentStep === step.id
                                        ? '#9b9b9b'
                                        : currentStep === step.id
                                          ? '#121212'
                                          : '#BFBFBF',
                                  },
                                ]}
                                onPress={() => {
                                  if (!isDisabled && currentStep === step.id) {
                                    handleTakeTest(step.label);
                                  }
                                }}
                                disabled={isDisabled && currentStep === step.id}>
                                <Text style={styles.stepButtonText}>
                                  {isDisabled && currentStep === step.id
                                    ? 'Retake test'
                                    : currentStep === step.id
                                      ? 'Start test'
                                      : 'Coming soon'}
                                </Text>
                              </TouchableOpacity>
                            )
                          ) : (
                            <View
                              style={[
                                styles.qualifiedFooter,
                                {
                                  backgroundColor: currentStep >= 3 ? '#28A745' : '#BFBFBF',
                                },
                              ]}>
                              <Text style={styles.qualifiedText}>
                                {currentStep >= 3 ? 'Qualified' : 'Locked'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Timer Display */}
                      {step.id !== 3 &&
                        isDisabled &&
                        currentStep === step.id &&
                        timer && (
                          <View style={styles.timerDisplay}>
                            <Text style={styles.timerText}>
                              {timer.days > 0 && `${timer.days}d `}
                              {timer.hours > 0 && `${timer.hours}h `}
                              {timer.minutes > 0 && `${timer.minutes}m `}
                              {timer.seconds !== undefined &&
                                timer.hours === 0 &&
                                timer.days === 0 &&
                                `${timer.seconds}sec`}
                            </Text>
                          </View>
                        )}

                      {/* Step Label */}
                      <Text style={styles.stepLabel}>{step.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          )}

          {/* Skills Badges Section */}
          <View style={styles.skillBadgesSection}>
            <Text style={styles.skillBadgeHeading}>Skills badges</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.skillBadgesContainer}>
              {/* Skills Required (not yet taken) - Show first */}
              {skillBadges.skillsRequired.map((skill) => (
                <SkillCard
                  key={`skill-${skill.id}`}
                  skillName={skill.skillName}
                  status={null}
                  onPress={() =>
                    navigation.navigate('TestInstruction', {
                      skillName: skill.skillName,
                      testType: 'SkillBadge',
                    })
                  }
                />
              ))}

              {/* Skills in applicantSkillBadges but not PASSED/FAILED - Show as not taken (Take test) */}
              {skillBadges.applicantSkillBadges
                .filter(
                  badge => {
                    if (!badge || !badge.skillBadge || !badge.skillBadge.name) return false;
                    const status = (badge.status || '').toUpperCase().trim();
                    // Show if status is null, empty, undefined, or any value other than PASSED/FAILED
                    // This includes badges that exist but haven't been attempted yet
                    return status !== 'PASSED' && status !== 'P' && status !== 'FAILED' && status !== 'F';
                  }
                )
                .map(badge => (
                  <SkillCard
                    key={`not-taken-badge-${badge.id || badge.skillBadge.id}`}
                    skillName={badge.skillBadge.name}
                    status={null}
                    onPress={() =>
                      navigation.navigate('TestInstruction', {
                        skillName: badge.skillBadge.name,
                        testType: 'SkillBadge',
                      })
                    }
                  />
                ))}

              {/* Passed Skill Badges - Show with PASSED status and Retake Test option */}
              {skillBadges.applicantSkillBadges
                .filter(
                  badge =>
                    badge &&
                    badge.skillBadge &&
                    badge.skillBadge.name &&
                    (badge.status === 'PASSED' || badge.status === 'P'),
                )
                .map(badge => (
                  <SkillCard
                    key={`passed-badge-${badge.id}`}
                    skillName={badge.skillBadge.name}
                    status="PASSED"
                    onPress={() =>
                      navigation.navigate('TestInstruction', {
                        skillName: badge.skillBadge.name,
                        testType: 'SkillBadge',
                      })
                    }
                  />
                ))}

              {/* Failed Skill Badges - Show with FAILED status, timer if active, or Retake Test after timer expires */}
              {skillBadges.applicantSkillBadges
                .filter(
                  badge =>
                    badge &&
                    badge.skillBadge &&
                    badge.skillBadge.name &&
                    (badge.status === 'FAILED' || badge.status === 'F'),
                )
                .map(badge => {
                  const timer = timerState[badge.skillBadge.id];
                  return (
                    <SkillCard
                      key={`failed-badge-${badge.id}`}
                      skillName={badge.skillBadge.name}
                      status="FAILED"
                      timer={timer}
                      onPress={() =>
                        !timer
                          ? navigation.navigate('TestInstruction', {
                            skillName: badge.skillBadge.name,
                            testType: 'SkillBadge',
                          })
                          : undefined
                      }
                      disabled={!!timer}
                    />
                  );
                })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default Badge;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: wp('1%'),
    width: wp('10%'),
  },
  backButtonPlaceholder: {
    width: wp('10%'),
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    textAlign: 'center',
  },
  congratulationsCard: {
    backgroundColor: '#FFF9ED',
    padding: wp('6%'),
    borderRadius: 12,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  verificationIcon: {
    width: wp('20%'),
    height: wp('20%'),
    marginBottom: hp('2%'),
  },
  congratulationsTitle: {
    color: '#F46F16',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: wp('6%'),
    marginBottom: hp('1%'),
  },
  congratulationsMessage: {
    color: '#333',
    fontSize: wp('3.8%'),
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  stepperContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: wp('4%'),
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  progressStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: hp('2.5%'),
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressLine: {
    position: 'absolute',
    height: 3,
    top: '50%',
    marginTop: -1.5,
    zIndex: 1,
  },
  stepCircleContainer: {
    zIndex: 3,
    width: wp('10%'),
    height: wp('10%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    zIndex: 3,
  },
  stepNumber: {
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },
  stepCardsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: hp('2%'),
    paddingHorizontal: wp('0.5%'),
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: wp('1.2%'),
  },
  stepCardContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: hp('1.5%'),
    height: hp('14%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eaeaea',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  stepIcon: {
    width: wp('10%'),
    height: hp('5%'),
    resizeMode: 'contain',
    marginBottom: hp('0.5%'),
  },
  stepCardFooter: {
    width: '100%',
    marginTop: 'auto',
  },
  scoreFooter: {
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp('4.8%'), // Increased from 4% to 5.5% for better visibility
  },
  scoreText: {
    color: '#fff',
    fontSize: wp('3.2%'),
    fontFamily: 'PlusJakartaSans-Bold',
  },
  stepButton: {
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('1.5%'),
    alignItems: 'center',
    height: hp('4%'),
    justifyContent: 'center',
  },
  stepButtonText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
  qualifiedFooter: {
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    paddingVertical: hp('1.3%'),
    paddingHorizontal: wp('1%'),
    alignItems: 'center',
    height: hp('4.2%'),
    justifyContent: 'center',
  },
  qualifiedText: {
    color: '#fff',
    fontSize: wp('2.8%'),
    fontFamily: 'PlusJakartaSans-Medium',
  },
  timerDisplay: {
    marginTop: hp('0.8%'),
    alignItems: 'center',
  },
  timerText: {
    color: '#F3780D',
    fontSize: wp('3.2%'),
    fontFamily: 'PlusJakartaSans-Bold',
  },
  stepLabel: {
    fontSize: wp('2.6%'),
    lineHeight: wp('3.2%'),
    marginTop: hp('0.8%'),
    textAlign: 'center',
    color: '#121212',
    fontFamily: 'PlusJakartaSans-Medium',
    width: '100%',
  },
  skillBadgesSection: {
    marginTop: hp('3%'),
    marginBottom: hp('5%'),
  },
  skillBadgeHeading: {
    fontSize: wp('5%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#495057',
    marginLeft: wp('6%'),
    marginBottom: hp('2%'),
  },
  skillBadgesContainer: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Skeleton Loading Styles
  skeletonBackButton: {
    width: wp('10%'),
    height: 32,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonTitle: {
    width: 150,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    flex: 1,
    marginHorizontal: 16,
  },
  skeletonStepCircle: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#e0e0e0',
  },
  skeletonProgressLine: {
    position: 'absolute',
    height: 3,
    top: '50%',
    marginTop: -1.5,
    backgroundColor: '#e0e0e0',
    zIndex: 1,
  },
  skeletonStepCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: wp('1.2%'),
  },
  skeletonStepCardContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: hp('1.5%'),
    height: hp('14%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eaeaea',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  skeletonStepIcon: {
    width: wp('10%'),
    height: hp('5%'),
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: hp('0.5%'),
  },
  skeletonStepButton: {
    width: '100%',
    height: hp('4%'),
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: '#e0e0e0',
    marginTop: 'auto',
  },
  skeletonStepLabel: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginTop: hp('0.8%'),
  },
  skeletonSkillBadgeHeading: {
    width: 150,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginLeft: wp('6%'),
    marginBottom: hp('2%'),
  },
  skeletonSkillCard: {
    width: 140,
    height: 174,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonStatusBadge: {
    position: 'absolute',
    top: 3,
    right: 5,
    width: 50,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  skeletonCardImage: {
    width: 65,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginTop: 40,
  },
  skeletonCardTitle: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  skeletonCardButton: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 32,
    backgroundColor: '#e0e0e0',
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
  },
});
