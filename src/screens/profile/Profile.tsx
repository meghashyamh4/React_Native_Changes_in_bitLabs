// ============================================
// OLD CODE COMMENTED OUT - DO NOT TOUCH
// ============================================
// import React, {useState, useEffect} from 'react';
// ... (all old code preserved above)
// ============================================

// NEW MOBILE-FRIENDLY REACT NATIVE PROFILE COMPONENT
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
  ImageBackground,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '@context/Authcontext';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { ProfileService } from '@services/profile/ProfileService';
import apiClient from '@services/login/ApiClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import EditBasicDetailsModal from './components/EditBasicDetailsModal';
import EditSummaryModal from './components/EditSummaryModal';
import EditPersonalDetailsModal from './components/EditPersonalDetailsModal';
import EditEducationModal from './components/EditEducationModal';
import EditProjectModal from './components/EditProjectModal';
import DeleteProjectModal from './components/DeleteProjectModal';
import EditSkillsModal from './components/EditSkillsModal';
import { showToast } from '../../services/login/ToastService';
import ImageUploadModal from './components/ImageUploadModal';
import ResumeUploadModal from './components/ResumeUploadModal';
import ResumeViewerModal from './components/ResumeViewerModal';
import SettingsButton from '../../components/styles/SettingsButton';
import UserContext from '@context/UserContext';
import BadgeProgressBar from '../HomePage/BadgeProgressBar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@models/Model';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface ApplicantCard {
  applicantId: number | null;
  name: string;
  role: string;
  mobileNumber: string;
  email: string;
  passYear: number | null;
  address: string;
  locationDisplay: string;
  lastUpdated: number | null;
  score: number;
}

interface SkillBadge {
  id: number;
  skillBadge?: { name: string };
  status?: string;
  flag?: string;
  test_taken?: string;
}

const DEFAULT_CARD: ApplicantCard = {
  applicantId: null,
  name: '',
  role: '',
  mobileNumber: '',
  email: '',
  passYear: null,
  address: '',
  locationDisplay: '',
  lastUpdated: null,
  score: 0,
};


const Profile: React.FC = () => {
  const { userId, userToken } = useAuth();
  const { refreshPersonalName, totalScore, refreshScore, scoreDetails } = useContext(UserContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<ApplicantCard>(DEFAULT_CARD);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [personalDetails, setPersonalDetails] = useState<any>({});
  const [education, setEducation] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]); // Changed from single object to array
  const [selectedProject, setSelectedProject] = useState<any>(null); // For editing specific project
  const [skills, setSkills] = useState<string[]>([]);
  const [skillBadges, setSkillBadges] = useState<SkillBadge[]>([]);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // Track if data has been loaded to prevent unnecessary API calls
  const hasLoadedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown between fetches

  // Sync score from UserContext to card
  useEffect(() => {
    if (totalScore > 0) {
      setCard(prev => ({
        ...prev,
        score: totalScore,
      }));
    }
  }, [totalScore]);

  // Modals
  const [editBasicModal, setEditBasicModal] = useState(false);
  const [editSummaryModal, setEditSummaryModal] = useState(false);
  const [editPersonalModal, setEditPersonalModal] = useState(false);
  const [editEducationModal, setEditEducationModal] = useState(false);
  const [editProjectModal, setEditProjectModal] = useState(false);
  const [editSkillsModal, setEditSkillsModal] = useState(false);
  const [deleteProjectModalVisible, setDeleteProjectModalVisible] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<number | null>(null);
  const [imageModal, setImageModal] = useState(false);
  const [resumeModal, setResumeModal] = useState(false);
  const [resumeViewerModal, setResumeViewerModal] = useState(false);

  // Badge levels
  const getPoints = (badgeName: string) => {
    return scoreDetails?.badgeScores?.find((b: any) => b.badge === badgeName.toUpperCase())?.points;
  };

  const bronzeThreshold = getPoints('BRONZE') || 200;
  const silverThreshold = getPoints('SILVER') || 300;
  const goldThreshold = getPoints('GOLD') || 500;

  const currentScore = scoreDetails?.total_score || totalScore || card?.score || 0;

  const earnedBadges = [
    { name: 'bronze', score: bronzeThreshold },
    { name: 'silver', score: silverThreshold },
    { name: 'gold', score: goldThreshold },
  ].filter(level => currentScore >= level.score);

  const fetchScoreDetails = async () => {
    if (refreshScore) await refreshScore();
  };

  // Fetch all data using ProfileApiService
  const fetchCard = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchCard(userId, userToken);
    if (result.success && result.data) {
      // Refresh score in UserContext and get the latest score
      await refreshScore();
      // Fetch fresh score directly to ensure we have the latest
      const scoreResult = await ProfileApiService.fetchScore(userId, userToken);
      const latestScore = scoreResult.success ? (scoreResult.score || 0) : (totalScore || 0);

      setCard({
        ...DEFAULT_CARD,
        ...result.data,
        score: latestScore,
      });
    }
  };
  console.log('card', card);
  const fetchPhoto = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileService.fetchProfilePhoto(userToken, userId);
    if (result.success && result.photoUrl) {
      setImageSrc(result.photoUrl);
    } else {
      setImageSrc(null);
    }
  };

  const fetchSummary = async () => {
    if (!userId || !userToken) {
      console.warn('[Profile] Cannot fetch summary - missing userId or userToken');
      return;
    }
    console.log('[Profile] Fetching summary...');
    const result = await ProfileApiService.fetchSummary(userId, userToken);
    console.log('[Profile] Summary fetch result:', {
      success: result.success,
      summaryLength: result.summary?.length || 0,
      hasSummary: !!result.summary,
    });
    setSummary(result.summary || '');
  };

  const fetchPersonalDetails = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchPersonalDetails(userId, userToken);
    setPersonalDetails(result.data);
  };

  const fetchEducation = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchEducation(userId, userToken);
    setEducation(result.data);
  };

  const fetchProjects = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchProjects(userId, userToken);
    setProjects(result.projects || []);
  };

  const handleDeleteProject = (projectId: number) => {
    setProjectToDeleteId(projectId);
    setDeleteProjectModalVisible(true);
  };

  const confirmDeleteProject = async () => {
    if (!userId || !userToken || !projectToDeleteId) return;

    setLoading(true);
    setDeleteProjectModalVisible(false);

    const result = await ProfileApiService.deleteProject(userId, userToken, projectToDeleteId);

    if (result.success) {
      showToast('success', 'Project deleted successfully');
      await fetchProjects();
    } else {
      showToast('error', result.error || "Failed to delete project");
    }
    setLoading(false);
    setProjectToDeleteId(null);
  };

  const handleDeleteProjectOld = async (projectId: number) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId || !userToken) return;
            setLoading(true);
            const result = await ProfileApiService.deleteProject(userId, userToken, projectId);

            if (result.success) {
              // Refresh projects list
              await fetchProjects();
            } else {
              Alert.alert("Error", result.error || "Failed to delete project");
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const fetchSkills = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchSkills(userId, userToken);
    setSkills(result.skills);
  };

  const fetchSkillBadges = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.fetchSkillBadges(userId, userToken);
    setSkillBadges(result.badges);
  };

  const probeResume = async () => {
    if (!userId || !userToken) return;
    const result = await ProfileApiService.checkResume(userId, userToken);
    setResumeAvailable(result.available);
  };

  const loadNotificationState = async () => {
    try {
      const savedMuted = await AsyncStorage.getItem('notificationsMuted');
      setNotificationsMuted(savedMuted === 'true');
    } catch (err) {
      console.error('Error loading notification state:', err);
    }
  };

  // Fetch FCM token details from server on mount
  useEffect(() => {
    const fetchFcmDetails = async () => {
      if (!userToken) {
        console.warn('⚠️ No userToken found; cannot fetch mute state');
        return;
      }

      try {
        const fcmToken = await AsyncStorage.getItem('fcmToken');
        if (!fcmToken) {
          console.warn('⚠️ No fcmToken found in AsyncStorage; cannot fetch mute state');
          return;
        }

        const endpoint = `/notification/getFcmTokenDetails/${fcmToken}`;
        console.log('📡 Fetching FCM token details:', { endpoint, fcmToken });

        const response = await apiClient.get(endpoint, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        const isTokenActive = response?.data?.isTokenActive;
        if (typeof isTokenActive === 'boolean') {
          const newMuted = !isTokenActive; // active => unmuted, inactive => muted
          setNotificationsMuted(newMuted);
          await AsyncStorage.setItem('notificationsMuted', newMuted ? 'true' : 'false');
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || '';
        // If there's an error (like duplicate tokens), just use the local state
        console.warn('⚠️ Failed to fetch FCM token details from server. Using local state:', errorMessage);
        // Don't update state if there's an error - keep using local AsyncStorage value
      }
    };

    if (userToken) {
      fetchFcmDetails();
    }
  }, [userToken]);

  const updateServerMute = async (isMuted: boolean) => {
    if (!userToken || !userId) {
      console.warn('⚠️ No userToken or userId found; cannot update mute state');
      return;
    }

    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
        console.warn('⚠️ No fcmToken found in AsyncStorage; cannot update mute state');
        return;
      }

      // Use FCM token directly in path (same as web version)
      const endpoint = `/notification/${isMuted ? 'mute' : 'unmute'}/${fcmToken}`;
      console.log('📡 Updating server mute state:', { isMuted, fcmToken, endpoint, userId });

      // Use PUT method only (same as web version)
      // Authorization header is automatically added by apiClient interceptor
      await apiClient.put(endpoint, null);

      console.log('✅ Server mute state updated');
    } catch (err: any) {
      const errorStatus = err?.response?.status;
      const errorMessage = err?.response?.data?.message || err?.message || '';
      const isDuplicateError = errorMessage.includes('unique result') || errorMessage.includes('NonUniqueResultException');
      const is404Error = errorStatus === 404;

      if (is404Error) {
        console.warn('⚠️ Endpoint not found (404). The mute/unmute API may not be available. Local state updated.');
      } else if (isDuplicateError) {
        console.warn('⚠️ Duplicate FCM tokens detected. Attempting to use userId-based endpoint...');
        // Try using userId-based endpoint if available
        try {
          const userIdEndpoint = `/notification/${isMuted ? 'mute' : 'unmute'}/applicant/${userId}`;
          // Authorization header is automatically added by apiClient interceptor
          await apiClient.put(userIdEndpoint, null);
          console.log('✅ Server mute state updated using userId endpoint');
        } catch (fallbackErr: any) {
          console.warn('⚠️ Fallback userId endpoint also failed. Local state updated but server sync may be incomplete:', fallbackErr?.response?.data || fallbackErr?.message);
        }
      } else {
        console.warn('⚠️ Failed to update server mute state. Local state updated:', errorMessage);
      }
    }
  };

  const handleNotificationToggle = async () => {
    const newMuted = !notificationsMuted;
    setNotificationsMuted(newMuted);
    await AsyncStorage.setItem('notificationsMuted', newMuted ? 'true' : 'false');
    await updateServerMute(newMuted);
  };

  const loadAllData = async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    // Only fetch if it's the first load or if enough time has passed
    if (hasLoadedRef.current && timeSinceLastFetch < FETCH_COOLDOWN) {
      console.log('⏭️ [PROFILE] Skipping API calls - recently fetched', {
        timeSinceLastFetch: Math.round(timeSinceLastFetch / 1000) + 's ago',
        cooldown: FETCH_COOLDOWN / 1000 + 's',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [PROFILE] Fetching all data...');
      await Promise.all([
        fetchCard(),
        fetchPhoto(),
        fetchSummary(),
        fetchPersonalDetails(),
        fetchEducation(),
        fetchProjects(),
        fetchSkills(),
        fetchSkillBadges(),
        probeResume(),
        loadNotificationState(),
        fetchScoreDetails(),
      ]);
      // Refresh personal name in UserContext after loading all data
      if (refreshPersonalName) {
        await refreshPersonalName();
      }
      hasLoadedRef.current = true;
      lastFetchTimeRef.current = Date.now();
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function that bypasses cooldown - used after successful updates
  const forceRefreshAllData = async () => {
    console.log('🔄 [PROFILE] Force refreshing all data after successful update...');
    // Reset cooldown to force immediate fetch
    lastFetchTimeRef.current = 0;
    hasLoadedRef.current = false;

    setLoading(true);
    try {
      await Promise.all([
        fetchCard(),
        fetchPhoto(),
        fetchSummary(),
        fetchPersonalDetails(),
        fetchEducation(),
        fetchProjects(),
        fetchSkills(),
        fetchSkillBadges(),
        probeResume(),
        loadNotificationState(),
        fetchScoreDetails(),
      ]);
      // Refresh personal name in UserContext after loading all data
      if (refreshPersonalName) {
        await refreshPersonalName();
      }
      // Refresh score after data update
      if (refreshScore) {
        await refreshScore();
      }
      hasLoadedRef.current = true;
      lastFetchTimeRef.current = Date.now();
      console.log('✅ [PROFILE] Force refresh completed successfully');
    } catch (error) {
      console.error('❌ [PROFILE] Error during force refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId && userToken) {
        loadAllData();
      }
    }, [userId, userToken]),
  );

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assests/Images/backgrounds/image.png')}
        style={styles.background}
      >
        <View style={styles.container}>
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navBackButton}
              >
                <MaterialIcon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.heading}>My Portfolio</Text>
              <View style={styles.navBackButtonPlaceholder} />
            </View>
          </View>

          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Card Skeleton */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.skeletonAvatarContainer}>
                  <View style={styles.skeletonAvatar} />
                </View>
                <View style={styles.headerInfo}>
                  <View style={styles.skeletonNameRow}>
                    <View style={styles.skeletonBadgeContainer}>
                      <View style={styles.skeletonBadge} />
                      <View style={styles.skeletonBadge} />
                    </View>
                    <View style={styles.skeletonEditButton} />
                  </View>
                  <View style={styles.skeletonName} />
                  <View style={styles.skeletonRole} />
                  <View style={styles.skeletonUpdated} />
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoSection}>
                <View style={styles.skeletonInfoRow} />
                <View style={styles.skeletonInfoRow} />
                <View style={styles.skeletonInfoRow} />
                <View style={styles.skeletonInfoRow} />
              </View>
              <View style={styles.skeletonScoreSection}>
                <View style={styles.skeletonScoreLabel} />
                <View style={styles.skeletonScoreValueContainer}>
                  <View style={styles.skeletonMedalsContainer}>
                    <View style={styles.skeletonBadgeMedal} />
                    <View style={styles.skeletonBadgeMedal} />
                  </View>
                  <View style={styles.skeletonScoreValue} />
                </View>
              </View>
              <View style={styles.skeletonProgressBar} />
            </View>

            {/* Resume Summary Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.skeletonCardTitle} />
                <View style={styles.skeletonEditButton} />
              </View>
              <View style={styles.skeletonSummaryText} />
              <View style={styles.skeletonSummaryText} />
              <View style={[styles.skeletonSummaryText, { width: '70%' }]} />
            </View>

            {/* Personal Details Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.skeletonCardTitle} />
                  <View style={[styles.skeletonCardSubtitle, { marginTop: 8 }]} />
                </View>
                <View style={styles.skeletonEditButton} />
              </View>
              <View style={styles.detailsGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.skeletonDetailInput} />
                ))}
                <View style={[styles.skeletonDetailInput, styles.span2]} />
                <View style={styles.skeletonDetailInput} />
              </View>
              <View style={styles.skeletonResumeContainer} />
            </View>

            {/* Education Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.skeletonCardTitle} />
                  <View style={[styles.skeletonCardSubtitle, { marginTop: 8 }]} />
                </View>
                <View style={styles.skeletonEditButton} />
              </View>
              <View style={styles.skeletonEducationSection}>
                <View style={styles.skeletonEducationRow} />
                <View style={styles.skeletonEducationRow} />
                <View style={styles.skeletonEducationRow} />
              </View>
            </View>

            {/* Project Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.skeletonCardTitle} />
                  <View style={[styles.skeletonCardSubtitle, { marginTop: 8 }]} />
                </View>
                <View style={styles.skeletonEditButton} />
              </View>
              <View style={styles.skeletonProjectContent}>
                <View style={styles.skeletonProjectRow} />
                <View style={styles.skeletonProjectRow} />
                <View style={styles.skeletonProjectRow} />
              </View>
            </View>

            {/* Key Skills Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.skeletonCardTitle} />
                <View style={styles.skeletonEditButton} />
              </View>
              <View style={[styles.skeletonCardSubtitle, { marginBottom: 12 }]} />
              <View style={styles.skeletonSkillsContainer}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.skeletonSkillBadge} />
                ))}
              </View>
            </View>

            {/* Skill Badges Card Skeleton */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.skeletonCardTitle} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesGrid}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.skeletonBadgeCard} />
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  if (!userId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to identify applicant.</Text>
      </View>
    );
  }

  const fullName = card?.name?.trim() || '—';
  const roleTitle = card?.role?.trim() || DEFAULT_CARD.role;
  const phoneText = card?.mobileNumber?.trim() || '—';
  const emailText = card?.email?.trim() || '—';
  const passOutText = card?.passYear ? `${card.passYear} passed out` : 'Passed out year not set';
  const locationText = card?.locationDisplay?.trim() || card?.address || '—';
  // Format lastUpdated date: "12-Dec-2025"
  const formatUpdatedDate = (timestamp: number | null): string => {
    if (!timestamp) return 'Not updated yet';

    try {
      const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not updated yet';
      }

      // Format as "12-Dec-2025"
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not updated yet';
    }
  };

  const updatedOnText = formatUpdatedDate(card?.lastUpdated || null);

  return (
    <ImageBackground
      source={require('../../assests/Images/backgrounds/image.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.navHeaderRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.navBackButton}
            >
              <MaterialIcon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.heading}>My Portfolio</Text>
            <View style={styles.navBackButtonPlaceholder} />
          </View>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={
                    imageSrc
                      ? { uri: imageSrc }
                      : require('../../assests/profile/profile.png')
                  }
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setImageModal(true)}>
                  <MaterialIcons name="camera-alt" size={16} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.headerInfo}>
                <View style={styles.nameRow}>
                  <View style={styles.nameAndBadges}>
                    <View style={styles.badgeContainer}>
                      {earnedBadges.map(badge => (
                        <Image
                          key={badge.name}
                          source={{
                            uri: `https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/badge-${badge.name}.png`,
                          }}
                          style={styles.badgeIcon}
                        />
                      ))}
                    </View>
                    <Text style={styles.name}>{fullName}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditBasicModal(true)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                    <FontAwesome name="pencil" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.role}>{roleTitle}</Text>
                <Text style={styles.updated}>Portfolio last updated – {updatedOnText}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Details</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={18} color="#9E9E9E" />
                <Text style={styles.infoText}>{phoneText}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={18} color="#9E9E9E" />
                <Text style={styles.infoText}>{emailText}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={18} color="#9E9E9E" />
                <Text style={styles.infoText}>{passOutText}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={18} color="#9E9E9E" />
                <Text style={styles.infoText}>{locationText}</Text>
              </View>
            </View>

            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Score</Text>
              <View style={styles.scoreValueContainer}>
                {(() => {
                  const currentScore = scoreDetails?.total_score || totalScore || card?.score || 0;
                  const currentLevel = scoreDetails?.level || 'Level 1';
                  const medals = [];

                  // Extract thresholds from badgeScores array
                  const getPoints = (badgeName: string) => {
                    return scoreDetails?.badgeScores?.find((b: any) => b.badge === badgeName.toUpperCase())?.points;
                  };

                  const bronzeThreshold = getPoints('BRONZE') || 200;
                  const silverThreshold = getPoints('SILVER') || 300;
                  const goldThreshold = getPoints('GOLD') || 500;

                  // If current_badge is NEWCOMER or similar, it might not be in the medals list
                  // We show medals based on the score thresholds or if the current_badge matches
                  const badgeName = scoreDetails?.current_badge?.toUpperCase();

                  if (currentScore >= bronzeThreshold) {
                    medals.push({
                      image: require('../../assests/Images/Medals/bronze.png'),
                      name: 'bronze',
                    });
                  }
                  if (currentScore >= silverThreshold) {
                    medals.push({
                      image: require('../../assests/Images/Medals/silver.png'),
                      name: 'silver',
                    });
                  }
                  if (currentScore >= goldThreshold) {
                    medals.push({
                      image: require('../../assests/Images/Medals/gold.png'),
                      name: 'gold',
                    });
                  }

                  return (
                    <>
                      {medals.length > 0 && (
                        <View style={styles.medalsContainer}>
                          {medals.map((medal, index) => (
                            <Image
                              key={`${medal.name}-${index}`}
                              source={medal.image}
                              style={styles.badgeMedal}
                            />
                          ))}
                        </View>
                      )}
                      <View style={styles.scoreLevelContainer}>
                        <Text style={styles.scoreValue}>{currentScore}</Text>
                        <Text style={styles.levelText}>{currentLevel}</Text>
                      </View>
                    </>
                  );
                })()}
              </View>

              <BadgeProgressBar
                dashboardScore={scoreDetails?.total_score || totalScore || card?.score || 0}
                scoreDetails={scoreDetails}
              />
            </View>
          </View>

          {/* Resume Summary Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Resume Summary <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.cardEditButton}
                onPress={() => setEditSummaryModal(true)}>
                <Text style={styles.cardEditButtonText}>Edit</Text>
                <FontAwesome name="pencil" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.summaryText, !summary && styles.placeholderText]}>
              {summary || 'Try adding a resume summary — it helps employers quickly understand your strengths, tech stack, and professional goals.'}
            </Text>
          </View>

          {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Personal Details <Text style={styles.required}>*</Text>
                </Text>

              </View>

              <TouchableOpacity
                style={styles.cardEditButton}
                onPress={() => setEditPersonalModal(true)}>
                <Text style={styles.cardEditButtonText}>Edit</Text>
                <FontAwesome name="pencil" size={12} color="#fff" />
              </TouchableOpacity>

            </View>
            <Text style={styles.cardSubtitle}>
              This information is important for employers to know you better
            </Text>
            <View style={styles.detailsGrid}>
              <TextInput
                style={[styles.detailInput, !personalDetails.fullName && styles.placeholderInput]}
                value={personalDetails.fullName || ''}
                placeholder="Enter full name"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.gender && styles.placeholderInput]}
                value={personalDetails.gender || ''}
                placeholder="Choose gender"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.email && styles.placeholderInput]}
                value={personalDetails.email || ''}
                placeholder="Enter email"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.phone && styles.placeholderInput]}
                value={personalDetails.phone || ''}
                placeholder="Enter phone number"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.dateOfBirth && styles.placeholderInput]}
                value={personalDetails.dateOfBirth || ''}
                placeholder="Date of birth"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.pincode && styles.placeholderInput]}
                value={personalDetails.pincode || ''}
                placeholder="PIN code"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
              <TextInput
                style={[styles.detailInput, styles.span2, !personalDetails.address && styles.placeholderInput]}
                value={personalDetails.address || ''}
                placeholder="Permanent address"
                placeholderTextColor="#9ca3af"
                editable={false}
                multiline
              />
              <TextInput
                style={[styles.detailInput, !personalDetails.knownLanguages && styles.placeholderInput]}
                value={Array.isArray(personalDetails.knownLanguages) ? personalDetails.knownLanguages.join(', ') : ''}
                placeholder="Known Language"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
            </View>
            <View style={styles.resumeContainer}>
              <TouchableOpacity style={styles.resumeDrop} onPress={() => setResumeModal(true)}>
                <View style={styles.resumeDropInner}>
                  <View style={styles.resumePill}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.resumePillText}>Resume upload</Text>
                  </View>
                  <Text style={styles.resumeNote}>Supported formats: pdf</Text>
                </View>
              </TouchableOpacity>

              {resumeAvailable && (
                <TouchableOpacity
                  style={styles.viewResumeButtonPage}
                  onPress={() => setResumeViewerModal(true)}
                >
                  <MaterialIcons name="description" size={20} color="#F97316" />
                  <Text style={styles.viewResumeButtonText}>View Current</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Education Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>
                  Education Details <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.cardSubtitle}>
                  Details like course, university, and more, help recruiters identify your educational background
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cardEditButton}
                onPress={() => setEditEducationModal(true)}>
                <Text style={styles.cardEditButtonText}>Edit</Text>
                <FontAwesome name="pencil" size={12} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Graduation */}
            {education.graduation && Object.keys(education.graduation).length > 0 && (
              <View style={styles.educationSection}>
                <Text style={styles.educationSectionTitle}>Graduation</Text>
                {education.graduation.degree && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Degree:</Text>
                    <Text style={styles.educationValue}>{education.graduation.degree}</Text>
                  </View>
                )}
                {education.graduation.university && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>University:</Text>
                    <Text style={styles.educationValue}>{education.graduation.university}</Text>
                  </View>
                )}
                {education.graduation.course && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Course:</Text>
                    <Text style={styles.educationValue}>{education.graduation.course}</Text>
                  </View>
                )}
                {education.graduation.specialization && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Specialization:</Text>
                    <Text style={styles.educationValue}>{education.graduation.specialization}</Text>
                  </View>
                )}
                {education.graduation.courseType && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Course Type:</Text>
                    <Text style={styles.educationValue}>{education.graduation.courseType}</Text>
                  </View>
                )}
                {(education.graduation.startYear || education.graduation.endYear) && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Duration:</Text>
                    <Text style={styles.educationValue}>
                      {education.graduation.startYear || '—'} - {education.graduation.endYear || '—'}
                    </Text>
                  </View>
                )}
                {education.graduation.marksPercent && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Percentage:</Text>
                    <Text style={styles.educationValue}>
                      {typeof education.graduation.marksPercent === 'number'
                        ? `${education.graduation.marksPercent}%`
                        : `${education.graduation.marksPercent}%`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Class XII */}
            {education.classXii && Object.keys(education.classXii).length > 0 && (
              <View style={styles.educationSection}>
                <Text style={styles.educationSectionTitle}>Class XII</Text>
                {education.classXii.board && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Board:</Text>
                    <Text style={styles.educationValue}>{education.classXii.board}</Text>
                  </View>
                )}
                {education.classXii.passingYear && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Passing Year:</Text>
                    <Text style={styles.educationValue}>{education.classXii.passingYear}</Text>
                  </View>
                )}
                {education.classXii.marksPercent && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Marks:</Text>
                    <Text style={styles.educationValue}>{education.classXii.marksPercent}%</Text>
                  </View>
                )}
              </View>
            )}

            {/* Class X */}
            {education.classX && Object.keys(education.classX).length > 0 && (
              <View style={styles.educationSection}>
                <Text style={styles.educationSectionTitle}>Class X</Text>
                {education.classX.board && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Board:</Text>
                    <Text style={styles.educationValue}>{education.classX.board}</Text>
                  </View>
                )}
                {education.classX.passingYear && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Passing Year:</Text>
                    <Text style={styles.educationValue}>{education.classX.passingYear}</Text>
                  </View>
                )}
                {education.classX.marksPercent && (
                  <View style={styles.educationRow}>
                    <Text style={styles.educationLabel}>Marks:</Text>
                    <Text style={styles.educationValue}>{education.classX.marksPercent}%</Text>
                  </View>
                )}
              </View>
            )}

            {(!education.graduation || Object.keys(education.graduation).length === 0) &&
              (!education.classXii || Object.keys(education.classXii).length === 0) &&
              (!education.classX || Object.keys(education.classX).length === 0) && (
                <Text style={styles.placeholderText}>No education details added yet</Text>
              )}
          </View>

          {/* Project Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>
                  Project Details <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.cardSubtitle}>
                  Stand out for employers by adding details about projects you have done in college, internships, or at work
                </Text>
              </View>
              {projects.length < 3 && (
                <TouchableOpacity
                  style={styles.cardEditButton}
                  onPress={() => {
                    setSelectedProject(null);
                    setEditProjectModal(true);
                  }}>
                  <Text style={styles.cardEditButtonText}>Add</Text>
                  <MaterialIcons name="add" size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {projects.length > 0 ? (
              <View style={styles.projectContent}>
                {projects.map((proj, index) => (
                  <View key={proj.id || proj.projectId || index} style={[
                    styles.projectItem,
                    index > 0 && styles.projectItemBorder
                  ]}>
                    <View style={styles.projectHeaderRow}>
                      <Text style={styles.projectTitleText}>
                        {proj.projectTitle || 'Untitled Project'}
                      </Text>
                      <View style={styles.projectActions}>
                        <TouchableOpacity
                          style={styles.projectActionButton}
                          onPress={() => {
                            setSelectedProject(proj);
                            setEditProjectModal(true);
                          }}>
                          <FontAwesome name="pencil" size={16} color="#F97316" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.projectActionButton}
                          onPress={() => handleDeleteProject(proj.id || proj.projectId)}>
                          <MaterialIcons name="delete" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {proj.specialization && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Specialization:</Text>
                        <Text style={styles.projectValue}>{proj.specialization}</Text>
                      </View>
                    )}

                    {proj.technologiesUsed && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Technologies:</Text>
                        <View style={styles.projectChips}>
                          {proj.technologiesUsed.split(',').map((tech: string, idx: number) => (
                            <View key={idx} style={styles.projectChip}>
                              <Text style={styles.projectChipText}>{tech.trim()}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {proj.teamSize && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Team Size:</Text>
                        <Text style={styles.projectValue}>{proj.teamSize} members</Text>
                      </View>
                    )}

                    {proj.roleInProject && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Your Role:</Text>
                        <Text style={styles.projectValue}>{proj.roleInProject}</Text>
                      </View>
                    )}

                    {proj.roleDescription && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Role Description:</Text>
                        <Text style={styles.projectValue}>{proj.roleDescription}</Text>
                      </View>
                    )}

                    {proj.projectDescription && (
                      <View style={styles.projectRow}>
                        <Text style={styles.projectLabel}>Description:</Text>
                        <Text style={styles.projectValue}>{proj.projectDescription}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>No project details added yet</Text>
            )}
          </View>

          {/* Key Skills Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Key Skills <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.cardEditButton}
                onPress={() => setEditSkillsModal(true)}>
                <Text style={styles.cardEditButtonText}>Edit</Text>
                <FontAwesome name="pencil"
                  size={12} color="#fff" />
              </TouchableOpacity>
            </View>
            {/* <Text style={[styles.cardSubtitle, { marginBottom: 12 }]}>
              Add skills that best define your expertise (e.g., Java, React, SQL). Minimum 1.
            </Text> */}
            {skills.length > 0 ? (
              <View style={styles.skillsList}>
                {skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                No skills added yet. Click Edit to add your first skill.
              </Text>
            )}
          </View>

          {/* Skill Badges Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Skill Badges</Text>
            </View>
            {skillBadges.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesGrid}
              >
                {skillBadges.map((badge, index) => {
                  const skillName = badge.skillBadge?.name || 'Unknown';
                  const status = (badge.status || '').toUpperCase();
                  const skillImageMap: Record<string, string> = {
                    Angular: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Angular.png',
                    Java: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java.png',
                    C: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/C.png',
                    'C++': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CPlusPlus.png',
                    'C Sharp': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CSharp.png',
                    CSS: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/CSS.png',
                    Django: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Django.png',
                    '.Net': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/DotNet.png',
                    Flask: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Flask.png',
                    Hibernate: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Hibernate.png',
                    HTML: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/HTML.png',
                    JavaScript: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/JavaScript.png',
                    JSP: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/JSP.png',
                    'Manual Testing': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/ManualTesting.png',
                    'Mongo DB': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MongoDB.png',
                    Python: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Python.png',
                    React: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/React.png',
                    'Regression Testing': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/RegressionTesting.png',
                    Selenium: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Selenium.png',
                    Servlets: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Servlets.png',
                    'Spring Boot': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/SpringBoot.png',
                    TypeScript: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Java.png',
                    Spring: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Spring.png',
                    SQL: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MySQL.png',
                    MySQL: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/MySQL.png',
                    Vue: 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/Vue.png',
                    'SQL-Server': 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/sqlserver.png',
                  };
                  const imageUri = skillImageMap[skillName] || 'https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/NotFound.png';

                  return (
                    <View key={index} style={styles.badgeCard}>
                      <Image source={{ uri: imageUri }} style={styles.badgeImage} />
                      <Text style={styles.badgeCardText} numberOfLines={2}>
                        {skillName}
                      </Text>
                      <View
                        style={[
                          styles.badgeStatus,
                          status === 'PASSED'
                            ? styles.badgeStatusPassed
                            : styles.badgeStatusFailed,
                        ]}>
                        <Text style={[
                          styles.badgeStatusText,
                          status === 'PASSED' ? { color: '#155724' } : { color: '#721c24' }
                        ]}>{status}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Image
                  source={require('../../assests/Images/Skillbadge/emptyimage.png')}
                  style={styles.emptyStateImage}
                />
                <Text style={styles.placeholderText}>Attend the skill test to get new badges </Text>
                <TouchableOpacity onPress={() => navigation.navigate('BottomTab', { screen: 'Badges' })}>
                  <Text style={styles.placeholderSkillValidation}>Skill Validation</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Edit Modals */}
          <EditBasicDetailsModal
            visible={editBasicModal}
            onClose={() => setEditBasicModal(false)}
            onSuccess={async () => {
              // Force refresh to get newly updated data
              await forceRefreshAllData();
            }}
            userId={userId!}
            userToken={userToken!}
            initialData={{
              name: card.name,
              role: card.role,
              mobileNumber: card.mobileNumber,
              email: card.email,
              passYear: card.passYear,
              address: card.address,
            }}
          />

          <EditSummaryModal
            visible={editSummaryModal}
            onClose={() => setEditSummaryModal(false)}
            onSuccess={forceRefreshAllData}
            userId={userId!}
            userToken={userToken!}
            initialSummary={summary}
          />

          <EditPersonalDetailsModal
            visible={editPersonalModal}
            onClose={() => setEditPersonalModal(false)}
            onSuccess={async () => {
              // Force refresh to get newly updated data
              await forceRefreshAllData();
            }}
            userId={userId!}
            userToken={userToken!}
            initialData={personalDetails}
          />

          <EditSkillsModal
            visible={editSkillsModal}
            onClose={() => setEditSkillsModal(false)}
            onSuccess={forceRefreshAllData}
            userId={userId!}
            userToken={userToken!}
            initialSkills={skills}
          />

          <EditEducationModal
            visible={editEducationModal}
            onClose={() => setEditEducationModal(false)}
            onSuccess={forceRefreshAllData}
            userId={userId!}
            userToken={userToken!}
            initialData={education}
          />

          <EditProjectModal
            visible={editProjectModal}
            onClose={() => {
              setEditProjectModal(false);
              setSelectedProject(null);
            }}
            onSuccess={forceRefreshAllData}
            userId={userId!}
            userToken={userToken!}
            initialData={selectedProject}
          />

          <DeleteProjectModal
            visible={deleteProjectModalVisible}
            onCancel={() => {
              setDeleteProjectModalVisible(false);
              setProjectToDeleteId(null);
            }}
            onDelete={confirmDeleteProject}
          />



          <ImageUploadModal
            visible={imageModal}
            onClose={() => setImageModal(false)}
            onSuccess={forceRefreshAllData}
            userId={userId!}
            userToken={userToken!}
          />

          <ResumeUploadModal
            visible={resumeModal}
            onClose={() => setResumeModal(false)}
            onSuccess={async () => {
              console.log('[Profile] Resume upload success - refreshing all data including summary');
              // Force refresh to get newly updated data including resume status and summary
              await forceRefreshAllData();
              // Explicitly fetch summary again after a short delay to ensure it's updated
              setTimeout(async () => {
                console.log('[Profile] Explicitly refreshing summary after resume upload');
                await fetchSummary();
              }, 1000);
            }}
            userId={userId!}
            userToken={userToken!}
            resumeAvailable={resumeAvailable}
            onViewResume={() => {
              setResumeModal(false);
              setResumeViewerModal(true);
            }}
          />

          <ResumeViewerModal
            visible={resumeViewerModal}
            onClose={() => setResumeViewerModal(false)}
            userId={userId!}
            userToken={userToken!}
          />

          {/* Settings and Notifications Section */}
          <View style={styles.settingsSection}>
            {/* <View style={styles.settingsButtonWrapper}>
              <SettingsButton />
            </View> */}

            <TouchableOpacity
              style={[styles.actionButton, styles.notificationButton, notificationsMuted && styles.notificationButtonMuted]}
              onPress={handleNotificationToggle}>
              <MaterialIcons
                name={notificationsMuted ? "notifications-off" : "notifications"}
                size={isTablet ? wp('5%') : wp('6%')}
                color={notificationsMuted ? "#9ca3af" : "#F97316"}
              />
              <Text style={[styles.actionButtonText, notificationsMuted && styles.mutedText]}>
                {notificationsMuted ? 'Notifications Disabled' : 'Notifications Enabled'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBackButton: {
    padding: 4,
  },
  navBackButtonPlaceholder: {
    width: 32,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  // Skeleton Loading Styles
  skeletonAvatarContainer: {
    marginRight: 16,
  },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e0e0',
  },
  skeletonNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonBadgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  skeletonBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  skeletonEditButton: {
    width: 60,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  skeletonName: {
    width: '70%',
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 6,
  },
  skeletonRole: {
    width: '50%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 6,
  },
  skeletonUpdated: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonInfoRow: {
    height: 18,
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  skeletonScoreSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  skeletonScoreLabel: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  skeletonScoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  skeletonMedalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  skeletonBadgeMedal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    marginLeft: 4,
  },
  skeletonScoreValue: {
    width: 80,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonProgressBar: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginTop: 16,
  },
  skeletonCardTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonCardSubtitle: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  skeletonSummaryText: {
    height: 16,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  skeletonDetailInput: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  skeletonResumeContainer: {
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginTop: 12,
  },
  skeletonEducationSection: {
    marginTop: 16,
  },
  skeletonEducationRow: {
    height: 18,
    width: '85%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  skeletonProjectContent: {
    marginTop: 16,
  },
  skeletonProjectRow: {
    height: 18,
    width: '90%',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  skeletonSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  skeletonSkillBadge: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  skeletonBadgeCard: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F4E7D6',
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFE2C4',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeIcon: {
    width: 20,
    height: 30,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nameAndBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1B1B1B',
  },
  role: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F97316',
    marginBottom: 4,
  },
  updated: {
    fontSize: 12,
    color: '#737373',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EDEDED',
    marginVertical: 16,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1b1b1b',
  },
  infoSection: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#737373',
    fontFamily: 'PlusJakartaSans-Medium',
    marginBottom: 2,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4, // Prevent bottom cutting
  },
  medalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeMedal: {
    width: 32,
    height: 32,
    marginLeft: 6,
    resizeMode: 'contain',
  },
  scoreValue: {
    fontSize: 44,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#D26B15',
    lineHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scoreLevelContainer: {
    alignItems: 'flex-end',
  },
  levelText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#D26B15',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',       // FIX #1 — Centers both sides vertically
    marginBottom: 8,
  },

  cardHeaderLeft: {
    flex: 1,                    // FIX #2 — Prevents right button from shifting out
    paddingRight: 10,           // FIX #3 — Avoids overlap with Edit button
  },

  cardTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1b1b1b',
  },
  required: {
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7a7a7a',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },
  educationSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  educationSectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
    marginBottom: 12,
  },
  educationRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  educationLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    minWidth: 100,
  },
  educationValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
    flex: 1,
  },
  projectContent: {
    gap: 12,
  },
  projectRow: {
    marginBottom: 12,
  },
  projectLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
    marginBottom: 4,
  },
  projectValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  projectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  projectChip: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  projectChipText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D26B15',
  },
  badgeImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
    borderRadius: 8,
  },
  cardEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  cardEditButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  summaryText: {
    fontSize: 14,
    color: '#3b3b3b',
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  placeholderSkillValidation: {
    fontSize: 14,
    color: '#e98d0cff',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  detailsGrid: {
    gap: 12,
  },
  detailInput: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  placeholderInput: {
    color: '#9ca3af',
  },
  span2: {
    minHeight: 80,
  },
  resumeContainer: {
    marginTop: 14,
    gap: 12,
  },
  resumeDrop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F4A66A',
    backgroundColor: '#FFF7F0',
    borderRadius: 12,
    padding: 22,
  },
  viewResumeButtonPage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#FFF7F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE2C4',
  },
  viewResumeButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#F97316',
  },
  resumeDropInner: {
    alignItems: 'center',
  },
  resumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  resumePillText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  resumeNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#8c8c8c',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  viewResumeButton: {
    marginTop: 8,
    backgroundColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewResumeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillChipText: {
    color: '#D26B15',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  badgesGrid: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingRight: 16,
  },
  badgeCard: {
    width: 120,
    marginRight: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  projectItem: {
    paddingVertical: 12,
  },
  projectItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitleText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1B1B1B',
    flex: 1,
    marginRight: 8,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectActionButton: {
    padding: 4,
  },

  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  badgeCardText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#1b1b1b',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeStatusPassed: {
    backgroundColor: '#D4EDDA',
  },
  badgeStatusFailed: {
    backgroundColor: '#F8D7DA',
  },
  badgeStatusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  settingsSection: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginHorizontal: wp('3%'),
    marginBottom: hp('1%'),
    marginTop: hp('1.5%'),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFE2C4',
    borderRadius: 12,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  settingsButton: {
    // Styles for settings button container
  },
  settingsButtonWrapper: {
    flex: 1,
    margin: 0,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationButtonMuted: {
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5E5',
  },
  actionButtonText: {
    fontSize: wp('3.2%'),
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  mutedText: {
    color: '#9ca3af',
  },
});

export default Profile;
