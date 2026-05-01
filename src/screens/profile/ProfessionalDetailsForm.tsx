import React from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
} from 'react-native';
import { useProfessionalDetailsFormViewModel } from '@viewmodel/Professionalformviewmodel';
import GradientButton from '@components/styles/GradientButton';
import Icon1 from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  skillBadges: [];
  onReload: () => void;
}

const ProfessionalDetailsForm: React.FC<ProfessionalDetailsFormProps> = React.memo(props => {
  const {
    visible,
    onClose,
    qualification: initialQualification,
    specialization: initialSpecialization,
    skillsRequired,
    experience: initialExperience,
    preferredJobLocations,
    skillBadges,
    onReload,
  } = props;

  const {
    qualification,
    setQualification,
    setSpecialization,
    skills,
    locations,
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
  } = useProfessionalDetailsFormViewModel({
    visible,
    onClose,
    qualification: initialQualification,
    specialization: initialSpecialization,
    skillsRequired,
    experience: initialExperience,
    preferredJobLocations,
    skillBadges,
    onReload,
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={closeAllDropdowns}>
          <View style={styles.modalView}>
            <View style={styles.modalCard}>
              <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={onClose}>
                  <Icon1 name="close" size={20} color="#6C757D" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={styles.modalTitle}>Professional Details</Text>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Qualification */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, validationErrors.qualification ? styles.errorInput : {}]}
                    placeholder="Qualification"
                    placeholderTextColor="#B1B1B1"
                    value={qualificationQuery}
                    onFocus={toggleQualificationDropdown}
                    onChangeText={text => {
                      setQualificationQuery(text);
                      setQualification(text);
                      setShowQualificationList(true);
                    }}
                  />
                  {validationErrors.qualification && (
                    <Text style={styles.errorText}>{validationErrors.qualification}</Text>
                  )}
                  {showQualificationList && (
                    <View style={[styles.dropdown, { zIndex: 1000 }]}>
                    <FlatList
  data={
    qualificationQuery === qualification
      ? qualificationsOptions // show full list if input equals selected
      : qualificationsOptions.filter(qual =>
          qual.toLowerCase().includes(qualificationQuery.toLowerCase())
        )
  }
  keyExtractor={item => item}
  renderItem={({ item }) => (
    <TouchableOpacity
     onPress={() => {
  setQualification(item);
  setQualificationQuery(item);
  setShowQualificationList(false);
  setValidationErrors(({ qualification, ...restErrors }) => restErrors);

  // Reset specialization when qualification changes
  setSpecialization('');
  setSpecializationQuery('');
}}

      >
      <Text
        style={[
          styles.suggestionItem,
          item === qualification && {
           fontFamily: 'PlusJakartaSans-Bold'
          },
        ]}>
        {item}
      </Text>
    </TouchableOpacity>
  )}
  disableVirtualization={true}
  ListEmptyComponent={<Text style={styles.noMatchText}>No matches found</Text>}
  nestedScrollEnabled={true}
/>

                    </View>
                  )}
                </View>

                {/* Specialization */}
              <View style={styles.inputContainer}>
  <TextInput
    style={[styles.input, validationErrors.specialization ? styles.errorInput : {}]}
    placeholder="Specialization"
    placeholderTextColor="#B1B1B1"
    value={specializationQuery}
    onFocus={toggleSpecializationDropdown}
    onChangeText={text => {
      setSpecializationQuery(text);
      setSpecialization(text);
      setShowSpecializationList(true);
    }}
  />
  {validationErrors.specialization && (
    <Text style={styles.errorText}>{validationErrors.specialization}</Text>
  )}
  {showSpecializationList && (
    <View style={[styles.dropdown, { zIndex: 1000 }]}>
      <FlatList
        data={
          specializationQuery === specializationQuery
            ? (specializationsByQualification[
                qualification as keyof typeof specializationsByQualification
              ] || [])
            : (specializationsByQualification[
                qualification as keyof typeof specializationsByQualification
              ] || []).filter((spec: string) =>
                spec.toLowerCase().includes(specializationQuery.toLowerCase())
              )
        }
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSpecialization(item);
              setSpecializationQuery(item);
              setShowSpecializationList(false);
              setValidationErrors(({ specialization, ...restErrors }) => restErrors);
            }}>
            <Text
              style={[
                styles.suggestionItem,
                item === specializationQuery && {
                  fontFamily: 'PlusJakartaSans-Bold',
                },
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        disableVirtualization={true}
        ListEmptyComponent={<Text style={styles.noMatchText}>No matches found</Text>}
        nestedScrollEnabled={true}
      />
    </View>
  )}
</View>


                {/* Skills */}
                <View style={styles.inputContainer}>
                  <View style={styles.searchInputContainer}>
                    <TextInput
                      style={[styles.input, validationErrors.skills ? styles.errorInput : {}]}
                      placeholder="Search Skills"
                      placeholderTextColor="#0D0D0D"
                      value={skillQuery}
                      onFocus={toggleSkillsDropdown}
                      onChangeText={text => {
                        setSkillQuery(text);
                        setShowSkillsList(true); // Ensure dropdown remains open
                      }}
                    />
                    {skillQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSkillQuery('');
                          setShowSkillsList(false);
                        }}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#888" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {validationErrors.skills && (
                    <Text style={styles.errorText}>{validationErrors.skills}</Text>
                  )}

                  {/* Dropdown Section */}
                  {showSkillsList && (
                    <View
                      style={[
                        styles.dropdown,
                        {
                          position: 'absolute',
                          top: 50,
                          left: 0,
                          right: 0,
                          maxHeight: 200,
                          zIndex: 1000,
                        },
                      ]}>
                      <FlatList
                        data={
                          skillQuery.length > 0
                            ? skillsOptions.filter(
                              s =>
                                s.toLowerCase().includes(skillQuery.toLowerCase()) &&
                                !skills.some(skill => skill.skillName === s) &&
                                !skillBadgesState.some(
                                  badge => badge.skillBadge.name === s && badge.flag === 'added',
                                ),
                            )
                            : skillsOptions.filter(
                              s =>
                                !skills.some(skill => skill.skillName === s) &&
                                !skillBadgesState.some(
                                  badge => badge.skillBadge.name === s && badge.flag === 'added',
                                ),
                            )
                        }
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => {
                              addSkill(item);
                              setSkillQuery(''); // Clear input after selection
                              // setShowSkillsList(true); // Keep dropdown open
                              setValidationErrors(({ skills, ...restErrors }) => restErrors);
                            }}>
                            <Text style={styles.autocompleteItem}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        disableVirtualization={true}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true} // Important for Android
                        ListEmptyComponent={<Text style={styles.noMatchText}>No matches found</Text>}
                      />
                    </View>
                  )}

                  {/* Selected Skills Section */}
                  <View style={styles.selectedItems}>
                    {skillBadgesState
                      .filter(badge => badge.flag === 'added')
                      .map(badge => (
                        <View
                          key={badge.skillBadge.id}
                          style={[styles.selectedItem, { backgroundColor: '#334584' }]}>
                          <Text style={styles.selectedItemText}>{badge.skillBadge.name}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              removeSkill(badge.skillBadge.id, true, badge.skillBadge.name);
                            }}>
                            <Text style={styles.removeText}>x</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    {skills.map(skill => (
                      <View
                        key={skill.id}
                        style={[styles.selectedItem, { backgroundColor: '#334584' }]}>
                        <Text style={styles.selectedItemText}>{skill.skillName}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            removeSkill(skill.id, false, skill.skillName);
                          }}>
                          <Text style={styles.removeText}>x</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
                {/* Locations */}
                <View style={styles.inputContainer}>
                  <View style={styles.searchInputContainer}>
                    <TextInput
                      style={[styles.input, validationErrors.locations ? styles.errorInput : {}]}
                      placeholder="Search Locations"
                      placeholderTextColor="#0D0D0D"
                      value={locationQuery}
                      onFocus={toggleLocationDropdown}
                      onChangeText={text => {
                        setLocationQuery(text);
                        setShowLocationList(true); // Ensure dropdown opens when typing
                      }}
                    />
                    {locationQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setLocationQuery('');
                          setShowLocationList(false);
                        }}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#888" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {validationErrors.locations && (
                    <Text style={styles.errorText}>{validationErrors.locations}</Text>
                  )}

                  {showLocationList && (
                    <View
                      style={[
                        styles.dropdown,
                        {
                          position: 'absolute',
                          top: 50,
                          left: 0,
                          right: 0,
                          maxHeight: 200,
                          zIndex: 1000,
                        },
                      ]}>
                      <FlatList
                        data={
                          locationQuery.length > 0
                            ? cities.filter(
                              loc =>
                                loc.toLowerCase().includes(locationQuery.toLowerCase()) &&
                                !locations.includes(loc),
                            )
                            : cities.filter(loc => !locations.includes(loc))
                        }
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() => {
                              addLocation(item);
                              setLocationQuery(''); // Clear input after selection
                              // setShowLocationList(true); // Keep dropdown open
                              setValidationErrors(({ locations, ...restErrors }) => restErrors);
                            }}>
                            <Text style={styles.autocompleteItem}>{item}</Text>
                          </TouchableOpacity>
                        )}
                        disableVirtualization={true}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        ListEmptyComponent={<Text style={styles.noMatchText}>No matches found</Text>}
                      />
                    </View>
                  )}

                  <View style={styles.selectedItems}>
                    {locations.map(location => (
                      <View
                        key={location}
                        style={[styles.selectedItem, { backgroundColor: '#334584' }]}>
                        <Text style={styles.selectedItemText}>{location}</Text>
                        <TouchableOpacity onPress={() => removeLocation(location)}>
                          <Text style={styles.removeText}>x</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Experience */}
           <View style={styles.inputContainer}>
  <TouchableOpacity
    style={[styles.input, validationErrors.experience ? styles.errorInput : {}]}
    onPress={() => setShowExperienceList(!showExperienceList)}
  >
    <Text style={{ color: experienceQuery ? '#0D0D0D' : '#B1B1B1', fontFamily: 'PlusJakartaSans-Medium' }}>
      {experienceQuery || 'Select Experience'}
    </Text>
  </TouchableOpacity>

  {validationErrors.experience && (
    <Text style={styles.errorText}>{validationErrors.experience}</Text>
  )}

  {showExperienceList && (
    <View style={[styles.dropdown, { zIndex: 1000 }]}>
      <FlatList
        data={[...Array(16).keys()].map(String)} // ['0', '1', ..., '15']
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setExperience(item);
              setExperienceQuery(item);
              setShowExperienceList(false);
              setValidationErrors(({ experience, ...rest }) => rest);
            }}
          >
            <Text
              style={[
                styles.autocompleteItem,
                item === experienceQuery && { fontFamily: 'PlusJakartaSans-Bold'},
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        nestedScrollEnabled
      />
    </View>
  )}
</View>


                <GradientButton
                  title="Save Changes"
                  onPress={handleSaveChanges}
                  style={styles.button} // Apply button styles
                />
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    height: '65%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666666',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  input: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    width: '100%',
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    color: '#0D0D0D',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    maxHeight: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    borderRadius: 5,
    zIndex: 1000,
    overflow: 'hidden',
    elevation: 5, // Added elevation for better visibility
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
  autocompleteItem: {
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
  selectedItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 8,
  },
  selectedItem: {
    backgroundColor: '#334584',
    padding: 5,
    marginRight: 10,
    marginBottom: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  removeText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: '100%',
    borderRadius: 5,
    marginTop: 8,
  },
  scrollContainer: {
    maxHeight: 150,
  },
});

export default ProfessionalDetailsForm;
