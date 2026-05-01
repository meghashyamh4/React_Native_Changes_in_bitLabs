import {useState, useEffect, useContext} from 'react';
import {saveJob, applyJob, removeSavedJob} from '../../services/Jobs/JobDetails'; // Add removeSavedJob
import {useAuth} from '@context/Authcontext';
import {fetchJobDetails} from '@services/Jobs/RecommendedJobs';
import {fetchCompanyLogo} from '@services/Jobs/AppliedJob';
import UserContext from '@context/UserContext';
import {showToast} from '@services/login/ToastService';
const useJobDetailsViewModel = (jobId: string) => {
  const {userToken, userId} = useAuth();
  const [isJobSaved, setIsJobSaved] = useState(false);
  const [isJobApplied, setIsJobApplied] = useState(false);
  const [suggestedCourses, setSuggestedCourses] = useState<string[]>([]);
  const [percent, setPercent] = useState<number>(0);
  const [skillProgressText, setSkillProgressText] = useState<string | null>(null);
  const [perfectMatchSkills, setPerfectMatchSkills] = useState<string[]>([]);
  const [unmatchedSkills, setUnmatchedSkills] = useState<string[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const {refreshJobCounts, setIsJobsLoaded, setLastViewedJobIndex} = useContext(UserContext);
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const jobData = await fetchJobDetails(Number(jobId), userId, userToken);

        setSkillProgressText(jobData.matchStatus);
        setSuggestedCourses(jobData.sugesstedCourses);

        const matchPercentage = jobData.matchPercentage;
        const skillsRequired = jobData.skillsRequired.map(skill => skill.skillName.toUpperCase());

        setPerfectMatchSkills(jobData.matchedSkills.map((skill: any) => skill.skillName));
        setUnmatchedSkills(skillsRequired);
        setPercent(matchPercentage);

        // Fetch company logo
        if (jobData.recruiterId) {
          try {
            const logoData = await fetchCompanyLogo(jobData.recruiterId, userToken);

            if (logoData) {
              // Assuming logoData is an ArrayBuffer, convert it to Base64
              const base64Logo = logoData;

              setCompanyLogo(base64Logo); // Set the Base64-encoded company logo
            } else {
              setCompanyLogo(null); // Set to null if no logo data is received
            }
          } catch (error) {
            //console.error('Error fetching or converting company logo:', error);
            setCompanyLogo(null); // Default to null in case of an error
          }
        } else {
          setCompanyLogo(null); // Default if no recruiterId
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfileData();
  }, [jobId, userId, userToken]);

  const handleSaveJob = async (JobIndex: number) => {
    try {

      const result = await saveJob(userId, Number(jobId),userToken);
      
      if (result) {
        setIsJobSaved(true);
        setIsJobsLoaded(false);
        refreshJobCounts();
        setLastViewedJobIndex(JobIndex);
        showToast('success', 'Job saved successfully!');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('error', 'Failed to save job.');
    }
  };

  const handleApplyJob = async (JobIndex: number) => {
    try {
      const result = await applyJob(userId, Number(jobId), userToken);
      if (result) {
        setIsJobApplied(true);
        setIsJobsLoaded(false);
        refreshJobCounts();
        setLastViewedJobIndex(JobIndex);
        showToast('success', 'Job application submitted successfully!');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      showToast('error', 'Failed to apply for job.');
    }
  };

  const handleRemoveJob = async () => {
    try {
      const result = await removeSavedJob(Number(jobId), userId, userToken);
      if (result) {
        setIsJobSaved(false);
        setIsJobsLoaded(false);
        refreshJobCounts();
        showToast('success', 'Job removed successfully!');
      }
    } catch (error) {
      console.error('Error removing job:', error);
      showToast('error', 'Failed to remove job.');
    }
  };

  return {
    isJobSaved,
    isJobApplied,
    suggestedCourses,
    percent,
    skillProgressText,
    perfectMatchSkills,
    unmatchedSkills,
    companyLogo,
    handleSaveJob,
    handleApplyJob,
    handleRemoveJob, // Expose the new function
  };
};

export default useJobDetailsViewModel;
