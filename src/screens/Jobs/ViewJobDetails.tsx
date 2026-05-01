import React from 'react';
import {View, StyleSheet} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '@models/Model';
import JobDetailsContent from './JobDetailsContent';
import useJobDetailsViewModels from '@viewmodel/jobs/JobDetailsViewModels';
type JobDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JobDetails'>;
type JobDetailsScreenRouteProp = RouteProp<RootStackParamList, 'JobDetails'>;

type JobDetailsProps = {
  route: JobDetailsScreenRouteProp;
  navigation: JobDetailsScreenNavigationProp;
};

const JobDetails: React.FC = ({route, navigation}: any) => {
  const {job} = route.params; // job data passed from the previous screen

  const {
    suggestedCourses,
    percent,
    skillProgressText,
    perfectMatchSkills,
    unmatchedSkills,
    companyLogo,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    justifyContent: 'space-between',
  },
});

export default JobDetails;
