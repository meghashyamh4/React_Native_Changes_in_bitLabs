import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useAuth } from '@context/Authcontext'; // Assuming you have an auth context for JWT
import { useTestViewModel } from '@viewmodel/Test/TestViewModel'; // Import ViewModel
import { LinearGradient } from 'react-native-linear-gradient'; // Import LinearGradient for gradient background
import Icon from 'react-native-vector-icons/AntDesign'; // Assuming you're using AntDesign for icons
import Header from '@components/CustomHeader/Header';
import { decode } from 'html-entities';
import { useSubmissionModel } from '@viewmodel/Test/TestSubmission'; // Assuming you have a model for test submission

const { width, height } = Dimensions.get('window');

const TestScreen = ({ route, navigation }: any) => {
  const { userId, userToken } = useAuth(); // Get user ID and JWT token from context
  const testName = route.params?.testName || "defaultTestName"; // Ensure testName is a string
  const testData = route.params?.testData


  const {
    currentQuestionIndex,
    answers,
    testDataAPI,
    timeLeft,
    errorMessage,
    isNetworkAvailable,
    showEarlySubmissionModal,
    formatTime,
    handleAnswerSelect,
    goToPreviousQuestion,
    goToNextQuestion,
    handleModalConfirm,
    setShowEarlySubmissionModal,
  } = useSubmissionModel(userId, userToken, testName, navigation, testData);
  const { setIsTestComplete } = useTestViewModel(userId, userToken, testName);

  const currentQuestion = testDataAPI.questions[currentQuestionIndex];
  if (!isNetworkAvailable) {
    return (
      <View style={styles.container1}>
        <View
          style={{
            backgroundColor: '#FFF',
            justifyContent: 'center',
            borderRadius: 10,
            padding: 20,
          }}>
          <Text style={styles.errorText1}>
            Your test has been interrupted.Kindly try again later.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        onBackPress={() => {
          setShowEarlySubmissionModal(true);
        }}
        title={testName}
      />
      {/* Other components and UI elements */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          Question {currentQuestionIndex + 1} / {testDataAPI?.questions?.length || 0}
        </Text>
        <View style={styles.timerContainer}>
          <Icon name="clockcircleo" size={20} color="orange" style={{ marginLeft: 15 }} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {decode(currentQuestion?.question || '')}
          </Text>
        </View>

        {/* Options Container (Replacing FlatList) */}
        <View style={styles.optionsContainer}>
          {currentQuestion?.options?.map((item: string, index: number) => {
            const isSelected = answers[currentQuestionIndex] === item;

            return (
              <TouchableOpacity
                key={`${currentQuestion?.id}-${index}`}
                style={styles.optionContainer}
                onPress={() => handleAnswerSelect(currentQuestionIndex, item)}>
                <View style={[styles.radioButton, isSelected && styles.selectedRadioButton]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.optionText}>{decode(item)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error Message */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            currentQuestionIndex === 0 && {
              backgroundColor: '#D3D3D3',
              borderColor: '#D3D3D3',
            },
          ]}
          onPress={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}>
          <Text
            style={[styles.navigationButtonText1, currentQuestionIndex === 0 && { color: '#fff' }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextQuestion}>
          <LinearGradient
            colors={['#F97316', '#FAA729']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}>
            <Text style={styles.navigationButtonText}>
              {currentQuestionIndex === testDataAPI.questions.length - 1 ? "Submit Test" : "Next"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {showEarlySubmissionModal && (
        <Modal visible={!!showEarlySubmissionModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent1}>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setShowEarlySubmissionModal(false)} // Close the modal
              >
                <Icon name="close" size={20} color={'0D0D0D'} />
              </TouchableOpacity>
              <Image
                source={require('../assests/Images/Test/Warning.png')}
                style={styles.Warning}
              />
              <Text style={styles.modalText}>Are you sure you want to quit?</Text>
              <Text style={styles.modalText1}>
                You will loose all the test results till now & You{'\n'}cannot take test until 1
                week
              </Text>
              <View style={styles.modalOptions}>
                <TouchableOpacity
                  onPress={() => setShowEarlySubmissionModal(false)} // Close the modal
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: '#FFF',
                      borderColor: '#9D9D9D',
                      borderWidth: 0.96,
                    },
                  ]}>
                  <Text style={[styles.modalButtonText, { color: 'grey' }]}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsTestComplete(true);
                    handleModalConfirm();
                  }}>
                  <LinearGradient
                    colors={['#F97316', '#FAA729']} // Gradient colors
                    start={{ x: 0, y: 0 }} // Gradient start point
                    end={{ x: 1, y: 1 }} // Gradient end point
                    style={[styles.modalButton, { borderRadius: 10, width: width * 0.41 }]} // Ensure borderRadius matches your button's design
                  >
                    <Text style={styles.modalButtonText}>Yes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F68318',
  },
  timerContainer: {
    width: 115.5, // Set the width
    height: 33.25, // Set the height
    flexShrink: 0, // Prevent shrinking
    flexDirection: 'row', // Ensure content is aligned horizontally
    alignItems: 'center', // Vertically align items
    justifyContent: 'flex-start', // Align items to the start (left)
    borderColor: '#F46F16',
    borderWidth: 1,
    borderRadius: 5,
  },
  timerText: {
    fontSize: 18,
    color: '#F46F16',
    marginLeft: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  questionContainer: {
    padding: 16,
    height: 'auto',
    width: width * 0.9,
    marginLeft: 10,
  },
  questionText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 16,
    color: '#000000',
    lineHeight: 25,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    // marginLeft: 10,
    width: width * 0.85,
  },
  optionText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 14.5,
    color: '#000000',
    marginLeft: 10,
    lineHeight: 25,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    marginLeft: 25,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',

    height: 93,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 161.25,
    padding: 10,
    borderRadius: 7.68,
    borderWidth: 0.96,
    borderColor: '#F97316',
    alignItems: 'center',
    marginLeft: '2%',
  },
  navigationButtonText1: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#F97316',
  },
  gradientBackground: {
    width: 162.21,
    padding: 12,
    borderRadius: 8,
  },
  navigationButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent1: {
    width: '95%',
    height: 337,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '95%',
    height: '95%',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  Warning: {
    width: 85,
    height: 73,
  },

  modalText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 25,
    color: '#333333',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  Alarm: {
    width: 123.88,
    height: 124.2,
  },
  modalText1: {
    fontSize: 14,
    lineHeight: 25,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F97316',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButton1: {
    borderRadius: 7.68,
    alignItems: 'center',
    padding: 10,
    width: width * 0.9,
    height: 45,
    backgroundColor: 'orange',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  container1: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  errorText1: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: 'grey',
    textAlign: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EAEAEA', // Grey outline
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAEAEA', // Initially filled with grey
  },
  selectedRadioButton: {
    backgroundColor: '#EAEAEA', // Keep grey when selected
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F68318', // Orange dot in the middle when selected
  },
  optionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: width * 0.05,
  },
});
export default TestScreen;
