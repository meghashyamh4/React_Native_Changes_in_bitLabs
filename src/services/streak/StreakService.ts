import apiClient from '../login/ApiClient';

export type StreakDetails = {
  currentStreak: number;
  monthlyRestoreRemaining: number;
  longestStreak: number;
  restoreAvailable: boolean;
  attemptedToday: boolean;
};

export type QuizQuestion = {
  question: string;
  description: string;
  options: {
    [key: string]: string;
  };
  correctAnswer: string;
  date: string | null;
};

export const fetchStreakDetails = async (
  userId: number | string,
): Promise<StreakDetails> => {
  try {
    const response = await apiClient.get(`/streak/${userId}/getStreakDetails`);
    console.log("Streak Details", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchStreakQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    const today = new Date();
    const dateString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const response = await apiClient.get(`/streak/questions/${dateString}`);
    console.log("Streak Questions", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
