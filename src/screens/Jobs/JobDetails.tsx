import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Ensure this is imported
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@models/Model'; // Ensure this path is correct
import Savejob from '@assests/icons/Savejob';
import Savedjob from '@assests/icons/Savedjob';
import Icon from 'react-native-vector-icons/Feather';
import useJobDetailsViewModels from '@viewmodel/jobs/JobDetailsViewModels';
import JobDetailsContent from './JobDetailsContent';
type JobDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JobDetails'>;
type JobDetailsScreenRouteProp = RouteProp<RootStackParamList, 'JobDetails'>;

type JobDetailsProps = {
  route: JobDetailsScreenRouteProp;
  navigation: JobDetailsScreenNavigationProp;
};

const JobDetails: React.FC<JobDetailsProps> = ({route, navigation}) => {
  const {job, JobIndex} = route.params;

  // Use the ViewModel
  const {
    isJobSaved,
    isJobApplied,
    suggestedCourses,
    percent,
    skillProgressText,
    perfectMatchSkills,
    unmatchedSkills,
    companyLogo,
    handleSaveJob,
    handleApplyJob,
  } = useJobDetailsViewModels(job.id);

  return (
    <View style={styles.container}>
      <JobDetailsContent
        job={job}
        percent={percent}
        skillProgressText={skillProgressText}
        perfectMatchSkills={perfectMatchSkills}
        unmatchedSkills={unmatchedSkills}
        suggestedCourses={suggestedCourses}
        companyLogo={companyLogo ?? undefined}
      />

      <View style={styles.footerContainer}>
        {isJobApplied ? (
          // Render only the Applied Button taking up full space
          <TouchableOpacity style={[styles.button, styles.fullWidthAppliedButton]} disabled>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="check" size={18} color="white" />
              <Text style={styles.appliedButtonText}>Applied</Text>
            </View>
          </TouchableOpacity>
        ) : (
          // Render both Save and Apply buttons if the job is not applied
          <>
            {isJobSaved ? (
              <TouchableOpacity style={[styles.button, styles.savedButton]} disabled>
                <View style={styles.buttonContent}>
                  <Savedjob height={18} width={18} />
                  <Text style={styles.savedButtonText}> Saved</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => handleSaveJob(JobIndex)}>
                <View style={styles.buttonContent}>
                  <Savejob height={18} width={18} />
                  <Text style={styles.buttonText}> Save Job</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={() => {
                handleApplyJob(JobIndex);
              }}>
              <LinearGradient
                colors={['#F97316', '#FAA729']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.button, styles.applyButtonGradient]}>
                <Text style={styles.applybuttonText}>Apply Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    justifyContent: 'space-between',
  },
  footerContainer: {
    flexDirection: 'row',
    position: 'relative',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 80,
    paddingHorizontal: 10,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderColor: '#F97316',
    marginLeft: 7,
  },
  savedButton: {
    backgroundColor: 'white',
    marginRight: 5,
    borderColor: '#F46F16',
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedButtonText: {
    color: '#F46F16',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  saveButton: {
    backgroundColor: 'white',
    marginRight: 5,
    borderColor: '#F46F16',
    borderWidth: 1,
    borderRadius: 8,
  },
  buttonText: {
    color: '#F46F16',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  appliedButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  appliedButton: {
    backgroundColor: '#08921E',
    marginLeft: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#08921E',
  },
  applyButton: {
    marginLeft: 5,
    marginRight: 10,
  },
  applyButtonGradient: {
    borderRadius: 10,
    flex: 1,
    width: '100%',
  },
  applybuttonText: {
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  fullWidthAppliedButton: {
    flex: 1,
    backgroundColor: '#08921E',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#08921E',
  },
});

export default JobDetails;
