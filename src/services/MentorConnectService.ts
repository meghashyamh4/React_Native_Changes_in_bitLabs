import apiClient from "./login/ApiClient";

export interface RegisteredMeeting {
    mentorConnectId: number;
    applicantId: number;
    registrationDate: number[];
}

export const getAllRegisteredMeetings = async (applicantId: number) => {
    try {
        const response = await apiClient.get(`/api/mentor-connect/applicant/getAllRegisteredMentorConnects/${applicantId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching registered meetings:", error);
        throw error;
    }
};

export const registerForMeeting = async (mentorConnectId: number, applicantId: number) => {
    try {
        const response = await apiClient.post(`/api/mentor-connect/registerMentorConnect/${mentorConnectId}/applicant/${applicantId}`);
        return response.data;
    } catch (error) {
        console.error("Error registering for meeting:", error);
        throw error;
    }
};

export const getMeetingById = async (id: number) => {
    try {
        const response = await apiClient.get(`/api/mentor-connect/getMeetingById/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        throw error;
    }
};
