import apiClient from "../login/ApiClient";

export const trackAnalyticsEvent = async (feature: string, userId: number | null) => {
    if (!userId) {
        console.warn("📊 [Analytics] userId is missing, event not tracked.");
        return;
    }

    const payload = {
        feature,
        userId,
    };

    console.log("📊 [Analytics] Tracking Event:", payload);

    try {
        const response = await apiClient.post("/api/analytics/event", payload);
        console.log("📊 [Analytics] Event tracked successfully:", response.data);
        console.log("payload",payload)
        console.log("response",response)
        return response.data;
    } catch (error) {
        console.error("📊 [Analytics] Error tracking event:", error);
        throw error;
    }
};
