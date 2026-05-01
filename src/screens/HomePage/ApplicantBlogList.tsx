

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "@services/login/ApiClient";
import Icon from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { trackAnalyticsEvent } from "@services/Analytics/AnalyticsService";
import { useAuth } from "@context/Authcontext";



const { width } = Dimensions.get("window");

const ApplicantBlogsList = ({ route }: { route?: any }) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showFullBlog, setShowFullBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [displayedBlogs, setDisplayedBlogs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { userId } = useAuth();
  const navigation = useNavigation();
  const initialBlogId = route?.params?.blogId;
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef<number>(0);

  const PAGE_SIZE = 10; // Display 10 blogs at a time

  // Initial load - fetch all blogs once
  useEffect(() => {
    loadAllBlogs();
  }, []);

  // Reset blog view state and clear search when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      console.log("🏠 [TECH VIBES FOCUS] Screen focused - resetting blog view state");

      // Get blogId from route params
      const blogIdFromRoute = route?.params?.blogId;

      // Reset blog view state when returning to screen (unless blogId is provided)
      // This ensures the blog list is shown by default when navigating from other tabs
      if (!blogIdFromRoute) {
        console.log("🏠 [TECH VIBES FOCUS] Resetting blog view to list (no blogId param)");
        setShowFullBlog(false);
        setSelectedBlog(null);
        setBlogLoading(false);
      }

      // Clear search when screen comes into focus
      setSearchQuery((prevQuery) => {
        if (prevQuery.length > 0) {
          console.log("🏠 [TECH VIBES FOCUS] Clearing search:", {
            previousQuery: prevQuery,
            willBeCleared: true,
            timestamp: new Date().toISOString(),
          });

          // Reset to first page when clearing search
          const firstPage = allBlogs.slice(0, PAGE_SIZE);
          setDisplayedBlogs(firstPage);
          setCurrentPage(0);
          setHasMore(allBlogs.length > PAGE_SIZE);

          return "";
        }
        return prevQuery;
      });
    }, [allBlogs, route?.params?.blogId])
  );

  // Auto-open blog if blogId is provided via route params
  useEffect(() => {
    if (initialBlogId && allBlogs.length > 0) {
      const blogToOpen = allBlogs.find(b => b.id === initialBlogId);
      if (blogToOpen) {
        // Small delay to ensure screen is ready
        setTimeout(() => {
          setBlogLoading(true);
          setSelectedBlog(blogToOpen);
          setShowFullBlog(true);
          // Trigger analytics event
          trackAnalyticsEvent("MOBILE-BLOGS", userId);
          setTimeout(() => {
            setBlogLoading(false);
          }, 300);
        }, 500);
      }
    }
  }, [initialBlogId, allBlogs]);

  const loadAllBlogs = async () => {
    setInitialLoading(true);
    try {
      // Fetch all blogs from API
      const res = await apiClient.get("/blogs/active");
      const fetchedBlogs = res.data || [];
      setAllBlogs(fetchedBlogs);

      // Display first page
      const firstPage = fetchedBlogs.slice(0, PAGE_SIZE);
      setDisplayedBlogs(firstPage);
      setCurrentPage(0);
      setHasMore(fetchedBlogs.length > PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  // Search logic - filter blogs based on search query
  const getFilteredBlogs = useCallback(() => {
    if (searchQuery.trim() === "") return allBlogs;
    const query = searchQuery.toLowerCase();

    return allBlogs.filter((blog) => {
      return (
        blog.title?.toLowerCase().includes(query) ||
        blog.description?.toLowerCase().includes(query) ||
        blog.author?.toLowerCase().includes(query) ||
        blog.content?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, allBlogs]);

  // Update displayed blogs when search query or allBlogs change
  useEffect(() => {
    const filteredBlogs = getFilteredBlogs();

    if (searchQuery.trim() !== "") {
      // When searching, show filtered results with pagination
      const firstPage = filteredBlogs.slice(0, PAGE_SIZE);
      setDisplayedBlogs(firstPage);
      setCurrentPage(0);
      setHasMore(filteredBlogs.length > PAGE_SIZE);
    } else {
      // When not searching, show normal pagination
      const firstPage = allBlogs.slice(0, PAGE_SIZE);
      setDisplayedBlogs(firstPage);
      setCurrentPage(0);
      setHasMore(allBlogs.length > PAGE_SIZE);
    }
  }, [searchQuery, allBlogs, getFilteredBlogs]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    // Simulate slight delay to avoid too fast loading
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = nextPage * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;

      // Use filtered blogs if searching, otherwise use all blogs
      const filteredBlogs = getFilteredBlogs();
      const sourceBlogs = searchQuery.trim() !== "" ? filteredBlogs : allBlogs;
      const nextBlogs = sourceBlogs.slice(startIndex, endIndex);

      if (nextBlogs.length > 0) {
        setDisplayedBlogs(prev => [...prev, ...nextBlogs]);
        setCurrentPage(nextPage);
        setHasMore(endIndex < sourceBlogs.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 300); // Small delay to avoid loading too quickly
  };

  // Handle Android back button
  const handleBackPress = useCallback(() => {
    if (showFullBlog) {
      setShowFullBlog(false);
      setSelectedBlog(null);
      // Restore scroll position after a brief delay to ensure FlatList is rendered
      setTimeout(() => {
        if (flatListRef.current && scrollOffsetRef.current > 0) {
          flatListRef.current.scrollToOffset({
            offset: scrollOffsetRef.current,
            animated: false
          });
        }
      }, 100);
      return true;
    }
    return false; // exit app or default behavior
  }, [showFullBlog]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [handleBackPress]);

  const formatDate = (arr: number[]) => {
    if (!arr || arr.length < 3) return "";
    const [year, month, day] = arr;
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');
    return `${formattedDay}/${formattedMonth}/${year}`;
  };

  const renderBlogCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setBlogLoading(true);
        setSelectedBlog(item);
        setShowFullBlog(true);
        // Trigger analytics event
        trackAnalyticsEvent("MOBILE-BLOGS", userId);
        // Simulate loading time for image/content
        setTimeout(() => {
          setBlogLoading(false);
        }, 300);
      }}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.fullTitle}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.authorName}>
            {item.author.length > 18 ? `${item.author.substring(0, 18)}...` : item.author} • {formatDate(item.createdAt)}
          </Text>
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => {
              setSelectedBlog(item);
              setShowFullBlog(true);
              // Trigger analytics event
              trackAnalyticsEvent("MOBILE-BLOGS", userId);
            }}
          >
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (initialLoading) {
    return (
      <ImageBackground
        source={require("../../assests/Images/backgrounds/image.png")}
        style={styles.background}>
        <View style={styles.container}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.skeletonBackButton} />
              <View style={styles.skeletonTitle} />
              <View style={styles.backButtonPlaceholder} />
            </View>
          </View>

          {/* Blog Cards Skeleton */}
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonCardImage} />
                <View style={styles.skeletonCardContent}>
                  <View style={styles.skeletonCardTitle} />
                  <View style={styles.skeletonCardDesc} />
                  <View style={styles.skeletonCardDesc} />
                  <View style={[styles.skeletonCardDesc, { width: '70%' }]} />
                  <View style={styles.skeletonCardFooter}>
                    <View style={styles.skeletonCardAuthor} />
                    <View style={styles.skeletonReadMoreButton} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}>
      <View style={styles.container}>
        {/* Header with Back + Title - Centered like Arena */}
        {!showFullBlog && (
          <>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Tech Vibes</Text>
                <View style={styles.backButtonPlaceholder} />
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Tech Vibes..."
                  placeholderTextColor="#888"
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
          </>
        )}

        {/* Blog List with Pagination */}
        {!showFullBlog && (
          <FlatList
            ref={flatListRef}
            data={displayedBlogs}
            renderItem={renderBlogCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            onScroll={(event) => {
              // Track scroll position
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={() => {
              if (initialLoading) return null;

              if (searchQuery.trim() !== "") {
                // No results found for search
                return (
                  <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
                    <View style={styles.emptySearchContainer}>
                      <Image
                        source={require("../../assests/Images/Search/Search.png")}
                        style={styles.emptySearchImage}
                      />
                      <Text style={styles.emptySearchTitle}>No blogs found</Text>
                      <Text style={styles.emptySearchMessage}>
                        We couldn't find any blogs matching "{searchQuery}"
                      </Text>
                      <Text style={styles.emptySearchHint}>
                        Try searching with different keywords
                      </Text>
                    </View>
                  </ScrollView>
                );
              }

              // No blogs at all
              return (
                <View style={styles.emptyContainer}>
                  <Icon name="article" size={64} color="#999" />
                  <Text style={styles.emptyTitle}>No blogs available</Text>
                  <Text style={styles.emptyMessage}>
                    There are no blogs to display at the moment.
                  </Text>
                </View>
              );
            }}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.loadMoreSkeletonContainer}>
                    {[1, 2].map((i) => (
                      <View key={i} style={styles.skeletonCard}>
                        <View style={styles.skeletonCardImage} />
                        <View style={styles.skeletonCardContent}>
                          <View style={styles.skeletonCardTitle} />
                          <View style={styles.skeletonCardDesc} />
                          <View style={styles.skeletonCardDesc} />
                          <View style={[styles.skeletonCardDesc, { width: '70%' }]} />
                          <View style={styles.skeletonCardFooter}>
                            <View style={styles.skeletonCardAuthor} />
                            <View style={styles.skeletonReadMoreButton} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              }
              return null;
            }}
          />
        )}

        {/* Full Blog View */}
        {showFullBlog && selectedBlog && (
          <View style={styles.fullBlogContainer}>
            {/* Fixed Header with Back + Tech Vibes Title */}
            <View style={styles.fullHeader}>
              <View style={styles.fullHeaderRow}>
                <TouchableOpacity
                  onPress={() => {
                    setShowFullBlog(false);
                    setSelectedBlog(null);
                    setBlogLoading(false);
                    // Restore scroll position after a brief delay to ensure FlatList is rendered
                    setTimeout(() => {
                      if (flatListRef.current && scrollOffsetRef.current > 0) {
                        flatListRef.current.scrollToOffset({
                          offset: scrollOffsetRef.current,
                          animated: false
                        });
                      }
                    }, 100);
                  }}
                  style={styles.fullBackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.fullScreenTitle}>Tech Vibes</Text>
                <View style={styles.fullBackButtonPlaceholder} />
              </View>
            </View>

            <ScrollView
              style={styles.fullBlog}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.fullBlogContent}
            >
              {blogLoading ? (
                /* Skeleton Loading for Full Blog */
                <View style={styles.fullBlogSkeleton}>
                  <View style={styles.skeletonFullTitle} />
                  <View style={styles.skeletonFullAuthor} />
                  <View style={styles.skeletonFullImage} />
                  <View style={styles.skeletonFullContent} />
                  <View style={styles.skeletonFullContent} />
                  <View style={styles.skeletonFullContent} />
                  <View style={[styles.skeletonFullContent, { width: '80%' }]} />
                </View>
              ) : (
                <>
                  {/* Blog Title */}
                  <Text style={styles.fullTitle}>{selectedBlog.title}</Text>

                  {/* Author and Date */}
                  <Text style={styles.fullAuthor}>
                    <Text style={styles.fullAuthorName}>{selectedBlog.author}</Text>
                    <Text style={styles.fullAuthorDate}> • {formatDate(selectedBlog.createdAt)}</Text>
                  </Text>

                  <Image source={{ uri: selectedBlog.imageUrl }} style={styles.fullImage} />

                  <Text style={styles.fullContent}>{selectedBlog.content}</Text>
                </>
              )}

              {/* Back to List Button */}
              <TouchableOpacity
                style={styles.bottomBackButton}
                onPress={() => {
                  setShowFullBlog(false);
                  setSelectedBlog(null);
                  setBlogLoading(false);
                  // Restore scroll position after a brief delay to ensure FlatList is rendered
                  setTimeout(() => {
                    if (flatListRef.current && scrollOffsetRef.current > 0) {
                      flatListRef.current.scrollToOffset({
                        offset: scrollOffsetRef.current,
                        animated: false
                      });
                    }
                  }, 100);
                }}
              >
                <Text style={styles.bottomBackText}>Back to List</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    </ImageBackground >
  );
};

export default ApplicantBlogsList;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header with Back + Title - Centered like Arena
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
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreSkeletonContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  image: { width: "100%", height: 180 },
  cardContent: { padding: 10 },
  desc: {
    fontSize: 14,
    color: "grey",
    fontFamily: 'PlusJakartaSans-Medium',
  },
  footer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: 'PlusJakartaSans-Medium',

  },
  authorName: {
    fontSize: 12, color: "grey", lineHeight: 18, fontFamily: 'PlusJakartaSans-Bold',
  },
  readMoreButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontFamily: 'PlusJakartaSans-Medium',

  },
  readMoreText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "PlusJakartaSans-Medium",
  },

  // Full Blog View
  fullBlogContainer: {
    flex: 1,
  },
  fullBlog: {
    flex: 1,
  },
  fullBlogContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  fullHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 1000,
  },
  fullHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fullBackButton: {
    padding: 4,
  },
  fullBackButtonPlaceholder: {
    width: 32,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  fullTitle: {
    fontSize: 22,
    color: "#000",
    fontFamily: "PlusJakartaSans-Bold",
    marginTop: 16,
    marginBottom: 12,
  },
  fullAuthor: {
    marginBottom: 16,
    fontFamily: "PlusJakartaSans-Medium",
  },
  fullAuthorName: {
    fontSize: 14,
    color: "#000",
    fontFamily: "PlusJakartaSans-Bold",
  },
  fullAuthorDate: {
    color: "#000",
    fontFamily: "PlusJakartaSans-Medium",
  },
  fullImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "cover",
  },
  fullContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 30,
    fontFamily: "PlusJakartaSans-Medium",
  },
  bottomBackButton: {
    backgroundColor: "#F97316",
    padding: 8,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
    fontFamily: 'PlusJakartaSans-Medium',

  },
  bottomBackText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Medium",
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  skeletonCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  skeletonCardImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#e0e0e0",
  },
  skeletonCardContent: {
    padding: 14,
  },
  skeletonCardTitle: {
    width: "85%",
    height: 22,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  skeletonCardDesc: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  skeletonCardAuthor: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    flex: 1,
  },
  skeletonReadMoreButton: {
    width: 90,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  skeletonBackButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonTitle: {
    width: 120,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    flex: 1,
    marginHorizontal: 16,
  },
  // Full Blog Skeleton Styles
  fullBlogSkeleton: {
    paddingHorizontal: 0,
  },
  skeletonFullTitle: {
    width: "90%",
    height: 28,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginTop: 16,
    marginBottom: 12,
  },
  skeletonFullAuthor: {
    width: 180,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
  },
  skeletonFullImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
  },
  skeletonFullContent: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  // Empty state styles
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySearchMessage: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  emptySearchHint: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans-Regular",
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },
});
