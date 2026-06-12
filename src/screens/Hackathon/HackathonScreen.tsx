import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  ImageSourcePropType,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
import { useAuth } from "@context/Authcontext";
import apiClient from "@services/login/ApiClient";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { trackAnalyticsEvent } from "@services/Analytics/AnalyticsService";


type TabKey = "MY" | "RECOMMENDED" | "ACTIVE" | "UPCOMING" | "COMPLETED";

interface EmptyState {
  message: string;
  image: ImageSourcePropType;  // Proper type for require() output
}

const emptyStates: Record<TabKey, EmptyState> = {
  MY: {
    message: "Looks like you're not in any hackathons — tap the button and discover exciting ones now!",
    image: require("../../assests/Images/empty-my.png"),
  },
  RECOMMENDED: {
    message: "No perfect match found? No worries — dive into other hackathons and keep the momentum going",
    image: require("../../assests/Images/empty-recommended.png"),
  },
  ACTIVE: {
    message: "Looks like there are no active hackathons at the moment — discover what’s coming next!",
    image: require("../../assests/Images/empty-active.png"),
  },
  UPCOMING: {
    message: "Looks like nothing’s coming up soon — see which hackathons are active now!",
    image: require("../../assests/Images/empty-upcoming.png"),
  },
  COMPLETED: {
    message: "No hackathons have been completed yet — explore some active ones while you wait!",
    image: require("../../assests/Images/empty-completed.png"),
  },
};

// ✅ Generic search empty image (reusing ACTIVE for consistency)
const emptySearchImage: ImageSourcePropType = require("../../assests/Images/empty-my.png");

const HackathonScreen = () => {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TabKey>("UPCOMING");  // ✅ Typed state - Initial tab set to "On the Horizon"
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Track initial load to show skeleton instead of empty state

  const { userId, userToken } = useAuth();
  const navigation = useNavigation<any>();
  const isNavigatingFromDetailRef = useRef(false);
  // Store the current tab before navigating to details (for back navigation)
  const lastTabRef = useRef<TabKey | null>(null);
  // Track if we just restored a tab from details (to prevent resetting to UPCOMING immediately after)
  const justRestoredFromDetailsRef = useRef(false);
  // Track the tab we just set to prevent overriding it when params are cleared
  const lastSetTabRef = useRef<TabKey | null>(null);

  // Check if we're accessed via tabs (Arena) or via Stack (Hackathon)
  // When accessed via tabs, the parent navigator will be a tab navigator
  const parent = navigation.getParent();
  const isTabNavigator = parent?.getState()?.type === 'tab';
  // If we're in a tab navigator, don't use goBack - navigate to Home tab instead
  // If we're in a stack navigator, use goBack if we can
  const shouldUseGoBack = !isTabNavigator && navigation.canGoBack();

  // ✅ Typed function param
  const getApiUrlByTab = (tabKey: TabKey) => {
    switch (tabKey) {
      case "RECOMMENDED":
        return `/api/hackathons/recommended/${userId}`;
      case "ACTIVE":
        return `/api/hackathons/active`;
      case "UPCOMING":
        return `/api/hackathons/upcoming`;
      case "COMPLETED":
        return `/api/hackathons/completed`;
      case "MY":
      default:
        return `/api/hackathons/getApplicantRegisteredHackathons/${userId}`;
    }
  };

  const fetchHackathons = async (tabKey: TabKey) => {
    try {
      // Set loading state FIRST - this ensures skeleton loader shows immediately
      // and prevents empty state from showing during loading
      setLoading(true);
      // Note: We don't clear hackathons here to prevent empty state flash
      // The skeleton loader will be shown while loading, hiding any old data
      const hackRes = await apiClient.get(getApiUrlByTab(tabKey), {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      let data = hackRes.data || [];

      // Fetch registration statuses
      let registrationMap: Record<number, any> = {};
      try {
        const regRes = await apiClient.get(
          `/hackathons/${userId}/getAllRegistrationStatus`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        const registrations = regRes.data || [];
        registrations.forEach((reg: any) => {
          registrationMap[reg.hackathonId] = reg;
        });
      } catch (regError: any) {
        console.warn("Failed to fetch registration statuses:", regError.message);
      }

      // Helper function to convert date to Date object
      const parseDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (Array.isArray(dateValue)) {
          if (dateValue.length >= 3) {
            return new Date(
              dateValue[0],
              (dateValue[1] ?? 1) - 1,
              dateValue[2] ?? 1,
              dateValue[3] ?? 0,
              dateValue[4] ?? 0,
              dateValue[5] ?? 0
            );
          }
          return null;
        }
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      // Merge registration info and convert dates
      data = data.map((h: any) => {
        const endAt = parseDate(h.endAt);
        const startAt = parseDate(h.startAt);
        const createdAt = parseDate(h.createdAt);
        return {
          ...h,
          registration: registrationMap[h.id] || null,
          endAt,
          startAt,
          createdAt,
        };
      });

      // Handle winners for COMPLETED or MY (same as before)
      if (tabKey === "COMPLETED" || tabKey === "MY") {
        const winnerIds = data.map((h: any) => h.winner).filter(Boolean);
        if (winnerIds.length > 0) {
          try {
            const winnerRes = await apiClient.post(`/applicant-image/hackathon/winners`, winnerIds);
            const winners: any[] = winnerRes.data;
            const winnerObj: Record<number, any> = {};
            winners.forEach((w) => {
              winnerObj[w.applicantId] = w;
            });
            data = data.map((h: any) => ({
              ...h,
              winnerInfo: h.winner ? winnerObj[h.winner] : null,
            }));
          } catch (_) { }
        }
      }

      // Calculate remainingDays & remainingText
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const processed = data.map((h: any) => {
        let remainingDays = 0;
        let remainingText = "";
        if (h.status === "ACTIVE" && h.endAt) {
          remainingDays = Math.ceil((h.endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          remainingText = remainingDays > 0 ? `Ends in ${remainingDays} days` : "Ends today";
        } else if (h.status === "UPCOMING" && h.startAt) {
          remainingDays = Math.ceil((h.startAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          remainingText = remainingDays > 0 ? `Starts in ${remainingDays} days` : "Starting soon";
        } else if (h.status === "COMPLETED" && h.endAt) {
          const daysSinceEnd = Math.floor((today.getTime() - h.endAt.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceEnd === 0) {
            remainingText = "Expired today";
          } else if (daysSinceEnd === 1) {
            remainingText = "Expired 1 day ago";
          } else {
            remainingText = `Expired ${daysSinceEnd} days ago`;
          }
        } else if (h.status === "COMPLETED") {
          remainingText = "Completed";
        }
        return { ...h, remainingDays, remainingText };
      });

      // ✅ Sorting logic
      let finalList = [...processed];

      if (tabKey === "MY") {
        // Keep My Arena order (Active → Upcoming → Completed) as before
        const statusOrder: Record<string, number> = { ACTIVE: 0, UPCOMING: 1, COMPLETED: 2 };
        finalList.sort((a, b) => {
          if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
          if (a.status === "ACTIVE" && a.endAt && b.endAt) {
            return a.endAt.getTime() - b.endAt.getTime();
          }
          if (a.status === "UPCOMING" && a.startAt && b.startAt) {
            return a.startAt.getTime() - b.startAt.getTime();
          }
          return 0;
        });
      } else if (tabKey === "RECOMMENDED" || tabKey === "UPCOMING") {
        // Newest first based on createdAt
        finalList.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime();
          }
          return 0;
        });
      }
      // ACTIVE, COMPLETED: keep normal sorting (or you can sort ACTIVE by nearest end if you want)

      setHackathons(finalList);
      setInitialLoading(false); // Mark initial load as complete after first successful fetch
    } catch (error: any) {
      console.error("Hackathons API Failed:", error.response?.data || error.message);
      setHackathons([]);
      setInitialLoading(false); // Mark initial load as complete even on error
    } finally {
      setLoading(false);
    }
  };



  type RouteParams = {
    refresh?: boolean;
    tab?: TabKey;
  };

  const route = useRoute<RouteProp<Record<string, RouteParams>>>();
  useFocusEffect(
    useCallback(() => {
      // ROOT CAUSE: When navigating to nested tab screens via navigation.navigate('BottomTab', { screen: 'Arena', params })
      // React Navigation doesn't always update route.params immediately for already-mounted screens.
      // Solution: Prioritize lastTabRef (set before navigating to details) as it's most reliable.

      // Priority order:
      // 1. lastTabRef.current - Set in handleViewClick before navigating (MOST RELIABLE)
      // 2. route.params?.tab - Direct params (works sometimes with nested nav)
      // 3. Navigation state lookup - Fallback if above don't work

      const tabFromRef = lastTabRef.current;
      const tabFromParams = route.params?.tab;

      // Try to get from navigation state (for nested navigation structure)
      let tabFromNavState: TabKey | undefined;
      try {
        const navState = navigation.getState();
        const bottomTabRoute = navState?.routes?.find((r: any) => r.name === 'BottomTab');
        if (bottomTabRoute?.state?.routes) {
          const arenaRoute = bottomTabRoute.state.routes.find((r: any) => r.name === 'Arena');
          tabFromNavState = arenaRoute?.params?.tab;
        }
      } catch (e) {
        // Navigation state lookup failed, continue with other sources
        console.warn("Failed to get tab from navigation state:", e);
      }

      // Use params first (most explicit), then nav state, then ref (fallback)
      // IMPORTANT: Only use ref if params/navState are not available
      // This ensures navigation params take precedence over stale ref values
      const tabToUse = tabFromParams || tabFromNavState || tabFromRef;

      // Debug logging to understand what's happening
      console.log("🔍 [HACKATHON FOCUS] Tab detection:", {
        tabFromRef,
        tabFromParams,
        tabFromNavState,
        tabToUse,
        currentStatusFilter: statusFilter
      });

      if (tabToUse) {
        // Coming back from details page - restore the tab that was active
        console.log("✅ [HACKATHON FOCUS] Coming back from details - restoring tab:", tabToUse, {
          fromRef: !!tabFromRef,
          fromParams: !!tabFromParams,
          fromNavState: !!tabFromNavState,
          currentStatusFilter: statusFilter
        });

        // Update statusFilter and fetch data
        setStatusFilter(tabToUse);
        fetchHackathons(tabToUse);

        // Track the tab we just set
        lastSetTabRef.current = tabToUse;

        // Mark that we just restored from details to prevent immediate reset to UPCOMING
        // This prevents the second useFocusEffect run from overriding the restored tab
        justRestoredFromDetailsRef.current = true;
        setTimeout(() => {
          justRestoredFromDetailsRef.current = false;
        }, 500); // Clear flag after 500ms to allow next navigation from bottom tabs

        // Clear params after using them to prevent stale params on next navigation
        // Do this after a delay to ensure state updates complete
        if (tabFromParams || tabFromNavState) {
          setTimeout(() => {
            navigation.setParams({ tab: undefined });
            // Clear the tracking ref after params are cleared
            setTimeout(() => {
              lastSetTabRef.current = null;
            }, 100);
          }, 200);
        }

        // Clear ref ONLY if we used it from the ref (not from params/navState)
        // Clear it after a delay to ensure state has updated
        if (tabFromRef) {
          setTimeout(() => {
            console.log("🧹 [HACKATHON FOCUS] Clearing ref after successfully using it");
            lastTabRef.current = null;
          }, 500);
        }
      } else {
        // No tab parameter found - this means we're navigating from bottom tabs (Home, TechVibes, etc.)
        // ALWAYS reset to "On the Horizon" tab in this case

        // When no tab param is found, it means we're navigating from bottom tabs (Home, TechVibes, etc.)
        // We should ALWAYS reset to "On the Horizon" in this case

        // When no tab param is found, we're navigating from bottom tabs (Home, TechVibes, etc.)
        // We should ALWAYS reset to "On the Horizon" in this case

        // Check if we recently set a tab (to prevent overriding when params are cleared)
        const recentlySetTab = lastSetTabRef.current;
        const shouldSkipReset = justRestoredFromDetailsRef.current || recentlySetTab;

        if (shouldSkipReset) {
          console.log("⏭️ [HACKATHON FOCUS] Just restored/recently set tab - skipping reset to UPCOMING", {
            justRestored: justRestoredFromDetailsRef.current,
            recentlySetTab
          });
          // Don't reset - we just restored a tab from details or recently set one
        } else {
          // We're navigating from bottom tabs - ALWAYS reset to UPCOMING (On the Horizon)
          // Clear any stale ref values and flags to ensure clean navigation
          lastTabRef.current = null; // Clear stale ref when navigating from bottom tabs
          justRestoredFromDetailsRef.current = false; // Ensure flag is cleared
          lastSetTabRef.current = null; // Clear tracking ref

          console.log("🏠 [HACKATHON FOCUS] No tab param - navigating from bottom tabs - resetting to On the Horizon", {
            currentStatusFilter: statusFilter,
            justRestoredFlag: justRestoredFromDetailsRef.current
          });

          // Always reset to UPCOMING (On the Horizon) when navigating from bottom tabs, regardless of current statusFilter
          setStatusFilter("UPCOMING");
          fetchHackathons("UPCOMING");
        }
      }

      // Clear search query when screen comes into focus
      setSearchQuery((prevQuery) => {
        if (prevQuery.length > 0) {
          console.log("🏠 [HACKATHON FOCUS] Clearing search:", {
            previousQuery: prevQuery,
            willBeCleared: true,
            timestamp: new Date().toISOString(),
          });
          return "";
        }
        return prevQuery;
      });
    }, [route.params?.refresh, route.params?.tab, userId, userToken, navigation])
  );

  // Optional: clear refresh flag to prevent infinite reload
  useEffect(() => {
    if (route.params?.refresh) {
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh]);

  // Fetch hackathons when statusFilter changes (e.g., when user manually switches tabs in UI)
  // This handles tab switches within the Arena screen itself
  useEffect(() => {
    // Skip if already loading to prevent double fetch
    // The useFocusEffect handles initial loads and navigation-triggered fetches
    if (!loading && !initialLoading) {
      fetchHackathons(statusFilter);
    }
  }, [statusFilter]);

  // ✅ Search logic (only one field)
  const filteredHackathons = hackathons.filter((h) => {
    if (searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = h.title?.toLowerCase().includes(query) || false;
    const techMatch = h.allowedTechnologies?.toLowerCase().includes(query) || false;
    const startAtMatch = h.startAt ? h.startAt.toLocaleDateString().toLowerCase().includes(query) : false;
    const endAtMatch = h.endAt ? h.endAt.toLocaleDateString().toLowerCase().includes(query) : false;
    return titleMatch || techMatch || startAtMatch || endAtMatch;
  });

  const handleViewClick = (hackathonId: number) => {
    // Store the current tab in ref for back navigation (fallback in case params don't work)
    const currentTab = statusFilter || 'UPCOMING';
    lastTabRef.current = currentTab;
    console.log("🔍 [HANDLE VIEW CLICK] Storing tab in ref:", currentTab, "for hackathon:", hackathonId);
    // Trigger analytics event
    trackAnalyticsEvent("MOBILE-HACKATHONS", userId);
    // Always pass the current statusFilter as tab parameter, defaulting to "UPCOMING" if not set
    const tabToPass = currentTab;
    navigation.navigate("ApplicantHackathonDetails", { id: hackathonId, tab: tabToPass });
  };

  type HackathonStatus = "ACTIVE" | "UPCOMING" | "COMPLETED";
  const statusStyleMap: Record<HackathonStatus, keyof typeof styles> = {
    ACTIVE: "active",
    UPCOMING: "upcoming",
    COMPLETED: "completed",
  };

  const renderHackathonCard = ({ item }: { item: any }) => {
    const today = new Date();
    const startDate = new Date(item.startAt);
    const endDate = new Date(item.endAt);

    let remainingText = "";
    if (item.status === "ACTIVE") {
      const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      remainingText = diffDays > 0 ? `Ends in ${diffDays} days` : "Ends today";
    } else if (item.status === "UPCOMING") {
      const diffDays = Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      remainingText =
        diffDays > 0 ? `Starts in ${diffDays} days` : "Starting soon";
    } else if (item.status === "COMPLETED") {
      if (item.endAt) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(item.endAt);
        endDate.setHours(0, 0, 0, 0);
        const daysSinceEnd = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceEnd === 0) {
          remainingText = "Expired today";
        } else if (daysSinceEnd === 1) {
          remainingText = "Expired 1 day ago";
        } else {
          remainingText = `Expired ${daysSinceEnd} days ago`;
        }
      } else {
        remainingText = "Completed";
      }
    }

    const registrationText =
      item.registration?.registaratinStatus || item.registration?.submitStatus
        ? item.registration.submitStatus
          ? "Submitted"
          : "Registered"
        : null;

    return (
      <View style={styles.card}>
        <Text
          style={[
            styles.badge,
            styles[statusStyleMap[item.status as HackathonStatus]],
          ]}
        >
          {item.status === "COMPLETED" ? "EXPIRED" : item.status}
        </Text>
        <View style={styles.bannerWrapper}>
          <Image
            source={{
              uri:
                item.bannerUrl ||
                "https://via.placeholder.com/300x200?text=No+Image",
            }}
            style={styles.banner}
          />
        </View>

        {/* Winner overlay — half over banner, half below */}
        {item.status === "COMPLETED" && item.winnerInfo && (
          <View style={styles.winnerContainer}>
            {/* Sparkle decorations */}
            <Text style={styles.winnerSparkleLeft}>✦ ✦</Text>
            <Text style={styles.winnerLabel}>WINNER!</Text>
            <Text style={styles.winnerSparkleRight}>✦ ✦</Text>

            {/* Medal icon */}
            <Text style={styles.winnerMedal}>🏆</Text>

            {/* Profile photo with ribbon badge */}
            <View style={styles.winnerAvatarWrapper}>
              <Image
                source={{
                  uri:
                    item.winnerInfo.imageUrl ||
                    "https://via.placeholder.com/80",
                }}
                style={styles.winnerAvatar}
              />
              {/* Gold ribbon badge */}
              {/* <View style={styles.winnerRibbonBadge}>
                <Text style={styles.winnerRibbonEmoji}></Text>
              </View> */}
            </View>

            {/* Winner name */}
            <Text style={styles.winnerName}>
              {item.winnerInfo.firstName} {item.winnerInfo.lastName}
            </Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.allowedTechnologies && (
            <View style={styles.skillsContainer}>
              {item.allowedTechnologies.split(',').map((skill: string, index: number) => (
                <View key={index} style={styles.skillBox}>
                  <Text style={styles.skillText}>{skill.trim()}</Text>
                </View>
              ))}
            </View>
          )}
          {registrationText && (
            <View style={styles.registrationBadge}>
              <Image
                source={
                  registrationText === "Submitted"
                    ? require("../../assests/Images/Arena/medal.png")
                    : require("../../assests/Images/Arena/check.png")
                }
                style={styles.registrationIcon}
              />
              <Text style={styles.registrationText}>{registrationText}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.remaining}>{remainingText}</Text>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => handleViewClick(item.id)}
          >
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ✅ Safe access now with typing
  const currentEmpty = emptyStates[statusFilter];
  // Empty state conditions - these are only evaluated when NOT loading (checked in render)
  // So we can safely check just the data and search query
  const isEmptyFromSearch = searchQuery.trim() !== "" && filteredHackathons.length === 0;
  const isEmptyFromTab = searchQuery.trim() === "" && filteredHackathons.length === 0;

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}
    >
      <View style={{ flex: 1 }}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerRow}>
            {shouldUseGoBack ? (
              <TouchableOpacity
                onPress={() => {
                  // If we're in a stack navigator and can go back, use default back behavior
                  navigation.goBack();
                }}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ) : (
              // If accessed via tabs, navigate to Home tab when back is pressed
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BottomTab' as any, { screen: 'Home' } as any);
                }}
                style={styles.backButton}
              >
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            )}
            <Text style={styles.pageTitle}>Hackathons</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>
        </View>

        {/* Search Bar - Now aligned with TechVibes */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              placeholder="Search Hackathons..."
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

        {/* Fixed Tabs */}
        <View style={styles.fixedTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {[
              { key: "MY" as TabKey, label: "My Arena" },
              { key: "RECOMMENDED" as TabKey, label: "Picks for you" },
              { key: "ACTIVE" as TabKey, label: "In Action" },
              { key: "UPCOMING" as TabKey, label: "On the Horizon" },
              { key: "COMPLETED" as TabKey, label: "Past battles" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  statusFilter === tab.key && styles.activeTab,
                ]}
                onPress={() => {
                  setStatusFilter(tab.key);
                  setSearchQuery("");
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    statusFilter === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: 0 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {/* Show skeleton loader while loading - this prevents empty state from showing */}
          {loading || initialLoading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonBadge} />
                  <View style={styles.skeletonBanner} />
                  <View style={styles.skeletonCardBody}>
                    <View style={styles.skeletonCompany} />
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSkillsContainer}>
                      <View style={styles.skeletonSkillBox} />
                      <View style={styles.skeletonSkillBox} />
                      <View style={styles.skeletonSkillBox} />
                    </View>
                  </View>
                  <View style={styles.skeletonCardFooter}>
                    <View style={styles.skeletonRemaining} />
                    <View style={styles.skeletonViewBtn} />
                  </View>
                </View>
              ))}
            </View>
          ) : /* Only show empty state AFTER loading completes - no empty state during loading */
            (!loading && !initialLoading && filteredHackathons.length === 0) ? (
              <View style={styles.emptyContainer}>
                {isEmptyFromTab ? (
                  <>
                    <Image
                      source={currentEmpty.image}
                      style={styles.emptyImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.emptyMessage}>{currentEmpty.message}</Text>

                    {/* 🔘 Unified Explore button logic */}
                    <TouchableOpacity
                      style={styles.exploreBtn}
                      onPress={() => {
                        if (statusFilter === "ACTIVE") {
                          // From In Action → go to On the Horizon
                          setStatusFilter("UPCOMING");
                        } else {
                          // From any other tab → go to In Action
                          setStatusFilter("ACTIVE");
                        }
                        setSearchQuery("");
                      }}
                    >
                      <Text style={styles.exploreBtnText}>Explore</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Image
                      source={emptySearchImage}
                      style={styles.emptyImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.emptyMessage}>
                      No hackathons match your search — try different keywords!
                    </Text>

                    {/* 🔘 Explore for empty search */}
                    <TouchableOpacity
                      style={styles.exploreBtn}
                      onPress={() => {
                        if (statusFilter === "ACTIVE") {
                          setStatusFilter("UPCOMING");
                        } else {
                          setStatusFilter("ACTIVE");
                        }
                        setSearchQuery("");
                      }}
                    >
                      <Text style={styles.exploreBtnText}>Explore</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredHackathons}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderHackathonCard}
                contentContainerStyle={styles.cardsContainer}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
              />
            )}

        </ScrollView>
      </View>
    </ImageBackground >
  );
};

export default HackathonScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: { flex: 1 },
  fixedHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "transparent",
    zIndex: 1000,
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
  pageTitle: {
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
  fixedTabs: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 999,
  },
  tabs: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8E8",
    borderWidth: 1,
    borderColor: "#999",
  },
  tabText: {
    fontSize: 14,
    color: "#000",
    fontFamily: "PlusJakartaSans-Medium",
  },
  activeTab: {
    backgroundColor: "#F46F16",
    borderWidth: 1,
    borderColor: "#F46F16",
    borderRadius: 6,
  },
  activeTabText: {
    color: "#fff",
    fontFamily: "PlusJakartaSans-Bold",
  },
  cardsContainer: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "visible",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
    color: "#fff",
    fontFamily: "PlusJakartaSans-Bold",
    zIndex: 1,
  },
  active: { backgroundColor: "#28a745" },
  upcoming: { backgroundColor: "#F97316" },
  completed: { backgroundColor: "#000000" },
  bannerWrapper: {
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  banner: { width: "100%", height: 180, objectFit: "fill" },
  cardBody: { padding: 12 },
  company: { fontSize: 14, color: "#F46F16", fontFamily: "PlusJakartaSans-Bold" },
  title: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    marginVertical: 4,
    color: "#666",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  skillBox: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 13,
    color: "#000",
    fontFamily: "PlusJakartaSans-Medium",
  },
  registrationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFF5EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  registrationIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  registrationText: {
    fontSize: 12,
    color: "#F46F16",
    fontFamily: "PlusJakartaSans-Bold",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  remaining: { fontSize: 12, color: "#555", fontFamily: "PlusJakartaSans-Medium" },
  viewBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  clearIcon: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  skeletonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    zIndex: 1,
  },
  skeletonBanner: {
    width: "100%",
    height: 180,
    backgroundColor: "#e0e0e0",
  },
  skeletonCardBody: {
    padding: 12,
  },
  skeletonCompany: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonTitle: {
    width: "80%",
    height: 20,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  skeletonSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skeletonSkillBox: {
    width: 70,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  skeletonCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  skeletonRemaining: {
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonViewBtn: {
    width: 60,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  exploreBtn: {
    marginTop: 16,
    backgroundColor: "#F46F16",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Bold",
  },


  viewBtnText: { color: "#fff", fontSize: 13, fontFamily: "PlusJakartaSans-Bold" },
  // ✅ New styles for empty state
  emptyContainer: { marginTop: 40, alignItems: "center", paddingHorizontal: 20 },
  emptyImage: { width: 200, height: 200, marginBottom: 20 },
  emptyMessage: { fontSize: 16, color: "#888", fontFamily: "PlusJakartaSans-Bold", textAlign: "center" },

  // ── Winner Section ──────────────────────────────────────────────
  winnerContainer: {
    marginTop: -70,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F5C842",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  winnerLabel: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#E8900A",
    letterSpacing: 2,
    textAlign: "center",
  },
  winnerSparkleLeft: {
    position: "absolute",
    left: 14,
    top: 16,
    fontSize: 16,
    color: "#F5C842",
    opacity: 0.9,
  },
  winnerSparkleRight: {
    position: "absolute",
    right: 14,
    top: 16,
    fontSize: 16,
    color: "#F5C842",
    opacity: 0.9,
  },
  winnerMedal: {
    fontSize: 40,
    marginTop: 6,
    marginBottom: 10,
  },
  winnerAvatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  winnerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#F5C842",
  },
  winnerRibbonBadge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F5C842",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  winnerRibbonEmoji: {
    fontSize: 16,
  },
  winnerName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#2F2F2F",
    marginTop: 2,
    textAlign: "center",
  },
});