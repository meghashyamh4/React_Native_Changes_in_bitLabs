import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { QuizQuestion, fetchStreakQuestions } from '../../services/streak/StreakService';

const { width: screenWidth } = Dimensions.get('window');

type StreakQuizProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export const StreakQuiz: React.FC<StreakQuizProps> = ({ onComplete, onSkip }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await fetchStreakQuestions();
      console.log("StreakQuiz component - Streak Questions Success:", data);
      setQuestions(data || []);
    } catch (error) {
       console.error('Failed to load quiz questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    onSkip();
  };

  const handleComplete = () => {
    setVisible(false);
    onComplete();
  };

  const handleOptionSelect = (optionKey: string) => {
    if (selectedOption) return;
    setSelectedOption(optionKey);
    
    if (optionKey === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (loading) return null;
  if (questions.length === 0) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#FFF5E6', '#FFD580']}
          style={styles.card}>
          
          {showResult ? (
            <View style={styles.resultContainer}>
              <Text style={styles.fireEmoji}>🏆</Text>
              <Text style={styles.resultTitle}>Quiz Completed!</Text>
              <Text style={styles.resultText}>
                You scored {score} out of {questions.length}
              </Text>
              <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                <Text style={styles.completeButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Daily Streak Quiz</Text>
                  <Text style={styles.progress}>
                    Question {currentIndex + 1} of {questions.length}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.skipBtn}>Skip</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.questionText}>{questions[currentIndex].question}</Text>

              <View style={styles.optionsContainer}>
                {Object.entries(questions[currentIndex].options).map(([key, value]) => {
                  const isSelected = selectedOption === key;
                  const isCorrect = key === questions[currentIndex].correctAnswer;
                  const showCorrectness = selectedOption !== null;

                  return (
                    <TouchableOpacity
                      key={key}
                      disabled={selectedOption !== null}
                      onPress={() => handleOptionSelect(key)}
                      style={[
                        styles.optionButton,
                        isSelected && styles.selectedOption,
                        showCorrectness && isCorrect && styles.correctOption,
                        showCorrectness && isSelected && !isCorrect && styles.wrongOption,
                      ]}>
                      <Text style={[
                        styles.optionText,
                        (isSelected || (showCorrectness && isCorrect)) && styles.whiteText
                      ]}>
                        {key}. {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedOption && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{questions[currentIndex].description}</Text>
                </View>
              )}
            </>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: wp('90%'),
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#4A2E0A',
  },
  progress: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D4751A',
  },
  skipBtn: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#7A5830',
    opacity: 0.7,
  },
  questionText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#2F2F2F',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#4A2E0A',
  },
  selectedOption: {
    backgroundColor: '#F46F16',
    borderColor: '#F46F16',
  },
  correctOption: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  wrongOption: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  descriptionContainer: {
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F46F16',
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Italic',
    color: '#5D4037',
    lineHeight: 20,
  },
  resultContainer: {
    alignItems: 'center',
    padding: 10,
  },
  fireEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#4A2E0A',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#7A5830',
    marginBottom: 30,
  },
  completeButton: {
    backgroundColor: '#F46F16',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 3,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
