import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/Model';
import { useAuth } from '@context/Authcontext';
import { FeedbackFormsService } from '@services/FeedbackFormsService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { showToast } from '@services/login/ToastService';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

/**
 * Question types based on web version:
 * RATING (STARS, SCALE, EMOJIS), RADIO, CHECKBOX, REVIEW, NUMBER, TEXTAREA, EMAIL, TEXT, PHONE
 */

type FeedbackFormDetailRouteProp = RouteProp<
    RootStackParamList,
    'FeedbackFormDetails'
>;

interface Question {
    questionKey: string;
    question: string;
    questionType: 'RATING' | 'RADIO' | 'CHECKBOX' | 'REVIEW' | 'NUMBER' | 'TEXTAREA' | 'EMAIL' | 'TEXT' | 'PHONE';
    displayType?: 'STARS' | 'SCALE' | 'EMOJIS';
    options: string[];
    isRequired: boolean;
}

interface FormDetails {
    id: number;
    formName: string;
    mentorName: string;
    collegeName: string;
    description?: string;
    formDescription?: string;
    questions: Question[];
}

const { width: screenWidth } = Dimensions.get('window');

const FeedbackFormDetailScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<FeedbackFormDetailRouteProp>();
    const { formId, title } = route.params;
    const { userId } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
    const [formData, setFormData] = useState<{ [key: string]: any }>({});
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        fetchFormDetails();
    }, [formId]);

    const fetchFormDetails = async () => {
        if (!userId) return;
        setLoading(true);
        const result = await FeedbackFormsService.getFormById(
            Number(userId),
            formId,
        );

        if (result.success && result.data) {
            const data = result.data;
            const parsedQuestions: Question[] = typeof data.questions === 'string'
                ? JSON.parse(data.questions)
                : data.questions;

            setFormDetails({
                ...data,
                questions: parsedQuestions
            });

            // Initialize form data
            const initialData: { [key: string]: any } = {};
            parsedQuestions.forEach(q => {
                if (q.questionType === 'CHECKBOX') {
                    initialData[q.questionKey] = [];
                } else {
                    initialData[q.questionKey] = '';
                }
            });
            setFormData(initialData);
        } else {
            showToast('error', result.error || 'Failed to load form details');
            navigation.goBack();
        }
        setLoading(false);
    };

    const handleInputChange = (questionKey: string, value: any, questionType: string, isChecked: boolean | null = null) => {
        setFormData(prev => {
            const updated = { ...prev };

            if (questionType === 'CHECKBOX') {
                const currentValues = prev[questionKey] || [];
                if (isChecked) {
                    updated[questionKey] = [...currentValues, value];
                } else {
                    updated[questionKey] = currentValues.filter((item: any) => item !== value);
                }
            } else if (questionType === 'NUMBER') {
                updated[questionKey] = value === '' ? '' : Number(value);
            } else {
                updated[questionKey] = value;
            }

            return updated;
        });

        if (fieldErrors[questionKey]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[questionKey];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (formDetails && formDetails.questions) {
            formDetails.questions.forEach(q => {
                const value = formData[q.questionKey];

                if (q.questionType === 'TEXTAREA' && value && value.trim().length < 10) {
                    errors[q.questionKey] = 'Response must be at least 10 characters';
                }

                if (q.isRequired) {
                    if (q.questionType === 'CHECKBOX') {
                        if (!Array.isArray(value) || value.length === 0) {
                            errors[q.questionKey] = 'Please select at least one option';
                        }
                    } else if (['RADIO', 'REVIEW', 'RATING'].includes(q.questionType)) {
                        if (value === undefined || value === null || value === '') {
                            errors[q.questionKey] = 'Please select an option';
                        }
                    } else if (!value || (typeof value === 'string' && value.trim() === '')) {
                        errors[q.questionKey] = 'This field is required';
                    }
                }
            });
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast('error', 'Please fill all required fields');
            return;
        }

        if (!userId) return;

        setSubmitting(true);
        const answers = formDetails!.questions.map((q, index) => ({
            questionKey: q.questionKey,
            answer: formData[q.questionKey],
            questionNumber: index + 1
        }));

        const result = await FeedbackFormsService.submitFeedback(
            Number(userId),
            formId,
            answers,
        );

        setSubmitting(false);

        if (result.success) {
            setShowSuccessPopup(true);
        } else {
            showToast('error', result.error || 'Failed to submit feedback');
        }
    };

    const renderRating = (q: Question) => {
        const value = formData[q.questionKey];
        const displayType = q.displayType || 'STARS';

        if (displayType === 'STARS') {
            const starLabels: { [key: string]: string } = {
                '1': 'Poor', '2': 'Fair', '3': 'Good', '4': 'Very Good', '5': 'Excellent'
            };
            return (
                <View style={styles.starsContainer}>
                    {q.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.starOption}
                            onPress={() => handleInputChange(q.questionKey, option, q.questionType)}>
                            <MaterialIcons
                                name={Number(option) <= Number(value) ? "star" : "star-outline"}
                                size={32}
                                color={Number(option) <= Number(value) ? "#F46F16" : "#DDD"}
                            />
                            <Text style={styles.ratingLabel}>{starLabels[option]}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (displayType === 'SCALE') {
            const options = q.options.map(Number);
            const min = Math.min(...options);
            const max = Math.max(...options);
            const currentValue = value === '' ? min : Number(value);

            return (
                <View style={styles.scaleContainer}>
                    <MultiSlider
                        values={[currentValue]}
                        sliderLength={screenWidth - 64}
                        onValuesChange={(values: number[]) => handleInputChange(q.questionKey, values[0].toString(), q.questionType)}
                        min={min}
                        max={max}
                        step={1}
                        selectedStyle={{ backgroundColor: '#F46F16' }}
                        unselectedStyle={{ backgroundColor: '#DDD' }}
                        markerStyle={styles.sliderMarker}
                    />
                    <View style={[styles.scaleLabels, { zIndex: 1000, marginTop: 10 }]}>
                        {q.options.map((opt, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    console.log(`[FeedbackForm] Scale Label Tapped: ${opt} for question ${q.questionKey}`);
                                    handleInputChange(q.questionKey, opt, q.questionType);
                                }}
                                hitSlop={{ top: 20, bottom: 20, left: 15, right: 15 }}
                                style={{ padding: 5 }}>
                                <Text style={[styles.scaleText, value === opt && styles.activeScaleText]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            );
        }

        if (displayType === 'EMOJIS') {
            const emojiMap: { [key: string]: string } = {
                '1': '😞', '2': '😕', '3': '😐', '4': '😊', '5': '😃'
            };
            const emojiLabels: { [key: string]: string } = {
                '1': 'Poor', '2': 'Fair', '3': 'Good', '4': 'Very Good', '5': 'Excellent'
            };
            return (
                <View style={styles.emojiContainer}>
                    {q.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.emojiOption}
                            onPress={() => handleInputChange(q.questionKey, option, q.questionType)}>
                            <Text style={[
                                styles.emojiText,
                                value && value !== option && styles.inactiveEmoji
                            ]}>
                                {emojiMap[option]}
                            </Text>
                            <Text style={[
                                styles.ratingLabel,
                                value === option && styles.activeRatingLabel,
                                value && value !== option && styles.inactiveLabel
                            ]}>
                                {emojiLabels[option]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        return null;
    };

    const renderQuestionInput = (q: Question) => {
        const value = formData[q.questionKey] || '';

        switch (q.questionType) {
            case 'RATING':
                return renderRating(q);
            case 'RADIO':
            case 'REVIEW':
                const isReview = q.questionType === 'REVIEW';
                return (
                    <View style={isReview ? styles.reviewGroup : styles.radioGroup}>
                        {q.options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.radioOption,
                                    value === option && styles.radioOptionSelected,
                                ]}
                                onPress={() => handleInputChange(q.questionKey, option, q.questionType)}>
                                {isReview ? (
                                    <View style={styles.reviewContent}>
                                        <MaterialIcons
                                            name={Number(option) <= Number(value) ? "star" : "star-outline"}
                                            size={20}
                                            color={Number(option) <= Number(value) ? "#F46F16" : "#666"}
                                        />
                                        <Text style={[styles.radioText, value === option && styles.activeRadioText]}>{option}</Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={[styles.radioCircle, value === option && styles.radioCircleSelected]}>
                                            {value === option && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={styles.radioText}>{option}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 'CHECKBOX':
                return (
                    <View style={styles.checkboxGroup}>
                        {q.options.map((option, index) => {
                            const isChecked = Array.isArray(value) && value.includes(option);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.checkboxOption, isChecked && styles.checkboxOptionSelected]}
                                    onPress={() => handleInputChange(q.questionKey, option, q.questionType, !isChecked)}>
                                    <MaterialIcons
                                        name={isChecked ? "check-box" : "check-box-outline-blank"}
                                        size={24}
                                        color={isChecked ? "#F46F16" : "#666"}
                                    />
                                    <Text style={styles.checkboxText}>{option}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );
            case 'NUMBER':
                return (
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Enter a number..."
                        value={value.toString()}
                        onChangeText={text => handleInputChange(q.questionKey, text.replace(/[^0-9]/g, ''), q.questionType)}
                    />
                );
            case 'TEXTAREA':
                return (
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Enter your response here..."
                        value={value}
                        onChangeText={text => handleInputChange(q.questionKey, text, q.questionType)}
                    />
                );
            case 'EMAIL':
                return (
                    <TextInput
                        style={styles.input}
                        keyboardType="email-address"
                        placeholder="Enter your email address..."
                        value={value}
                        onChangeText={text => handleInputChange(q.questionKey, text, q.questionType)}
                    />
                );
            case 'PHONE':
                return (
                    <TextInput
                        style={styles.input}
                        keyboardType="phone-pad"
                        placeholder="Enter your phone number..."
                        maxLength={10}
                        value={value}
                        onChangeText={text => handleInputChange(q.questionKey, text.replace(/[^0-9]/g, ''), q.questionType)}
                    />
                );
            default: // TEXT
                return (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your response..."
                        value={value}
                        onChangeText={text => handleInputChange(q.questionKey, text, q.questionType)}
                    />
                );
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F46F16" />
                <Text style={styles.loadingText}>Loading form details...</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../../assests/Images/backgrounds/image.png')}
            style={styles.background}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
                    <View style={{ width: 32 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {formDetails && (
                        <View style={styles.formMetaCard}>
                            <Text style={styles.formTitle}>{formDetails.formName}</Text>
                            {(formDetails.description || formDetails.formDescription) && (
                                <Text style={styles.formDescription}>{formDetails.description || formDetails.formDescription}</Text>
                            )}
                            <View style={styles.metaDivider} />
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Mentor: </Text>
                                <Text style={styles.metaValue}>{formDetails.mentorName}</Text>
                            </View>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>College: </Text>
                                <Text style={styles.metaValue}>{formDetails.collegeName}</Text>
                            </View>
                        </View>
                    )}

                    {formDetails?.questions.map((q, index) => (
                        <View key={q.questionKey} style={styles.questionCard}>
                            <Text style={styles.questionText}>
                                {index + 1}. {q.question}
                                {q.isRequired && <Text style={styles.requiredMark}> *</Text>}
                            </Text>
                            {renderQuestionInput(q)}
                            {fieldErrors[q.questionKey] && (
                                <Text style={styles.errorText}>{fieldErrors[q.questionKey]}</Text>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {showSuccessPopup && (
                <View style={styles.successPopupOverlay}>
                    <View style={styles.successPopup}>
                        <View style={styles.successIconContainer}>
                            <MaterialIcons name="check" size={40} color="#FFF" />
                        </View>
                        <Text style={styles.successTitle}>Feedback Submitted Successfully!</Text>
                        <Text style={styles.successMessage}>Thank you for your valuable feedback. Your response has been recorded.</Text>
                        <TouchableOpacity
                            style={styles.successBtn}
                            onPress={() => {
                                setShowSuccessPopup(false);
                                navigation.goBack();
                            }}>
                            <Text style={styles.successBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#000',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
    },
    formMetaCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFE0CC',
    },
    formTitle: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#F46F16',
        marginBottom: 8,
    },
    formDescription: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    metaDivider: {
        height: 1,
        backgroundColor: '#FFE0CC',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    metaLabel: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: '#000',
    },
    metaValue: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#444',
    },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    questionText: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans-SemiBold',
        color: '#333',
        marginBottom: 16,
        lineHeight: 20,
    },
    requiredMark: {
        color: '#E53935',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#333',
        backgroundColor: '#FAFAFA',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    radioGroup: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 8,
    },
    radioOptionSelected: {
        borderColor: '#F46F16',
        backgroundColor: '#FFF7F2',
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CCC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioCircleSelected: {
        borderColor: '#F46F16',
    },
    radioDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#F46F16',
    },
    radioText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    activeRadioText: {
        color: '#F46F16',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    checkboxGroup: {
        gap: 12,
    },
    checkboxOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 8,
    },
    checkboxOptionSelected: {
        borderColor: '#F46F16',
        backgroundColor: '#FFF7F2',
    },
    checkboxText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'PlusJakartaSans-Medium',
        marginLeft: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    starOption: {
        alignItems: 'center',
        gap: 4,
    },
    ratingLabel: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    activeRatingLabel: {
        color: '#F46F16',
    },
    scaleContainer: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    sliderMarker: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: '#F46F16',
        borderWidth: 4,
        borderColor: '#FFF',
        elevation: 3,
    },
    scaleLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
    },
    scaleText: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    activeScaleText: {
        color: '#F46F16',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    emojiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    emojiOption: {
        alignItems: 'center',
        flex: 1,
    },
    emojiText: {
        fontSize: 36,
        marginBottom: 8,
    },
    inactiveEmoji: {
        opacity: 0.35,
    },
    inactiveLabel: {
        opacity: 0.5,
    },
    reviewGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    reviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    errorText: {
        color: '#E53935',
        fontSize: 12,
        marginTop: 8,
        fontFamily: 'PlusJakartaSans-Medium',
    },
    submitButton: {
        backgroundColor: '#F46F16',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#F46F16',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    successPopupOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successPopup: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    successIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
    },
    successMessage: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    successBtn: {
        backgroundColor: '#F46F16',
        paddingHorizontal: 48,
        paddingVertical: 12,
        borderRadius: 12,
    },
    successBtnText: {
        color: '#FFF',
        fontFamily: 'PlusJakartaSans-Bold',
        fontSize: 16,
    },
});

export default FeedbackFormDetailScreen;
