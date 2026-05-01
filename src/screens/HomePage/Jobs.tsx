import React, {useState, useEffect, useContext, useRef} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, FlatList} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, JobData} from '@models/Model'; // Import navigation types
import AppliedJobs from '../Jobs/AppliedJobs';
import SavedJobs from '../Jobs/SavedJobs';
import useRecommendedJobsViewModel from '@viewmodel/jobs/RecommendedJobs'; // Your ViewModel
import UserContext from '@context/UserContext';
import {useAuth} from '@context/Authcontext';
import JobCard from '../Jobs/Jobcard';
import {useLogos} from '../../hooks/useLogos';
import {DefaultLogoUrl} from '@components/constant';

// Navigation prop type for RecommendedJobs
type RecommendedJobsNavigationProp = StackNavigationProp<RootStackParamList, 'JobDetails'>;
type JobsRouteProp = RouteProp<RootStackParamList, 'Jobs'>;

const RecommendedJobs = () => {
  const route = useRoute<JobsRouteProp>(); // Specify the route type
  const {jobs, loading, reloadJobs} = useRecommendedJobsViewModel(); // Assuming jobs are passed from view model
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied' | 'saved'>('recommended');
  const navigation = useNavigation<RecommendedJobsNavigationProp>();
  const [visibleJobsCount, setVisibleJobsCount] = useState(10); // Number of jobs to display initially
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null);
  const {isJobsLoaded, setIsJobsLoaded, lastViewedJobIndex, setLastViewedJobIndex} =
    useContext(UserContext);
  const {userToken} = useAuth();
  const flastListRef = useRef<FlatList>(null);
  const {logos, loading: logosLoading}: {logos: {[key: number]: string}; loading: boolean} =
    useLogos(jobs, userToken ?? '');
  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab); // Set the active tab from the passed parameter
    }
  }, [route.params?.tab]);

  useEffect(() => {
    if (!isJobsLoaded) {
      reloadJobs().then(() => {
        if (lastViewedJobIndex !== null) {
          const safeIndex = Math.min(lastViewedJobIndex + 2, visibleJobs.length - 1);
          setVisibleJobsCount(lastViewedJobIndex + 2);
          setPendingScrollIndex(safeIndex);
          setLastViewedJobIndex(null);
        }
      }); // Reload jobs only when `isJobsLoaded` is false
      setIsJobsLoaded(true); // Mark as loaded after fetching
    }
  }, [isJobsLoaded]);

  // Handle tab press
  const handleTabPress = (tab: 'recommended' | 'applied' | 'saved') => {
    setActiveTab(tab);
  };

  // Load more jobs when the user scrolls to the bottom
  const loadMoreJobs = () => {
    if (visibleJobsCount < jobs.length) {
      setVisibleJobsCount(visibleJobsCount + 16); // Load 10 more jobs
    }
  };

  // Render job cards
  const renderJobs = ({item, index}: {item: JobData; index: number}) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('JobDetails', {job: item, JobIndex: index})}>
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
  };

  const visibleJobs = jobs.slice(0, visibleJobsCount);

  // Render content based on active tab
  const renderContent = () => {
    if (loading || logosLoading) {
      return (
        <ActivityIndicator
          size="large"
          color="#F46F16"
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
        />
      );
    }
    switch (activeTab) {
      case 'recommended':
        return (
          <FlatList
            ref={flastListRef}
            data={visibleJobs} // Filter and display only visible jobs
            renderItem={renderJobs}
            keyExtractor={item => item.id.toString()}
            getItemLayout={(_, index) => ({length: 177, offset: 177 * index, index})}
            onContentSizeChange={() => {
              if (pendingScrollIndex !== null) {
                const indexToScroll =
                  pendingScrollIndex < visibleJobs.length
                    ? pendingScrollIndex
                    : visibleJobs.length - 1;
                flastListRef.current?.scrollToIndex({index: indexToScroll, animated: false});
                setPendingScrollIndex(null);
              }
            }}
            onEndReached={loadMoreJobs} // Load more jobs when the user scrolls to the bottom
            onEndReachedThreshold={0.5} // Trigger when the user is 50% from the bottom
            ListEmptyComponent={
              !loading && jobs.length === 0 ? (
                <Text style={styles.placeholderText}>No recommended jobs found!</Text>
              ) : null
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator
                  size="large"
                  color="#F46F16"
                  style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
                />
              ) : null
            }
          />
        );
      case 'applied':
        return <AppliedJobs />;
      case 'saved':
        return <SavedJobs />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.jobstextcon}>
        <Text style={styles.Jobstext}>Jobs</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommended' && styles.activeTab]}
          onPress={() => handleTabPress('recommended')}>
          <Text
            style={[
              styles.tabText,
              styles.rightAlignedText,
              activeTab === 'recommended' && styles.activeTabText,
            ]}>
            Recommended
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'applied' && styles.activeTab]}
          onPress={() => handleTabPress('applied')}>
          <Text
            style={[
              styles.tabText,
              styles.rightAlignedText,
              activeTab === 'applied' && styles.activeTabText,
            ]}>
            Applied
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => handleTabPress('saved')}>
          <Text
            style={[
              styles.tabText,
              styles.rightAlignedText,
              activeTab === 'saved' && styles.activeTabText,
            ]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    top: 0,
  },
  jobstextcon: {
    backgroundColor: 'white',
  },
  Jobstext: {
    marginLeft: 22,
    marginBottom: 10,
    marginTop: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0D0D0D',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#F97316',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  activeTabText: {
    color: '#F97316',
    marginLeft: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  rightAlignedText: {
    marginLeft: 20, // Adjust this value to set how far you want to move the text to the right
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecommendedJobs;
