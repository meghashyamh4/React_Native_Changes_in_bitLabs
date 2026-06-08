import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';

type BadgeProgressBarProps = {
  dashboardScore: number;
  backgroundColor?: string;
  borderColor?: string;
  scoreDetails?: any;
};

const BadgeProgressBar: React.FC<BadgeProgressBarProps> = ({
  dashboardScore,
  backgroundColor = '#fff',
  borderColor = '#EA7B20',
  scoreDetails,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const getPoints = (badge: string) => {
    return scoreDetails?.badgeScores?.find((b: any) => b.badge === badge)?.points;
  };

  const bronzeScore = getPoints('BRONZE') || 200;
  const silverScore = getPoints('SILVER') || 300;
  const goldScore = getPoints('GOLD') || 500;

  const bronzeWidth = (bronzeScore / goldScore) * 100;
  const silverWidth = ((silverScore - bronzeScore) / goldScore) * 100;
  const goldWidth = ((goldScore - silverScore) / goldScore) * 100;

  const badgeLevels = [
    { name: 'Bronze', score: bronzeScore },
    { name: 'Silver', score: silverScore },
    { name: 'Gold', score: goldScore },
  ];

  const earnedBadges = badgeLevels.filter(level => dashboardScore >= level.score);
  const nextBadge = badgeLevels.find(level => dashboardScore < level.score);

  // Determine which segment is active based on score
  const getActiveSegment = () => {
    if (dashboardScore < bronzeScore) return 'bronze';
    if (dashboardScore < silverScore) return 'silver';
    if (dashboardScore < goldScore) return 'gold';
    return 'gold'; // Max level
  };

  const activeSegment = getActiveSegment();

  const [parentWidth, setParentWidth] = React.useState(0);
  const [badgeWidth, setBadgeWidth] = React.useState(0);

  const onParentLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setParentWidth(width);
  };

  const onBadgeLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setBadgeWidth(width);
  };

  // Use web version's exact calculation method
  const overallProgress = Math.min(100, (dashboardScore / goldScore) * 100);

  // Calculate relative positions in pixels if widths are available
  let badgeLeft = 0;
  let pointerLeft = 0;

  if (parentWidth > 0 && badgeWidth > 0) {
    const progressRatio = Math.min(1, dashboardScore / goldScore);
    const progressX = progressRatio * parentWidth;

    // Safety margin to keep pointer away from the badge's rounded corners
    const pointerSafeMargin = 12;

    // Allow the badge to hang off the bar slightly (into card margins)
    // Card padding is wp(3%) + wrapper padding wp(1%) = wp(4%) total.
    // We allow up to wp(3.5%) to be safe.
    const allowableOverflow = wp('3.5%');

    // 1. Initial attempt: center badge on progressX
    let idealBadgeX = progressX - (badgeWidth / 2);

    // 2. Clamp badgeX to stay within card bounds (relatively to barContainer)
    let clampedBadgeX = Math.max(-allowableOverflow, Math.min(parentWidth + allowableOverflow - badgeWidth, idealBadgeX));

    // 3. See where the pointer would land relative to this badge position
    let targetPointerX = progressX - clampedBadgeX;

    // 4. Clamp the pointer within the badge's safe zone
    const clampedPointerX = Math.max(pointerSafeMargin, Math.min(badgeWidth - pointerSafeMargin, targetPointerX));

    // 5. Re-center badge if pointer was forced to move
    badgeLeft = progressX - clampedPointerX;
    pointerLeft = clampedPointerX;
  } else {
    // Fallback while measurements are loading or not available
    badgeLeft = overallProgress;
  }

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.wrapper}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressLabel}>Badge Achievement Level</Text>
          <View style={styles.progressRightContainer}>
            {/* <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text> */}
            <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn More</Text>
            </TouchableOpacity>
             <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text>
          </View>
        </View>

        <View style={styles.barContainer} onLayout={onParentLayout}>
          <View style={styles.badgeBar}>
            {/* Bronze Segment */}
            <View
              style={[
                styles.segment,
                {
                  width: `${bronzeWidth}%`,
                  backgroundColor: 'transparent',
                }
              ]}
            >
              <Text style={styles.segmentText}>
                Bronze
              </Text>
            </View>

            {/* Silver Segment */}
            <View
              style={[
                styles.segment,
                {
                  width: `${silverWidth}%`,
                  backgroundColor: 'transparent',
                }
              ]}
            >
              <Text style={styles.segmentText}>
                Silver
              </Text>
            </View>

            {/* Gold Segment */}
            <View
              style={[
                styles.segment,
                styles.lastSegment,
                {
                  width: `${goldWidth}%`,
                  backgroundColor: 'transparent',
                }
              ]}
            >
              <Text style={styles.segmentText}>
                Gold
              </Text>
            </View>

            {/* Progress Fill - fills up to current score position */}
            <View
              style={[
                styles.progressFill,
                {
                  width: `${overallProgress}%`,
                },
              ]}
            />
          </View>

          {/* Score Badge - positioned below the bar with upward pointer, moves according to progress */}
          {parentWidth > 0 && (
            <View
              onLayout={onBadgeLayout}
              style={[
                styles.scoreBadge,
                {
                  left: badgeLeft,
                },
              ]}
            >
              {/* Upward pointing triangle */}
              <View style={[styles.badgePointer, { left: pointerLeft }]} />
              <Text style={styles.scoreBadgeText}>
                {dashboardScore} / {nextBadge ? nextBadge.score : goldScore}
              </Text>
            </View>
          )}
        </View>

        {!nextBadge && (
          <Text style={styles.congratsText}>Congrats Buddy! You unlocked all badges!</Text>
        )}
      </View>

      {/* Points Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How do points work?</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>You can earn points by taking one of the actions below.</Text>

              <View style={styles.pointsList}>
                <View style={styles.pointsCard}>
                  <View style={styles.pointsCardLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.iconEmoji}>🏆</Text>
                    </View>
                    <View style={styles.pointsDetails}>
                      <Text style={styles.pointsTitle}>Conquer The Challenge</Text>
                      <Text style={styles.pointsSub}>Hackathon Submission</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>+25 Points</Text>
                </View>

                <View style={styles.pointsCard}>
                  <View style={styles.pointsCardLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.iconEmoji}>🧠</Text>
                    </View>
                    <View style={styles.pointsDetails}>
                      <Text style={styles.pointsTitle}>Prove Your Expertise</Text>
                      <Text style={styles.pointsSub}>Skill Validation Test</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>+20 Points</Text>
                </View>

                <View style={styles.pointsCard}>
                  <View style={styles.pointsCardLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.iconEmoji}>🚀</Text>
                    </View>
                    <View style={styles.pointsDetails}>
                      <Text style={styles.pointsTitle}>Ignite Your Journey</Text>
                      <Text style={styles.pointsSub}>Hackathon Registration</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>+5 Points</Text>
                </View>

                <View style={styles.pointsCard}>
                  <View style={styles.pointsCardLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.iconEmoji}>🤝</Text>
                    </View>
                    <View style={styles.pointsDetails}>
                      <Text style={styles.pointsTitle}>Link With Leaders</Text>
                      <Text style={styles.pointsSub}>Mentor Connect Registration</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>+5 Points</Text>
                </View>

                <View style={styles.pointsCard}>
                  <View style={styles.pointsCardLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.iconEmoji}>📺</Text>
                    </View>
                    <View style={styles.pointsDetails}>
                      <Text style={styles.pointsTitle}>Catch The Vibe</Text>
                      <Text style={styles.pointsSub}>Watching Tech Buzz Shorts</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsValue}>+2 Points</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.gotItButton}>
                <Text style={styles.gotItButtonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default BadgeProgressBar;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    padding: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    elevation: 3,
    overflow: 'visible', // Allow badge to extend below, but position will keep it within horizontal bounds
  },
  wrapper: {
    paddingHorizontal: wp('1%'),
    overflow: 'visible',
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  progressLabel: {
    fontSize: hp('2%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
  },
  progressRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: hp('1.8%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#EA7B20',
    marginRight: wp('2%'),
  },
  learnMoreButton: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
  },
  learnMoreText: {
    fontSize: hp('1.4%'),
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#EA7B20',
    textDecorationLine: 'underline',
  },
  barContainer: {
    position: 'relative',
    marginBottom: hp('5%'), // More space for score badge below
    marginTop: hp('0.5%'),
    paddingHorizontal: 0,
    overflow: 'visible', // Allow badge to be visible below bar
  },
  badgeBar: {
    flexDirection: 'row',
    height: hp('4%'),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e66a0e', // Black border
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  segment: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#dcdcdc', // Black border in middle
    zIndex: 3, // Above progress fill
  },
  lastSegment: {
    borderRightWidth: 0, // Remove right border from last segment
  },
  segmentText: {
    fontSize: hp('1.3%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000', // Always black text
    zIndex: 5, // Ensure text is always visible above fill
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#EA7B20',
    borderRadius: 8,
    zIndex: 1,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: -hp('4%'), // Moved further down
    backgroundColor: '#EA7B20',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.6%'),
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    alignItems: 'center',
    // Width is now dynamic
  },
  badgePointer: {
    position: 'absolute',
    top: -hp('0.6%'), // Deep overlap for perfect fusion (triangle height is ~0.8%)
    marginLeft: -hp('0.8%'),
    width: 0,
    height: 0,
    borderLeftWidth: hp('0.8%'),
    borderRightWidth: hp('0.8%'),
    borderBottomWidth: hp('0.8%'),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EA7B20',
    zIndex: 11,
  },
  scoreBadgeText: {
    fontSize: hp('1.4%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff', // White text on orange background
  },
  congratsText: {
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#28a745',
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: hp('80%'),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: hp('2.2%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: wp('1%'),
  },
  modalBody: {
    padding: wp('4%'),
    maxHeight: hp('60%'),
  },
  modalDescription: {
    fontSize: hp('1.6%'),
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    marginBottom: hp('2%'),
  },
  pointsList: {
    marginTop: hp('1%'),
  },
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pointsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#fff5e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  iconEmoji: {
    fontSize: wp('5%'),
  },
  pointsDetails: {
    flex: 1,
  },
  pointsTitle: {
    fontSize: hp('1.6%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
    marginBottom: hp('0.3%'),
  },
  pointsSub: {
    fontSize: hp('1.3%'),
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  pointsValue: {
    fontSize: hp('1.5%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#EA7B20',
  },
  modalFooter: {
    padding: wp('4%'),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  gotItButton: {
    backgroundColor: '#EA7B20',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('8%'),
    borderRadius: 28,
    alignItems: 'center',
  },
  gotItButtonText: {
    fontSize: hp('1.8%'),
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
});

