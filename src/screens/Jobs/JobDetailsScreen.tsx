import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '@context/Authcontext';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@models/Model';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useJobDetailsViewModels from '@viewmodel/jobs/JobDetailsViewModels';
import { useJobDetailsViewModel } from '@viewmodel/jobs/JobDetailsViewModel';
import { DefaultLogoUrl } from '@components/constant';

type JobDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'JobDetailsScreen'>;
};

const JobDetailsScreen: React.FC<JobDetailsScreenProps> = ({ route }) => {
  const { job } = route.params;
  const { userId, userToken } = useAuth();
  const { jobStatus, loading,  formatDates } = useJobDetailsViewModel(
    job,
    userId ?? '',
    userToken ?? ''
  );

  const { companyLogo } = useJobDetailsViewModels(job.id);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'JobDetails'>>();
const formatCreationDate = (dateString: string): string => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); //  month is 0-based in JS

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthName = monthNames[date.getMonth()];
    const formattedDay = date.getDate();
    const formattedYear = date.getFullYear();

    return `${monthName} ${formattedDay}, ${formattedYear}`;
  } catch (e) {
    console.error('Invalid date format:', e);
    return dateString;
  }
};

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#F46F16" />
          </View>
        ) : (
          <View>
            <View style={styles.jobCard}>
              <View style={styles.row}>
                <Image
                  source={
                    companyLogo && !companyLogo.includes(DefaultLogoUrl)
                      ? { uri: companyLogo }
                      : require('../../assests/Images/company.png')
                  }
                  style={styles.companyLogo}
                />
                <View style={styles.jobDetails}>
                  <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                  <Text style={styles.companyName}>{job.companyname}</Text>
                </View>
              </View>

              <View style={[styles.tag, styles.locationContainer]}>
                <Image source={require('../../assests/Images/rat/loc.png')} style={styles.locationIcon} />
                <Text style={styles.locationText}>{job.location}</Text>
              </View>

              <View style={styles.tagRow}>
                <View style={styles.briefcon}>
                  <Image source={require('../../assests/Images/rat/exp.png')} style={styles.brieficon} />
                  <Text style={styles.ovalText}>
                    Exp: {job.minimumExperience} - {job.maximumExperience} years
                  </Text>
                  <Text style={{ color: '#E2E2E2' }}> |</Text>
                </View>
                <View style={styles.briefcon}>
                  <Text style={{ fontSize: 13 }}>{'₹'}</Text>
                  <Text style={styles.ovalText}>
                    {job.minSalary.toFixed(2)} - {job.maxSalary.toFixed(2)} LPA
                  </Text>
                  <Text style={{ color: '#E2E2E2' }}> |</Text>
                </View>
                <View style={styles.briefcon}>
                  <Text style={styles.ovalText}>{job.employeeType}</Text>
                </View>
              </View>
              <Text style={styles.postedOn}>Posted on {formatCreationDate(job.creationDate)}</Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusHeader}>Status History</Text>
              {jobStatus.length > 0 ? (
                <View style={styles.statusTable}>
                  {(() => {
                    const sortedStatus = [...jobStatus].sort((a, b) => {
                      const dateA = new Date(a.changeDate[0], a.changeDate[1] - 1, a.changeDate[2]);
                      const dateB = new Date(b.changeDate[0], b.changeDate[1] - 1, b.changeDate[2]);
                      return dateA.getTime() - dateB.getTime(); // Ascending
                    })  .map((status) => ({
    applyJobId: status.applyJob.applyjobid,
    status: status.status,
    changeDate: status.changeDate,
    reason: status.applyJob.reason, 
  }));

                    return sortedStatus.map((status, idx) => {
              const isSelected = status.status.toLowerCase() === 'selected';
const isRejected = status.status.toLowerCase() === 'rejected';

                      const isLast = idx === sortedStatus.length - 1;

                      return (
                        <View
                          key={`status-${idx}`}
                          style={[
                            styles.statusRow,
                            (isSelected || isRejected) && {
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              paddingVertical: 20,
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                            <Text style={styles.statusDate}>{formatDates(status.changeDate)}</Text>
                            <View style={styles.iconWrapper}>
  {isSelected && (
    <Icon
      name="check-circle"
      size={24}
      style={{ marginTop: 2, marginLeft: -5 }}
      color="#4CAF50"
    />
  )}
  {isRejected && !isSelected && (
    <Icon
      name="times-circle"
      size={24}
      style={{ marginTop: 2, marginLeft: -5 }}
      color="#FF3B3B"
    />
  )}
  {!isSelected && !isRejected && (
    <>
      <View style={styles.circle} />
      {!isLast && <View style={styles.verticalLine} />}
    </>
  )}
</View>

                            <Text style={styles.statusText}>
                              
                              {status.status === 'New'
  ? 'Job Applied'
  : isSelected
  ? 'Selected'
  : isRejected
  ? 'Rejected'
  : status.status}

                            </Text>
                          </View>

                          {(isSelected || isRejected) && status.reason && (
<Text style={[styles.feedbackText, {  color: 'hsba(0, 0%, 28%, 1)' }]}>
  Reason: {status.reason}
</Text>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>
              ) : (
                <Text style={styles.placeholderText}>No status history available!</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.viewJobButton]}
          onPress={() => navigation.navigate('ViewJobDetails', { job })}
        >
          <LinearGradient
            colors={['#F97316', '#FAA729']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, styles.applyButtonGradient]}
          >
            <Text style={styles.viewJobText}>View Job</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6', padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 8,
    margin: 2,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  companyLogo: { width: 50, height: 50, borderRadius: 15, marginRight: 16 },
  jobDetails: { flex: 1 },
  jobTitle: {
    color: '#121212',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'rgba(83, 83, 83, 0.80)',
    marginVertical: 4,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: -10 },
  locationIcon: { width: 11, height: 12, marginRight: 6 },
  locationText: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  brieficon: { height: 10, width: 12, marginRight: 8 },
  briefcon: { flexDirection: 'row', alignItems: 'center' },
  ovalText: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 3,
    marginBottom: 8,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    marginBottom: 12,
    marginTop: 6,
  },
  postedOn: {
    color: '#979696',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 9,
    lineHeight: 23.76,
    marginTop: 9,
    marginLeft: '50%',
  },
  statusContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginLeft: 2,
    marginBottom: 20,
  },
  statusHeader: {
    fontSize: 16,
    marginBottom: 8,
    color: '#F46F16',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  statusTable: {
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  statusDate: {
    fontSize: 14,
    color: '#5D5555',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  statusText: {
    fontSize: 14,
    color: '#5D5555',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F46F16',
    backgroundColor: '#F46F16',
    marginLeft: -8,
  },
  verticalLine: {
    position: 'absolute',
    top: 16,
    bottom: -40,
    width: 1,
    backgroundColor: '#F46F16',
    left: 7,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 13,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  viewJobButton: {},
  applyButtonGradient: {
    borderRadius: 10,
    flex: 1,
    width: '100%',
    padding: 20,
  },
  viewJobText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  feedbackText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 30,
    marginLeft: 32,
    justifyContent:'center',
    alignItems: 'center',
  },
});

export default JobDetailsScreen;
