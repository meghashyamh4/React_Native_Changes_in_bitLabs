/**
 * Login Navigation Utility
 * 
 * Determines the correct navigation route based on user profile completeness
 */

export type UserRouteType = 'step1' | 'step3' | 'home';

export interface UserProfileStatus {
  profileId: number;
  resumeStatus: number | null; // null if error, 200 if exists, 404 if missing
}

/**
 * Determines the next route for a user based on profile and resume status
 * 
 * @param profileId - Profile ID from API (0 = no profile, >0 = has profile)
 * @param resumeStatus - Resume API status (200 = exists, 404 = missing, null = error)
 * @returns UserRouteType - The route the user should be navigated to
 * 
 * Navigation Rules:
 * - If profileId !== 0 AND resume === 404: Step3 (partial profile, resume missing)
 * - If profileId === 0 OR resume === 404: Step1 (new user or no resume)
 * - Else (profileId exists AND resume exists): Home (complete user)
 */
export const getUserNextRoute = (
  profileId: number,
  resumeStatus: number | null
): UserRouteType => {
  // If profileId !== 0 AND resume === 404: Navigate to Step3
  // (User has partial profile but resume missing)
  if (profileId !== 0 && resumeStatus === 404) {
    return 'step3';
  }

  // If profileId === 0 OR resume === 404: Navigate to Step1
  // (Brand NEW user → start from Step 1)
  if (profileId === 0 || resumeStatus === 404) {
    return 'step1';
  }

  // Else (profileId exists AND resume exists): Navigate to Home
  // (Existing user → send to home dashboard)
  return 'home';
};

/**
 * Fetches user profile ID
 * 
 * @param userId - User ID
 * @param userToken - Authentication token
 * @returns Promise with profile ID (0 if no profile exists)
 */
export const fetchUserProfileId = async (
  userId: number,
  userToken: string
): Promise<number> => {
  try {
    const {fetchProfileId} = await import('@services/Create/createProfile');
    const result = await fetchProfileId(userId, userToken);
    
    if (result.success && result.profileid !== undefined) {
      return result.profileid;
    }
    
    // Default to 0 if fetch failed
    return 0;
  } catch (error) {
    console.error('Error fetching profile ID:', error);
    // Default to 0 (new user) on error
    return 0;
  }
};

/**
 * Fetches user resume status
 * 
 * @param userId - User ID
 * @returns Promise with resume status (200 = exists, 404 = missing, null = error)
 */
export const fetchUserResumeStatus = async (
  userId: number
): Promise<number | null> => {
  try {
    const resumeCall = (await import('@services/profile/Resume')).default;
    const resumeResponse = await resumeCall(userId);
    
    // If response exists and status is 200, user has resume
    if (resumeResponse !== null && resumeResponse.status === 200) {
      return 200;
    }
    
    // If response is null, treat as missing
    return 404;
  } catch (error: any) {
    // Check if error is 404 (resume not found)
    if (error?.response?.status === 404) {
      return 404;
    }
    
    // For other errors, return null
    console.error('Error fetching resume status:', error);
    return null;
  }
};

/**
 * Determines user navigation route by fetching profile and resume data
 * 
 * @param userId - User ID
 * @param userToken - Authentication token
 * @returns Promise with the route type user should be navigated to
 */
export const determineUserRoute = async (
  userId: number,
  userToken: string
): Promise<UserRouteType> => {
  try {
    // Fetch profile ID and resume status in parallel
    const [profileId, resumeStatus] = await Promise.all([
      fetchUserProfileId(userId, userToken),
      fetchUserResumeStatus(userId),
    ]);

    // Determine route based on profile and resume status
    return getUserNextRoute(profileId, resumeStatus);
  } catch (error) {
    console.error('Error determining user route:', error);
    // Default to step1 (new user) on error
    return 'step1';
  }
};

