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
import { QuizQuestion, fetchStreakQuestions, completeStreak } from '../../services/streak/StreakService';

const { width: screenWidth } = Dimensions.get('window');

type StreakQuizProps = {
  onComplete: () => void;
  onSkip: () => void;
  userId: number | string;
};

export const StreakQuiz: React.FC<StreakQuizProps> = ({ onComplete, onSkip, userId }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [visible, setVisible] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [userSelections, setUserSelections] = useState<Record<number, string>>({});

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
       // Set empty array to allow quiz to show error state
       setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    onSkip();
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await completeStreak(userId);
      console.log("Streak completed successfully");
      setVisible(false);
      onComplete();
    } catch (error) {
      console.error("Failed to complete streak:", error);
      // Still close the modal even if API fails
      setVisible(false);
      onComplete();
    } finally {
      setCompleting(false);
    }
  };

  const handleOptionSelect = (optionKey: string) => {
    if (selectedOption) return;
    setSelectedOption(optionKey);

    // Store the selection for this question
    setUserSelections(prev => ({ ...prev, [currentIndex]: optionKey }));

    if (optionKey === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
    // Removed time limit - user can now manually navigate using Next button
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Restore the selection for the previous question
      const previousSelection = userSelections[currentIndex - 1];
      setSelectedOption(previousSelection || null);
    }
  };

  const handleNext = () => {
    if (selectedOption === null) {
      // Don't allow next without selecting an option
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Restore the selection for the next question if it exists
      const nextSelection = userSelections[currentIndex + 1];
      setSelectedOption(nextSelection || null);
    } else {
      setShowResult(true);
    }
  };

  if (loading) return null;
  if (questions.length === 0) {
    // Show error message if questions failed to load
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
            <View style={styles.resultContainer}>
              <Text style={styles.fireEmoji}>⚠️</Text>
              <Text style={styles.resultTitle}>No Quiz Available</Text>
              <Text style={styles.resultText}>
                Unable to load streak questions. Please try again later.
              </Text>
              <TouchableOpacity style={styles.completeButton} onPress={handleClose}>
                <Text style={styles.completeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  }

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

              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}>
                  <Text style={[styles.navButtonText, currentIndex === 0 && styles.disabledButtonText]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, !selectedOption && styles.disabledButton]}
                  onPress={handleNext}
                  disabled={!selectedOption}>
                  <Text style={[styles.navButtonText, !selectedOption && styles.disabledButtonText]}>
                    {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#F46F16',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    elevation: 0,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  disabledButtonText: {
    color: '#999999',
  },
});
