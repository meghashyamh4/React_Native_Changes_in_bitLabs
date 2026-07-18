import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import * as Keychain from "react-native-keychain";
import { handleLogin, handleLoginWithEmail, handleFirebaseGoogleLogin, AuthResponse } from "../services/login/Authservice";
import { showToast } from "@services/login/ToastService";
import LogoutModal from "../screens/LandingPage/LogoutModel";
import { setLogoutHandler, removeInterceptors } from "@services/login/ApiClient";
import { setCachedToken } from "@services/TokenManager";
import { searchLead, createLead } from "@services/ZohoCrm";
import { saveFcmToken } from "@services/PushNotifications/PushNotifications";
import { getMessaging, onTokenRefresh } from "@react-native-firebase/messaging";
import { clearAllUserData } from "../utils/userDataManager";

interface AuthContextProps {
  isAuthenticated: boolean;
  setAuthData: React.Dispatch<React.SetStateAction<{ token: string; id: number; email: string } | null>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  authData: { token: string; id: number; email: string } | null;
  leadId: string | null;
  setLeadId: (id: string | null) => void;
  login: (loginemail: string, loginpassword: string) => Promise<AuthResponse>;
  Glogin: (loginemail: string) => Promise<AuthResponse>;
  firebaseGlogin: (firebaseIdToken: string) => Promise<AuthResponse>;
  logout: () => void;
  forceLogout: () => void;
  clearAllUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<{ token: string; id: number; email: string } | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  // Replace registerFcmToken with direct saveFcmToken calls
  useEffect(() => {
    const unsubscribe = onTokenRefresh(getMessaging(), async (newToken) => {
      if (authData?.id) {
        console.log("🔄 FCM token refreshed:", newToken);
        // directly save refreshed token
        try {
          await saveFcmToken(String(authData.id));
        } catch (e) {
          console.error("Failed to save refreshed FCM token", e);
        }
      }
    });
    return unsubscribe;
  }, [authData]);

  const login = async (loginemail: string, loginpassword: string): Promise<AuthResponse> => {
    const response = await handleLogin(loginemail, loginpassword);
    if (response.success && typeof response.data === "object") {
      const { token, id } = response.data;

      await Keychain.setGenericPassword("user", JSON.stringify({ id, email: loginemail }), { service: "userDetails" });
      await Keychain.setGenericPassword("auth", token, { service: "authToken" });

      setAuthData({ token, id, email: loginemail });
      setIsAuthenticated(true);
      setCachedToken(token);

      const fetchedLeadId = await searchLead(loginemail);
      setLeadId(fetchedLeadId || null);

      // ✅ Save FCM token after login
      try {
        await saveFcmToken(String(id));
      } catch (e) {
        console.log("FCM token save skipped/failed during login", e);
      }
    }
    return response;
  };

  const Glogin = async (loginemail: string): Promise<AuthResponse> => {
    const response = await handleLoginWithEmail(loginemail);
    if (response.success && typeof response.data === "object") {
      const { token, id } = response.data;

      await Keychain.setGenericPassword("user", JSON.stringify({ id, email: loginemail }), { service: "userDetails" });
      await Keychain.setGenericPassword("auth", token, { service: "authToken" });

      setAuthData({ token, id, email: loginemail });
      setIsAuthenticated(true);
      setCachedToken(token);

      let fetchedLeadId = await searchLead(loginemail);
      if (!fetchedLeadId) {
        const leadData = {
          data: [
            {
              Last_Name: loginemail.split("@")[0].replace(/\d+/g, ""),
              Email: loginemail,
              Phone: "",
              Status_TS: "Signed-Up",
              Industry: "Software",
              Platform: "mobile app",
            },
          ],
        };
        fetchedLeadId = await createLead(leadData);
      }
      setLeadId(fetchedLeadId);

      // ✅ Save FCM token after Google login
      try {
        await saveFcmToken(String(id));
      } catch (e) {
        console.log("FCM token save skipped/failed during Google login", e);
      }
    }
    return response;
  };

  const firebaseGlogin = async (firebaseIdToken: string): Promise<AuthResponse> => {
    const response = await handleFirebaseGoogleLogin(firebaseIdToken);
    if (response.success && typeof response.data === "object") {
      const { token, id } = response.data;
      // Email isn't directly available from the token here; it will be stored empty.
      // The Firebase user's email can be passed in from google.jsx if needed in the future.
      const email = "";

      await Keychain.setGenericPassword("user", JSON.stringify({ id, email }), { service: "userDetails" });
      await Keychain.setGenericPassword("auth", token, { service: "authToken" });

      setAuthData({ token, id, email });
      setIsAuthenticated(true);
      setCachedToken(token);

      // ✅ Save FCM token after Firebase Google login
      try {
        await saveFcmToken(String(id));
      } catch (e) {
        console.log("FCM token save skipped/failed during Firebase Google login", e);
      }
    }
    return response;
  };


  const showLogoutModal = () => setLogoutModalVisible(true);
  const hideLogoutModal = () => setLogoutModalVisible(false);

  const handleLogout = async () => {
    try {
      // Clear all user data
      await clearAllUserData();

      // Reset auth state
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);

      showToast("error", "Logout Successful");
      hideLogoutModal();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still reset state even if clearing fails
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);
      hideLogoutModal();
    }
  };

  const checkAuth = async () => {
    try {
      const userDetails = await Keychain.getGenericPassword({ service: "userDetails" });
      const authToken = await Keychain.getGenericPassword({ service: "authToken" });

      if (userDetails && authToken) {
        const parsedUserDetails = JSON.parse(userDetails.password);
        setAuthData({
          id: parsedUserDetails.id,
          token: authToken.password,
          email: parsedUserDetails.email,
        });
        setIsAuthenticated(true);
      } else {
        setAuthData(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setAuthData(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // setLogoutHandler(handleLogout);

    setLogoutHandler(forceLogout);
  }, []);


  const forceLogout = async () => {
    try {
      // Clear all user data
      await clearAllUserData();

      // Reset auth state
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);

      // showToast("error", "Session expired. Logged out automatically.");
    } catch (error) {
      console.error('Error during force logout:', error);
      // Still reset state even if clearing fails
      setAuthData(null);
      setIsAuthenticated(false);
      setLeadId(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, authData, login, Glogin, firebaseGlogin, logout: showLogoutModal, leadId, setLeadId, setAuthData, forceLogout, clearAllUserData }}>
      {children}
      <LogoutModal visible={logoutModalVisible} onCancel={hideLogoutModal} onConfirm={handleLogout} />
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  const { authData, setLeadId, ...rest } = context;
  const userId = authData?.id ?? null;
  const userToken = authData?.token ?? null;
  const userEmail = authData?.email ?? null;
  return { ...rest, userId, userToken, userEmail, setLeadId };
};

export { AuthProvider, useAuth, AuthContext };
