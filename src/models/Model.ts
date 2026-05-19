// src/models/Models.ts

export interface LoginErrors {
  username?: string;
  password?: string;
}

export interface SignupErrors {
  name?: string;
  email?: string;
  whatsappnumber?: string;
  password?: string;
  userRegistered?: string;
}
export interface ForgotErrors {
  email?: string;
  response?: string;
  password?: string;
  message?: string;
}

export interface TestDetails {
  testName: string;
  testScore: number;
  testStatus: 'P' | 'F'; // Pass or Fail
  testDateTime: string; // ISO string format
  applicant: { id: number }; // Assuming applicant is an object with an id
}
export interface SkillBadge {
  id: number;
  name: string;
}

export interface ApplicantSkillBadge {
  flag: string;
  id: number;
  skillBadge: SkillBadge;
  status: string;
  testTaken: string;
}
export interface ProfileData {
  applicant: string;
  basicDetails: string;
  skillsRequired: Skill[];
  qualification: string;
  specialization: string;
  preferredJobLocations: string[];
  experience: string;
  applicantSkillBadges: ApplicantSkillBadge[];
}

export interface Skill {
  id: number;
  skillName: string;
}
// /src/Types/jobTypes.ts
export interface Skill {
  skillName: string;
}

export interface JobData1 {
  id: number;
  companyname: string;
  jobTitle: string;
  location: string;
  employeeType: string;
  minimumExperience: number;
  maximumExperience: number;
  minSalary: number;
  maxSalary: number;
  creationDate: [number, number, number]; // [Year, Month, Day]
  skillsRequired: Skill[];
  jobStatus: string;
  logoFile: string | null;
  recruiterId: number;
}
export type JobDetails = {
  id: number;
  applyJobId: number;
  jobTitle: string;
  companyname: string;
  location: string;
  minimumExperience: number;
  maximumExperience: number;
  minSalary: number;
  maxSalary: number;
  employeeType: string;
  creationDate: [number, number, number];
};
// /src/Types/jobTypes.ts

export type RootStackParamList1 = {
  Home: undefined;
  JobDetails: { job: JobData }; // Define the Job type as per your data structure
};

export interface JobData {
  id: number;
  companyname: string;
  jobTitle: string;
  location: string;
  employeeType: string;
  applyJobId: number;
  minimumExperience: number;
  maximumExperience: number;
  minSalary: number;
  maxSalary: number;
  creationDate: string; // [Year, Month, Day]
  skillsRequired: { skillName: string }[];
  jobStatus: string;
  logoFile: string | null;
  description: string;
  matchPercentage: number;
  matchStatus: string;
  sugesstedCourses: string[];
  matchedSkills: string[];
  recruiterId: number;
}

export interface JobCounts {
  recommendedJobs: number;
  appliedJobs: number;
  savedJobs: number;
}

export type RootStackParamList = {
  ForgotPassword: undefined;
  LandingPage: undefined;
  BottomTab: { shouldShowStep1?: boolean; welcome?: string; screen?: string } | undefined;
  Step1: { email: string | null };
  Step2: { updateShouldShowStep1?: React.Dispatch<React.SetStateAction<boolean>> };
  TestInstruction: { testName: string };
  TestScreen: { questions: any[] };
  Jobs: { tab: 'recommended' | 'applied' | 'saved' };
  JobDetails: { job: any; JobIndex: number };
  JobDetailsScreen: { job: any };
  ViewJobDetails: { job: any };
  AppliedJobs: { job: any };
  SavedDetails: { job: any };
  SavedJobs: undefined;
  Profile: { retake?: boolean } | undefined;
  ImagePreview: { uri: string; retake?: boolean };
  passContent: { finalScore: number; testName: string };
  FailContent: undefined;
  TimeUp: undefined;
  Badges: { skillName: string; testType: string } | undefined;
  ChangePassword: undefined;
  Notification: undefined;
  ResumeBuilder: undefined;
  Home: { welcome: string } | undefined;
  Drives: undefined;
  'My Resume': undefined;
  TechVibes: { blogId?: number } | undefined;
  Videos: undefined;
  VerifiedVideosScreen: { videoId?: number } | undefined;
  Hackathon: { tab?: 'MY' | 'RECOMMENDED' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' } | undefined;
  ApplicantHackathonDetails: { id: number; tab?: 'MY' | 'RECOMMENDED' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' };
  ApplicantSubmitHackathon: { hackathonId: number };
  Blogs: undefined;
  MentorConnect: { meetingId?: string | number } | undefined;
  Arena: { tab?: 'MY' | 'RECOMMENDED' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' } | undefined;
  'Mentor Sphere': undefined;
  InterviewPreparation: undefined;
  TechbuzzVideos: undefined;
  Dashboard: undefined;
  ProfileCards: undefined;
  ArenaCard: undefined;
  Mentors: undefined;
  MentorDetail: undefined;
  Resume: undefined;
  Splash: undefined;
  Shorts: undefined;
  FeedbackFormsList: undefined;
  FeedbackFormDetails: { formId: number; title: string };
  LMSMainPage: undefined;
  ScormPlayer: { url?: string; progress: number; courseId: number; courseName: string };
};

// Define the type for the test data
export interface TestData {
  testName: string;
  duration: string;
  numberOfQuestions: number;
  topicsCovered: string[];
  questions?: {
    id: number;
    question: string;
    options: string[];
    answer: string;
  }[];
}

