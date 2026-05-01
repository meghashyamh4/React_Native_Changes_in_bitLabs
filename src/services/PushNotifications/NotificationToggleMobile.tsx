import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from "react-native-device-info";
import apiClient from "@services/login/ApiClient";
import { useAuth } from "@context/Authcontext";

export default function NotificationToggleMobile() {
  const { userId, userToken } = useAuth();
  const [muted, setMuted] = useState<boolean>(() => {
    // Initialize from AsyncStorage synchronously (will be updated from server)
    return false;
  });

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const savedMuted = await AsyncStorage.getItem("notificationsMuted");
        setMuted(savedMuted === "true");
      } catch (err) {
        console.error("❌ Error loading state:", err);
      }
    };
    loadInitialState();
  }, []);

  useEffect(() => {
    const fetchFcmDetails = async () => {
      if (!userToken) {
        console.warn("⚠️ No userToken found; cannot fetch mute state");
        return;
      }

      try {
        const fcmToken = await AsyncStorage.getItem("fcmToken");
        if (!fcmToken) {
          console.warn("⚠️ No fcmToken found in AsyncStorage; cannot fetch mute state");
          return;
        }

        const endpoint = `/notification/getFcmTokenDetails/${fcmToken}`;
        console.log("📡 Fetching FCM token details:", { endpoint, fcmToken });

        const response = await apiClient.get(endpoint, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        const isTokenActive = response?.data?.isTokenActive;
        if (typeof isTokenActive === "boolean") {
          const newMuted = !isTokenActive; // active => unmuted, inactive => muted
          setMuted(newMuted);
          await AsyncStorage.setItem("notificationsMuted", newMuted ? "true" : "false");
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || '';
        // If there's an error (like duplicate tokens), just use the local state
        console.warn("⚠️ Failed to fetch FCM token details from server. Using local state:", errorMessage);
        // Don't update state if there's an error - keep using local AsyncStorage value
      }
    };

    if (userToken) {
      fetchFcmDetails();
    }
  }, [userToken]);

  /**
   * 🔧 Update server mute state
   */
  const updateServerMute = async (isMuted: boolean) => {
    if (!userToken || !userId) {
      console.warn("⚠️ No userToken or userId found; cannot update mute state");
      return;
    }

    try {
      const fcmToken = await AsyncStorage.getItem("fcmToken");
      if (!fcmToken) {
        console.warn("⚠️ No fcmToken found in AsyncStorage; cannot update mute state");
        return;
      }

      // Use FCM token directly in path (same as web version)
      const endpoint = `/notification/${isMuted ? "mute" : "unmute"}/${fcmToken}`;
      
      // Log full URL for debugging (matching web version format)
      const baseURL = apiClient.defaults.baseURL || '';
      const fullUrl = `${baseURL}${endpoint}`;
      console.log("📡 Updating server mute state:", { 
        isMuted, 
        fcmToken, 
        endpoint,
        baseURL,
        fullUrl,
        userId 
      });
      console.log("🌐 Full request URL (should match web):", fullUrl);

      // Use PUT method only (same as web version)
      // Authorization header is automatically added by apiClient interceptor
      const response = await apiClient.put(endpoint, null);
      console.log("✅ Server mute state updated:", response.status);

      console.log("✅ Server mute state updated");
    } catch (err: any) {
      const errorStatus = err?.response?.status;
      const errorMessage = err?.response?.data?.message || err?.message || '';
      const isDuplicateError = errorMessage.includes('unique result') || errorMessage.includes('NonUniqueResultException');
      const is404Error = errorStatus === 404;
      
      if (is404Error) {
        console.warn("⚠️ Endpoint not found (404). The mute/unmute API may not be available. Local state updated.");
      } else if (isDuplicateError) {
        console.warn("⚠️ Duplicate FCM tokens detected. Attempting to use userId-based endpoint...");
        // Try using userId-based endpoint if available
        try {
          const userIdEndpoint = `/notification/${isMuted ? "mute" : "unmute"}/applicant/${userId}`;
          // Authorization header is automatically added by apiClient interceptor
          await apiClient.put(userIdEndpoint, null);
          console.log("✅ Server mute state updated using userId endpoint");
        } catch (fallbackErr: any) {
          console.warn("⚠️ Fallback userId endpoint also failed. Local state updated but server sync may be incomplete:", fallbackErr?.response?.data || fallbackErr?.message);
        }
      } else {
        console.warn("⚠️ Failed to update server mute state. Local state updated:", errorMessage);
      }
    }
  };

  /**
   * Toggle mute/unmute
   */
  const handleToggle = async () => {
    const newMuted = !muted;
    setMuted(newMuted);
    await AsyncStorage.setItem("notificationsMuted", newMuted ? "true" : "false");
    await updateServerMute(newMuted);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleToggle}>
        <Text style={styles.buttonText}>
          {muted ? "Unmute Notifications" : "Mute Notifications"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.status, muted && styles.muted]}>
        {muted ? "🔕 Notifications muted" : "🔔 Notifications enabled"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#007bff",
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  status: {
    marginLeft: 10,
    fontSize: 12,
    color: "black",
    fontFamily: "PlusJakartaSans-Medium",
  },
  muted: {
    color: "gray",
  },
});
