import {useState, useEffect} from 'react';
import {fetchCompanyLogo} from '@services/Jobs/AppliedJob';
import {JobData} from '@models/Model';

export const useLogos = (jobs: JobData[], token: string) => {
  const [logos, setLogos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      if (jobs.length > 0) {
        const logoPromises = jobs.map(async job => {
          if (job.recruiterId) {
            try {
              const logo = await fetchCompanyLogo(Number(job.recruiterId), token);
              return {[job.id]: logo};
            } catch (error) {
              console.error(`Error fetching logo for recruiterId ${job.recruiterId}:`, error);
              return {[job.id]: null};
            }
          }
          return {[job.id]: null};
        });

        const logoDataArray = await Promise.all(logoPromises);
        const logoData = logoDataArray.reduce((acc, logo) => ({...acc, ...logo}), {});
        setLogos(logoData);
      }
      setLoading(false);
    };

    fetchLogos();
  }, [jobs, token]);

  return {logos, loading};
};
