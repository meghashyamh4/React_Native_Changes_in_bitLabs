import React, { useCallback, useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ImageBackground,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "@context/Authcontext";
import apiClient from "@services/login/ApiClient";
import UserContext from "@context/UserContext";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";
import { trackAnalyticsEvent } from "@services/Analytics/AnalyticsService";

const ApplicantHackathonDetails = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id: hackathonId, tab } = route.params;
  const { userId, userToken } = useAuth();
  const { refreshScore } = useContext(UserContext);

  const [hackathon, setHackathon] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper to parse date to object for comparison
  const getParsedDate = (val: any): Date | null => {
    if (!val) return null;
    let d: Date;
    if (Array.isArray(val)) {
      if (val.length >= 3) {
        d = new Date(
          val[0],
          (val[1] ?? 1) - 1,
          val[2] ?? 1,
          val[3] ?? 0,
          val[4] ?? 0,
          val[5] ?? 0,
          Math.floor((val[6] ?? 0) / 1_000_000)
        );
      } else {
        return null;
      }
    } else {
      d = new Date(val);
    }
    return isNaN(d.getTime()) ? null : d;
  };

  // Format date safely
  const formatDate = (val: any) => {
    const d = getParsedDate(val);
    if (!d) return "N/A";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Fetch Hackathon details
  const fetchHackathon = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/hackathons/getHackathonDetails/${hackathonId}/${userId}`);
      setHackathon(response.data);

      const regResponse = await apiClient.get(`/hackathons/${hackathonId}/getRegistrationStatus/${userId}`);
      setRegistration(regResponse.data);
      // Trigger analytics event
      trackAnalyticsEvent("MOBILE-HACKATHONS", userId);
    } catch (error: any) {
      console.log("Response Error:", error.response);
      console.error("❌ Error fetching hackathon:", error.response?.status, error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHackathon();
    }, [hackathonId])
  );

  // Handle back button press to navigate to Arena tab with correct tab
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Use the tab parameter that was passed when navigating to details
      // This ensures we return to the same tab (e.g., "ACTIVE", "RECOMMENDED", etc.)
      const tabToUse = tab || 'MY';
      // Prevent default back behavior
      e.preventDefault();
      // Navigate to BottomTab with Arena screen and tab parameter
      // This preserves the tab state (e.g., if user was on "ACTIVE", they return to "ACTIVE")
      navigation.navigate('BottomTab' as any, { screen: 'Arena', params: { tab: tabToUse } } as any);
    });

    return unsubscribe;
  }, [navigation, tab]);

  // Handle Register Button Click - Show Confirmation Modal
  const handleRegisterClick = () => {
    setShowConfirmModal(true);
  };

  // Handle Register Confirmation - Actually Register
  const handleRegister = async () => {
    setShowConfirmModal(false);
    try {
      const res = await apiClient.post(
        `/hackathons/${hackathonId}/registerForHackathon/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      console.log("📌 Register API Response:", res.data);
      setRegistration({ ...registration, registaratinStatus: true });
      setShowModal(true); // Show success modal

      // Refresh score after hackathon registration
      if (refreshScore) {
        console.log("🔄 [HACKATHON] Refreshing score after registration...");
        await refreshScore();
      }
    } catch (error: any) {
      console.error("❌ Register Error:", error.response?.status, error.message);

      // Show error toast message
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.response?.data?.message || 'Failed to register for hackathon. Please try again.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    }
  };

  // Handle Submit Navigation
  const handleSubmit = () => {
    navigation.navigate("ApplicantSubmitHackathon", {
      hackathonId,
      registrationId: registration?.id,
    });
  };

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        {/* Banner Skeleton */}
        <View style={styles.skeletonBannerWrapper}>
          <View style={styles.skeletonBanner} />
          <View style={styles.skeletonBadge} />
        </View>

        {/* Title Skeleton */}
        <View style={styles.skeletonTitle} />

        {/* Description Section Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonSectionText} />
          <View style={styles.skeletonSectionText} />
          <View style={[styles.skeletonSectionText, { width: '70%' }]} />
        </View>

        {/* Instructions Section Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonListItem} />
          <View style={styles.skeletonListItem} />
          <View style={styles.skeletonListItem} />
        </View>

        {/* Eligibility Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonTagContainer}>
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
          </View>
        </View>

        {/* Technologies Skeleton */}
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonTagContainer}>
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
          </View>
        </View>

        {/* Info Box Skeleton */}
        <View style={styles.skeletonInfoBox}>
          <View style={styles.skeletonSectionTitle} />
          <View style={styles.skeletonInfoRow}>
            <View style={styles.skeletonInfoLabel} />
            <View style={styles.skeletonInfoValue} />
          </View>
          <View style={styles.skeletonInfoRow}>
            <View style={styles.skeletonInfoLabel} />
            <View style={styles.skeletonInfoValue} />
          </View>
          <View style={styles.skeletonInfoRow}>
            <View style={styles.skeletonInfoLabel} />
            <View style={styles.skeletonInfoValue} />
          </View>
        </View>

        {/* Button Skeleton */}
        <View style={styles.skeletonButton} />
      </ScrollView>
    );
  }

  if (!hackathon) {
    return (
      <View style={styles.centered}>
        <Text>No hackathon found.</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assests/Images/backgrounds/image.png")}
      style={styles.background}
    >
      <ScrollView style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hackathon Details</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>
        </View>

        {/* Banner + Status */}
        <View style={styles.bannerWrapper}>
          <Image
            source={{
              uri: hackathon.bannerUrl || "https://via.placeholder.com/600x300?text=No+Image",
            }}
            style={styles.banner}
          />
          <Text
            style={[
              styles.badge,
              styles[
              (hackathon.status?.toLowerCase() as "active" | "upcoming" | "completed") || "active"
              ],
            ]}
          >
            {hackathon.status}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{hackathon.title}</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{hackathon.description}</Text>
        </View>

        {/* Instructions */}
        {hackathon.instructions && hackathon.instructions.trim() !== "" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {hackathon.instructions.split("\n").map((line: string, idx: number) => (
              <Text key={idx} style={styles.listItem}>
                • {line.replace(/^\d+\.\s*/, "")}
              </Text>
            ))}
          </View>
        )}

        {/* Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility Criteria</Text>
          <View style={styles.tagContainer}>
            {hackathon.eligibility?.split(",").map((item: string, idx: number) => (
              <Text key={idx} style={styles.tag}>
                {item.trim()}
              </Text>
            ))}
          </View>
        </View>

        {/* Technologies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Tech Stack</Text>
          <View style={styles.tagContainer}>
            {hackathon.allowedTechnologies?.split(",").map((tech: string, idx: number) => (
              <Text key={idx} style={[styles.tag, styles.techTag]}>
                {tech.trim()}
              </Text>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoBox}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoText}>{formatDate(hackathon.startAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoText}>{formatDate(hackathon.endAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organized By</Text>
            <Text style={styles.infoText}>{hackathon.company}</Text>
          </View>
        </View>

        {/* Button Logic */}
        {/* Button Logic */}
        {/* Button Logic */}
        {(() => {
          const startDate = getParsedDate(hackathon.startAt);
          const now = new Date();
          // Check if start date is in the future
          // We use slightly loose comparison to avoid second-precision issues if needed, strictly now < startDate means not started
          const hasStarted = startDate ? now >= startDate : false;

          if (hackathon.status?.toLowerCase() === "completed") {
            return (
              <TouchableOpacity style={[styles.registerBtn, { backgroundColor: "gray" }]} disabled>
                <Text style={styles.registerText}>Hackathon Completed</Text>
              </TouchableOpacity>
            );
          }

          if (registration?.registaratinStatus) {
            if (registration.submitStatus) {
              return (
                <TouchableOpacity style={[styles.registerBtn, { backgroundColor: "gray" }]} disabled>
                  <Text style={styles.registerText}>Already Submitted</Text>
                </TouchableOpacity>
              );
            }

            // Registered but not submitted
            if (!hasStarted) {
              return (
                <TouchableOpacity style={[styles.registerBtn, { backgroundColor: "gray" }]} disabled>
                  <Text style={styles.registerText}>Already Registered</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity style={styles.registerBtn} onPress={handleSubmit}>
                <Text style={styles.registerText}>Submit Response</Text>
              </TouchableOpacity>
            );
          }

          // Not registered
          return (
            <TouchableOpacity style={styles.registerBtn} onPress={handleRegisterClick}>
              <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
          );
        })()}


        {/* Registration Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.confirmModalBackground}>
            <View style={styles.confirmModalContainer}>
              <Text style={styles.confirmModalTitle}>
                Are you sure you want to{'\n'}register for this hackathon?
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity
                  onPress={() => setShowConfirmModal(false)}
                  style={[styles.confirmModalButton, styles.confirmCancelButton]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#F46F16' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRegister}
                  style={[styles.confirmModalButton]}
                >
                  <LinearGradient colors={['#F46F16', '#F8A44C']} style={styles.confirmGradientButton}>
                    <Text style={[styles.confirmButtonText, { color: '#FFF' }]}>Register</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🎉 Successfully Registered!</Text>
              <Text style={styles.modalText}>
                You have successfully registered for the hackathon: {hackathon.title}.
              </Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
};

export default ApplicantHackathonDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  background: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header styles
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "transparent",
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
  headerTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },

  bannerWrapper: { position: "relative", marginBottom: 16, marginHorizontal: 16, marginTop: 16 },
  banner: { width: "100%", height: 200, borderRadius: 12, objectFit: "fill" },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  active: { backgroundColor: "#28a745" },
  upcoming: { backgroundColor: "#F97316" },
  completed: { backgroundColor: "#6c757d" },

  title: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans-Bold",
    marginBottom: 12,
    color: "#333",
    paddingHorizontal: 16,
  },

  section: { marginBottom: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    marginBottom: 8,
    color: "#F97316",
  },
  sectionText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#444",
    lineHeight: 26,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#555",
  },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  col: { flex: 1, marginHorizontal: 4 },

  tagContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 13,
    fontFamily: "PlusJakartaSans-Medium",
    margin: 4,
    color: "#555",
  },
  techTag: { backgroundColor: "#fff0e6", color: "#F97316" },

  infoBox: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Bold",
    color: "#000",
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#000",
    flex: 1,
    textAlign: "left",
  },

  registerBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 30,
  },
  registerText: {
    color: "#fff",
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 16,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#000",
  },
  modalText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  modalBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnText: {
    color: "#fff",
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 14,
  },
  // Skeleton Loading Styles
  skeletonBannerWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  skeletonBanner: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  skeletonBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 70,
    height: 28,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },
  skeletonTitle: {
    width: "85%",
    height: 28,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  skeletonSection: {
    marginBottom: 16,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
  },
  skeletonSectionText: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonListItem: {
    width: "90%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  skeletonCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  skeletonTagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skeletonTag: {
    width: 60,
    height: 28,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    margin: 4,
  },
  skeletonInfoBox: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  skeletonInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  skeletonInfoLabel: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonInfoValue: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  skeletonButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    marginBottom: 30,
  },
  // Confirmation Modal Styles (matching LogoutModal theme)
  confirmModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmModalContainer: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 26,
    textAlign: 'center',
    color: '#0D0D0D',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmModalButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmCancelButton: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#F46F16',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  confirmGradientButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    paddingVertical: 10,
  },
  confirmButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

