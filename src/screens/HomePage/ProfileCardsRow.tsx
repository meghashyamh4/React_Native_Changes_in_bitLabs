


import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@models/Model';

import { useAuth } from '@context/Authcontext';
import { useProfileViewModel } from '@viewmodel/Profileviewmodel';
import { useProfilePhoto } from '@context/ProfilePhotoContext';
import UserContext from '@context/UserContext';
import apiClient from '@services/login/ApiClient';
import { ProfileApiService } from '@services/profile/ProfileApiService';

import ArenaCard from './ArenaCard';
import { MentorSphereCard } from './MentorSphereCard';
import { PortfolioCard } from './PortfolioCard';
import { StreakCard } from './StreakCard';
import { TechBuzzShotsCard } from './TechBuzzShotsCard';
import { TechVibesCard } from './TechVibesCard';
import BadgeProgressBar from './BadgeProgressBar';
import { fetchStreakDetails, StreakDetails } from '@services/streak/StreakService';
import videoService from '@services/Videos/videoService';
const { getRecommendedVideos: fetchRecommendedVideos } = videoService;
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type ProfileCardsRowNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Meeting = {
  meetingId?: number;
  meeting_id?: number;
  id?: number;
  mentorName?: string;
  mentor_name?: string;
  title?: string;
  date?: number[];
  startTime?: number[];
  start_time?: number[];
  status?: string;
  meetLink?: string;
  meet_link?: string;
  durationMinutes?: number;
  duration?: number;
};

const ProfileCardsRow: React.FC = () => {
  const navigation = useNavigation<ProfileCardsRowNavigationProp>();
  const { userId, userToken } = useAuth();
  const { profileData, isLoading: profileLoading } = useProfileViewModel(userToken, userId);
  const { photo } = useProfilePhoto();
  const { totalScore, refreshScore, scoreDetails } = useContext(UserContext);

  const [mentorLoading, setMentorLoading] = useState(true);
  const [mentorConnectData, setMentorConnectData] = useState<{ items: Meeting[] }>({ items: [] });
  const [userName, setUserName] = useState<string>('');
  // Use totalScore from UserContext instead of local state
  const dashboardScore = totalScore;
  const [techBuzzVideos, setTechBuzzVideos] = useState<any[]>([]);
  const [techBuzzLoading, setTechBuzzLoading] = useState(true);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<StreakDetails | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);

  // Cache refs to prevent unnecessary refetching
  const videosCacheRef = useRef<{ data: any[]; timestamp: number } | null>(null);
  const blogsCacheRef = useRef<{ data: any[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 60000; // 60 seconds cache

  const getPoints = (badge: string) => {
    return scoreDetails?.badgeScores?.find((b: any) => b.badge === badge)?.points;
  };

  const bronzeScore = getPoints('BRONZE') || 200;
  const silverScore = getPoints('SILVER') || 300;
  const goldScore = getPoints('GOLD') || 500;

  const badgeLevels = [
    { name: 'Bronze', score: bronzeScore },
    { name: 'Silver', score: silverScore },
    { name: 'Gold', score: goldScore },
  ];

  const defaultMentorImages = [
    require('../../assests/Images/mentorconnect/mentor-dummy.png'),
    require('../../assests/Images/mentorconnect/mentor-dummy.png'),
    require('../../assests/Images/mentorconnect/mentor-dummy.png'),
    require('../../assests/Images/mentorconnect/mentor-dummy.png'),
  ];

  // Fetch meetings function - extracted to be reusable
  const fetchMeetings = useCallback(async () => {
    if (!userToken) return;
    setMentorLoading(true);

    try {
      console.log("🔄 [HOME MENTOR CARD] Fetching meetings from API...");
      const resp = await apiClient.get('/api/mentor-connect/getAllMeetings', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const data = Array.isArray(resp.data.items) ? resp.data.items : [];
      setMentorConnectData({ items: data });
      console.log("✅ [HOME MENTOR CARD] Meetings fetched successfully:", data.length);

    } catch (err) {
      console.error('❌ [HOME MENTOR CARD] Mentor fetch error:', err);
    } finally {
      setMentorLoading(false);
    }
  }, [userToken]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Refresh mentor data when tab switches (screen comes into focus)
  useFocusEffect(
    useCallback(() => {
      console.log("📱 [HOME MENTOR CARD] Tab switched - refreshing mentor data...");
      fetchMeetings();
    }, [fetchMeetings])
  );

  const normalizeMentorItems = () => {
    // Don't filter by status here - let MentorSphereCard handle Active/Upcoming filtering
    return mentorConnectData.items
      .filter(item => item) // Only filter out null/undefined
      .map(item => ({
        meetingId: String(item.meetingId || item.meeting_id || item.id || ''),
        mentorName: item.mentorName || item.mentor_name || 'Mentor',
        title: item.title || 'Session',
        date: item.date || [],
        startTime: item.startTime || item.start_time || [],
        durationMinutes: item.durationMinutes || item.duration || 60,
        duration: item.duration || item.durationMinutes || 60,
      }));
  };

  // Calculate progress percentage based on next badge
  const calculateProgressPercentage = () => {
    if (dashboardScore === null || dashboardScore === undefined || dashboardScore === 0) {
      return 0;
    }

    const nextBadge = badgeLevels.find(level => dashboardScore < level.score);
    let progressPercentage = 100;

    if (nextBadge) {
      progressPercentage = (dashboardScore / nextBadge.score) * 100;
      progressPercentage = Math.min(Math.max(progressPercentage, 0), 100);
    }

    return progressPercentage;
  };

  // Fetch user name from applicant card API
  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId || !userToken) return;
      try {
        const result = await ProfileApiService.fetchCard(userId, userToken);
        if (result.success && result.data?.name) {
          setUserName(result.data.name);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();
  }, [userId, userToken]);

  // Refresh score from UserContext when component mounts or userId changes
  useEffect(() => {
    if (userId && userToken && refreshScore) {
      console.log('🔄 [PROFILE CARDS ROW] Refreshing score on mount...');
      refreshScore();
    }
  }, [userId, userToken]);

  // Calculate earned badges based on score
  const getEarnedMedalBadges = () => {
    if (dashboardScore === null || dashboardScore === undefined || dashboardScore === 0) {
      return [];
    }
    const earned = badgeLevels.filter(level => dashboardScore >= level.score);
    return earned;
  };

  // Get next badge to unlock
  const getNextBadge = () => {
    if (dashboardScore === null || dashboardScore === undefined || dashboardScore === 0) {
      return null;
    }
    const next = badgeLevels.find(level => dashboardScore < level.score) || null;
    return next;
  };

  // Fetch tech buzz videos with caching
  const fetchTechBuzzVideos = useCallback(async (forceRefresh = false) => {
    if (!userId || !userToken) {
      setTechBuzzLoading(false);
      return;
    }

    // Check cache first
    const now = Date.now();
    if (!forceRefresh && videosCacheRef.current) {
      const cacheAge = now - videosCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        // Use cached data
        setTechBuzzVideos(videosCacheRef.current.data);
        setTechBuzzLoading(false);
        return;
      }
    }

    setTechBuzzLoading(true);
    try {
      const videos = await fetchRecommendedVideos!(userId, userToken);
      const videoArray = Array.isArray(videos) ? videos : [];
      setTechBuzzVideos(videoArray);
      // Update cache
      videosCacheRef.current = { data: videoArray, timestamp: now };
    } catch (err) {
      console.error('Error fetching tech buzz videos:', err);
      // If we have cached data, use it even if expired
      if (videosCacheRef.current) {
        setTechBuzzVideos(videosCacheRef.current.data);
      } else {
        setTechBuzzVideos([]);
      }
    } finally {
      setTechBuzzLoading(false);
    }
  }, [userId, userToken]);

  // Fetch blogs with caching
  const fetchBlogs = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && blogsCacheRef.current) {
      const cacheAge = now - blogsCacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        // Use cached data
        setBlogs(blogsCacheRef.current.data);
        setBlogsLoading(false);
        return;
      }
    }

    setBlogsLoading(true);
    setBlogsError(null);
    try {
      const res = await apiClient.get('/blogs/active');
      const blogArray = Array.isArray(res.data) ? res.data : [];
      setBlogs(blogArray);
      // Update cache
      blogsCacheRef.current = { data: blogArray, timestamp: now };
    } catch (err: any) {
      console.error('Error fetching blogs:', err);
      setBlogsError('Failed to load blogs');
      // If we have cached data, use it even if expired
      if (blogsCacheRef.current) {
        setBlogs(blogsCacheRef.current.data);
      } else {
        setBlogs([]);
      }
    } finally {
      setBlogsLoading(false);
    }
  }, []);

  // Fetch streak details
  const loadStreakDetails = useCallback(async () => {
    if (!userId) return;
    setStreakLoading(true);
    try {
      const data = await fetchStreakDetails(userId);
      setStreakData(data);
    } catch (err) {
      console.error('Error fetching streak details:', err);
    } finally {
      setStreakLoading(false);
    }
  }, [userId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTechBuzzVideos();
    fetchBlogs();
    loadStreakDetails();
  }, [fetchTechBuzzVideos, fetchBlogs, loadStreakDetails]);

  // Refresh on focus only if cache is expired
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refresh if cache is expired
      if (!videosCacheRef.current || (now - videosCacheRef.current.timestamp) >= CACHE_DURATION) {
        fetchTechBuzzVideos(false);
      }
      if (!blogsCacheRef.current || (now - blogsCacheRef.current.timestamp) >= CACHE_DURATION) {
        fetchBlogs(false);
      }
    }, [fetchTechBuzzVideos, fetchBlogs])
  );


  const getEarnedSkillBadges = () => {
    if (!profileData?.applicant?.applicantSkillBadges) return [];
    return profileData.applicant.applicantSkillBadges
      .filter((badge: any) => badge.flag === 'added' && badge.status === 'PASSED')
      .map((badge: any) => ({
        name: badge.skillBadge?.name || 'Badge',
      }))
      .filter((badge: any) => badge.name && badge.name.trim() !== '');
  };

  // Skeleton Loading Components
  const SkeletonCard = ({ backgroundColor, borderColor }: { backgroundColor: string; borderColor: string }) => (
    <View style={[styles.skeletonCard, { backgroundColor, borderColor }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLink} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonTextContainer}>
          <View style={styles.skeletonTextLine1} />
          <View style={styles.skeletonTextLine2} />
          <View style={styles.skeletonTextLine3} />
        </View>
      </View>
    </View>
  );

  const SkeletonPortfolioCard = () => (
    <View style={[styles.skeletonCard, { backgroundColor: '#FFF5E6', borderColor: '#EA7B20' }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLink} />
      </View>
      <View style={styles.skeletonPortfolioContent}>
        <View style={styles.skeletonProfileImage} />
        <View style={styles.skeletonPortfolioDetails}>
          <View style={styles.skeletonDetailLine} />
          <View style={styles.skeletonDetailLine} />
          <View style={styles.skeletonScore} />
        </View>
      </View>
      <View style={styles.skeletonSkills}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={styles.skeletonSkillBadge} />
        ))}
      </View>
      <View style={styles.skeletonProgressBar} />
    </View>
  );

  const SkeletonArenaCard = () => (
    <View style={[styles.skeletonCard, { backgroundColor: '#fff', borderColor: '#EA7B20' }]}>
      <View style={styles.skeletonArenaContent}>
        <View style={styles.skeletonArenaText}>
          <View style={styles.skeletonArenaTitle} />
          <View style={styles.skeletonArenaDesc} />
          <View style={styles.skeletonArenaButton} />
        </View>
        <View style={styles.skeletonArenaImage} />
      </View>
    </View>
  );

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <SkeletonPortfolioCard />
        <SkeletonArenaCard />
        <SkeletonCard backgroundColor="#FFF5E6" borderColor="#EA7B20" />
        <SkeletonCard backgroundColor="#fff" borderColor="#EA7B20" />
        <SkeletonCard backgroundColor="#FFF5E6" borderColor="#EA7B20" />
      </View>
    );
  }

  // Alternate colors: orange, white, orange, white, etc.
  const cardColors = [
    { bg: '#FFF5E6', border: '#EA7B20' }, // Portfolio - Orange
    { bg: '#fff', border: '#EA7B20' },    // Arena - White
    { bg: '#FFF5E6', border: '#EA7B20' }, // MentorSphere - Orange
    { bg: '#fff', border: '#EA7B20' },    // TechBuzz - White
    { bg: '#FFF5E6', border: '#EA7B20' }, // TechVibes - Orange
  ];

  return (
    <View style={styles.container}>
      {/* Badge Progress Bar - Above Portfolio Card */}
      <BadgeProgressBar
        dashboardScore={dashboardScore ?? 0}
        backgroundColor={cardColors[1].bg}
        borderColor={cardColors[1].border}
        scoreDetails={scoreDetails}
      />

      {/* Portfolio Card - Orange */}
      <PortfolioCard
        imageSrc={photo}
        profileData={profileData}
        dashboardScore={totalScore ?? 0}
        userName={userName}
        onExplore={() => navigation.navigate('Profile')}
        backgroundColor={cardColors[0].bg}
        borderColor={cardColors[0].border}
        scoreDetails={scoreDetails}
      />

      {/* Streak Card - Below Portfolio */}
      {/* {!streakLoading && streakData && (
        <StreakCard
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          onExplore={() => navigation.navigate('Profile')}
        />
      )} */}

      {/* Arena Card - White */}
      <ArenaCard
        characterImg={require('../../assests/Images/Asknewton/hackathon.png')}
        onEnterArena={() => navigation.navigate('BottomTab' as any, { screen: 'Hackathon' } as any)}
        backgroundColor={cardColors[1].bg}
        borderColor={cardColors[1].border}
      />

      {/* MentorSphere Card - Orange */}
      <MentorSphereCard
        items={normalizeMentorItems()}
        loading={mentorLoading}
        defaultImages={defaultMentorImages}
        onViewMore={() => {
          // Navigate to BottomTab and then to Mentor Sphere tab
          navigation.navigate('BottomTab' as any, { screen: 'Mentor Sphere' } as any);
        }}
        onSelectMentor={(item) => {
          // Navigate to MentorConnect screen with the specific meetingId
          const meetingId = item.meetingId;
          if (meetingId) {
            navigation.navigate('MentorConnect' as any, { meetingId: String(meetingId) } as any);
          } else {
            // Fallback: navigate to Mentor Sphere tab if no meetingId
            navigation.navigate('BottomTab' as any, { screen: 'Mentor Sphere' } as any);
          }
        }}
        backgroundColor={cardColors[2].bg}
        borderColor={cardColors[2].border}
      />

      {/* Tech Buzz Shots Card - White */}
      <TechBuzzShotsCard
        videos={techBuzzVideos}
        loading={techBuzzLoading}
        onViewMore={() => navigation.navigate('BottomTab', { screen: 'Shorts' })}
        onVideoPress={(videoId) => {
          navigation.navigate('VerifiedVideosScreen', { videoId });
        }}
        backgroundColor={cardColors[3].bg}
        borderColor={cardColors[3].border}
      />

      {/* Tech Vibes Card - Orange */}
      <TechVibesCard
        blogs={blogs}
        loading={blogsLoading}
        error={blogsError}
        onExplore={() => navigation.navigate('TechVibes')}
        onBlogPress={(blogId) => {
          navigation.navigate('TechVibes', { blogId });
        }}
        backgroundColor={cardColors[4].bg}
        borderColor={cardColors[4].border}
      />

    </View>
  );
};

export default ProfileCardsRow;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skeletonCard: {
    borderRadius: 12,
    padding: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  skeletonTitle: {
    width: wp('30%'),
    height: hp('2%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonLink: {
    width: wp('15%'),
    height: hp('1.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonImage: {
    width: wp('20%'),
    height: hp('10%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: wp('2%'),
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTextLine1: {
    width: '80%',
    height: hp('1.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: hp('0.5%'),
  },
  skeletonTextLine2: {
    width: '60%',
    height: hp('1.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: hp('0.5%'),
  },
  skeletonTextLine3: {
    width: '70%',
    height: hp('1.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonPortfolioContent: {
    flexDirection: 'row',
    marginBottom: hp('1%'),
  },
  skeletonProfileImage: {
    width: wp('15%'),
    height: hp('8%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: wp('2%'),
  },
  skeletonPortfolioDetails: {
    flex: 1,
  },
  skeletonDetailLine: {
    width: '70%',
    height: hp('1.2%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: hp('0.3%'),
  },
  skeletonScore: {
    width: wp('20%'),
    height: hp('2%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: hp('0.5%'),
  },
  skeletonSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp('1%'),
  },
  skeletonSkillBadge: {
    width: wp('18%'),
    height: hp('2.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginRight: wp('1%'),
    marginBottom: hp('0.5%'),
  },
  skeletonProgressBar: {
    width: '100%',
    height: hp('1%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonArenaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonArenaText: {
    flex: 1,
    paddingRight: wp('2%'),
  },
  skeletonArenaTitle: {
    width: '60%',
    height: hp('2%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: hp('1%'),
  },
  skeletonArenaDesc: {
    width: '90%',
    height: hp('1.5%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: hp('0.5%'),
  },
  skeletonArenaButton: {
    width: wp('40%'),
    height: hp('4%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: hp('1%'),
  },
  skeletonArenaImage: {
    width: wp('35%'),
    height: hp('15%'),
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
});
