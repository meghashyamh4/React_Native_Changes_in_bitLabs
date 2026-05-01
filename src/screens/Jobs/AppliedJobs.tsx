import React from 'react';
import {StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useAppliedJobsViewModel} from '@viewmodel/jobs/AppliedJob';
import {useAuth} from '@context/Authcontext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, JobData} from '@models/Model';
import JobCard from './Jobcard';
import {useLogos} from '../../hooks/useLogos';
import {DefaultLogoUrl} from '@components/constant';

const AppliedJobs = () => {
  const {userId, userToken} = useAuth();
  const {appliedJobs, loading, error} = useAppliedJobsViewModel(userId, userToken);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AppliedJobs'>>();
  const {logos, loading: logosLoading}: {logos: {[key: number]: string}; loading: boolean} =
    useLogos(appliedJobs, userToken ?? '');

  const renderJobItem = ({item}: {item: JobData}) => (
    <TouchableOpacity onPress={() => navigation.navigate('JobDetailsScreen', {job: item})}>
      <JobCard
        jobTitle={item.jobTitle}
        companyName={item.companyname}
        location={item.location}
        minExperience={item.minimumExperience}
        maxExperience={item.maximumExperience}
        minSalary={item.minSalary}
        maxSalary={item.maxSalary}
        employeeType={item.employeeType}
        creationDate={item.creationDate}
        logoUrl={
          logos[item.id] === DefaultLogoUrl
            ? undefined // Use fallback for invalid Base64
            : logos[item.id] ?? undefined
        }
        truncateTitle={true}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Show loader until data is fully loaded */}
      {(loading || logosLoading) && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      )}

      {error && <Text style={styles.placeholderText}>{error}</Text>}

      {/* Render jobs if loading is complete and no error */}
      {!loading && !logosLoading && (
        <FlatList
          data={appliedJobs}
          renderItem={renderJobItem}
          keyExtractor={item => item.id.toString()}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Handle empty list */}
      {!loading && !logosLoading && appliedJobs.length === 0 && (
        <Text style={styles.placeholderText}>No applied jobs available!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    top: 0,
    // marginBottom: 112,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppliedJobs;
