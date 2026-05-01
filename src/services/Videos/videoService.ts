// services/Videos/videoService.ts
import apiClient from "../login/ApiClient";

const MAX_RETRIES = 3;

export const getRecommendedVideos = async (
  userId: number,
  jwtToken: string | null
) => {
  try {
    const res = await apiClient.get(`/videos/recommended/${userId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    console.log("✅ Recommended videos fetched successfully");
    return res.data || [];
  } catch (error) {
    console.error("❌ Error fetching recommended videos:", error);
    throw error;
  }
};

export const trackVideoWatch = async (
  userId: number,
  videoId: number,
  jwtToken: string | null
) => {
  console.log("🎬 [TRACK VIDEO] Starting track video API call:", {
    userId,
    videoId,
    hasToken: !!jwtToken,
    retries: MAX_RETRIES,
    timestamp: new Date().toISOString(),
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🎬 [TRACK VIDEO] Attempt ${attempt}/${MAX_RETRIES} - Calling API...`);

      const response = await apiClient.post(
        `/api/video-watch/track`,
        {
          applicantId: userId,
          videoId: videoId
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      console.log("✅ [TRACK VIDEO] SUCCESS - Video watch tracked:", {
        userId,
        videoId,
        attempt,
        responseStatus: response?.status,
        responseData: response?.data,
        timestamp: new Date().toISOString(),
      });

      return; // Success
    } catch (error: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const isServerError = error?.response?.status >= 500;

      console.log(`⚠️ [TRACK VIDEO] Attempt ${attempt}/${MAX_RETRIES} FAILED:`, {
        userId,
        videoId,
        errorMessage: error?.message,
        errorStatus: error?.response?.status,
        errorData: error?.response?.data,
        isServerError,
        isLastAttempt,
        timestamp: new Date().toISOString(),
      });

      if (isLastAttempt || !isServerError) {
        console.error("❌ [TRACK VIDEO] Final failure - Video watch tracking failed:", {
          userId,
          videoId,
          error: error?.message || error,
          errorStatus: error?.response?.status,
          errorData: error?.response?.data,
          timestamp: new Date().toISOString(),
        });
        // Don't throw on last attempt to avoid blocking UI
        if (!isLastAttempt) {
          throw error;
        }
        return;
      }

      // Wait before retry (exponential backoff)
      console.log(`🔄 [TRACK VIDEO] Retrying in ${attempt * 1000}ms...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
};

// Defensive default export to handle resolution ambiguity
const videoService = {
  getRecommendedVideos,
  trackVideoWatch,
};

export default videoService;
