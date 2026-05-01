import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/Model';
import { useAuth } from '@context/Authcontext';
import { FeedbackFormsService } from '@services/FeedbackFormsService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { showToast } from '@services/login/ToastService';

type FeedbackFormsListNavigationProp = StackNavigationProp<
    RootStackParamList,
    'FeedbackFormsList'
>;

interface FeedbackForm {
    formId: number;
    formName: string;
    mentorName: string;
    description: string;
    formDescription?: string;
    collegeName: string;
    isActive: boolean;
    isSubmitted: boolean;
}

const FeedbackFormsListScreen = () => {
    const navigation = useNavigation<FeedbackFormsListNavigationProp>();
    const { userId } = useAuth();
    const [forms, setForms] = useState<FeedbackForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        if (!userId) return;
        setLoading(true);
        const result = await FeedbackFormsService.getAllForms(Number(userId));
        if (result.success) {
            console.log('FeedbackFormsListScreen: All forms:', JSON.stringify(result.data, null, 2));
            setForms(result.data);
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const renderItem = ({ item }: { item: FeedbackForm }) => (
        <TouchableOpacity
            style={[styles.card, !item.isActive && styles.cardDisabled]}
            onPress={() => {
                if (item.isSubmitted) {
                    showToast('success', 'You have already submitted this feedback');
                    return;
                }
                if (item.isActive) {
                    navigation.navigate('FeedbackFormDetails', {
                        formId: item.formId,
                        title: item.formName,
                    });
                }
            }}
            disabled={!item.isActive}
        >
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <MaterialIcons
                        name="feedback"
                        size={24}
                        color={item.isSubmitted ? "#4CAF50" : (item.isActive ? "#F46F16" : "#999")}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.formName, (!item.isActive || item.isSubmitted) && styles.textDisabled]}>
                        {item.formName}
                    </Text>
                    {(item.description || item.formDescription) && (
                        <View style={styles.row}>
                            <MaterialIcons name="info-outline" size={16} color="#666" style={styles.rowIcon} />
                            <Text style={styles.detailText} numberOfLines={2}>
                                Description: {item.description || item.formDescription}
                            </Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <MaterialIcons name="person-outline" size={16} color="#666" style={styles.rowIcon} />
                        <Text style={styles.detailText}>Mentor: {item.mentorName}</Text>
                    </View>
                    <View style={styles.row}>
                        <MaterialIcons name="school" size={16} color="#666" style={styles.rowIcon} />
                        <Text style={styles.detailText}>College: {item.collegeName}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                        <View style={[
                            styles.statusBadge,
                            item.isActive ? styles.statusActive : styles.statusInactive,
                            item.isSubmitted && { marginRight: 8 }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                item.isActive ? styles.statusTextActive : styles.statusTextInactive
                            ]}>
                                {item.isActive ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                        {item.isSubmitted && (
                            <View style={[styles.statusBadge, styles.statusSubmitted]}>
                                <Text style={[styles.statusText, styles.statusTextSubmitted]}>
                                    Submitted
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {item.isActive && !item.isSubmitted && (
                    <MaterialIcons name="chevron-right" size={24} color="#999" />
                )}
                {item.isSubmitted && (
                    <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                )}
            </View>
        </TouchableOpacity>
    );


    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F46F16" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('../../assests/Images/backgrounds/image.png')}
            style={styles.background}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.navHeaderRow}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.navBackButton}>
                            <MaterialIcons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.heading}>Feedback Forms</Text>
                        <View style={styles.navBackButtonPlaceholder} />
                    </View>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchForms} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : forms.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No active feedback forms found.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={forms}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => (item?.formId ? item.formId.toString() : index.toString())}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    navHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navBackButton: {
        padding: 4,
    },
    navBackButtonPlaceholder: {
        width: 32,
    },
    heading: {
        fontSize: 18,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#000',
        flex: 1,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF0E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    formName: {
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Bold',
        color: '#333',
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 13,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#777',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#666',
        marginBottom: 2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#E53935',
        marginBottom: 16,
        textAlign: 'center',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#F46F16',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans-Bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'PlusJakartaSans-Medium',
    },
    cardDisabled: {
        opacity: 0.7,
        backgroundColor: '#f9f9f9',
    },
    textDisabled: {
        color: '#888',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    rowIcon: {
        marginRight: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusActive: {
        backgroundColor: '#FFF0E6',
        borderWidth: 1,
        borderColor: '#F46F16',
    },
    statusInactive: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    statusSubmitted: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'PlusJakartaSans-Bold',
    },
    statusTextActive: {
        color: '#F46F16',
    },
    statusTextInactive: {
        color: '#6B7280',
    },
    statusTextSubmitted: {
        color: '#4CAF50',
    },
});

export default FeedbackFormsListScreen;
