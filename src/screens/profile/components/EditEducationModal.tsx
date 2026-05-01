import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import { ProfileApiService } from '@services/profile/ProfileApiService';
import { showToast } from '@services/login/ToastService';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@components/Toast/toast_config';

// Dropdown options
const degreeOptions = [
  "B.E / B.Tech", "B.Sc", "BCA", "Diploma", "B.Com", "BBA", "M.E / M.Tech", "M.Sc", "MCA"
];

const courseTypeOptions = ["Full time", "Part time", "Distance"];

const gradingOptions = ["Percentage", "CGPA"];

const boardOptions = ["CBSE", "ICSE", "State Board", "Other"];

const yearRange = (from: number, to: number) => {
  const arr: number[] = [];
  for (let y = to; y >= from; y--) arr.push(y);
  return arr;
};

const YEARS = yearRange(1980, 2029);

const percentBuckets = [
  "≥ 90", "80–89", "70–79", "60–69", "< 60"
];

// Helper function to convert percentage bucket string to number
// API might expect numeric value instead of bucket string
const convertPercentBucketToNumber = (bucket: string): number | null => {
  if (!bucket) return null;

  // Extract number from bucket string
  if (bucket.includes('≥')) {
    // "≥ 90" -> 90
    const match = bucket.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } else if (bucket.includes('–') || bucket.includes('-')) {
    // "80–89" -> 85 (average)
    const match = bucket.match(/(\d+)[–-](\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.round((min + max) / 2);
    }
  } else if (bucket.includes('<')) {
    // "< 60" -> 55 (or could be 50)
    const match = bucket.match(/(\d+)/);
    return match ? Math.max(0, parseInt(match[1], 10) - 5) : null;
  }

  return null;
};

const getSpecializationOptions = (qualification: string | any): string[] => {
  switch (qualification) {
    case 'B.E / B.Tech':
    case 'B.Tech':
      return [
        'Computer Science and Engineering (CSE)',
        'Electronics and Communication Engineering (ECE)',
        'Electrical and Electronics Engineering (EEE)',
        'Mechanical Engineering (ME)',
        'Civil Engineering (CE)',
        'Aerospace Engineering',
        'Information Technology (IT)',
        'Chemical Engineering',
        'Biotechnology Engineering',
      ];
    case 'MCA':
      return [
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
      ];
    case 'B.Sc':
    case 'Degree':
      return [
        'Bachelor of Science (B.Sc) Physics',
        'Bachelor of Science (B.Sc) Mathematics',
        'Bachelor of Science (B.Sc) Statistics',
        'Bachelor of Science (B.Sc) Computer Science',
        'Bachelor of Science (B.Sc) Electronics',
        'Bachelor of Science (B.Sc) Chemistry',
        'Bachelor of Commerce (B.Com)',
      ];
    case 'Intermediate':
      return ['MPC', 'BiPC', 'CEC', 'HEC'];
    case 'Diploma':
      return [
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
      ];
    default:
      return [];
  }
};

interface EditEducationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialData: any;
}

const EditEducationModal: React.FC<EditEducationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    graduation: {
      degree: '',
      university: '',
      specialization: '',
      courseType: '',
      startYear: '',
      endYear: '',
      marksPercent: '',
    },
    classXii: {
      board: '',
      passingYear: '',
      marksPercent: '',
    },
    classX: {
      board: '',
      passingYear: '',
      marksPercent: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    graduation: true,
    classXii: true,
    classX: true,
  });
  // Dropdown states for DropDownPicker (pure select components)
  const [degreeOpen, setDegreeOpen] = useState(false);
  const [specializationOpen, setSpecializationOpen] = useState(false);
  const [courseTypeOpen, setCourseTypeOpen] = useState(false);
  const [startYearOpen, setStartYearOpen] = useState(false);
  const [endYearOpen, setEndYearOpen] = useState(false);
  const [xiiBoardOpen, setXiiBoardOpen] = useState(false);
  const [xiiYearOpen, setXiiYearOpen] = useState(false);
  const [xBoardOpen, setXBoardOpen] = useState(false);
  const [xYearOpen, setXYearOpen] = useState(false);

  // Separate state for degree, specialization, courseType (like qualification in professionalDetails.tsx)
  const [degree, setDegree] = useState<string>(formData.graduation.degree || '');
  const [specialization, setSpecialization] = useState<string>(formData.graduation.specialization || '');
  const [courseType, setCourseType] = useState<string>(formData.graduation.courseType || '');
  const [gradMarks, setGradMarks] = useState<string>(formData.graduation.marksPercent || '');
  // Separate state for Class XII and Class X dropdowns
  const [xiiBoard, setXiiBoard] = useState<string>(formData.classXii.board || '');
  const [xiiMarks, setXiiMarks] = useState<string>(formData.classXii.marksPercent || '');
  const [xBoard, setXBoard] = useState<string>(formData.classX.board || '');
  const [xMarks, setXMarks] = useState<string>(formData.classX.marksPercent || '');

  useEffect(() => {
    if (visible && initialData) {
      // Parse initial data and convert numbers to strings for form inputs
      const initialDegree = initialData.graduation?.degree || '';
      const initialSpecialization = initialData.graduation?.specialization || '';
      const initialCourseType = initialData.graduation?.courseType || '';
      const initialGradMarks = initialData.graduation?.marksPercent?.toString() || '';
      const initialXiiBoard = initialData.classXii?.board || '';
      const initialXiiMarks = initialData.classXii?.marksPercent?.toString() || '';
      const initialXBoard = initialData.classX?.board || '';
      const initialXMarks = initialData.classX?.marksPercent?.toString() || '';
      setDegree(initialDegree);
      setSpecialization(initialSpecialization);
      setCourseType(initialCourseType);
      setGradMarks(initialGradMarks);
      setXiiBoard(initialXiiBoard);
      setXiiMarks(initialXiiMarks);
      setXBoard(initialXBoard);
      setXMarks(initialXMarks);
      setFormData({
        graduation: {
          degree: initialDegree,
          university: initialData.graduation?.university || '',
          specialization: initialSpecialization,
          courseType: initialCourseType,
          startYear: initialData.graduation?.startYear?.toString() || '',
          endYear: initialData.graduation?.endYear?.toString() || '',
          marksPercent: initialGradMarks,
        },
        classXii: {
          board: initialXiiBoard,
          passingYear: initialData.classXii?.passingYear?.toString() || '',
          marksPercent: initialXiiMarks,
        },
        classX: {
          board: initialXBoard,
          passingYear: initialData.classX?.passingYear?.toString() || '',
          marksPercent: initialXMarks,
        },
      });
      setErrors({});
      closeAllDropdowns();
    } else if (!visible) {
      setDegree('');
      setSpecialization('');
      setCourseType('');
      setGradMarks('');
      setXiiBoard('');
      setXiiMarks('');
      setXBoard('');
      setXMarks('');
      closeAllDropdowns();
    }
  }, [visible, initialData]);

  // Sync degree and specialization to formData (like in professionalDetails.tsx)
  useEffect(() => {
    if (degree !== formData.graduation.degree) {
      handleChange('graduation', 'degree', degree);
      // Clear specialization when degree changes
      setSpecialization('');
      handleChange('graduation', 'specialization', '');
    }
  }, [degree]);

  useEffect(() => {
    if (specialization !== formData.graduation.specialization) {
      handleChange('graduation', 'specialization', specialization);
    }
  }, [specialization]);

  useEffect(() => {
    if (courseType !== formData.graduation.courseType) {
      handleChange('graduation', 'courseType', courseType);
    }
  }, [courseType]);

  useEffect(() => {
    if (gradMarks !== formData.graduation.marksPercent) {
      handleChange('graduation', 'marksPercent', gradMarks);
    }
  }, [gradMarks]);

  useEffect(() => {
    if (xiiBoard !== formData.classXii.board) {
      handleChange('classXii', 'board', xiiBoard);
    }
  }, [xiiBoard]);

  useEffect(() => {
    if (xiiMarks !== formData.classXii.marksPercent) {
      handleChange('classXii', 'marksPercent', xiiMarks);
    }
  }, [xiiMarks]);

  useEffect(() => {
    if (xBoard !== formData.classX.board) {
      handleChange('classX', 'board', xBoard);
    }
  }, [xBoard]);

  useEffect(() => {
    if (xMarks !== formData.classX.marksPercent) {
      handleChange('classX', 'marksPercent', xMarks);
    }
  }, [xMarks]);

  const handleChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
    setErrors(prev => {
      const errorKey = `${section}.${field}`;
      if (prev[errorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prev;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Get all year values first for chronological validation
    const gradStartYear = formData.graduation.startYear?.trim();
    const gradEndYear = formData.graduation.endYear?.trim();
    const xiiYear = formData.classXii.passingYear?.trim();
    const xYear = formData.classX.passingYear?.trim();

    // Validate Graduation fields - ALL REQUIRED, minimum 3 characters
    const gradDegree = formData.graduation.degree?.trim();
    const gradUniversity = formData.graduation.university?.trim();
    const gradSpecialization = specialization?.trim() || formData.graduation.specialization?.trim();

    // Degree validation - REQUIRED, minimum 3 characters
    if (!gradDegree) {
      newErrors['graduation.degree'] = 'Degree is required';
    } else if (gradDegree.length < 3) {
      newErrors['graduation.degree'] = 'Degree must be at least 3 characters';
    }

    // University validation - REQUIRED
    if (!gradUniversity) {
      newErrors['graduation.university'] = 'University/Institute is required';
    }

    // Specialization validation - REQUIRED
    if (!gradSpecialization) {
      newErrors['graduation.specialization'] = 'Specialization is required';
    }

    // Course Type validation - REQUIRED
    const gradCourseType = formData.graduation.courseType?.trim();
    if (!gradCourseType) {
      newErrors['graduation.courseType'] = 'Course type is required';
    }

    // Marks Percent validation - REQUIRED, 35-100
    const gradMarksValue = gradMarks?.trim() || formData.graduation.marksPercent?.trim();
    if (!gradMarksValue || gradMarksValue.trim() === '') {
      newErrors['graduation.marksPercent'] = 'Percentage is required';
    } else {
      const percentNum = parseFloat(gradMarksValue);
      if (isNaN(percentNum)) {
        newErrors['graduation.marksPercent'] = 'Percentage must be a valid number';
      } else if (percentNum < 35 || percentNum > 100) {
        newErrors['graduation.marksPercent'] = 'Percentage must be between 35 and 100';
      }
    }

    // Start Year validation - REQUIRED, max 2029
    if (!gradStartYear) {
      newErrors['graduation.startYear'] = 'Course start year is required';
    } else {
      const startYearNum = parseInt(gradStartYear, 10);
      if (isNaN(startYearNum) || startYearNum === 0) {
        newErrors['graduation.startYear'] = 'Course start year is required';
      } else if (startYearNum > 2029) {
        newErrors['graduation.startYear'] = 'Start year must be 2029 or earlier';
      } else if (startYearNum < 1980) {
        newErrors['graduation.startYear'] = 'Start year must be 1980 or later';
      } else {
        // Validate Graduation start year should be >= Class XII year (chronological order)
        if (xiiYear) {
          const xiiYearNum = parseInt(xiiYear, 10);
          if (!isNaN(xiiYearNum) && startYearNum < xiiYearNum) {
            newErrors['graduation.startYear'] = 'Graduation start year must be after or equal to Class XII passing year (chronological order: 10th → Inter → BTech)';
          }
        }
        // Validate Graduation start year should be >= Class X year (chronological order)
        if (xYear) {
          const xYearNum = parseInt(xYear, 10);
          if (!isNaN(xYearNum) && startYearNum < xYearNum) {
            newErrors['graduation.startYear'] = 'Graduation start year must be after or equal to Class X passing year (chronological order: 10th → Inter → BTech)';
          }
        }
      }
    }

    // End Year validation - REQUIRED, max 2029
    if (!gradEndYear) {
      newErrors['graduation.endYear'] = 'Course ending year is required';
    } else {
      const endYearNum = parseInt(gradEndYear, 10);
      if (isNaN(endYearNum) || endYearNum === 0) {
        newErrors['graduation.endYear'] = 'Course ending year is required';
      } else if (endYearNum > 2029) {
        newErrors['graduation.endYear'] = 'End year must be 2029 or earlier';
      } else if (endYearNum < 1980) {
        newErrors['graduation.endYear'] = 'End year must be 1980 or later';
      } else if (gradStartYear) {
        const startYearNum = parseInt(gradStartYear, 10);
        if (!isNaN(startYearNum)) {
          if (endYearNum === startYearNum) {
            newErrors['graduation.endYear'] = 'End year cannot be the same as start year';
          } else if (endYearNum < startYearNum) {
            newErrors['graduation.endYear'] = 'End year cannot be earlier than start year';
          }
        }
      }
      // Validate Graduation end year should be >= Class XII year (chronological order)
      if (xiiYear) {
        const xiiYearNum = parseInt(xiiYear, 10);
        if (!isNaN(xiiYearNum) && endYearNum < xiiYearNum) {
          newErrors['graduation.endYear'] = 'Graduation end year must be after or equal to Class XII passing year (chronological order: 10th → Inter → BTech)';
        }
      }
      // Validate Graduation end year should be >= Class X year (chronological order)
      if (xYear) {
        const xYearNum = parseInt(xYear, 10);
        if (!isNaN(xYearNum) && endYearNum < xYearNum) {
          newErrors['graduation.endYear'] = 'Graduation end year must be after or equal to Class X passing year (chronological order: 10th → Inter → BTech)';
        }
      }
    }

    // Validate Class XII fields - ALL REQUIRED, minimum 3 characters
    // Use state variables for dropdowns to ensure latest values are checked
    const xiiBoardValue = xiiBoard?.trim() || formData.classXii.board?.trim();
    // xiiYear already declared at top
    const xiiMarksValue = xiiMarks?.trim() || formData.classXii.marksPercent?.trim();

    if (!xiiBoardValue) {
      newErrors['classXii.board'] = 'Board of education is required';
    }

    if (!xiiYear) {
      newErrors['classXii.passingYear'] = 'Passing year is required';
    } else {
      const yearNum = parseInt(xiiYear, 10);
      if (isNaN(yearNum) || yearNum === 0) {
        newErrors['classXii.passingYear'] = 'Passing year is required';
      } else if (yearNum > 2029) {
        newErrors['classXii.passingYear'] = 'Passing year must be 2029 or earlier';
      } else if (yearNum < 1980) {
        newErrors['classXii.passingYear'] = 'Passing year must be 1980 or later';
      }
      // Validate Class XII year should NOT be equal to Class X year
      if (xYear) {
        const xYearNum = parseInt(xYear, 10);
        if (!isNaN(xYearNum) && yearNum === xYearNum) {
          newErrors['classXii.passingYear'] = 'Class XII (Inter) passing year must be different from Class X (10th) passing year';
        } else if (!isNaN(xYearNum) && yearNum < xYearNum) {
          newErrors['classXii.passingYear'] = 'Class XII passing year must be after Class X passing year';
        }
      }
      // Validate Class XII year should be <= Graduation end year (chronological order)
      if (gradEndYear) {
        const gradEndYearNum = parseInt(gradEndYear, 10);
        if (!isNaN(gradEndYearNum) && yearNum > gradEndYearNum) {
          newErrors['classXii.passingYear'] = 'Class XII passing year must be before or equal to Graduation end year (chronological order: 10th → Inter → BTech)';
        }
      }
    }

    if (!xiiMarksValue || xiiMarksValue.trim() === '') {
      newErrors['classXii.marksPercent'] = 'Percentage is required';
    } else {
      const percentNum = parseFloat(xiiMarksValue);
      if (isNaN(percentNum)) {
        newErrors['classXii.marksPercent'] = 'Percentage must be a valid number';
      } else if (percentNum < 35 || percentNum > 100) {
        newErrors['classXii.marksPercent'] = 'Percentage must be between 35 and 100';
      }
    }

    // Validate Class X fields - ALL REQUIRED, minimum 3 characters
    // Use state variables for dropdowns to ensure latest values are checked
    const xBoardValue = xBoard?.trim() || formData.classX.board?.trim();
    // xYear already declared at top
    const xMarksValue = xMarks?.trim() || formData.classX.marksPercent?.trim();

    if (!xBoardValue) {
      newErrors['classX.board'] = 'Board of education is required';
    }

    if (!xYear) {
      newErrors['classX.passingYear'] = 'Passing year is required';
    } else {
      const yearNum = parseInt(xYear, 10);
      if (isNaN(yearNum) || yearNum === 0) {
        newErrors['classX.passingYear'] = 'Passing year is required';
      } else if (yearNum > 2029) {
        newErrors['classX.passingYear'] = 'Passing year must be 2029 or earlier';
      } else if (yearNum < 1980) {
        newErrors['classX.passingYear'] = 'Passing year must be 1980 or later';
      }
      // Validate Class X year should NOT be equal to Class XII year
      if (xiiYear) {
        const xiiYearNum = parseInt(xiiYear, 10);
        if (!isNaN(xiiYearNum) && yearNum === xiiYearNum) {
          newErrors['classX.passingYear'] = 'Class X (10th) passing year must be different from Class XII (Inter) passing year';
        } else if (!isNaN(xiiYearNum) && yearNum > xiiYearNum) {
          newErrors['classX.passingYear'] = 'Class X passing year must be before Class XII passing year';
        }
      }
      // Validate Class X year should be <= Graduation end year (chronological order)
      if (gradEndYear) {
        const gradEndYearNum = parseInt(gradEndYear, 10);
        if (!isNaN(gradEndYearNum) && yearNum > gradEndYearNum) {
          newErrors['classX.passingYear'] = 'Class X passing year must be before or equal to Graduation end year (chronological order: 10th → Inter → BTech)';
        }
      }
    }

    if (!xMarksValue || xMarksValue.trim() === '') {
      newErrors['classX.marksPercent'] = 'Percentage is required';
    } else {
      const percentNum = parseFloat(xMarksValue);
      if (isNaN(percentNum)) {
        newErrors['classX.marksPercent'] = 'Percentage must be a valid number';
      } else if (percentNum < 35 || percentNum > 100) {
        newErrors['classX.marksPercent'] = 'Percentage must be between 35 and 100';
      }
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSave = async () => {
    console.log('[EditEducationModal] Save button pressed');

    // Run validation first
    const validationResult = validate();
    if (!validationResult.isValid) {
      // Get all error messages from the validation result
      const errorMessages = Object.values(validationResult.errors).filter(msg => msg && msg.trim() !== '');

      if (errorMessages.length > 0) {
        // Show all validation errors in snackbar
        const errorText = errorMessages.length === 1
          ? errorMessages[0]
          : `Please fill all highlighted required fieldss:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}`;

        console.warn('[EditEducationModal] Validation failed:', errorMessages);
        showToast('error', errorText);
      } else {
        showToast('error', 'Please fill all required fields');
      }
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - only include sections that have data
      const payload: any = {};

      // Build graduation section - only include fields with values
      const gradDegree = formData.graduation.degree?.trim();
      const gradUniversity = formData.graduation.university?.trim();
      const gradSpecialization = specialization?.trim() || formData.graduation.specialization?.trim();
      const gradCourseType = formData.graduation.courseType?.trim();
      const gradMarksValue = gradMarks?.trim() || formData.graduation.marksPercent?.trim();
      const gradStartYear = formData.graduation.startYear?.trim();
      const gradEndYear = formData.graduation.endYear?.trim();

      // Only add graduation section if it has at least one field
      if (gradDegree || gradUniversity || gradSpecialization ||
        gradCourseType || gradMarksValue || gradStartYear || gradEndYear) {
        payload.graduation = {};
        if (gradDegree) payload.graduation.degree = gradDegree;
        if (gradUniversity) payload.graduation.university = gradUniversity;
        if (gradSpecialization) payload.graduation.specialization = gradSpecialization;
        if (gradCourseType) payload.graduation.courseType = gradCourseType;
        // Send percentage as number
        if (gradMarksValue) {
          const numericValue = parseFloat(gradMarksValue);
          if (!isNaN(numericValue)) {
            payload.graduation.marksPercent = numericValue;
          }
        }
        if (gradStartYear) {
          const year = parseInt(gradStartYear, 10);
          if (!isNaN(year) && year > 0) {
            payload.graduation.startYear = year;
          }
        }
        if (gradEndYear) {
          const year = parseInt(gradEndYear, 10);
          if (!isNaN(year) && year > 0) {
            payload.graduation.endYear = year;
          }
        }
      }

      // Build classXii section - only include if it has data
      // Use state variables for dropdowns to ensure latest values are used
      const xiiBoardValue = xiiBoard?.trim() || formData.classXii.board?.trim();
      const xiiYear = formData.classXii.passingYear?.trim();
      const xiiMarksValue = xiiMarks?.trim() || formData.classXii.marksPercent?.trim();

      if (xiiBoardValue || xiiYear || xiiMarksValue) {
        payload.classXii = {};
        if (xiiBoardValue) payload.classXii.board = xiiBoardValue;
        if (xiiYear) {
          const year = parseInt(xiiYear, 10);
          if (!isNaN(year) && year > 0) {
            payload.classXii.passingYear = year;
          }
        }
        // Send percentage as number
        if (xiiMarksValue) {
          const numericValue = parseFloat(xiiMarksValue);
          if (!isNaN(numericValue)) {
            payload.classXii.marksPercent = numericValue;
          }
        }
      }

      // Build classX section - only include if it has data
      // Use state variables for dropdowns to ensure latest values are used
      const xBoardValue = xBoard?.trim() || formData.classX.board?.trim();
      const xYearValue = formData.classX.passingYear?.trim();
      const xMarksValue = xMarks?.trim() || formData.classX.marksPercent?.trim();

      if (xBoardValue || xYearValue || xMarksValue) {
        payload.classX = {};
        if (xBoardValue) payload.classX.board = xBoardValue;
        if (xYearValue) {
          const year = parseInt(xYearValue, 10);
          if (!isNaN(year) && year > 0) {
            payload.classX.passingYear = year;
          }
        }
        // Send percentage as number
        if (xMarksValue) {
          const numericValue = parseFloat(xMarksValue);
          if (!isNaN(numericValue)) {
            payload.classX.marksPercent = numericValue;
          }
        }
      }

      console.log('Education Payload:', JSON.stringify(payload, null, 2));
      console.log('Education Payload keys:', Object.keys(payload));
      console.log('Graduation keys:', payload.graduation ? Object.keys(payload.graduation) : 'none');
      console.log('ClassXii keys:', payload.classXii ? Object.keys(payload.classXii) : 'none');
      console.log('ClassX keys:', payload.classX ? Object.keys(payload.classX) : 'none');

      const result = await ProfileApiService.updateEducation(userId, userToken, payload);

      console.log('Education API Result:', JSON.stringify(result, null, 2));
      if (!result.success && result.error) {
        console.error('Education API Error Details:', {
          error: result.error,
          status: result.error?.status,
          message: result.error?.message || result.error?.error,
        });
      }

      console.log('[EditEducationModal] Update result:', {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log('[EditEducationModal] Update successful');
        // Stop loading first
        setLoading(false);
        // Close modal immediately to prevent reopening
        onClose();
        // Show success snackbar after closing modal
        showToast('success', 'Education details saved successfully');
        // Call onSuccess to trigger data refresh after closing modal
        // Use setTimeout to ensure modal is closed before refresh
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        setLoading(false);
        const errorMessage = result.error?.message ||
          result.error?.error ||
          (typeof result.error === 'string' ? result.error : 'Failed to update education details. Please try again.');
        console.error('[EditEducationModal] Update failed:', errorMessage);
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[EditEducationModal] Update error:', {
        error: error?.message || error,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'An unexpected error occurred. Please try again.';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections],
    });
  };


  // Function to close all dropdowns (ensures only one opens at a time)
  const closeAllDropdowns = () => {
    setDegreeOpen(false);
    setSpecializationOpen(false);
    setCourseTypeOpen(false);
    setStartYearOpen(false);
    setEndYearOpen(false);
    setXiiBoardOpen(false);
    setXiiYearOpen(false);
    setXBoardOpen(false);
    setXYearOpen(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Education Details</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Graduation Section */}
            <View style={[styles.section]}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('graduation')}>
                <Text style={styles.sectionTitle}>Graduation Details</Text>
                <Text style={styles.toggleIcon}>
                  {expandedSections.graduation ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedSections.graduation && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Degree <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={degreeOpen}
                      value={degree}
                      items={degreeOptions.map(opt => ({ label: opt, value: opt }))}
                      setOpen={setDegreeOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setDegreeOpen(true);
                        setFocusedField('graduation.degree');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={value => {
                        setDegree(value);
                        setErrors(prev => ({ ...prev, 'graduation.degree': '', 'graduation.specialization': '' }));
                      }}
                      placeholder="Select Degree"
                      style={[
                        styles.dropdown,
                        errors['graduation.degree'] && styles.errorInput,
                        focusedField === 'graduation.degree' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={3000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['graduation.degree'] && (
                      <Text style={styles.errorText}>{errors['graduation.degree']}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>University/Institute <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors['graduation.university'] && styles.inputError,
                        focusedField === 'graduation.university' && styles.inputFocused,
                      ]}
                      value={formData.graduation.university || ''}
                      onChangeText={value => {
                        handleChange('graduation', 'university', value);
                        // Real-time validation with functional update
                        setErrors(prevErrors => {
                          const newErrors = { ...prevErrors };
                          if (value.trim().length > 0 && value.trim().length < 3) {
                            newErrors['graduation.university'] = 'University must be at least 3 characters';
                          } else {
                            delete newErrors['graduation.university'];
                          }
                          return newErrors;
                        });
                      }}
                      onFocus={() => setFocusedField('graduation.university')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter university"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors['graduation.university'] && (
                      <Text style={styles.errorText}>{errors['graduation.university']}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Specialization <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={specializationOpen}
                      value={specialization}
                      items={getSpecializationOptions(degree).map(opt => ({ label: opt, value: opt }))}
                      setOpen={setSpecializationOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setSpecializationOpen(true);
                        setFocusedField('graduation.specialization');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={(value: any) => {
                        setSpecialization(value);
                        setErrors(prev => ({ ...prev, 'graduation.specialization': '' }));
                      }}
                      placeholder="Select Specialization"
                      style={[
                        styles.dropdown,
                        errors['graduation.specialization'] && styles.errorInput,
                        focusedField === 'graduation.specialization' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      labelStyle={styles.dropdownText}
                      listItemLabelStyle={styles.dropdownText}
                      listItemContainerStyle={styles.dropdownListItem}
                      listMode="SCROLLVIEW"
                      zIndex={3000}
                      disabled={!degree}
                      disabledStyle={styles.inputDisabled}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['graduation.specialization'] && (
                      <Text style={styles.errorText}>{errors['graduation.specialization']}</Text>
                    )}
                    {!degree && (
                      <Text style={styles.hintText}>Please select a degree first</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Course Type <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={courseTypeOpen}
                      value={courseType}
                      items={courseTypeOptions.map(opt => ({ label: opt, value: opt }))}
                      setOpen={setCourseTypeOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setCourseTypeOpen(true);
                        setFocusedField('graduation.courseType');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={value => {
                        setCourseType(value);
                        setErrors(prev => ({ ...prev, 'graduation.courseType': '' }));
                      }}
                      placeholder="Select Course Type"
                      style={[
                        styles.dropdown,
                        errors['graduation.courseType'] && styles.errorInput,
                        focusedField === 'graduation.courseType' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={3000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['graduation.courseType'] && (
                      <Text style={styles.errorText}>{errors['graduation.courseType']}</Text>
                    )}
                  </View>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <Text style={styles.label}>Start Year <Text style={styles.required}>*</Text></Text>
                      <DropDownPicker
                        open={startYearOpen}
                        value={formData.graduation.startYear ? parseInt(formData.graduation.startYear) : null}
                        items={YEARS.map(year => ({ label: year.toString(), value: year }))}
                        setOpen={setStartYearOpen}
                        onOpen={() => {
                          closeAllDropdowns();
                          setStartYearOpen(true);
                          setFocusedField('graduation.startYear');
                        }}
                        onClose={() => {
                          setFocusedField(null);
                        }}
                        setValue={(value: any) => {
                          const yearValue = typeof value === 'function' ? value(formData.graduation.startYear ? parseInt(formData.graduation.startYear) : null) : value;
                          handleChange('graduation', 'startYear', yearValue ? yearValue.toString() : '');
                          setErrors(prev => {
                            const newErrors: Record<string, string> = { ...prev, 'graduation.startYear': '' };
                            if (yearValue) {
                              const startYearNum = parseInt(yearValue.toString(), 10);
                              // Check end year if it exists
                              if (formData.graduation.endYear) {
                                const endYearNum = parseInt(formData.graduation.endYear, 10);
                                if (!isNaN(endYearNum) && !isNaN(startYearNum)) {
                                  if (endYearNum === startYearNum) {
                                    newErrors['graduation.endYear'] = 'End year cannot be the same as start year';
                                  } else if (endYearNum < startYearNum) {
                                    newErrors['graduation.endYear'] = 'End year cannot be earlier than start year';
                                  }
                                }
                              }
                              // Check against Class XII (chronological order)
                              if (formData.classXii.passingYear) {
                                const xiiYearNum = parseInt(formData.classXii.passingYear, 10);
                                if (!isNaN(xiiYearNum) && startYearNum < xiiYearNum) {
                                  newErrors['graduation.startYear'] = 'Graduation start year must be after or equal to Class XII passing year (chronological order: 10th → Inter → BTech)';
                                }
                              }
                              // Check against Class X (chronological order)
                              if (formData.classX.passingYear) {
                                const xYearNum = parseInt(formData.classX.passingYear, 10);
                                if (!isNaN(xYearNum) && startYearNum < xYearNum) {
                                  newErrors['graduation.startYear'] = 'Graduation start year must be after or equal to Class X passing year (chronological order: 10th → Inter → BTech)';
                                }
                              }
                            }
                            return newErrors;
                          });
                        }}
                        placeholder="Select Start Year"
                        style={[
                          styles.dropdown,
                          errors['graduation.startYear'] && styles.errorInput,
                          focusedField === 'graduation.startYear' && styles.inputFocused,
                        ]}
                        dropDownContainerStyle={styles.dropdownContainer}
                        placeholderStyle={styles.placeholderText}
                        textStyle={styles.dropdownText}
                        listMode="SCROLLVIEW"
                        zIndex={3000}
                        searchable={false}
                        closeAfterSelecting={true}
                      />
                      {errors['graduation.startYear'] && (
                        <Text style={styles.errorText}>{errors['graduation.startYear']}</Text>
                      )}
                    </View>
                    <View style={[styles.inputContainer, { flex: 1 }]}>
                      <Text style={styles.label}>End Year <Text style={styles.required}>*</Text></Text>
                      <DropDownPicker
                        open={endYearOpen}
                        value={formData.graduation.endYear ? parseInt(formData.graduation.endYear) : null}
                        items={YEARS.map(year => ({ label: year.toString(), value: year }))}
                        setOpen={setEndYearOpen}
                        onOpen={() => {
                          closeAllDropdowns();
                          setEndYearOpen(true);
                          setFocusedField('graduation.endYear');
                        }}
                        onClose={() => {
                          setFocusedField(null);
                        }}
                        setValue={(value: any) => {
                          const yearValue = typeof value === 'function' ? value(formData.graduation.endYear ? parseInt(formData.graduation.endYear) : null) : value;
                          handleChange('graduation', 'endYear', yearValue ? yearValue.toString() : '');
                          setErrors(prev => {
                            const newErrors: Record<string, string> = { ...prev };
                            newErrors['graduation.endYear'] = '';
                            if (yearValue) {
                              const endYearNum = parseInt(yearValue.toString(), 10);
                              // Check start year if it exists
                              if (formData.graduation.startYear) {
                                const startYearNum = parseInt(formData.graduation.startYear, 10);
                                if (!isNaN(startYearNum) && !isNaN(endYearNum)) {
                                  if (endYearNum === startYearNum) {
                                    newErrors['graduation.endYear'] = 'End year cannot be the same as start year';
                                  } else if (endYearNum < startYearNum) {
                                    newErrors['graduation.endYear'] = 'End year cannot be earlier than start year';
                                  }
                                }
                              }
                              // Check against Class XII
                              if (formData.classXii.passingYear) {
                                const xiiYearNum = parseInt(formData.classXii.passingYear, 10);
                                if (!isNaN(xiiYearNum) && endYearNum < xiiYearNum) {
                                  newErrors['graduation.endYear'] = 'Graduation passing year must be greater than or equal to Class XII passing year';
                                } else {
                                  // Clear Class XII error if it was about being greater than Graduation
                                  if (newErrors['classXii.passingYear']?.includes('Graduation')) {
                                    delete newErrors['classXii.passingYear'];
                                  }
                                }
                              }
                              // Check against Class X
                              if (formData.classX.passingYear) {
                                const xYearNum = parseInt(formData.classX.passingYear, 10);
                                if (!isNaN(xYearNum) && endYearNum < xYearNum) {
                                  newErrors['graduation.endYear'] = 'Graduation passing year must be greater than or equal to Class X passing year';
                                } else {
                                  // Clear Class X error if it was about being greater than Graduation
                                  if (newErrors['classX.passingYear']?.includes('Graduation')) {
                                    delete newErrors['classX.passingYear'];
                                  }
                                }
                              }
                            }
                            return newErrors;
                          });
                        }}
                        placeholder="Select End Year"
                        style={[
                          styles.dropdown,
                          errors['graduation.endYear'] && styles.errorInput,
                          focusedField === 'graduation.endYear' && styles.inputFocused,
                        ]}
                        dropDownContainerStyle={styles.dropdownContainer}
                        placeholderStyle={styles.placeholderText}
                        textStyle={styles.dropdownText}
                        listMode="SCROLLVIEW"
                        zIndex={3000}
                        searchable={false}
                        closeAfterSelecting={true}
                      />
                      {errors['graduation.endYear'] && (
                        <Text style={styles.errorText}>{errors['graduation.endYear']}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Percentage <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors['graduation.marksPercent'] && styles.inputError,
                        focusedField === 'graduation.marksPercent' && styles.inputFocused,
                      ]}
                      value={gradMarks || formData.graduation.marksPercent || ''}
                      onChangeText={value => {
                        // Only allow numbers and one decimal point
                        const numericValue = value.replace(/[^0-9.]/g, '');
                        // Ensure only one decimal point
                        const parts = numericValue.split('.');
                        const filteredValue = parts.length > 2
                          ? parts[0] + '.' + parts.slice(1).join('')
                          : numericValue;
                        // Limit to 35-100
                        if (filteredValue) {
                          const numValue = parseFloat(filteredValue);
                          if (numValue > 100) {
                            return;
                          }
                        }
                        setGradMarks(filteredValue);
                        handleChange('graduation', 'marksPercent', filteredValue);
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['graduation.marksPercent'];
                          return newErrors;
                        });
                      }}
                      onFocus={() => setFocusedField('graduation.marksPercent')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter percentage (35-100)"
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                    {errors['graduation.marksPercent'] && (
                      <Text style={styles.errorText}>{errors['graduation.marksPercent']}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Class XII Section */}
            <View style={[styles.section]}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('classXii')}>
                <Text style={styles.sectionTitle}>Class XII Details</Text>
                <Text style={styles.toggleIcon}>
                  {expandedSections.classXii ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedSections.classXii && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Board <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={xiiBoardOpen}
                      value={xiiBoard}
                      items={boardOptions.map(opt => ({ label: opt, value: opt }))}
                      setOpen={setXiiBoardOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setXiiBoardOpen(true);
                        setFocusedField('classXii.board');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={value => {
                        setXiiBoard(value);
                        setErrors(prev => ({ ...prev, 'classXii.board': '' }));
                      }}
                      placeholder="Select Board"
                      style={[
                        styles.dropdown,
                        errors['classXii.board'] && styles.errorInput,
                        focusedField === 'classXii.board' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={2000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['classXii.board'] && (
                      <Text style={styles.errorText}>{errors['classXii.board']}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Passing Year <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={xiiYearOpen}
                      value={formData.classXii.passingYear ? parseInt(formData.classXii.passingYear) : null}
                      items={YEARS.map(year => ({ label: year.toString(), value: year }))}
                      setOpen={setXiiYearOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setXiiYearOpen(true);
                        setFocusedField('classXii.passingYear');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={(value: any) => {
                        const yearValue = typeof value === 'function' ? value(formData.classXii.passingYear ? parseInt(formData.classXii.passingYear) : null) : value;
                        handleChange('classXii', 'passingYear', yearValue ? yearValue.toString() : '');
                        setErrors(prev => {
                          const newErrors: Record<string, string> = { ...prev };
                          newErrors['classXii.passingYear'] = '';
                          // Clear related field errors that might be affected
                          if (yearValue) {
                            const yearNum = parseInt(yearValue.toString(), 10);
                            // Check against Class X
                            if (formData.classX.passingYear) {
                              const xYearNum = parseInt(formData.classX.passingYear, 10);
                              if (!isNaN(xYearNum) && yearNum < xYearNum) {
                                newErrors['classXii.passingYear'] = 'Class XII passing year must be greater than  to Class X passing year';
                              } else {
                                // Clear Class X error if it was about being greater than Class XII
                                if (newErrors['classX.passingYear']?.includes('Class XII')) {
                                  delete newErrors['classX.passingYear'];
                                }
                              }
                            }
                            // Check against Graduation
                            if (formData.graduation.endYear) {
                              const gradYearNum = parseInt(formData.graduation.endYear, 10);
                              if (!isNaN(gradYearNum) && yearNum > gradYearNum) {
                                newErrors['classXii.passingYear'] = 'Class XII passing year must be less than or equal to Graduation passing year';
                              } else {
                                // Clear Graduation error if it was about being less than Class XII
                                if (newErrors['graduation.endYear']?.includes('Class XII')) {
                                  delete newErrors['graduation.endYear'];
                                }
                              }
                            }
                          }
                          return newErrors;
                        });
                      }}
                      placeholder="Select Passing Year"
                      style={[
                        styles.dropdown,
                        errors['classXii.passingYear'] && styles.errorInput,
                        focusedField === 'classXii.passingYear' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={2000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['classXii.passingYear'] && (
                      <Text style={styles.errorText}>{errors['classXii.passingYear']}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Percentage <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors['classXii.marksPercent'] && styles.inputError,
                        focusedField === 'classXii.marksPercent' && styles.inputFocused,
                      ]}
                      value={xiiMarks || formData.classXii.marksPercent || ''}
                      onChangeText={value => {
                        // Only allow numbers and one decimal point
                        const numericValue = value.replace(/[^0-9.]/g, '');
                        // Ensure only one decimal point
                        const parts = numericValue.split('.');
                        const filteredValue = parts.length > 2
                          ? parts[0] + '.' + parts.slice(1).join('')
                          : numericValue;
                        // Limit to 35-100
                        if (filteredValue) {
                          const numValue = parseFloat(filteredValue);
                          if (numValue > 100) {
                            return;
                          }
                        }
                        setXiiMarks(filteredValue);
                        handleChange('classXii', 'marksPercent', filteredValue);
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['classXii.marksPercent'];
                          return newErrors;
                        });
                      }}
                      onFocus={() => setFocusedField('classXii.marksPercent')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter percentage (35-100)"
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                    {errors['classXii.marksPercent'] && (
                      <Text style={styles.errorText}>{errors['classXii.marksPercent']}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Class X Section */}
            <View style={[styles.section]}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('classX')}>
                <Text style={styles.sectionTitle}>Class X Details</Text>
                <Text style={styles.toggleIcon}>
                  {expandedSections.classX ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedSections.classX && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Board <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={xBoardOpen}
                      value={xBoard}
                      items={boardOptions.map(opt => ({ label: opt, value: opt }))}
                      setOpen={setXBoardOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setXBoardOpen(true);
                        setFocusedField('classX.board');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={value => {
                        setXBoard(value);
                        setErrors(prev => ({ ...prev, 'classX.board': '' }));
                      }}
                      placeholder="Select Board"
                      style={[
                        styles.dropdown,
                        errors['classX.board'] && styles.errorInput,
                        focusedField === 'classX.board' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={1000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['classX.board'] && (
                      <Text style={styles.errorText}>{errors['classX.board']}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Passing Year <Text style={styles.required}>*</Text></Text>
                    <DropDownPicker
                      open={xYearOpen}
                      value={formData.classX.passingYear ? parseInt(formData.classX.passingYear) : null}
                      items={YEARS.map(year => ({ label: year.toString(), value: year }))}
                      setOpen={setXYearOpen}
                      onOpen={() => {
                        closeAllDropdowns();
                        setXYearOpen(true);
                        setFocusedField('classX.passingYear');
                      }}
                      onClose={() => {
                        setFocusedField(null);
                      }}
                      setValue={(value: any) => {
                        const yearValue = typeof value === 'function' ? value(formData.classX.passingYear ? parseInt(formData.classX.passingYear) : null) : value;
                        handleChange('classX', 'passingYear', yearValue ? yearValue.toString() : '');
                        setErrors(prev => {
                          const newErrors: Record<string, string> = { ...prev };
                          newErrors['classX.passingYear'] = '';
                          if (yearValue) {
                            const yearNum = parseInt(yearValue.toString(), 10);
                            // Check against Class XII
                            if (formData.classXii.passingYear) {
                              const xiiYearNum = parseInt(formData.classXii.passingYear, 10);
                              if (!isNaN(xiiYearNum) && yearNum > xiiYearNum) {
                                newErrors['classX.passingYear'] = 'Class X passing year must be less than or equal to Class XII passing year';
                              } else {
                                // Clear Class XII error if it was about being less than Class X
                                if (newErrors['classXii.passingYear']?.includes('Class X')) {
                                  delete newErrors['classXii.passingYear'];
                                }
                              }
                            }
                            // Check against Graduation
                            if (formData.graduation.endYear) {
                              const gradYearNum = parseInt(formData.graduation.endYear, 10);
                              if (!isNaN(gradYearNum) && yearNum > gradYearNum) {
                                newErrors['classX.passingYear'] = 'Class X passing year must be less than or equal to Graduation passing year';
                              } else {
                                // Clear Graduation error if it was about being less than Class X
                                if (newErrors['graduation.endYear']?.includes('Class X')) {
                                  delete newErrors['graduation.endYear'];
                                }
                              }
                            }
                          }
                          return newErrors;
                        });
                      }}
                      placeholder="Select Passing Year"
                      style={[
                        styles.dropdown,
                        errors['classX.passingYear'] && styles.errorInput,
                        focusedField === 'classX.passingYear' && styles.inputFocused,
                      ]}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholderStyle={styles.placeholderText}
                      textStyle={styles.dropdownText}
                      listMode="SCROLLVIEW"
                      zIndex={1000}
                      searchable={false}
                      closeAfterSelecting={true}
                    />
                    {errors['classX.passingYear'] && (
                      <Text style={styles.errorText}>{errors['classX.passingYear']}</Text>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Percentage <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors['classX.marksPercent'] && styles.inputError,
                        focusedField === 'classX.marksPercent' && styles.inputFocused,
                      ]}
                      value={xMarks || formData.classX.marksPercent || ''}
                      onChangeText={value => {
                        // Only allow numbers and one decimal point
                        const numericValue = value.replace(/[^0-9.]/g, '');
                        // Ensure only one decimal point
                        const parts = numericValue.split('.');
                        const filteredValue = parts.length > 2
                          ? parts[0] + '.' + parts.slice(1).join('')
                          : numericValue;
                        // Limit to 35-100
                        if (filteredValue) {
                          const numValue = parseFloat(filteredValue);
                          if (numValue > 100) {
                            return;
                          }
                        }
                        setXMarks(filteredValue);
                        handleChange('classX', 'marksPercent', filteredValue);
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['classX.marksPercent'];
                          return newErrors;
                        });
                      }}
                      onFocus={() => setFocusedField('classX.marksPercent')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter percentage (35-100)"
                      placeholderTextColor="#9ca3af"
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                    {errors['classX.marksPercent'] && (
                      <Text style={styles.errorText}>{errors['classX.marksPercent']}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Toast config={toastConfig} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'visible', // Critical: allows dropdowns to render outside modal
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  scrollView: {
    maxHeight: 500,
    overflow: 'hidden', // Keep dropdowns inside ScrollView
  },
  section: {
    marginBottom: 16,
    paddingBottom: 26,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    overflow: "hidden", // Keep dropdowns inside section
  },
  sectionExpandedinitialCard: {
    paddingBottom: 76,
  },
  sectionExpanded: {
    paddingBottom: 190, // Increased padding when last dropdown is open
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7F7F7',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  toggleIcon: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  sectionContent: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#333',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    minHeight: 45,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 150,
    zIndex: 9999,
  },
  dropdownWrapper: {
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden', // Keep dropdowns inside wrapper
  },
  dropdownDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },
  placeholderText: {
    color: '#9ca3af',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2B2B2B',
    lineHeight: 20, // Added line height for proper spacing when text wraps to multiple lines
  },
  dropdownListItem: {
    minHeight: 44, // Consistent minimum height for all list items (single or two lines)
    paddingVertical: 10, // Consistent vertical padding
    paddingHorizontal: 12, // Consistent horizontal padding
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorInput: {
    borderColor: 'red',
  },
  inputDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.6,
  },
  inputFocused: {
    borderColor: '#F97316',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 4,
  },
  required: {
    color: '#F97316',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  suggestionItem: {
    padding: 10,
    fontSize: 16,
    backgroundColor: '#FFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    color: '#0D0D0D',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  noMatchText: {
    padding: 10,
    fontSize: 16,
    color: '#bbb',
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

export default EditEducationModal;

