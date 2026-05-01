import apiClient from '../login/ApiClient';

export const ProfileApiService = {
  // Fetch applicant card
  async fetchCard(userId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(`/applicant-card/${userId}/getApplciantCard`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      // Convert lastUpdated from array format to timestamp (milliseconds)
      let lastUpdatedTimestamp: number | null = null;
      if (data.lastUpdated) {
        if (Array.isArray(data.lastUpdated)) {
          // Array format: [year, month, day, hour, minute, second, nanoseconds]
          // Note: month is 1-indexed in the array (12 = December)
          const [year, month, day, hour = 0, minute = 0, second = 0] = data.lastUpdated;
          if (year && month && day) {
            const date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in Date
            if (!isNaN(date.getTime())) {
              lastUpdatedTimestamp = Math.floor(date.getTime() / 1000); // Convert to seconds timestamp
            }
          }
        } else if (typeof data.lastUpdated === 'string') {
          // ISO string format
          const date = new Date(data.lastUpdated);
          if (!isNaN(date.getTime())) {
            lastUpdatedTimestamp = Math.floor(date.getTime() / 1000);
          }
        } else if (typeof data.lastUpdated === 'number') {
          // Already a timestamp
          lastUpdatedTimestamp = data.lastUpdated;
        }
      }

      // Map API response field names to internal field names
      const mappedData = {
        ...data,
        passYear: data.passOutyear || data.passYear || null, // Map passOutyear to passYear for internal use
        lastUpdated: lastUpdatedTimestamp, // Use converted timestamp
      };
      return { success: true, data: mappedData };
    } catch (error: any) {
      console.error('Failed to fetch card:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update applicant card
  async updateCard(userId: number, userToken: string, cardData: any) {
    try {
      const { data } = await apiClient.put(`/applicant-card/${userId}/updateApplicantCard`, cardData, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch score
  async fetchScore(userId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(
        `/applicant-scores/applicant/${userId}/getTotalScore`,
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      let score = 0;
      if (data && typeof data === 'object') {
        score = data.totalScore ?? data.score ?? 0;
      } else if (typeof data === 'number') {
        score = data;
      } else if (typeof data === 'string') {
        const patterns = [
          /is\s+(-?\d+)\b/i,
          /score\s*[:\-]\s*(-?\d+)\b/i,
          /total\s+score\s+is\s+(-?\d+)\b/i,
        ];
        for (const regex of patterns) {
          const match = data.match(regex);
          if (match) {
            score = parseInt(match[1], 10);
            break;
          }
        }
      }
      return { success: true, score };
    } catch (error: any) {
      console.warn('Scores API failed', error);
      return { success: false, score: 0 };
    }
  },

  // Fetch score details (level, badge, progress)
  async fetchApplicantScoreDetails(applicantId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(
        `/applicant-scores/applicant/${applicantId}/getApplicantScoreDetails`,
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      return { success: true, data };
    } catch (error: any) {
      console.error('Failed to fetch applicant score details:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch summary
  async fetchSummary(userId: number, userToken: string) {
    try {
      console.log('📡 [API] Fetching summary for userId:', userId);
      const { data } = await apiClient.get(`applicant-summary/${userId}/getApplicantSummary`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      console.log('📥 [API] Summary response:', JSON.stringify(data, null, 2));

      // Handle different response structures
      const summaryText = data?.summary || data || '';
      const trimmedSummary = typeof summaryText === 'string' ? summaryText.trim() : '';

      console.log('✅ [API] Summary fetched:', { length: trimmedSummary.length, preview: trimmedSummary.substring(0, 50) });
      return { success: true, summary: trimmedSummary };
    } catch (error: any) {
      console.error('❌ [API] Failed to fetch summary:', {
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      return { success: false, summary: '' };
    }
  },

  // Update summary
  async updateSummary(userId: number, userToken: string, summary: string) {
    try {
      console.log('📤 [API] Updating summary:', { userId, summaryLength: summary.length });

      const { data } = await apiClient.put(
        `applicant-summary/${userId}/updateApplicantSummary`,
        { summary },
        { headers: { Authorization: `Bearer ${userToken}` } },
      );

      console.log('✅ [API] Summary updated successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to update summary:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch personal details
  async fetchPersonalDetails(userId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(`/applicant-personal/${userId}/getApplicantPersonalDetails`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      // Map API response to internal format (if needed)
      const mappedData = {
        ...data,
        fullName: data.name || data.fullName || '', // Map name to fullName for UI
      };

      return { success: true, data: mappedData || {} };
    } catch (error: any) {
      console.error('Failed to fetch personal details:', error);
      return { success: false, data: {} };
    }
  },

  // Update personal details
  async updatePersonalDetails(userId: number, userToken: string, personalData: any) {
    try {
      // Map internal format to API format
      const apiPayload = {
        address: personalData.address || '',
        dateOfBirth: personalData.dateOfBirth || '',
        email: personalData.email || '',
        gender: personalData.gender || '',
        knownLanguages: personalData.knownLanguages || [],
        name: personalData.name || personalData.fullName || '', // Map fullName to name for API
        phone: personalData.phone || '',
        pincode: personalData.pincode || '',
      };

      console.log('📤 [API] Updating personal details:', JSON.stringify(apiPayload, null, 2));

      const { data } = await apiClient.put(
        `/applicant-personal/${userId}/updateApplicantPersonalDetails`,
        apiPayload,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      console.log('✅ [API] Personal details updated successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to update personal details:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch education
  async fetchEducation(userId: number, userToken: string) {
    try {
      console.log('📡 [API] Fetching education for userId:', userId);
      const { data } = await apiClient.get(`/applicant-education/${userId}/getApplciantEducationDetails`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      console.log('📥 [API] Education response:', JSON.stringify(data, null, 2));
      return { success: true, data: data || { graduation: {}, classXii: {}, classX: {} } };
    } catch (error: any) {
      console.error('❌ [API] Failed to fetch education:', error);
      return { success: false, data: { graduation: {}, classXii: {}, classX: {} } };
    }
  },

  // Update education
  async updateEducation(userId: number, userToken: string, educationData: any) {
    try {
      console.log('📡 [API] Updating education for userId:', userId);
      console.log('📤 [API] Education payload:', JSON.stringify(educationData, null, 2));
      const { data } = await apiClient.put(`/applicant-education/${userId}/updateApplciantEducationDetails`, educationData, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      console.log('✅ [API] Education update success:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Education update error:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      console.error('❌ [API] Error status:', error.response?.status);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch all projects (returns array)
  async fetchProjects(userId: number, userToken: string) {
    try {
      console.log('📡 [API] Fetching projects for userId:', userId);
      const { data } = await apiClient.get(`/applicant-projects/${userId}/getApplicantProjects`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      console.log('📥 [API] Projects response:', JSON.stringify(data, null, 2));

      // API returns an array of projects
      const projects = Array.isArray(data) ? data : [];

      console.log(`✅ [API] Fetched ${projects.length} projects`);
      return { success: true, projects };
    } catch (error: any) {
      console.error('❌ [API] Failed to fetch projects:', error);
      return { success: false, projects: [] };
    }
  },

  // Fetch single project by ID
  async fetchProjectById(userId: number, userToken: string, projectId: number) {
    try {
      console.log(`📡 [API] Fetching project by ID: ${projectId}`);
      const { data } = await apiClient.get(
        `/applicant-projects/${userId}/getApplicantProjectById/${projectId}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log('📥 [API] Project by ID response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to fetch project by ID:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Create new project
  async createProject(userId: number, userToken: string, projectData: any) {
    try {
      console.log('📤 [API] Creating new project:', JSON.stringify(projectData, null, 2));

      const apiPayload = {
        projectDescription: projectData.projectDescription || '',
        projectTitle: projectData.projectTitle || '',
        roleDescription: projectData.roleDescription || '',
        roleInProject: projectData.roleInProject || '',
        specialization: projectData.specialization || '',
        teamSize: projectData.teamSize || 0,
        technologiesUsed: projectData.technologiesUsed || '',
      };

      const { data } = await apiClient.post(
        `/applicant-projects/${userId}/saveApplicantProject`,
        apiPayload,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      console.log('✅ [API] Project created successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to create project:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update existing project by ID
  async updateProjectById(userId: number, userToken: string, projectId: number, projectData: any) {
    try {
      console.log(`📤 [API] Updating project ID ${projectId}:`, JSON.stringify(projectData, null, 2));

      const apiPayload = {
        projectDescription: projectData.projectDescription || '',
        projectTitle: projectData.projectTitle || '',
        roleDescription: projectData.roleDescription || '',
        roleInProject: projectData.roleInProject || '',
        specialization: projectData.specialization || '',
        teamSize: projectData.teamSize || 0,
        technologiesUsed: projectData.technologiesUsed || '',
      };

      const { data } = await apiClient.put(
        `/applicant-projects/${userId}/updateApplicantProject/${projectId}`,
        apiPayload,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      console.log('✅ [API] Project updated successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to update project:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Delete project by ID
  async deleteProject(userId: number, userToken: string, projectId: number) {
    try {
      console.log(`🗑️ [API] Deleting project ID: ${projectId}`);
      const { data } = await apiClient.delete(
        `/applicant-projects/${userId}/deleteApplicantProject/${projectId}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );
      console.log('✅ [API] Project deleted successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [API] Failed to delete project:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch skills
  async fetchSkills(userId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(`/applicantprofile/${userId}/skills`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      return { success: true, skills: Array.isArray(data) ? data : [] };
    } catch (error: any) {
      return { success: false, skills: [] };
    }
  },

  // Update skills
  async updateSkills(userId: number, userToken: string, skills: string[]) {
    try {
      const { data } = await apiClient.put(
        `/applicantprofile/${userId}/skills`,
        { skills },
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Fetch skill badges
  async fetchSkillBadges(userId: number, userToken: string) {
    try {
      const { data } = await apiClient.get(`/skill-badges/${userId}/skill-badges`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const badges = data?.applicantSkillBadges || [];
      // Return ALL badges, not just passed/failed ones
      return { success: true, badges: badges };
    } catch (error: any) {
      return { success: false, badges: [] };
    }
  },

  // Check resume availability
  async checkResume(userId: number, userToken: string) {
    try {
      const res = await apiClient.get(`/applicant-pdf/getresume/${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
        responseType: 'blob',
        validateStatus: s => (s >= 200 && s < 300) || s === 404,
      });
      return { success: true, available: res.status !== 404 && res.data?.size > 0 };
    } catch (error: any) {
      return { success: false, available: false };
    }
  },
};

