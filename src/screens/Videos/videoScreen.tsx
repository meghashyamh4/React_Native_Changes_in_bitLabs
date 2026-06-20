
import React, { useEffect, useRef, useState, useMemo, memo, useContext } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Pressable,
  Animated,
  ImageBackground,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Video from "react-native-video";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Keychain from "react-native-keychain";
import videoService from "@services/Videos/videoService";
import { showToast } from "@services/login/ToastService";
import UserContext from "@context/UserContext";
import Slider from '@react-native-community/slider';
import { trackAnalyticsEvent } from "@services/Analytics/AnalyticsService";
import ProgressBar from "@components/progessBar/ProgressBar";

const { getRecommendedVideos, trackVideoWatch } = videoService;

const PROGRESS_UPDATE_INTERVAL = 250;

const FAVICON_IMAGE = require("../../assests/Images/favicon.png");
const BG_IMAGE = require("../../assests/Images/backgrounds/image.png");
const SEARCH_PLACEHOLDER = require("../../assests/Images/Search/Search.png");

interface VideoItem {
  videoId: number;
  title: string;
  s3url: string;
  thumbnail_url: string;
  isWatched?: boolean;
  watched?: boolean;
  watchedStatus?: boolean;
}

/* ===========================
   VIDEO CARD
=========================== */
const VideoCardItem = memo<{ item: VideoItem; onPress: (url: string) => void }>(
  ({ item, onPress }) => {
    const thumbnailSource = useMemo(() => {
      if (item?.thumbnail_url?.startsWith("http")) {
        return { uri: item.thumbnail_url };
      }
      return FAVICON_IMAGE;
    }, [item?.thumbnail_url]);

    return (
      <View style={styles.card}>
        <Pressable onPress={() => onPress(item.s3url)}>
          <Image source={thumbnailSource} style={styles.thumbnail} />
          <View style={styles.playIconContainer}>
            <Icon name="play-circle" size={64} color="#F97316" />
          </View>
        </Pressable>
        <View style={styles.titleRow}>
          <Image style={styles.avatar} source={FAVICON_IMAGE} />
          <Text numberOfLines={2} style={styles.caption}>
            {item.title}
          </Text>
        </View>
      </View>
    );
  }
);

/* ===========================
   MAIN SCREEN
=========================== */
const VerifiedVideosScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const { refreshScore } = useContext(UserContext);

  const [userId, setUserId] = useState<number | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filtered, setFiltered] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [fsVisible, setFsVisible] = useState(false);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const isSeekingRef = useRef(false);
  const currentTimeRef = useRef(0);

  const videoSource = useMemo(() => {
    return currentUrl ? { uri: currentUrl } : null;
  }, [currentUrl]);

  const videoRef = useRef<any>();
  const videoTrackedRef = useRef<string | null>(null);

  const fsScale = useRef(new Animated.Value(0.9)).current;
  const fsOpacity = useRef(new Animated.Value(0)).current;

  /* ===========================
     FETCH AUTH
  =========================== */
  useEffect(() => {
    const loadAuth = async () => {
      const userDetails = await Keychain.getGenericPassword({ service: "userDetails" });
      const authToken = await Keychain.getGenericPassword({ service: "authToken" });
      if (userDetails && authToken) {
        const parsed = JSON.parse(userDetails.password);
        setUserId(parsed.id);
        setUserToken(authToken.password);
      }
    };
    loadAuth();
  }, []);

  /* ===========================
     FETCH VIDEOS
  =========================== */
  useEffect(() => {
    const fetchVideos = async () => {
      if (!userId || !userToken) return;

      try {
        const result = await getRecommendedVideos(userId, userToken);
        const sorted = result.sort((a: any, b: any) => {
          const aWatched = a.isWatched || a.watched || a.watchedStatus;
          const bWatched = b.isWatched || b.watched || b.watchedStatus;
          return aWatched === bWatched ? 0 : aWatched ? 1 : -1;
        });

        setVideos(sorted);
        setFiltered(sorted);
        console.log("📊 [Analytics] Tracking MOBILE-SHORTS event on load for user:", userId);
        trackAnalyticsEvent("MOBILE-SHORTS", userId);
      } catch {
        showToast("error", "Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userId, userToken]);


  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      setFiltered(videos);
    } else {
      setFiltered(
        videos.filter((v) =>
          v.title.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
    if (userId) {
      console.log("📊 [Analytics] Tracking MOBILE-SHORTS event on search for user:", userId);
      trackAnalyticsEvent("MOBILE-SHORTS", userId);
    }
  };


  const openVideo = (url: string) => {
    videoTrackedRef.current = null;
    setCurrentUrl(url);
    setPaused(false);
    setMuted(false);
    setFsVisible(true);

    if (userId) {
      console.log("📊 [Analytics] Tracking MOBILE-SHORTS event on video play for user:", userId);
      trackAnalyticsEvent("MOBILE-SHORTS", userId);
    }

    Animated.parallel([
      Animated.timing(fsScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fsOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeVideo = () => {
    setPaused(true);
    setFsVisible(false);
    setCurrentUrl(null);
  };

  /* ===========================
     TRACK 70%
  =========================== */
  const handleProgress = (p: any) => {
    setCurrentTime(p.currentTime);

    if (!duration) return;

    const percent = (p.currentTime / duration) * 100;
    if (percent >= 70 && videoTrackedRef.current !== currentUrl) {
      videoTrackedRef.current = currentUrl;

      if (userId && userToken && currentUrl) {
        const matched = videos.find((v) => v.s3url === currentUrl);
        if (matched) {
          trackVideoWatch(userId, matched.videoId, userToken);
          console.log("📊 [Analytics] Tracking MOBILE-SHORTS event on video watch for user:", userId);

          refreshScore?.();
        }
      }
    }
  };

  /* ===========================
      Video Controllers
   =========================== */
  //   const seekBackward = () => {
  //     const liveTime = progress?.currentTime || 0;
  //   const newTime = Math.max(liveTime - 10,0);
  //   videoRef.current?.seek(newTime);
  //   setCurrentTime(newTime);
  //   currentTimeRef.current = newTime;
  // };

  // const seekForward = () => {
  //   const liveTime = progress?.currentTime || 0;
  //   const newTime = Math.min(liveTime + 10,duration);
  //   videoRef.current?.seek(newTime);
  //   setCurrentTime(newTime);
  //   currentTimeRef.current = newTime;

  // };

  //  const onSeek = (value : number) => {
  //     setIsSeeking(false);
  //     videoRef.current?.seek(value);
  //     setCurrentTime(value);
  //   };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };





  /* ===========================
     RENDER
  =========================== */
  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#F97316" />
        ) : (
          <>
            {/* Header with Back + Title - Centered like Tech Vibes */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Tech Buzz Shorts</Text>
                <View style={styles.backButtonPlaceholder} />
              </View>
            </View>

            {/* Search Bar - Refined style */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Tech Buzz Shorts..."
                  placeholderTextColor="#888"
                  value={searchText}
                  onChangeText={handleSearch}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleSearch("")}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#888" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(i) => `${i.videoId}`}
              renderItem={({ item }) => (
                <VideoCardItem item={item} onPress={openVideo} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
              ListEmptyComponent={() => {
                if (loading) return null;

                if (searchText.trim() !== "") {
                  // No results found for search
                  return (
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
                      <View style={styles.emptySearchContainer}>
                        <Image
                          source={SEARCH_PLACEHOLDER}
                          style={styles.emptySearchImage}
                        />
                        <Text style={styles.emptySearchTitle}>No shorts found</Text>
                        <Text style={styles.emptySearchMessage}>
                          We couldn't find any shorts matching "{searchText}"
                        </Text>
                        <Text style={styles.emptySearchHint}>
                          Try searching with different keywords
                        </Text>
                      </View>
                    </ScrollView>
                  );
                }

                // No shorts at all
                return (
                  <View style={styles.emptyContainer}>
                    <Image
                      source={SEARCH_PLACEHOLDER}
                      style={styles.emptySearchImage}
                    />
                    <Text style={styles.emptyTitle}>No Tech Buzz Shorts available</Text>
                    <Text style={styles.emptyMessage}>
                      No Tech Buzz Shorts available right now.
                    </Text>
                  </View>
                );
              }}
            />
          </>
        )}

        {/* FULLSCREEN VIDEO */}
        <Modal visible={fsVisible} transparent={false} animationType="fade">
          <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
            <Animated.View
              style={{
                flex: 1,
                opacity: fsOpacity,
                transform: [{ scale: fsScale }],
              }}
            >
              {videoSource && (
                <Video
                  ref={videoRef}
                  source={videoSource}
                  style={{ flex: 1 }}
                  resizeMode="contain"
                  paused={paused}
                  muted={muted}
                  onLoad={(d) => {
                    setDuration(d.duration)
                  }}
                  onProgress={(x: any) => {
                    { handleProgress(x) }
                    // Sync check with ref to prevent flickering during/after seek
                    if (isSeekingRef.current) return;

                    // Update duration if we get a valid one
                    if (x.seekableDuration > 0 && x.seekableDuration < 1e9 && x.seekableDuration !== duration) {
                      setDuration(x.seekableDuration);

                    }

                    const time = Math.max(0, x.currentTime || 0);
                    // Update digital timer ONLY if not seeking to prevent flicker
                    if (!isSeekingRef.current) {
                      setCurrentTime(time);
                      setProgress(time);
                      currentTimeRef.current = time;
                    }
                  }}
                  progressUpdateInterval={PROGRESS_UPDATE_INTERVAL}
                />
              )}

              {/* Pause overlay with slight blur/dim effect */}
              {paused && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                  <Icon name="pause-circle-filled" size={80} color="rgba(255,255,255,0.8)" />
                </View>
              )}

              <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused(!paused)} />

              <View style={styles.fsControls}>
                <TouchableOpacity onPress={closeVideo} style={styles.fsCloseBtn}>
                  <Icon name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setMuted(!muted); }} style={styles.fsCloseBtn}>
                  <Icon
                    name={muted ? "volume-off" : "volume-up"}
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>


                {/* <TouchableOpacity onPress={seekBackward}>
                    <Icon name="replay-10" size={35} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={seekForward}>
                    <Icon name="forward-10" size={35} color="#fff" />
                </TouchableOpacity>  */}
              </View>
              <View style={styles.buttomSlider}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>

                <Slider
                  style={{ flex: 1, marginLeft: 12, height: 40 }}
                  minimumValue={0}
                  maximumValue={Math.max(duration, 1)}
                  value={isSeeking ? undefined : progress} // Uncontrolled while seeking
                  minimumTrackTintColor="#F97316"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#fff"
                  onSlidingStart={() => {
                    isSeekingRef.current = true;
                    setIsSeeking(true);
                  }}
                  onValueChange={(val) => {
                    // Update digital timer text in real-time
                    setCurrentTime(val);
                  }}
                  onSlidingComplete={(val) => {
                    videoRef.current?.seek(val);
                    setCurrentTime(val);
                    setProgress(val);

                    // Delay unlocking to ensure player has seeked
                    setTimeout(() => {
                      isSeekingRef.current = false;
                      setIsSeeking(false);
                    }, 600);
                  }}
                />
              </View>
            </Animated.View>
          </SafeAreaView>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default VerifiedVideosScreen;

/* ===========================
   STYLES
=========================== */
const styles = StyleSheet.create({
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 32,
  },
  screenTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  heading: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    fontFamily: "PlusJakartaSans-Medium",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  card: {
    width: "92%",
    alignSelf: "center",
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  playIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  titleRow: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  caption: {
    marginLeft: 12,
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
  },
  fsControls: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fsCloseBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  // Empty State Styles
  emptySearchContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptySearchImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
    resizeMode: "contain",
  },
  emptySearchTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySearchMessage: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 22,
  },
  emptySearchHint: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#9CA3AF",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#6B7280",
    textAlign: "center",
  },
  slider: {
    width: '95%',
    alignSelf: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: "PlusJakartaSans-Bold",
  },
  buttomSlider: {
    position: 'absolute',
    bottom: 55,
    width: '95%',
    alignSelf: 'center',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

});
