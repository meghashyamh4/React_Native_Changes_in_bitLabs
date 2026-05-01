
import { useState, useEffect, useCallback } from "react";
import { AppState, BackHandler } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import { useTestViewModel } from "@viewmodel/Test/TestViewModel"; // Import the useTestViewModel hook
import { useSkillTestViewModel } from "@viewmodel/Test/skillViewModel"; // Import the useSkillTestViewModel hook
import { TestData } from "@models/Model";


export const useSubmissionModel = (
  userId: number | null,
  userToken: string | null,
  testName: string,
  navigation: any,
  testData: TestData
) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(2 * 60); // 2 minutes for testing
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [testDataAPI, setTestDataAPI] = useState<{ questions: any[] }>({ questions: [] });
  const [isNetworkAvailable, setIsNetworkAvailable] = useState<boolean>(true);
  const [hasExceededTimeout, setHasExceededTimeout] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const { submitSkillTest } = useSkillTestViewModel(userId, userToken, testName);
  const {
    isTestComplete,
    showEarlySubmissionModal,
    setShowEarlySubmissionModal,
    setIsTestComplete,
    submitTest,
  } = useTestViewModel(userId, userToken, testName);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  let timerInterval: NodeJS.Timeout;

  // Handle app state changes (background/foreground)
  useEffect(() => {
    let backgroundStartTime: number | null = null;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        backgroundStartTime = Date.now();
        clearInterval(timerInterval);
      } else if (nextAppState === 'active' && backgroundStartTime) {
        const elapsedTime = Math.floor((Date.now() - backgroundStartTime) / 1000);
        setTimeLeft(prevTime => Math.max(0, prevTime - elapsedTime));
        backgroundStartTime = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Handle network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsNetworkAvailable(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Handle test timer
  useEffect(() => {
    // Stop timer when modal is showing or test is complete or already submitted
    if (isTestComplete || showEarlySubmissionModal || isTestSubmitted) {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      return;
    }

    // Handle time up
    if (timeLeft === 0 && !showEarlySubmissionModal) {
      setIsTestComplete(true);
      handleTimeUp();
      return;
    }

    timerInterval = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft, isTestComplete, showEarlySubmissionModal, isTestSubmitted]);

  // Handle back button press
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setShowEarlySubmissionModal(true);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, []),
  );

  // Load test data based on testName
  useEffect(() => {
    if (!testName || !testData)
      return;

    // Prevent re-setting if questions already exist
    if (testDataAPI.questions.length > 0)
      return;

    setTestDataAPI({ questions: [] })
    if (testData) {
      const shuffledQuestions = shuffleArray([...(testData?.questions ?? [])]);
      setTestDataAPI({ questions: shuffledQuestions });
      const durationString = testData?.duration || "30 mins";
      const durationInSeconds = parseDuration(durationString);
      setTimeLeft(durationInSeconds);
    }
  }, [testName, testData]);

  // Helper functions
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const parseDuration = (duration: string): number => {
    const regex = /(\d+)\s*(mins?|hr|hours?)/i;
    const match = regex.exec(duration);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      if (unit.includes('hr')) {
        return value * 3600;
      } else if (unit.includes('min')) {
        return value * 60;
      }
    }

    return 1800; // Default to 30 mins
  };

  const calculateScore = (currentAnswers: { [key: number]: string }, shuffledQuestions: any[]) => {
    let score = 0;
    for (let i = 0; i < shuffledQuestions.length; i++) {
      const currentQuestion = shuffledQuestions[i];

      if (currentAnswers[i] && currentQuestion?.answer && currentAnswers[i] === currentQuestion.answer) {
        score += 1;
      }
    }
    return score;
  };

  const handleModalConfirm = async () => {
    setShowEarlySubmissionModal(false);
    clearInterval(timerInterval);
    const finalScore = 0; // Score is 0 for early submission
    if (testName === 'Technical Test' || testName === 'General Aptitude Test') {
      await submitTest(finalScore, true);
    } else {
      await submitSkillTest(finalScore, true);
    }
  };

  const handleTimeUp = async () => {
    clearInterval(timerInterval);
    setIsTestSubmitted(true);
    const finalScore = calculateScore(answers, testDataAPI.questions);
    const percentageScore = parseFloat(((finalScore / testDataAPI.questions.length) * 100).toFixed(2));

    if (testName === 'Technical Test' || testName === 'General Aptitude Test') {
      await submitTest(percentageScore, false);
    } else {
      await submitSkillTest(percentageScore, false);
    }
  };

  const handleAnswerSelect = (index: number, answer: string) => {
    setSelectedAnswer(answer);
    setAnswers(prevAnswers => ({ ...prevAnswers, [index]: answer }));
    setErrorMessage('');
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const previousAnswer = answers[currentQuestionIndex - 1] || null;
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(previousAnswer);
      setErrorMessage('');
    }
  };

  const goToNextQuestion = async () => {
    if (!selectedAnswer) {
      setErrorMessage('Please provide your answer before moving to the next question.');
      return;
    }
    const updatedAnswers = {
      ...answers,
      [currentQuestionIndex]: selectedAnswer
    }
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < testDataAPI.questions.length - 1) {

      const nextAnswer = updatedAnswers[currentQuestionIndex + 1] || null;
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(nextAnswer);
      setErrorMessage('');
    } else {
      setIsTestSubmitted(true);
      const finalScore = calculateScore(updatedAnswers, testDataAPI.questions);
      const percentageScore = parseFloat(
        ((finalScore / testDataAPI.questions.length) * 100).toFixed(2),
      );
      if (testName === 'Technical Test' || testName === 'General Aptitude Test') {
        await submitTest(percentageScore, false);
      } else {
        await submitSkillTest(percentageScore, false);
      }
    }
  };

  return {
    currentQuestionIndex,
    selectedAnswer,
    answers,
    timeLeft,
    errorMessage,
    testDataAPI,
    isNetworkAvailable,
    hasExceededTimeout,
    isTestSubmitted,
    isTestComplete,
    showEarlySubmissionModal,
    formatTime,
    handleAnswerSelect,
    goToPreviousQuestion,
    goToNextQuestion,
    handleModalConfirm,
    setShowEarlySubmissionModal,
  };
};
