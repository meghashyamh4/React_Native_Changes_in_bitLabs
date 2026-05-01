


import axios from "axios";
import { Alert } from "react-native";
import { API_BASE_URL } from "@env";
import * as Keychain from "react-native-keychain";
import { getCachedToken, setCachedToken } from "@services/TokenManager";
import { showToast } from "@services/login/ToastService";

let logoutHandler: (() => void) | null = null;
let sessionExpiredAlertActive = false;

let interceptorId: number | null = null; // Store interceptor ID
let lastNoInternetAlertTime = 0; // timestamp in milliseconds

// Function to set logout handler from AuthContext
export const setLogoutHandler = (logoutFn: () => void) => {
  logoutHandler = logoutFn;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//Takes token from keychain ,
apiClient.interceptors.request.use(
  async config => {
    let token = getCachedToken(); // Get token from memory
    if (!token) {
      const tokenData = await Keychain.getGenericPassword({ service: "authToken" });
      if (tokenData) {
        token = tokenData.password; // Update the outer token variable
        setCachedToken(token); // Cache it for future requests
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token to header
    }
    return config;
  },
  error => Promise.reject(error),
);

// Interceptor to handle errors
const responseInterceptor = async (error: any) => {
  // Handle no internet / network errors:
  if (!error.response) {
    const now = Date.now();
    // Check if 4 minutes have passed since the last no internet alert
    if (now - lastNoInternetAlertTime > 1 * 60 * 1000) {
      lastNoInternetAlertTime = now;
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK" }],
      );
    }
    return Promise.reject(error);
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    if (!sessionExpiredAlertActive) {
      sessionExpiredAlertActive = true; // Activate the flag so it won't trigger again immediately

      if (logoutHandler) {
        logoutHandler(); // Log out user
      }

      showToast("error", "Your session has expired. Please log in again.");

      // Reset flag after toast visibility time (5 seconds) to allow future toasts if needed
      setTimeout(() => {
        sessionExpiredAlertActive = false;
      }, 5000);
    }
  }

  return Promise.reject(error);
};

// Add interceptor and store ID
interceptorId = apiClient.interceptors.response.use(response => response, responseInterceptor);

// Function to remove interceptors when logging out
export const removeInterceptors = () => {
  if (interceptorId !== null) {
    apiClient.interceptors.response.eject(interceptorId);
    interceptorId = null; // Reset ID
  }
};

export default apiClient;