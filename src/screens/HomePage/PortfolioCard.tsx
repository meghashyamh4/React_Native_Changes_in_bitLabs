import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type PortfolioCardProps = {
  imageSrc?: any;
  profileData?: any;
  dashboardScore?: number;
  userName?: string;
  onExplore: () => void;
  backgroundColor?: string;
  borderColor?: string;
  scoreDetails?: any;
};

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  imageSrc,
  profileData,
  dashboardScore = 0,
  userName = '',
  onExplore,
  backgroundColor = '#FFF5E6',
  borderColor = '#EA7B20',
  scoreDetails,
}) => {
  const alternatePhone = profileData?.basicDetails?.alternatePhoneNumber || '';
  const email = profileData?.applicant?.email || '';

  // Get added badges and required skills
  const addedBadges =
    profileData?.applicant?.applicantSkillBadges
      ?.filter((badge: any) => badge.flag === 'added')
      .map((badge: any) => ({
        id: badge.id,
        name: badge.skillBadge.name,
        status: badge.status,
        flag: badge.flag,
      })) || [];

  const requiredSkills =
    profileData?.skillsRequired?.map((skillReq: any) => ({
      id: skillReq.id,
      name: skillReq.skillName,
      status: 'REQUIRED',
      flag: 'required',
    })) || [];

  const allSkills = [...addedBadges, ...requiredSkills]
    .filter((skill) => skill?.name && skill.name.trim() !== '')
    .sort((a, b) => {
      const lenDiff = (a.name?.length || 0) - (b.name?.length || 0);
      if (lenDiff !== 0) return lenDiff;
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });

  // Determine which medals to show based on score ranges
  // 0-150: Only bronze medal
  // 150-300: Bronze and silver medals
  // 300-500: All three medals (bronze, silver, gold)
  const getEarnedMedals = () => {
    const getPoints = (badge: string) => {
      return scoreDetails?.badgeScores?.find((b: any) => b.badge === badge)?.points;
    };

    const bronzeScore = getPoints('BRONZE') || 200;
    const silverScore = getPoints('SILVER') || 300;
    const goldScore = getPoints('GOLD') || 500;

    const medals = [];

    // Bronze: Now based on dynamic threshold (e.g., 20 or 100 or 200)
    if (dashboardScore >= bronzeScore) {
      medals.push({
        image: require('../../assests/Images/Medals/bronze.png'),
        name: 'bronze',
      });
    }

    // Silver
    if (dashboardScore >= silverScore) {
      medals.push({
        image: require('../../assests/Images/Medals/silver.png'),
        name: 'silver',
      });
    }

    // Gold
    if (dashboardScore >= goldScore) {
      medals.push({
        image: require('../../assests/Images/Medals/gold.png'),
        name: 'gold',
      });
    }

    return medals;
  };

  const earnedMedals = getEarnedMedals();

  return (
    <View style={[styles.portfolioCard, { backgroundColor, borderColor }]}>
      {/* My portfolio heading at top */}
      <View style={styles.portfolioHeading}>
        <Text style={styles.portfolioTitle}>My Portfolio</Text>
        <TouchableOpacity onPress={onExplore}>
          <Text style={styles.exploreLink}>Explore</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSideSection}>
        <View style={styles.profileImageContainer}>
          {imageSrc ? (
            <Image
              source={{ uri: imageSrc }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require('../../assests/profile/profile.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.profileExtraDetails}>
          <View style={styles.contactRow}>
            <View style={styles.detailRow}>
              <Icon name="phone" size={18} color="#EA7B20" />
              <Text style={styles.detailText}>{alternatePhone || 'N/A'}</Text>
            </View>
            <View style={styles.portfolioScoreDetails}>
              <Text style={styles.scoreLabel}>score</Text>
              <Text style={styles.scoreValue}>{dashboardScore ?? 0}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Icon name="email" size={18} color="#EA7B20" />
            <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">{email || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.userNameContainer}>
        <Text style={styles.userName}>
          {userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : ''}
        </Text>
        {earnedMedals.length > 0 && (
          <View style={styles.medalsContainer}>
            {earnedMedals.map((medal, index) => (
              <Image
                key={medal.name}
                source={medal.image}
                style={styles.badgeMedal}
                resizeMode="contain"
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.skillsContainer}>
        {allSkills.slice(0, 6).map((skill) => (
          <View
            key={skill.id}
            style={[
              styles.skillBadge,
              skill.flag === 'removed' && styles.removedSkillBadge,
            ]}
          >
            <Text style={styles.skillText}>{skill.name}</Text>
          </View>
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  portfolioCard: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  portfolioHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: hp('2%'), // Consistent card title size
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  exploreLink: {
    color: '#EA7B20',
    fontSize: hp('1.5%'), // Consistent link size
    fontFamily: 'PlusJakartaSans-Medium',
  },
  profileSideSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
    overflow: 'hidden',
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: '#EA7B20',
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  profileExtraDetails: {
    flex: 1,
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
    flex: 1,
  },
  detailText: {
    fontSize: hp('1.3%'), // Consistent small text size
    color: '#333',
    marginLeft: 6,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  portfolioScoreDetails: {
    alignItems: 'center',
    marginLeft: 'auto',
  },
  scoreLabel: {
    fontSize: hp('1.3%'), // Consistent small text size
    color: '#666',
    textTransform: 'lowercase',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  scoreValue: {
    fontSize: hp('2%'), // Consistent card title size
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: hp('1.8%'), // Consistent sub-heading size
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Bold',
    marginRight: 8,
  },
  medalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeMedal: {
    width: 24,
    height: 24,
    marginLeft: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  removedSkillBadge: {
    backgroundColor: '#D9534F',
  },
  skillText: {
    fontSize: hp('1.3%'), // Consistent small text size
    color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

