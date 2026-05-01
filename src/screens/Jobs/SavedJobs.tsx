import React, {useCallback, useContext} from 'react';
import {FlatList, ActivityIndicator, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSavedJobs} from '@services/Jobs/SavedJob';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList, JobData} from '@models/Model';
import UserContext from '@context/UserContext';
import {useAuth} from '@context/Authcontext';
import JobCard from './Jobcard';
import {useLogos} from '../../hooks/useLogos';
import {DefaultLogoUrl} from '@components/constant';
const SavedJobs = () => {
  const {savedJobs, loading, error, fetchSavedJobs} = useSavedJobs(); // Assuming `fetchSavedJobs` is available to manually trigger data fetch
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'SavedJobs'>>();
  const {jobCounts} = useContext(UserContext);

  const count = jobCounts?.savedJobs ?? 300;
  const {userToken} = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchSavedJobs(count); // Trigger a reload of the saved jobs data
    }, [fetchSavedJobs, count]),
  );
  const {logos, loading: logosLoading}: {logos: {[key: number]: string}; loading: boolean} =
    useLogos(savedJobs, userToken ?? '');
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#F46F16"
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
        />
      </View>
    );
  }

  if (error || savedJobs.length === 0) {
    return <Text style={styles.placeholderText}>No saved jobs available!</Text>;
  }

  const renderItem = ({item}: {item: JobData}) => (
    <TouchableOpacity onPress={() => navigation.navigate('SavedDetails', {job: item})}>
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
      {/* Show loader until both jobs and logos are loaded */}
      {(loading || logosLoading) && <ActivityIndicator size="large" color="#FF8C00" />}

      {/* Show error if any */}
      {error && <Text style={styles.placeholderText}>{error}</Text>}

      {/* Render jobs only when loading is complete */}
      {!loading && !logosLoading && (
        <FlatList
          data={savedJobs}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          onEndReachedThreshold={0.5}
        />
      )}

      {!loading && !logosLoading && savedJobs.length === 0 && (
        <Text style={styles.placeholderText}>No saved jobs available!</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default SavedJobs;
