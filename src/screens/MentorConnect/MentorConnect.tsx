import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  ImageBackground,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "@context/Authcontext";
import apiClient from "@services/login/ApiClient";
import { Image } from "react-native";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@models/Model";
import { getAllRegisteredMeetings, registerForMeeting, getMeetingById } from "@services/MentorConnectService";
import { showToast } from "@services/login/ToastService";
import { trackAnalyticsEvent } from "@services/Analytics/AnalyticsService";

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const { width } = Dimensions.get("window");

const NoMentorConnectsImage = require("../../assests/Images/mentorconnect/NoMentorConnects.png");

type MentorConnectRouteProp = RouteProp<RootStackParamList, 'MentorConnect'>;

type Meeting = {
  meetingId?: number;
  meeting_id?: number;
  id?: number;
  mentorName?: string;
  mentor_name?: string;
  title?: string;
  description?: string;
  date?: number[];
  startTime?: number[];
  start_time?: number[];
  durationMinutes?: number;
  duration?: number;
  meetLink?: string;
  meet_link?: string;
  bannerImageUrl?: string;
  banner_image_url?: string;
};

const MentorConnect: React.FC = () => {
  const route = useRoute<MentorConnectRouteProp>();
  const targetMeetingId = route.params?.meetingId;
  console.log('📱 [MENTOR CONNECT] Initial targetMeetingId:', targetMeetingId);
  const [loading, setLoading] = useState(true);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [displayedMeetings, setDisplayedMeetings] = useState<Meeting[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userToken, userId } = useAuth();
  const [registeredMeetingIds, setRegisteredMeetingIds] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigation = useNavigation<any>();
  const flatListRef = React.useRef<FlatList<Meeting>>(null);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const PAGE_SIZE = 10; // Display 10 meetings at a time

  // Update currentTime every minute to refresh status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Utility functions (moved before useEffects to be accessible)
  // Build date in local time to avoid UTC shifts (matching web version)
  const buildStartDate = (dateArr?: number[], timeArr?: number[]) => {
    if (!Array.isArray(dateArr) || dateArr.length < 3) return null;
    const [y, m, d] = dateArr;
    const hh = Array.isArray(timeArr) ? (timeArr[0] ?? 0) : 0;
    const mm = Array.isArray(timeArr) ? (timeArr[1] ?? 0) : 0;
    // Build directly to avoid rollover issues when today is 29th/30th/31st
    const dt = new Date(y, (m ?? 1) - 1, d, hh, mm, 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Compute status: "Active", "Upcoming", or "Expired" (matching web version)
  const computeStatus = (item: Meeting): "Active" | "Upcoming" | "Expired" => {
    const start = buildStartDate(item.date, item.startTime ?? item.start_time);
    if (!start) return "Expired";

    const mins = Number(item.durationMinutes ?? item.duration ?? 60) || 60;
    const end = new Date(start.getTime() + mins * 60000);
    const now = new Date();

    // Enable Start button 10 minutes before actual start time
    const bufferMins = 10;
    const startWithBuffer = new Date(start.getTime() - bufferMins * 60000);

    // Treat exact start time (with buffer) as Active (>= startWithBuffer && < end)
    if (now >= startWithBuffer && now < end) return "Active";
    if (now < startWithBuffer) return "Upcoming";
    return "Expired";
  };

  // Fetch meetings function - extracted to be reusable
  const fetchMeetings = React.useCallback(async () => {
    if (!userToken) return;

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching mentor meetings...");

      // ✅ ALWAYS fetch meetings first
      const resp = await apiClient.get("/api/mentor-connect/getAllMeetings");

      const payload = resp.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      console.log("✅ Meetings received:", list.length);
      setAllMeetings(list);

      // ✅ Fetch registration separately (DO NOT BLOCK UI)
      if (userId) {
        try {
          const registeredResp = await getAllRegisteredMeetings(Number(userId));
          console.log("📊 [MENTOR CONNECT] Raw registered meetings response:", JSON.stringify(registeredResp));

          const ids = new Set<number>();

          if (Array.isArray(registeredResp)) {
            registeredResp.forEach((m: any) => {
              const id = m.mentorConnectId ?? m.meetingId ?? m.id;
              if (id) ids.add(Number(id));
            });
          } else if (registeredResp && typeof registeredResp === 'object') {
            // Handle specific format: {"Registered Mentor connect Ids": [6, 7]}
            // Also look for any key that might contain the IDs array
            const keys = Object.keys(registeredResp);
            const idKey = keys.find(k => k.toLowerCase().includes("id") && Array.isArray((registeredResp as any)[k]));

            const idList = idKey ? (registeredResp as any)[idKey] : null;
            if (Array.isArray(idList)) {
              idList.forEach((id: any) => ids.add(Number(id)));
            } else {
              console.log("⚠️ [MENTOR CONNECT] No ID array found in object keys:", keys);
            }
          } else if (typeof registeredResp === 'string') {
            // Handle case where API might return a raw string like "Registered Mentor connect Ids: [6, 7]"
            console.log("📝 [MENTOR CONNECT] Registration data is a string, attempting to parse...");
            const match = registeredResp.match(/\[(.*?)\]/);
            if (match && match[1]) {
              match[1].split(',').forEach(s => {
                const id = Number(s.trim());
                if (!isNaN(id)) ids.add(id);
              });
            }
          }

          setRegisteredMeetingIds(ids);
          console.log("✅ Registered meeting IDs:", [...ids]);
        } catch (regErr) {
          console.warn("⚠️ Registration API failed, continuing without registration data", regErr);
          setRegisteredMeetingIds(new Set());
        }
      }

    } catch (err) {
      console.error("❌ Meetings API failed:", err);
      setError("Failed to load mentor sessions");
    } finally {
      setLoading(false);
    }
  }, [userToken, userId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("📱 [MENTOR CONNECT] Screen focused - refreshing data...");
      fetchMeetings();
      // Clear search when screen comes into focus
      setSearchQuery("");
    }, [fetchMeetings])
  );

  // Scroll to target meeting when it's available
  useEffect(() => {
    if (targetMeetingId && displayedMeetings.length > 0) {
      const index = displayedMeetings.findIndex(
        (item) =>
          String(item.meetingId ?? item.meeting_id ?? item.id) === String(targetMeetingId)
      );
      if (index !== -1 && flatListRef.current) {
        // Wait a bit for the list to render, then scroll
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5 // Center the item
          });
        }, 500);
      }
    }
  }, [targetMeetingId, displayedMeetings]);

  // Filter and sort meetings (matching web version: hide Expired, show Active and Upcoming)
  useEffect(() => {
    if (allMeetings.length === 0) return;

    // Filter out Expired meetings
    let filtered = allMeetings.filter((item: Meeting) => computeStatus(item) !== "Expired");

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const mentor = (item.mentorName ?? item.mentor_name ?? "").toLowerCase();
        const title = (item.title ?? "").toLowerCase();
        const description = (item.description ?? "").toLowerCase();
        return mentor.includes(query) || title.includes(query) || description.includes(query);
      });
    }

    // Sort: Active first, then Upcoming (within same status, earlier start first)
    const sorted = filtered.slice().sort((a, b) => {
      const order = { Active: 1, Upcoming: 2, Expired: 3 };
      const sa = computeStatus(a);
      const sb = computeStatus(b);
      const diff = (order[sa] || 99) - (order[sb] || 99);
      if (diff !== 0) return diff;

      // Within same status, earlier start first
      const ta = buildStartDate(a.date, a.startTime ?? a.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = buildStartDate(b.date, b.startTime ?? b.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

    const firstPage = sorted.slice(0, PAGE_SIZE);
    setDisplayedMeetings(firstPage);
    setCurrentPage(0);
    setHasMore(sorted.length > PAGE_SIZE);
  }, [allMeetings, currentTime, searchQuery]);


  // ✅ Custom date formatter (e.g., 24 Oct 2025, 03:15 PM)
  const formatDatePill = (dateArr?: number[], timeArr?: number[]) => {
    const dt = buildStartDate(dateArr, timeArr);
    if (!dt) return "";

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = dt.getDate().toString().padStart(2, "0");
    const month = monthNames[dt.getMonth()];
    const year = dt.getFullYear();
    const hours = dt.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = dt.getMinutes().toString().padStart(2, "0");
    const period = dt.getHours() >= 12 ? "PM" : "AM";

    const result = `${day} ${month} ${year}, ${hours}:${minutes} ${period}`;
    return result;
  };

  const formatDuration = (mins?: number) => {
    if (mins == null) return "";
    const n = Number(mins);
    if (isNaN(n)) return `${mins}`;
    if (n < 60) return `${n} min`;
    const h = Math.floor(n / 60);
    const r = n % 60;
    return r === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${r} min`;
  };

  // Use local time (no Z) to avoid timezone mismatch (matching web version)
  const toGoogleLocal = (d: Date) => {
    const p = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  };

  const buildGoogleCalendarUrl = (meeting: Meeting) => {
    try {
      const title = meeting.title ?? "Mentor Session";
      const details = [
        meeting.description || "",
        meeting.meetLink ? `Join: ${meeting.meetLink}` : "",
        "MentorSphere — bitLabs Jobs",
      ]
        .filter(Boolean)
        .join("\n\n");

      const start = buildStartDate(meeting.date, meeting.startTime ?? meeting.start_time);
      if (!start) {
        return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
          title
        )}&details=${encodeURIComponent(details)}`;
      }

      const mins = Number(meeting.durationMinutes ?? meeting.duration ?? 60) || 60;
      const end = new Date(start.getTime() + mins * 60000);
      const dates = `${toGoogleLocal(start)}/${toGoogleLocal(end)}`;
      const loc = meeting.meetLink ?? meeting.meet_link ?? "";

      return (
        "https://www.google.com/calendar/render?action=TEMPLATE" +
        `&text=${encodeURIComponent(title)}` +
        `&details=${encodeURIComponent(details)}` +
        `&location=${encodeURIComponent(loc)}` +
        `&dates=${encodeURIComponent(dates)}`
      );
    } catch {
      return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
        meeting.title ?? "Mentor Session"
      )}`;
    }
  };

  const handleJoin = (url?: string) => {
    if (!url) {
      Alert.alert("Error", "No join link provided for this meeting.");
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to open the link.");
    });
  };

  // Load more meetings (pagination) - filter and sort like initial load
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    setTimeout(() => {
      // Filter out Expired and sort
      const filtered = allMeetings.filter((item: Meeting) => computeStatus(item) !== "Expired");
      const sorted = filtered.slice().sort((a, b) => {
        const order = { Active: 1, Upcoming: 2, Expired: 3 };
        const sa = computeStatus(a);
        const sb = computeStatus(b);
        const diff = (order[sa] || 99) - (order[sb] || 99);
        if (diff !== 0) return diff;
        const ta = buildStartDate(a.date, a.startTime ?? a.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const tb = buildStartDate(b.date, b.startTime ?? b.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

      const nextPage = currentPage + 1;
      const startIndex = nextPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const nextMeetings = sorted.slice(startIndex, endIndex);

      if (nextMeetings.length > 0) {
        setDisplayedMeetings(prev => [...prev, ...nextMeetings]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < sorted.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 300);
  };

  const handleRegister = async (mentorConnectId: number) => {
    if (!userId) {
      showToast("error", "Please login to register for meetings");
      return;
    }

    setRegisteringId(mentorConnectId);
    try {
      await registerForMeeting(mentorConnectId, Number(userId));
      showToast("success", "Successfully registered for the meeting!");

      // Update local state to show "Registered" immediately
      setRegisteredMeetingIds(prev => new Set(prev).add(mentorConnectId));
    } catch (err) {
      console.error("❌ [MENTOR CONNECT] Registration error:", err);
      showToast("error", "Registration failed. Please try again.");
    } finally {
      setRegisteringId(null);
    }
  };

  const handleAddCalendar = async (meeting: Meeting) => {
    try {
      const meetingId = meeting.meetingId ?? meeting.meeting_id ?? meeting.id;
      const latestMeeting = await getMeetingById(Number(meetingId));
      const gcalUrl = buildGoogleCalendarUrl(latestMeeting || meeting);
      if (gcalUrl) {
        Linking.openURL(gcalUrl).catch(() => {
          Alert.alert("Error", "Unable to open calendar.");
        });
      }
    } catch (err) {
      console.error("Error fetching meeting for calendar:", err);
      const gcalUrl = buildGoogleCalendarUrl(meeting);
      Linking.openURL(gcalUrl).catch(() => {
        Alert.alert("Error", "Unable to open calendar.");
      });
    }
  };

  const RenderMeetingCard = ({ item }: { item: Meeting }) => {
    const meetingId = item.meetingId ?? item.meeting_id ?? item.id;
    const mentor = item.mentorName ?? item.mentor_name ?? "Mentor";
    const title = item.title ?? "Webinar";
    const description = item.description ?? "";
    const dateArr = item.date;
    const timeArr = item.startTime ?? item.start_time;
    const durationMinutes = item.durationMinutes ?? item.duration ?? 60;
    const meetLink = item.meetLink ?? item.meet_link ?? "";
    const bannerImageUrl = item.bannerImageUrl ?? item.banner_image_url;
    const dateText = formatDatePill(dateArr, timeArr);

    const status = computeStatus(item);
    const isRegistered = registeredMeetingIds.has(Number(meetingId));

    // Debug log for each card's registration status
    console.log(`🔍 [MENTOR CONNECT] Meeting ${meetingId} ("${title}") -> Registered: ${isRegistered}`);

    const isRegistering = registeringId === Number(meetingId);

    const startEnabled = status === "Active" && isRegistered;
    const addCalEnabled = status === "Upcoming" && isRegistered;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        {bannerImageUrl ? (
          <Image
            source={{ uri: bannerImageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.headerBar}>
          <View style={styles.mentorNameContainer}>
            <Text style={styles.mentorName}>{mentor}</Text>
          </View>
          <View style={styles.datePill}>
            <Icon name="calendar-today" size={14} color="#EF7D27" />
            <Text style={styles.dateText}>{dateText}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={[
              styles.statusBadge,
              status === "Active" && styles.statusBadgeActive,
              status === "Upcoming" && styles.statusBadgeUpcoming
            ]}>
              <Text style={[
                styles.statusText,
                status === "Active" && styles.statusTextActive,
                status === "Upcoming" && styles.statusTextUpcoming
              ]}>
                {status}
              </Text>
            </View>
            {isRegistered && (
              <View style={[styles.statusBadge, styles.statusBadgeRegistered]}>
                <Text style={[styles.statusText, styles.statusTextRegistered]}>
                  Registered
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.titleStyle}>{title}</Text>
          <Text style={styles.descBox} numberOfLines={3} ellipsizeMode="tail">
            {description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                Duration: {formatDuration(durationMinutes)}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            {!isRegistered ? (
              <TouchableOpacity
                style={[styles.btnFilled, isRegistering && { opacity: 0.7 }]}
                onPress={() => handleRegister(Number(meetingId))}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="how-to-reg" size={18} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.btnFilledText}>Register</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.btnStart,
                    (!meetLink || !startEnabled) && styles.btnStartDisabled
                  ]}
                  onPress={() => {
                    if (startEnabled && meetLink) {
                      const featureWithDate = `MOBILE-MENTOR CONNECTS ${getCurrentDate()}`;
                      console.log(`📊 [Analytics] Tracking ${featureWithDate} event for user:`, userId);
                      trackAnalyticsEvent(featureWithDate, userId);
                      handleJoin(meetLink);
                    }
                  }}
                  disabled={!meetLink || !startEnabled}
                >
                  <Icon
                    name="play-arrow"
                    size={18}
                    color={startEnabled && meetLink ? "#fff" : "#999"}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.btnStartText,
                    (!meetLink || !startEnabled) && styles.btnStartTextDisabled
                  ]}>
                    {status === "Active" ? "Join now" : "Start now"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btnFilled,
                    !addCalEnabled && styles.btnFilledDisabled
                  ]}
                  onPress={() => handleAddCalendar(item)}
                  disabled={!addCalEnabled}
                >
                  <Icon
                    name="event"
                    size={16}
                    color={addCalEnabled ? "#fff" : "#999"}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.btnFilledText,
                    !addCalEnabled && styles.btnFilledTextDisabled
                  ]}>
                    Add calendar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.heading}>Mentor Sphere</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              placeholder="Search by mentor, title, or topic..."
              placeholderTextColor="#888"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonBannerImage} />
                  <View style={styles.skeletonHeaderBar}>
                    <View style={styles.skeletonMentorName} />
                    <View style={styles.skeletonDatePill} />
                  </View>
                  <View style={styles.skeletonBody}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonDescription} />
                    <View style={styles.skeletonMetaRow}>
                      <View style={styles.skeletonMetaChip} />
                      <View style={styles.skeletonMetaChip} />
                    </View>
                    <View style={styles.skeletonFooter}>
                      <View style={styles.skeletonBtnOutline} />
                      <View style={styles.skeletonBtnFilled} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Image
                source={NoMentorConnectsImage}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>No mentor sessions available right now.</Text>
            </View>
          ) : displayedMeetings.length === 0 ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {searchQuery.trim() !== "" ? (
                <View style={styles.emptySearchContainer}>
                  <Image
                    source={require("../../assests/Images/Search/Search.png")}
                    style={styles.emptySearchImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptySearchTitle}>No mentor sessions found</Text>
                  <Text style={styles.emptySearchMessage}>
                    We couldn't find any sessions matching "{searchQuery}"
                  </Text>
                  <Text style={styles.emptySearchHint}>
                    Try searching with different keywords
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Image
                    source={NoMentorConnectsImage}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyText}>No mentor sessions available right now.</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={displayedMeetings}
              keyExtractor={(item) =>
                `${item.meetingId ?? item.meeting_id ?? item.id ?? Math.random()}`
              }
              renderItem={({ item }) => <RenderMeetingCard item={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              onScrollToIndexFailed={(info) => {
                // Handle scroll failure gracefully
                console.log('Scroll to index failed:', info);
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
              ListFooterComponent={() => {
                if (loadingMore) {
                  return (
                    <View style={styles.loadMoreContainer}>
                      <ActivityIndicator size="small" color="#F97316" />
                    </View>
                  );
                }
                return null;
              }}
            />
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

export default MentorConnect;

// ----------- STYLES -----------
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
    borderBottomColor: "#eee"
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

  heading: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },

  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#000",
    paddingVertical: 0,
  },

  clearButton: {
    padding: 4,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
    fontFamily: "PlusJakartaSans-Medium"
  },

  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#b91c1c",
    padding: 24,
    fontFamily: "PlusJakartaSans-Medium"
  },

  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
    fontFamily: "PlusJakartaSans-Medium"
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  emptyImage: {
    width: 250,
    height: 250,
    maxWidth: "100%",
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  listContent: {
    paddingBottom: 20
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  card: {
    width: width - 40,
    alignSelf: "center",
    backgroundColor: "#fff",
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 0,
    columnGap: 8,
    rowGap: 4,
  },
  bannerImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  mentorNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mentorName: {
    fontSize: 12,
    color: "#1F2937",
    fontFamily: "PlusJakartaSans-Bold"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeActive: {
    backgroundColor: "#22c55e",
  },
  statusBadgeUpcoming: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#F97316",
  },
  statusText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans-Bold",
    textTransform: "capitalize",
  },
  statusTextActive: {
    color: "#fff",
  },
  statusTextUpcoming: {
    color: "#F97316",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statusBadgeRegistered: {
    backgroundColor: "#FFF5EE",
    borderWidth: 1,
    borderColor: "#FFD8BA",
  },
  statusTextRegistered: {
    color: "#F46F16",
  },

  datePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5EB",
    borderWidth: 1,
    borderColor: "#FFD8BA",
    borderRadius: 24,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  dateText: {
    fontSize: 12,
    color: "#000",
    marginLeft: 6,
    fontFamily: "PlusJakartaSans-Bold"
  },

  body: {
    padding: 14
  },

  titleStyle: {
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 8,
    fontFamily: "PlusJakartaSans-Bold"
  },

  descBox: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 10,
    fontFamily: "PlusJakartaSans-Medium",
    lineHeight: 20,
    minHeight: 20 * 3,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12
  },

  metaChip: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  metaChipText: {
    fontSize: 12,
    color: "#475569",
    fontFamily: "PlusJakartaSans-Medium"
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10
  },

  btnStart: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: "#F97316",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  btnStartDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnStartText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "PlusJakartaSans-Bold"
  },
  btnStartTextDisabled: {
    color: "#999",
  },

  btnFilled: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: "#F97316",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  btnFilledDisabled: {
    backgroundColor: "#E5E5E5",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnFilledText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "PlusJakartaSans-Bold"
  },
  btnFilledTextDisabled: {
    color: "#999",
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    paddingBottom: 20,
  },
  skeletonCard: {
    width: width - 40,
    alignSelf: "center",
    backgroundColor: "#fff",
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  skeletonBannerImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#e0e0e0",
  },
  skeletonHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE7D6",
  },
  skeletonMentorName: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonDatePill: {
    width: 100,
    height: 28,
    borderRadius: 24,
    backgroundColor: "#e0e0e0",
  },
  skeletonBody: {
    padding: 14,
  },
  skeletonTitle: {
    width: "80%",
    height: 22,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonDescription: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
  },
  skeletonMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  skeletonMetaChip: {
    width: 100,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  skeletonBtnOutline: {
    width: 100,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#e0e0e0",
  },
  skeletonBtnFilled: {
    width: 130,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#e0e0e0",
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptySearchImage: {
    width: 194,
    height: 194,
    marginBottom: 16,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  emptySearchMessage: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  emptySearchHint: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans-Regular",
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
});
