import { useState, useContext } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { submitSkillBadge } from '@services/Test/SkillBadgeService';
import { RootStackParamList } from '@models/model';
import UserContext from '@context/UserContext';

export const useSkillTestViewModel = (
  userId: number | any,
  jwtToken: string | null,
  testName: string,
) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const { refreshScore } = useContext(UserContext);

  // Skill Test Submission Logic
  const submitSkillTest = async (finalScore: number, isEarlySubmission: boolean) => {
    const testStatus = isEarlySubmission
      ? 'FAILED' // Early submission fails by default
      : finalScore >= 70
        ? 'PASSED' // Pass if score >= 70
        : 'FAILED'; // Fail otherwise

    try {
      const data = {
        applicantId: userId, // userId as applicantId
        skillBadgeName: testName, // testName as skillBadgeName
        status: testStatus, // testStatus as status
      };

      // Only send the necessary data to the API for the skill test
      const response = await submitSkillBadge(
        data.applicantId,
        data.skillBadgeName,
        data.status,
        jwtToken,
      );

      if (response === 'ApplicantSkillBadge saved successfully') {
        setIsTestComplete(true);

        // Refresh score after skill test submission
        if (refreshScore) {
          console.log("🔄 [SKILL TEST] Refreshing score after skill test submission...");
          await refreshScore();
        }

        // Navigate based on skill test result
        if (isEarlySubmission) {
          // Early submissions don't show pass/fail, just acknowledge exit
          navigation.navigate('FailContent');
        } else if (finalScore >= 70) {
          navigation.navigate('passContent', { finalScore, testName });
        } else {
          navigation.navigate('FailContent');
        }
      } else {
        console.error('Error during skill test submission');
      }
    } catch (error) {
      console.error('Error during submission:', error);
    }
  };

  return {
    isTestComplete,
    setIsTestComplete,
    submitSkillTest,
    finalScore,
  };
};
