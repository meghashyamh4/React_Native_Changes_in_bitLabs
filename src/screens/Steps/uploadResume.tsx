import React, {useContext, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ProgressBar from '@components/progessBar/ProgressBar';
import {useAuth} from '@context/Authcontext';
import * as Progress from 'react-native-progress';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon7 from 'react-native-vector-icons/AntDesign';
import Fileupload from '@assests/icons/Fileupload';
import {ScrollView} from 'react-native-gesture-handler';
const {width} = Dimensions.get('window');
import {useStep3ViewModel} from '@viewmodel/step/step3';
import UserContext from '@context/UserContext';


const Step3: React.FC = ({route, navigation}: any) => {
  const {updateShouldShowStep1} = route.params;
  const [isSaving, setIsSaving] = useState(false);


  const {userId, userToken} = useAuth();




  const { refreshJobCounts, refreshPersonalName, refreshVerifiedStatus } = useContext(UserContext);

const handleSave = async () => {
  if (!resumeFile) return;


  if (resumeFile) {
   
    updateShouldShowStep1(false);

    //Refresh user-related data before navigation
    await Promise.all([
      refreshJobCounts(),
      refreshPersonalName(),
      refreshVerifiedStatus()
    ]);

    // Then navigate
    navigation.navigate('BottomTab', {
      shouldShowStep1: false,
      welcome: 'Welcome',
    });
  }
};

  const {
    resumeFile,
    isUploadComplete,
    loading,
    progress,
    showBorder,
    bgcolor,
    handleAPI,
    handleUploadResume,
    handleCancelUpload,
    handleSaveResume,
  } = useStep3ViewModel(userId, userToken, handleSave, route);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }} />
        </View>

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.completeProfile}>Complete Your Profile</Text>
            <Text style={styles.subHeader}>Fill the form fields to go to the next step</Text>
          </View>

          <ProgressBar initialStep={3} />
          <View>
            <View style={{paddingHorizontal: 15}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                }}>
                <Text style={styles.modalTitle1}>Upload Resume</Text>
              </View>
              <View
                style={[
                  styles.uploadContainer,
                  {
                    borderColor: bgcolor ? '#DE3A3A' : '#3A76DE',
                    borderWidth: 1.5,
                    alignSelf: 'stretch',
                    borderStyle: 'dashed',
                    backgroundColor: bgcolor ? '#FFEAE7' : '#E7F2FF',
                    borderRadius: 20,
                  },
                ]}>
                <TouchableOpacity onPress={handleUploadResume}>
                  <View style={{alignItems: 'center'}}>
                    <Fileupload style={{position: 'absolute', top: 30}} />
                  </View>

                  <View style={{padding: 10}}>
                    <Text
                      style={{
                        fontSize: 17,
                        marginTop: 65,
                        textAlign: 'center',
                        color:"black",
                        fontFamily: 'PlusJakartaSans-Bold',
                      }}>
                      Select File
                    </Text>
                    <Text
                      style={{
                        color: '#6C6C6C',
                        textAlign: 'center',
                        fontFamily: 'PlusJakartaSans-Medium',
                      }}>
                      File must be less than 5Mb
                    </Text>
                    <Text
                      style={{
                        color: '#6C6C6C',
                        textAlign: 'center',
                        fontFamily: 'PlusJakartaSans-Medium',
                      }}>
                      Only .doc or .PDFs are allowed.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{marginBottom: 50}}>
                {bgcolor ? (
                  <Text
                    style={{
                      color: 'red',
                      marginTop: 7,
                      marginBottom: 22,
                      fontFamily: 'PlusJakartaSans-Medium',
                    }}>
                    File Not selected
                  </Text>
                ) : (
                  <Text></Text>
                )}
              </View>

              <View style={[styles.fileContainer, showBorder && styles.showborder]}>
                {resumeFile && (
                  <View style={{flexDirection: 'row'}}>
                    <FontAwesome name="file-text-o" size={20} color="#000" />
                    <Text style={[styles.fileNameText, {marginLeft: 12}]}>
                      {resumeFile?.name
                        ? resumeFile.name.length > 20
                          ? `${resumeFile.name.substring(0, 17)}...`
                          : resumeFile.name
                        : 'No file selected'}
                    </Text>
                    <TouchableOpacity style={styles.closeIcon} onPress={handleCancelUpload}>
                      <View style={{position: 'absolute', right: 5, top: 1.5}}>
                        <Icon7 name="close" size={15} color={'0D0D0D'} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {loading && (
                  <View style={styles.progressContainer}>
                    <Progress.Bar
                      progress={progress}
                      width={width * 0.65}
                      color="#F97316"
                      unfilledColor="#D7D6D6"
                      borderColor="#D7D6D6"
                    />
                  </View>
                )}
              </View>

          
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
       <TouchableOpacity
  style={[styles.saveButton, {borderWidth: 0}]}
  disabled={!resumeFile || isUploadComplete || isSaving}
  onPress={async () => {
    if (isSaving) return; // Prevent double click
    setIsSaving(true);

    console.log("Save button clicked");

    const uploaded = await handleSaveResume();
    console.log("Upload result:", uploaded, "resumeFile:", resumeFile);

    if (resumeFile && uploaded) {
      try {
        console.log("Calling handleAPI...");
        await handleAPI();
        await handleSave();
      } catch (e) {
        console.error("handleAPI failed", e);
        setIsSaving(false); // Re-enable on failure
      }
    } else {
      console.warn("Conditions not met for handleAPI");
      setIsSaving(false); // Re-enable if not uploaded
    }
  }}
>
  {(!resumeFile || isUploadComplete || isSaving) ? (
    <View
      style={[
        styles.saveButton,
        {
          backgroundColor: '#D7D6D6',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 5,
        },
      ]}
    >
      <Text
        style={[
          styles.nextButtonText,
          {color: '#A0A0A0', fontFamily: 'PlusJakartaSans-Medium'},
        ]}
      >
        Save
      </Text>
    </View>
  ) : (
    <LinearGradient
      colors={['#F97316', '#FAA729']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.saveButton]}
    >
      <Text style={styles.nextButtonText}>Save</Text>
    </LinearGradient>
  )}
</TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fileContainer: {
    padding: 10,
    marginBottom: 10,
    marginTop: -50,
    position: 'relative',
    width: '100%',
  },
  showborder: {
    borderWidth: 1,
    borderColor: '#D7D6D6',
    borderRadius: 10,
  },
  modalTitle1: {
    color: '#333333',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    position: 'relative',
    bottom: 5,
  },

  orContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  closeIcon: {
    position: 'absolute',
    top: 1,
    right: 1,
    padding: 3,
    paddingRight: 30,
  },
  line: {
    width: '20%',
    height: 1,
    backgroundColor: '#D8D8D8',
    position: 'static',
    top: '60%',
    marginBottom: 10,
  },
  uploadButton: {
    maxWidth: width * 0.75,
    backgroundColor: '#4B4A4A',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 5,
    marginBottom: 55,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingBottom: 75,
    width: '100%',
    maxWidth: Dimensions.get('window').width, // Prevents overflow
    minWidth: Dimensions.get('window').width,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 3,
    width: '80%',
    paddingLeft: 10,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  logoContainer: {
    marginBottom: 20,
    marginTop: 9,
    alignSelf: 'center',
  },
  logo: {
    width: 150, // Decreased width
    height: 45,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  completeProfile: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: 'black',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: 'black',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  uploadContainer: {
    //flexDirection: "row",
    //justifyContent: "space-between",
    textAlign: 'center',
    padding: 5,
    width: '100%',
  },
  browseButton: {
    backgroundColor: 'gray',
    flexDirection: 'row',
    padding: 10,
    marginLeft: 7,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  browseText: {
    color: 'white',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 10,
  },
  buildButton: {
    width: 142,
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  buildText: {
    color: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    borderTopColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingVertical: 10,
    gap: 10,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  backButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nextButton: {
    backgroundColor: '#F97316',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  saveButton: {
    padding: 10,
    borderRadius: 6, // Consistent with backButton
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default Step3;

