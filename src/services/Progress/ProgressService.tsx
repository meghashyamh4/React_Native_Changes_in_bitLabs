import apiClient from '../login/ApiClient';

class ProgressService {
  saveProgress(data: {
    applicantId: number;
    courseId: number;
    courseName: string;
    overallProgress: number;
    totalProgress?: number;
    topicIndex?: number;
    topicName?: string;
    topicProgress?: number;
  }) {
    return apiClient.post('/api/progress', data);
  }

  getApplicantProgress(applicantId: string) {
    try {
      return apiClient.get(`/api/progress/applicant/${applicantId}`);
    } catch (error) {
      console.error('Error fetching applicant progress:', error);
      throw error;
    }
  }

  getCourseTopics(courseProgressId: number) {
    try {
      return apiClient.get(`/api/progress/topics/${courseProgressId}`);
    } catch (error) {
      console.error('Error fetching course topics progress:', error);
      throw error;
    }
  }

  // resetCourseProgress(applicantId: string, courseId: string) {
  //   return apiClient.delete(`/api/progress/reset/${applicantId}/${courseId}`);
  // }
}

export default new ProgressService();