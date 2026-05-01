/**
 * User Profile Validator Utility
 * 
 * Validates user profile completeness and determines navigation route
 */

import { fetchProfileId } from '@services/Create/createProfile';
import ProfileService from '@services/profile/ProfileService';
import resumeCall from '@services/profile/Resume';

export type ValidationResult = {
  route: 'step1' | 'step3' | 'home';
  reason: string;
  profileId: number;
  hasFirstName: boolean;
  hasResume: boolean;
};

/**
 * Validates user profile and determines navigation route
 * 
 * Flow:
 * A. Check profileId - Missing → Navigate to BasicForm1
 * B. Check firstName - Missing → Navigate to BasicForm1
 * C. Check Resume - Exists → Navigate to Home, Missing → Navigate to BasicForm3
 * 
 * @param userId - User ID
 * @param userToken - Authentication token
 * @returns Promise with validation result and recommended route
 */
export const validateUserProfile = async (
  userId: number,
  userToken: string
): Promise<ValidationResult> => {
  try {
    // Step A: Check profileId
    const profileIdResult = await fetchProfileId(userId, userToken);
    
    if (!profileIdResult.success) {
      return {
        route: 'step1',
        reason: 'Profile ID fetch failed',
        profileId: 0,
        hasFirstName: false,
        hasResume: false,
      };
    }

    const profileId = profileIdResult.profileid || 0;

    // If profileId is 0, user has no profile → Navigate to BasicForm1
    if (profileId === 0) {
      return {
        route: 'step1',
        reason: 'No profile exists (profileId === 0)',
        profileId: 0,
        hasFirstName: false,
        hasResume: false,
      };
    }

    // Step B: Check firstName
    let hasFirstName = false;
    try {
      const profileData = await ProfileService.fetchProfile(userToken, userId);
      hasFirstName = !!(profileData?.basicDetails?.firstName);
    } catch (error) {
      console.error('Error fetching profile for firstName check:', error);
    }

    // If firstName is missing → Navigate to BasicForm1
    if (!hasFirstName) {
      return {
        route: 'step1',
        reason: 'First name missing',
        profileId,
        hasFirstName: false,
        hasResume: false,
      };
    }

    // Step C: Check Resume
    let hasResume = false;
    try {
      const resumeResponse = await resumeCall(userId);
      hasResume = resumeResponse !== null && resumeResponse.status === 200;
    } catch (error: any) {
      // If resume API returns 404, user doesn't have resume
      if (error?.response?.status === 404) {
        hasResume = false;
      } else {
        console.error('Error fetching resume:', error);
        hasResume = false;
      }
    }

    // If resume exists → Navigate to Home
    if (hasResume) {
      return {
        route: 'home',
        reason: 'Profile complete (has firstName and resume)',
        profileId,
        hasFirstName: true,
        hasResume: true,
      };
    }

    // If resume missing → Navigate to BasicForm3
    return {
      route: 'step3',
      reason: 'Resume missing (has firstName but no resume)',
      profileId,
      hasFirstName: true,
      hasResume: false,
    };
  } catch (error) {
    console.error('Error validating user profile:', error);
    // Default to step1 on error
    return {
      route: 'step1',
      reason: 'Validation error - defaulting to new user flow',
      profileId: 0,
      hasFirstName: false,
      hasResume: false,
    };
  }
};

