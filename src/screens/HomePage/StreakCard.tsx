import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

type StreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  onExplore: () => void;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  longestStreak,
  onExplore,
}) => {
  // Build day-streak indicators based on current day and streak count
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0=Sun … 6=Sat

  const getDayStatus = (dayIndex: number): 'achieved' | 'missed' | 'future' => {
    if (dayIndex > currentDayIndex) return 'future';
    // How many past days (including today) in this week
    const daysFromStart = currentDayIndex - dayIndex; // 0 = today
    // If streak covers this day → achieved, else missed
    if (daysFromStart < currentStreak) return 'achieved';
    return 'missed';
  };

  return (
    <LinearGradient
      colors={['#FDEBD0', '#F5CBA7']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.card}>
      {/* Top Row */}
      <View style={styles.topRow}>
        {/* Left: Fire + Streak Number */}
        <View style={styles.streakSection}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <View style={styles.streakNumberContainer}>
            <Text style={styles.streakLabel}>Streak</Text>
            <Text style={styles.streakNumber}>
              {String(currentStreak).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Right: Recent Streaks */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Streaks</Text>
            {/* <TouchableOpacity onPress={onExplore}>
              <Text style={styles.exploreLink}>Explore</Text>
            </TouchableOpacity> */}
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((day, index) => {
              const status = getDayStatus(index);
              return (
                <View key={day} style={styles.dayItem}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View
                    style={[
                      styles.dayIndicator,
                      status === 'achieved' && styles.dayAchieved,
                      status === 'missed' && styles.dayMissed,
                      status === 'future' && styles.dayFuture,
                    ]}>
                    <Text style={styles.dayIcon}>
                      {status === 'achieved'
                        ? '✓'
                        : status === 'missed'
                        ? '✗'
                        : '–'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom: Longest Streak */}
      <View style={styles.bottomRow}>
        <Text style={styles.longestLabel}>Longest Day Streak</Text>
        <Text style={styles.longestNumber}>
          {String(longestStreak).padStart(2, '0')}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: wp('3.5%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E8A854',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Left: fire + number
  streakSection: {
    alignItems: 'center',
    marginRight: wp('4%'),
    paddingTop: hp('0.5%'),
  },
  fireEmoji: {
    fontSize: hp('3.5%'),
  },
  streakNumberContainer: {
    alignItems: 'center',
    marginTop: hp('0.3%'),
  },
  streakLabel: {
    fontSize: hp('1.4%'),
    color: '#7A5830',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  streakNumber: {
    fontSize: hp('3.5%'),
    color: '#4A2E0A',
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: hp('4%'),
  },
  // Right: recent streaks
  recentSection: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  recentTitle: {
    fontSize: hp('1.7%'),
    color: '#4A2E0A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  exploreLink: {
    fontSize: hp('1.4%'),
    color: '#D4751A',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: hp('1.2%'),
    color: '#7A5830',
    fontFamily: 'PlusJakartaSans-Medium',
    marginBottom: hp('0.4%'),
  },
  dayIndicator: {
    width: wp('7.5%'),
    height: wp('7.5%'),
    borderRadius: wp('3.75%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayAchieved: {
    backgroundColor: '#27AE60',
  },
  dayMissed: {
    backgroundColor: '#E74C3C',
  },
  dayFuture: {
    backgroundColor: '#D5C4A1',
  },
  dayIcon: {
    color: '#FFFFFF',
    fontSize: hp('1.6%'),
    fontFamily: 'PlusJakartaSans-Bold',
  },
  // Bottom: longest streak
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1.5%'),
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 12,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  longestLabel: {
    fontSize: hp('1.7%'),
    color: '#4A2E0A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  longestNumber: {
    fontSize: hp('3%'),
    color: '#4A2E0A',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
