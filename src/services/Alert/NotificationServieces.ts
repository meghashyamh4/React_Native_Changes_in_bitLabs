import {JobData} from '@models/Model';
import apiClient from '../login/ApiClient';

export interface JobAlert {
  id: number;
  message: string;
  feature: string;
  createdTime: number[];
  seenApplicantId?: number[];
  applicantId?: number[];
  featureId?: number; // ID of the specific item (hackathon/blog/video)
  seenStatus?: boolean; // Direct read status from API
  [key: string]: any; // Allow any additional fields from API response
}

export const fetchJobAlerts = async (
  userId: number | null,
  userToken: string | null,
  page: number = 0,
  limit: number = 15,
): Promise<JobAlert[]> => {
  try {
    if (!userId || !userToken) {
      return [];
    }
    const response = await apiClient.get(`/notifications/getNotifications/${userId}/`, {
      headers: { Authorization: `Bearer ${userToken}` },
      params: { page, limit },
    });
    const alerts = Array.isArray(response.data) ? response.data : [];
        console.log("notification response page", page, response.data)

    // Sort notifications by most recent first (based on createdTime)
    const sortedAlerts = alerts.sort((a, b) => {
      // Convert createdTime arrays to timestamps for comparison
      const dateA = a.createdTime && Array.isArray(a.createdTime) 
        ? new Date(a.createdTime[0], a.createdTime[1] - 1, a.createdTime[2]).getTime()
        : 0;
      const dateB = b.createdTime && Array.isArray(b.createdTime)
        ? new Date(b.createdTime[0], b.createdTime[1] - 1, b.createdTime[2]).getTime()
        : 0;
      
      return dateB - dateA; // Descending order (most recent first)
    });

    return sortedAlerts;
  } catch (error) {
    console.error('❌ ERROR fetching notifications:', error);
    return [];
  }
};


export const unseenCounts = async ( userId: number | null,
  userToken: string | null,
): Promise<number> => {
  try {
    const response = await apiClient.get(`/applyjob/applicants/${userId}/unread-alert-count`, {});
    console.log('Unseen count response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching job alerts:', error);
    throw error;
  }
};

export const markAlertAsSeen = async (
  alertId: number,
  userId: number | null,
  userToken: string | null,
): Promise<void> => {
  try {
    if (!userId || !userToken) return;
    await apiClient.put(
      `/notifications/${alertId}/move-to-seen/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
  } catch (error) {
    console.error('❌ ERROR marking notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async (
  userId: number | null,
  userToken: string | null,
): Promise<any> => {
  try {
    if (!userId || !userToken) return;
    const response = await apiClient.put(
      `/notifications/move-to-seen-everywhere/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` ,
                    "Content-Type": "application/json",} }
    );
    console.log("First API responce:",response);
    return response
  } catch (error) {
    console.error('❌ ERROR marking all as read:', error);
    throw error;
  }
};
const formatCreationDate = (dateArray: number[]): string => {
  if (!dateArray || dateArray.length !== 3) return 'Invalid Date';
  const [year, month, day] = dateArray;
  const paddedMonth = month.toString().padStart(2, '0');
  const paddedDay = day.toString().padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`; // YYYY-MM-DD
};

const mapJobData = (apiResponse: any, id: number | null, apply: number): JobData => {
    const rawDate = apiResponse.body.creationDate ?? [2024, 1, 1];
  return {
    id: id ?? 0, // Default to 0 if null
    companyname: apiResponse.body.companyname ?? '',
    jobTitle: apiResponse.body.jobTitle ?? '',
    location: apiResponse.body.location ?? '',
    employeeType: apiResponse.body.employeeType ?? '',
    minimumExperience: apiResponse.body.minimumExperience ?? 0,
    maximumExperience: apiResponse.body.maximumExperience ?? 0,
    minSalary: apiResponse.body.minSalary ?? 0,
    maxSalary: apiResponse.body.maxSalary ?? 0,
     creationDate: formatCreationDate(rawDate), 
    skillsRequired: apiResponse.body.skillsRequired
      ? apiResponse.body.skillsRequired.map((skill: any) => ({
          skillName: skill ?? '',
        }))
      : [], // Default to an empty array if no skills required
    jobStatus: apiResponse.body.jobStatus ?? '',
    logoFile: apiResponse.body.logoFile ?? null,
    description: apiResponse.body.description ?? '',
    matchPercentage: apiResponse.body.matchPercentage ?? '',
    matchStatus: apiResponse.body.matchStatus ?? '',
    sugesstedCourses: apiResponse.body.sugesstedCourses ?? [],
    matchedSkills: apiResponse.body.matchedSkills ?? [],
    applyJobId: apply ?? 0,
    recruiterId: apiResponse.body.recruiterId ?? 0,
  };
};

export const fetchJobDetails = async (
  jobId: number | null,
  userToken: string | null,
  apply: number,
) => {
  try {
    const response = await apiClient.get(`/viewjob/applicant/viewjob/${jobId}`);
    const jobData = mapJobData(response.data, jobId, apply);

    return jobData;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};



export const deleteJobAlert = async (
  alertId: number,
  userId: number | null,
  userToken: string | null,
): Promise<void> => {
  try {
    if (!userId || !userToken) return;
    await apiClient.delete(
      `/notifications/${alertId}/deleteNotification/${userId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const deleteAllNotifications = async (
  userId: number | null,
  userToken: string | null,
): Promise<void> => {
  try {
    if (!userId || !userToken) return;
    await apiClient.delete(
      `/notifications/deleteAllNotifications/${userId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

export const countOfUnseenNotifications = async (
  userId: number | null,
  userToken: string | null,
): Promise<number> => {
  try {
    if (!userId || !userToken) return 0;

    const response = await apiClient.get(
      `/notifications/count/${userId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    console.log("count of unseen notifications", response.data);
    console.log("count of notify", response.data.count)

return response.data;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return 0;
  }
};
