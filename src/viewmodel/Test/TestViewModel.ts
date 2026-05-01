
import React, { useState, useContext } from "react";
import { submitTestResult } from "@services/Test/testService"; // Import the service
import { TestDetails } from "@models/Model"; // Assuming you have a model for test details
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "@models/model"; // Define your stack param list
import { updateLead, searchLead } from "@services/ZohoCrm";
import { useAuth } from "@context/Authcontext";
import UserContext from "@context/UserContext";

// Type the navigation object with your stack's params

export const useTestViewModel = (
  userId: number | any,
  jwtToken: string | null,
  testName: string,
) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [showEarlySubmissionModal, setShowEarlySubmissionModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const { leadId, setLeadId, userEmail } = useAuth();
  const { refreshScore } = useContext(UserContext);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const submitTest = async (finalScore: number, isEarlySubmission: boolean) => {
    if (!isMounted.current) return;

    const testStatus = isEarlySubmission
      ? 'F' // Early submission fails by default
      : finalScore >= 70
        ? "P" // Pass if score >= 70
        : "F"; // Fail otherwise
    const testDetails: TestDetails = {
      testName: testName,
      testScore: isEarlySubmission ? 0 : finalScore,
      testStatus: testStatus,
      testDateTime: new Date().toISOString(),
      applicant: { id: userId },
    };

    try {
      const response = await submitTestResult(userId, testDetails, jwtToken);

      if (!isMounted.current) return;

      if (response.status) {
        // Handle success
        setIsTestComplete(true);
        let leadData = {};
        if (testName === "General Aptitude Test") {
          leadData = {
            data: [
              {
                Owner: { id: "4569859000019865042" },
                GAT: finalScore >= 70 ? 'cleared' : 'failed',
                GAT_Score: Math.round(testDetails.testScore),
              },
            ],
          };
        }
        else if (testName === "Technical Test") {
          leadData = {
            data: [
              {
                Owner: { id: "4569859000019865042" },
                TT: finalScore >= 70 ? 'cleared' : 'failed',
                TT_Score: Math.round(testDetails.testScore),
              },
            ],
          };
        }
        // Attempt to update lead in Zoho CRM
        try {
          console.log("Searching for lead using email:", userEmail);
          const fetchedLeadId = await searchLead(userEmail);

          if (fetchedLeadId && isMounted.current) {
            console.log("Lead found with ID:", fetchedLeadId);
            setLeadId(fetchedLeadId); // Update the leadId state

            // Step 2: Update the Lead in Zoho CRM
            console.log("Updating Lead with ID:", fetchedLeadId);
            const res = await updateLead(fetchedLeadId, leadData);
            if (res?.status) {
              console.log("Lead update status:", res?.status);
            }
          } else {
            console.log("No lead found for email:", userEmail);
          }
        } catch (error) {
          console.error("Error updating lead:", error);
        }

        // Refresh score after test submission
        if (refreshScore && isMounted.current) {
          console.log("🔄 [TEST] Refreshing score after test submission...");
          await refreshScore();
        }

        if (!isMounted.current) return;

        // Navigation logic
        if (finalScore >= 70) {
          navigation.navigate("passContent", { finalScore, testName });
        } else {
          navigation.navigate('FailContent');
        }
      } else {
        console.error("Error during test submission:");
      }
    } catch (error) {
      console.error('Error during test submission:', error);
    }
  };

  return {
    isTestComplete,
    showEarlySubmissionModal,
    setShowEarlySubmissionModal,
    setIsTestComplete,
    submitTest,
    showTimeUpModal,
    setShowTimeUpModal,
  };
};
