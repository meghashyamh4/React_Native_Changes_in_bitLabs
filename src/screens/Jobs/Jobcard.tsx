import React from 'react';
import {View, Text, Image, StyleSheet, useWindowDimensions} from 'react-native';
import {DefaultLogoUrl} from '@components/constant';

type JobCardProps = {
  jobTitle: string;
  companyName: string;
  location: string;
  minExperience: number;
  maxExperience: number;
  minSalary: number;
  maxSalary: number;
  employeeType: string;
  creationDate: string;
  logoUrl?: string;
  truncateTitle?: boolean;
};

const JobCard: React.FC<JobCardProps> = ({
  jobTitle,
  companyName,
  location,
  minExperience,
  maxExperience,
  minSalary,
  maxSalary,
  employeeType,
  creationDate,
  logoUrl,
  truncateTitle = false,
}) => {
  const Tab_breakPoint = 768; 
  const {width: screenWidth} = useWindowDimensions();
  const isTablet = screenWidth >= Tab_breakPoint ;
 

const formatCreationDate = (dateString: string): string => {
  try {
    // Split the string and rearrange to proper Date format
    const [year,  month, day,] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-based

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthName = monthNames[date.getMonth()];
    const formattedDay = date.getDate();
    const formattedYear = date.getFullYear();

    return `${monthName} ${formattedDay}, ${formattedYear}`;
  } catch (e) {
    console.error("Invalid date format:", e);
    return dateString; // Fallback
  }
};
const getCompanyLogoSource = (logoUrl: string | undefined | null) => {
  if (!logoUrl || logoUrl.includes(DefaultLogoUrl)) {
    return require('../../assests/Images/company.png'); // Default fallback
  }

  if (logoUrl.startsWith('data:image/')) {
    return { uri: logoUrl }; // Base64
  }

  return { uri: logoUrl }; // Regular image URL
};


  return (
    <View style={styles.jobCard}>
      <View style={styles.row}>
       <Image
  source={getCompanyLogoSource(logoUrl)}
  style={styles.companyLogo}
/>


        <View style={styles.jobDetails}>
          <Text
            style={styles.jobTitle}
            numberOfLines={truncateTitle ? 1 : undefined}
            ellipsizeMode={truncateTitle ? 'tail' : undefined}>
            {jobTitle}
          </Text>
          <Text style={styles.companyName}>{companyName}</Text>
        </View>
      </View>
      <View style={[styles.tag, styles.locationContainer]}>
        <Image source={require('../../assests/Images/rat/loc.png')} style={styles.locationIcon} />
        <Text style={styles.locationText}>{location}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap',
          alignItems: 'center',
          marginLeft: 10,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginRight: 10}}>
          <Image source={require('../../assests/Images/rat/exp.png')} style={styles.brieficon} />
          <Text style={styles.ovalText}>
            Exp: {minExperience} - {maxExperience} years
          </Text>
          <Text style={{color: '#E2E2E2'}}> |</Text>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', marginRight: 10, marginTop: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{fontSize: 13}}>{'\u20B9'}</Text>
            <Text style={styles.ovalText}>
              {minSalary.toFixed(2)} - {maxSalary.toFixed(2)} LPA{' '}
            </Text>
            <Text style={{color: '#E2E2E2'}}> |</Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={{fontSize: 11, fontFamily: 'PlusJakartaSans-Medium'}}>{employeeType}</Text>
        </View>
      </View>
      <View>
        <Text style={[styles.postedOn , isTablet && {marginLeft:'80%'}]}>Posted on {formatCreationDate(creationDate)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    margin: 12,
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 16,
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  companyName: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  tag: {
    marginTop: -10,
    color: 'black',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
    marginRight: 3,
    marginBottom: 8,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  brieficon: {
    height: 11,
    width: 11,
    marginRight: 8,
  },
  ovalText: {
    fontSize: 11,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  postedOn: {
    color: '#979696',
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 9,
    lineHeight: 23.76,
    marginTop: 10,
    display: 'flex',
    marginLeft: '60%',
  },
  locationIcon: {
    width: 11,
    height: 11,
    marginRight: 4,
  },
});

export default JobCard;
