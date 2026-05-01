
import { useEffect, useState } from 'react';
import { fetchJobStatusByJobAndApplicant } from '@services/Jobs/JobDetailsService';
import { JobDetails } from '@models/Model';

type JobStatus = {
  applyJobId: number;
  status: string;
  changeDate: [number, number, number];
  reason: string; 
  applyJob: string;

};

export const useJobDetailsViewModel = (
  job: Partial<JobDetails>,
  applicantId: number | string,
  userToken: string
) => {
  const [jobStatus, setJobStatus] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getJobStatus = async () => {
      if (!job?.id) {
        console.warn(' job.id is missing');
        setLoading(false);
        return;
      }
      if (!applicantId) {
        console.warn(' applicantId is missing');
        setLoading(false);
        return;
      }
      if (!userToken) {
        console.warn(' userToken is missing');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchJobStatusByJobAndApplicant(job.id, applicantId, userToken);
        setLoading(false);

        if (Array.isArray(data.jobStatus) && data.jobStatus.length > 0) {
          const sortedStatuses = [...data.jobStatus].sort((a, b) => {
            const dateA = new Date(a.changeDate[0], a.changeDate[1] - 1, a.changeDate[2]);
            const dateB = new Date(b.changeDate[0], b.changeDate[1] - 1, b.changeDate[2]);
            return dateA.getTime() - dateB.getTime(); 
          });
          setJobStatus(sortedStatuses);
        }
      } catch (error) {
        console.error('Error fetching job status:', error);
        setLoading(false);
      }
    };

    getJobStatus();
  }, [job, applicantId, userToken]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const formatDates = ([year, month, day]: [number, number, number]): string =>
    `${monthNames[month - 1]} ${day}, ${year}`;

  return {
    jobStatus,
    loading,
    formatDate,
    formatDates,
  };
};
