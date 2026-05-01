import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ProfileApiService} from '@services/profile/ProfileApiService';
import {showToast} from '@services/login/ToastService';

// Predefined skills list
const SKILLS_LIST = [
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

interface EditSkillsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  userToken: string;
  initialSkills: string[];
}

const EditSkillsModal: React.FC<EditSkillsModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userToken,
  initialSkills,
}) => {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSkillsList, setShowSkillsList] = useState(false);

  useEffect(() => {
    if (visible) {
      setSkills(initialSkills);
      setInputValue('');
      setSearchQuery('');
      setShowSkillsList(false);
    }
  }, [visible, initialSkills]);

  // Filter available skills based on search query and exclude already added skills
  const availableSkills = useMemo(() => {
    return SKILLS_LIST.filter(
      skill =>
        (searchQuery.length === 0 || skill.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !skills.includes(skill)
    );
  }, [searchQuery, skills]);

  const addSkill = (skillToAdd?: string) => {
    const skill = skillToAdd || inputValue.trim();
    
    if (!skill || skill.length === 0) {
      return;
    }

    // Check if skill is in the predefined list (case-insensitive)
    const matchedSkill = SKILLS_LIST.find(
      s => s.toLowerCase() === skill.toLowerCase()
    );

    if (!matchedSkill) {
      // Skill not in list - reset and close
      setInputValue('');
      setSearchQuery('');
      setShowSkillsList(false);
      return;
    }

    // Add skill if not already in the list
    setSkills(prevSkills => {
      if (prevSkills.includes(matchedSkill)) {
        return prevSkills;
      }
      return [...prevSkills, matchedSkill];
    });
    
    // Reset input, search, and close dropdown
    setInputValue('');
    setSearchQuery('');
    setShowSkillsList(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setInputValue(text);
    setShowSkillsList(true); // Always show list when typing
  };

  const handleInputFocus = () => {
    setShowSkillsList(true);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    console.log('[EditSkillsModal] Save button pressed');
    
    if (skills.length === 0) {
      console.warn('[EditSkillsModal] No skills added');
      showToast('error', 'Please add at least one skill');
      return;
    }

    console.log('[EditSkillsModal] Starting update:', {
      userId,
      hasToken: !!userToken,
      skillsCount: skills.length,
      skills: skills,
    });

    setLoading(true);
    try {
      const result = await ProfileApiService.updateSkills(userId, userToken, skills);
      console.log('[EditSkillsModal] Update result:', {
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        console.log('[EditSkillsModal] Update successful');
        showToast('success', 'Skills details successfully updated');
        onSuccess();
        onClose();
      } else {
        const errorMessage = result.error?.message || 
                           result.error?.error || 
                           (typeof result.error === 'string' ? result.error : 'Failed to update skills. Please try again.');
        console.error('[EditSkillsModal] Update failed:', errorMessage);
        showToast('error', errorMessage);
      }
    } catch (error: any) {
      console.error('[EditSkillsModal] Update error:', {
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Key Skills</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* <Text style={styles.label}>
                Add skills that best define your expertise. Search and select from the list. Minimum 1.
              </Text> */}

              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.input}
                  value={inputValue}
                  onChangeText={handleSearchChange}
                  onFocus={handleInputFocus}
                  placeholder="Search skills..."
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={() => addSkill()}
                />
                {inputValue.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleSearchChange('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#888" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Skills List Dropdown */}
              {showSkillsList && (
                <View style={styles.skillsDropdown}>
                  {availableSkills.length > 0 ? (
                    <ScrollView 
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="always"
                      scrollEnabled={availableSkills.length > 5}
                      style={styles.skillsListContainer}>
                      {availableSkills.map((item, index) => (
                        <TouchableOpacity
                          key={`skill-${item}-${index}`}
                          style={styles.skillListItem}
                          onPress={() => addSkill(item)}
                          activeOpacity={0.7}>
                          <Text style={styles.skillListItemText}>{item}</Text>
                          <MaterialIcons name="add-circle-outline" size={20} color="#F97316" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        {searchQuery.length > 0
                          ? 'No matching skills found. Please select from the available list.'
                          : 'All available skills have been added.'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {skills.length > 0 && (
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>Your Skills ({skills.length}):</Text>
                  <View style={styles.skillsList}>
                    {skills.map((skill, index) => (
                      <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                        <TouchableOpacity onPress={() => removeSkill(skill)}>
                          <MaterialIcons name="close" size={18} color="#D26B15" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {skills.length === 0 && (
                <Text style={styles.emptyText}>No skills added yet. Add your first skill above.</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (loading || skills.length === 0) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading || skills.length === 0}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    maxHeight: 400,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  skillsDropdown: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillsListContainer: {
    maxHeight: 200,
    overflow: 'hidden',
  },
  skillListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  skillListItemText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#2B2B2B',
  },
  noResultsContainer: {
    padding: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE2C4',
  },
  noResultsText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#D26B15',
    textAlign: 'center',
  },
  skillsContainer: {
    gap: 12,
  },
  skillsLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  skillChipText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#D26B15',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#fff',
  },
});

export default EditSkillsModal;

