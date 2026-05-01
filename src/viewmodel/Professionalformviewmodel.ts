
import { useState, useEffect } from "react";
import { Keyboard } from "react-native";
import { useAuth } from "@context/Authcontext";
import { ProfileViewModel } from "@viewmodel/Profileviewmodel";
import { showToast } from "@services/login/ToastService";
import { ApplicantSkillBadge } from "@models/Model";
import { updateLead } from "@services/ZohoCrm";


interface Skill {
  id: number;
  skillName: string;
  experience: number;
}

interface ProfessionalDetailsFormProps {
  visible: boolean;
  onClose: () => void;
  qualification: string;
  specialization: string;
  skillsRequired: Skill[];
  experience: string;
  preferredJobLocations: string[];
  skillBadges: any[];
  onReload: () => void;
}

export const useProfessionalDetailsFormViewModel = ({
  visible,
  onClose,
  qualification: initialQualification = '',
  specialization: initialSpecialization = '',
  skillsRequired: initialSkills = [],
  experience: initialExperience = '',
  preferredJobLocations: initialLocations = [],
  skillBadges: applicantSkillBadges,
  onReload,
}: ProfessionalDetailsFormProps) => {
  const [qualification, setQualification] = useState<string>(initialQualification);
  const [specialization, setSpecialization] = useState<string>(initialSpecialization);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [experience, setExperience] = useState<string>(initialExperience);

  const [qualificationQuery, setQualificationQuery] = useState(initialQualification);
  const [specializationQuery, setSpecializationQuery] = useState(initialSpecialization);
  const [experienceQuery, setExperienceQuery] = useState(initialExperience);
  const [skillQuery, setSkillQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const [showQualificationList, setShowQualificationList] = useState(false);
  const [showSpecializationList, setShowSpecializationList] = useState(false);
  const [showExperienceList, setShowExperienceList] = useState(false);
  const [showSkillsList, setShowSkillsList] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const { userToken, userId, leadId } = useAuth();

  useEffect(() => {
    if (visible) {
      setQualification(initialQualification);
      setSpecialization(initialSpecialization);
      setLocations(initialLocations);
      setSkills(initialSkills);
      setExperience(initialExperience);
    }
  }, [
    visible,
    initialQualification,
    initialSpecialization,
    initialSkills,
    initialExperience,
    initialLocations,
  ]);

  const qualificationsOptions = ['B.Tech', 'MCA', 'Degree', 'Intermediate', 'Diploma'];
  const specializationsByQualification: Record<string, string[]> = {
    'B.Tech': [
      'Computer Science and Engineering (CSE)',
      'Electronics and Communication Engineering (ECE)',
      'Electrical and Electronics Engineering (EEE)',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CE)',
      'Aerospace Engineering',
      'Information Technology(IT)',
      'Chemical Engineering',
      'Biotechnology Engineering',
    ],
    MCA: [
      'Software Engineering',
      'Data Science',
      'Artificial Intelligence',
      'Machine Learning',
      'Information Security',
      'Cloud Computing',
      'Mobile Application Development',
      'Web Development',
      'Database Management',
      'Network Administration',
      'Cyber Security',
      'IT Project Management',
    ],
    Degree: [
      'Bachelor of Science (B.Sc) Physics',
      'Bachelor of Science (B.Sc) Mathematics',
      'Bachelor of Science (B.Sc) Statistics',
      'Bachelor of Science (B.Sc) Computer Science',
      'Bachelor of Science (B.Sc) Electronics',
      'Bachelor of Science (B.Sc) Chemistry',
      'Bachelor of Commerce (B.Com)',
    ],
    Intermediate: ['MPC', 'BiPC', 'CEC', 'HEC'],
    Diploma: [
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Electronics and Communication Engineering',
      'Computer Engineering',
      'Automobile Engineering',
      'Chemical Engineering',
      'Information Technology',
      'Instrumentation Engineering',
      'Mining Engineering',
      'Metallurgical Engineering',
      'Agricultural Engineering',
      'Textile Technology',
      'Architecture',
      'Interior Designing',
      'Fashion Designing',
      'Hotel Management and Catering Technology',
      'Pharmacy',
      'Medical Laboratory Technology',
      'Radiology and Imaging Technology',
    ],
  };

  const skillsOptions = [
    'Java',
    'C',
    'C++',
    'C Sharp',
    'Python',
    'HTML',
    'CSS',
    'JavaScript',
    'TypeScript',
    'Angular',
    'React',
    'Vue',
    'JSP',
    'Servlets',
    'Spring',
    'Spring Boot',
    'Hibernate',
    '.Net',
    'Django',
    'Flask',
    'SQL',
    'MySQL',
    'SQL-Server',
    'Mongo DB',
    'Selenium',
    'Regression Testing',
    'Manual Testing',
  ];
  const cities = [
    'Chennai',
    'Thiruvananthapuram',
    'Bangalore',
    'Hyderabad',
    'Coimbatore',
    'Kochi',
    'Madurai',
    'Mysore',
    'Thanjavur',
    'Pondicherry',
    'Vijayawada',
    'Pune',
    'Gurgaon',
  ];
  const experienceOptions = Array.from({length: 16}, (_, i) => i.toString());

  const [skillBadgesState, setSkillBadgesState] = useState<ApplicantSkillBadge[]>(
    applicantSkillBadges.filter((badge: ApplicantSkillBadge) => badge.flag === 'added'),
  );

  const toggleQualificationDropdown = () => {
    setShowQualificationList(!showQualificationList);
    setShowSpecializationList(false);
    setShowExperienceList(false);
    setShowSkillsList(false);
    setShowLocationList(false);
  };

  const toggleSpecializationDropdown = () => {
    setShowSpecializationList(!showSpecializationList);
    setShowQualificationList(false);
    setShowExperienceList(false);
    setShowSkillsList(false);
    setShowLocationList(false);
  };

  const toggleExperienceDropdown = () => {
    setShowExperienceList(!showExperienceList);
    setShowQualificationList(false);
    setShowSpecializationList(false);
    setShowSkillsList(false);
    setShowLocationList(false);
  };

  const toggleSkillsDropdown = () => {
    setShowSkillsList(!showSkillsList);
    setShowQualificationList(false);
    setShowSpecializationList(false);
    setShowExperienceList(false);
    setShowLocationList(false);
  };

  const toggleLocationDropdown = () => {
    setShowLocationList(!showLocationList);
    setShowQualificationList(false);
    setShowSpecializationList(false);
    setShowExperienceList(false);
    setShowSkillsList(false);
  };

  const closeAllDropdowns = () => {
    setShowQualificationList(false);
    setShowSpecializationList(false);
    setShowExperienceList(false);
    setShowSkillsList(false);
    setShowLocationList(false);
    Keyboard.dismiss();
  };

  const addSkill = (skillName: string) => {
    if (!skillsOptions.includes(skillName)) {
      showToast('error', `${skillName} is not a valid skill.`);
      return;
    }

    const skillExists = skills.find(s => s.skillName === skillName);
    const badgeSkillExists = skillBadgesState.find(badge => badge.skillBadge.name === skillName);

    if (badgeSkillExists) {
      const updatedSkillBadges = skillBadgesState.map(badge =>
        badge.skillBadge.name === skillName ? {...badge, flag: 'added'} : badge,
      );
      setSkillBadgesState(updatedSkillBadges);
    } else if (!skillExists) {
      const newSkill: Skill = {id: skills.length + 1, skillName, experience: 0};
      setSkills([...skills, newSkill]);
    }

    setSkillQuery('');
    setShowSkillsList(false);
  };

  const removeSkill = (id: number, fromBadge: boolean, skillName: string) => {
    if (fromBadge) {
      const updatedSkillBadges = skillBadgesState.map(badge =>
        badge.skillBadge.name === skillName ? {...badge, flag: 'removed'} : badge,
      );
      setSkillBadgesState(updatedSkillBadges);
    } else {
      const updatedSkills = skills.filter(s => s.id !== id);
      setSkills(updatedSkills);
    }

    setSkillQuery('');
  };

  const addLocation = (location: string) => {
    if (!cities.includes(location)) {
      showToast('error', `${location} is not a valid location.`);
      return;
    }
    if (!locations.includes(location)) {
      setLocations([...locations, location]);
    }
    setLocationQuery('');
    setShowLocationList(false);
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter(loc => loc !== location));
  };

  const handleSaveChanges = async () => {
    let errors: {[key: string]: string} = {};

    if (!qualification || !qualificationsOptions.includes(qualification)) {
      errors.qualification = 'Qualification is required';
    }

    const specializationOptions =
      specializationsByQualification[qualification as keyof typeof specializationsByQualification];

    if (!specialization || !specializationOptions?.includes(specialization)) {
      errors.specialization = 'Specialization is required';
    }
    const totalValidSkills =
      skills.length + skillBadgesState.filter(badge => badge.flag === 'added').length;

    if (totalValidSkills === 0) {
      errors.skills = 'At least one valid skill is required';
    }

    if (locations.length === 0) {
      errors.locations = 'At least one location is required';
    }

    if (!experience || !experienceOptions.includes(experience)) {
      errors.experience = 'Experience is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const skillsRequired = [
      ...skills,
      ...skillBadgesState
        .filter(badge => badge.flag === 'added')
        .map(badge => ({
          id: badge.skillBadge.id,
          skillName: badge.skillBadge.name,
          experience: 0,
        })),
    ];

    const requestBody = {
      experience,
      preferredJobLocations: locations,
      qualification,
      specialization,
      skillsRequired,
    };

    console.log('Request Body:', requestBody);

    try {
      const response = await ProfileViewModel.saveProfessionalDetails(
        userToken,
        userId,
        requestBody,
      );

      if (response.formErrors) {
        setValidationErrors(response.formErrors);
      } else if (response.success) {
        showToast('success', 'Professional details updated successfully');
        onClose();
        onReload();
        try {
          const leadData = {
            data: [
              {
                Owner: { id: "4569859000019865042" },

                Technical_Skills: requestBody.skillsRequired.map((skill: any) => ({
                  skillName: skill.skillName,
                })),
                Specialization: requestBody.specialization,
                Education_Qualifications: requestBody.qualification,
                Degree_level: requestBody.qualification,
                Total_work_experience_in_years: requestBody.experience,
                Preferred_Job_Locations: requestBody.preferredJobLocations.join(", "),
              },
            ],
          };
          console.log("Lead Data:", leadData);
          console.log("Lead Id:", leadId);
          const res = await updateLead(leadId, leadData);
          if (res?.status) {
            console.log("Lead updated status", res?.status);
          }

        } catch {
          console.log("Error updating lead");
        }
      } else {
        showToast('error', 'Error updating professional details');
        onClose();
        onReload();
      }
    } catch (error) {
      console.error('Internal error:', error);
      showToast('error', 'Error occurred while updating professional details');
    }
  };

  return {
    qualification,
    setQualification,
    specialization,
    setSpecialization,
    skills,
    setSkills,
    locations,
    setLocations,
    experience,
    setExperience,
    qualificationQuery,
    setQualificationQuery,
    specializationQuery,
    setSpecializationQuery,
    experienceQuery,
    setExperienceQuery,
    skillQuery,
    setSkillQuery,
    locationQuery,
    setLocationQuery,
    showQualificationList,
    setShowQualificationList,
    showSpecializationList,
    setShowSpecializationList,
    showExperienceList,
    setShowExperienceList,
    showSkillsList,
    setShowSkillsList,
    showLocationList,
    setShowLocationList,
    validationErrors,
    setValidationErrors,
    qualificationsOptions,
    specializationsByQualification,
    skillsOptions,
    cities,
    experienceOptions,
    skillBadgesState,
    setSkillBadgesState,
    toggleQualificationDropdown,
    toggleSpecializationDropdown,
    toggleExperienceDropdown,
    toggleSkillsDropdown,
    toggleLocationDropdown,
    closeAllDropdowns,
    addSkill,
    removeSkill,
    addLocation,
    removeLocation,
    handleSaveChanges,
  };
};
