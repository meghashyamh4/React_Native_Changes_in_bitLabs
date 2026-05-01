import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Image,
} from 'react-native';
import { useJobAlerts } from '@viewmodel/Alert/Notificationmodel';
import { JobAlert } from '@services/Alert/NotificationServieces';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@models/Model';
import { useAuth } from '@context/Authcontext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const NotificationsPage: React.FC = () => {
  const { userId } = useAuth();
  const {
    jobAlerts,
    loading,
    loadingMore,
    readLoading,
    clearLoading,
    deletingItems,
    hasMore,
    handleMarkAsSeen,
    handleReadAll,
    handleDeleteAlert,
    handleClearAll,
    refreshJobAlerts,
    loadMoreNotifications,
  } = useJobAlerts();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  
//changed
function formatDate(dateString : String) {
  if (!dateString) return "";

  const isoString = dateString.replace(" ", "T"); // important fix
  const date = new Date(isoString);

  if (!date) return "Invalid Date";

  return date.toDateString();
}

  const handleNotificationPress = (alert: JobAlert) => {
    console.log('🔔 [NOTIFICATION PRESS] Full Alert Data:', JSON.stringify(alert, null, 2));
    if (!userId) return;
    handleMarkAsSeen(alert.id);

    const fId = alert.featureId || (alert as any).hackathonId || (alert as any).blogId || (alert as any).videoId || (alert as any).meetingId || (alert as any).mentorConnectId;

    if (alert.feature === 'hackathon') {
      if (fId) navigation.navigate('ApplicantHackathonDetails', { id: fId });
      else navigation.navigate('BottomTab', { screen: 'Arena' });
    } else if (alert.feature === 'blog' || alert.feature === 'Tech Vibes') {
      navigation.navigate('TechVibes', fId ? { blogId: fId } : undefined);
    } else if (alert.feature === 'Mentor Connect') {
      navigation.navigate('MentorConnect', fId ? { meetingId: fId } : undefined);
    } else if (alert.feature === 'Tech buzz shorts') {
      navigation.navigate('VerifiedVideosScreen', fId ? { videoId: fId } : undefined);
    } else {
      navigation.navigate('BottomTab', { screen: 'Home' });
    }
  };

  const renderItem = ({ item }: { item: JobAlert }) => {
    const isSeen = item.seenStatus === true;
    const isDeleting = deletingItems.has(item.id);

    return (
      <View
        style={[
          styles.notificationCard,
          isSeen ? styles.read : null,
          isDeleting ? styles.deleting : null,
        ]}
      >
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={(e) => {
            e?.stopPropagation?.(); // Prevent parent onPress from firing
            handleDeleteAlert(item.id);
          }}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#fd7e14" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contentContainer}
          onPress={() => !isDeleting && handleNotificationPress(item)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.indicatorDot,
                isSeen ? styles.indicatorDotSeen : styles.indicatorDotUnseen,
              ]}
            />
          </View>
          <View style={styles.content}>
            <Text
              style={[
                styles.message,
                isSeen ? styles.readText : null,
              ]}
            >
              {item.message}
            </Text>
            <View style={styles.dateWrapper}>
              <Text style={[styles.dateInfo, isSeen ? styles.readText : null]}>
                {/* changed */}
                Posted On: {formatDate(item.createdTime.toString())}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const sortedAlerts = [...jobAlerts].sort((a, b) => {
    const dateA = a.createdTime && a.createdTime.length >= 3
      ? new Date(a.createdTime[0], a.createdTime[1] - 1, a.createdTime[2])
      : new Date(0);
    const dateB = b.createdTime && b.createdTime.length >= 3
      ? new Date(b.createdTime[0], b.createdTime[1] - 1, b.createdTime[2])
      : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const anyActionRunning = readLoading || clearLoading;
  const hasNoNotifications = jobAlerts.length === 0;
  const isReadAllDisabled = loading || hasNoNotifications || anyActionRunning;
  const isClearAllDisabled = loading || hasNoNotifications || anyActionRunning;

  return (
    <ImageBackground
      source={require('../../assests/Images/backgrounds/image.png')}
      style={styles.background}
    >
      <View style={styles.header}>
        <View style={styles.navHeaderRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.navBackButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.heading}>Notification</Text>
          <View style={styles.navBackButtonPlaceholder} />
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.readAllButton,
                isReadAllDisabled && styles.disabledButton,
              ]}
              onPress={handleReadAll}
              disabled={isReadAllDisabled}
            >
              {readLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.readAllButtonText,
                    isReadAllDisabled && styles.disabledButtonText,
                  ]}>
                  Read all
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.clearAllButton,
                isClearAllDisabled && styles.disabledButton,
              ]}
              onPress={handleClearAll}
              disabled={isClearAllDisabled}
            >
              {clearLoading ? (
                <ActivityIndicator size="small" color="#fd7e14" />
              ) : (
                <Text
                  style={[
                    styles.clearAllButtonText,
                    isClearAllDisabled && styles.disabledButtonText,
                  ]}>
                  Clear all
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonLine1} />
                <View style={styles.skeletonLine2} />
              </View>
            ))}
          </View>
        ) : sortedAlerts.length > 0 ? (
          <FlatList
            data={sortedAlerts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={hasMore ? loadMoreNotifications : null}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#fd7e14" />
                  <Text style={styles.loadingMoreText}>Loading more notifications...</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assests/Images/backgrounds/notification-empty-state.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No new notifications at the moment.</Text>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp('3%'),
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
  headerContainer: {
    marginBottom: hp('1%'),
    marginTop: hp('1.5%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: hp('1%'),
  },
  actionButton: {
    flex: 1,
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('3%'),
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  readAllButton: {
    backgroundColor: '#fd7e14',
  },
  readAllButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: hp('1.5%'),
  },
  clearAllButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fd7e14',
  },
  clearAllButtonText: {
    color: '#fd7e14',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: hp('1.5%'),
  },
  loadingContainer: {
    padding: 20,
  },
  skeletonCard: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonLine1: {
    height: 20,
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  skeletonLine2: {
    height: 15,
    width: '40%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  listContent: {
    paddingBottom: hp('2%'),
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  read: {
    backgroundColor: '#E8E8E8',
  },
  deleting: {
    opacity: 0.5,
  },
  deleteIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 2,
    padding: 6,
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fd7e14',
  },
  indicatorDotUnseen: {
    backgroundColor: '#fd7e14',
  },
  indicatorDotSeen: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  message: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#000',
    fontSize: hp('1.8%'),
    marginBottom: 8,
  },
  readText: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#666',
  },
  dateWrapper: {
    marginTop: 4,
  },
  dateInfo: {
    fontSize: hp('1.3%'),
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  emptyImage: {
    width: wp('60%'),
    height: hp('30%'),
    marginBottom: hp('2%'),
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: hp('2%'),
    color: '#666',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: hp('1.5%'),
    color: '#666',
    fontFamily: 'PlusJakartaSans-Medium',
  },
});

export default NotificationsPage;
