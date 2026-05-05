import { useState, useEffect } from 'react';
import { useAuth } from '@context/Authcontext';
import {
  countOfUnseenNotifications,
  fetchJobAlerts,
  markAlertAsSeen,
  markAllAsRead,
  deleteJobAlert,
  deleteAllNotifications,
  JobAlert,
} from '@services/Alert/NotificationServieces';
import { showToast } from '@services/login/ToastService';

export const useJobAlerts = () => {
  const { userId, userToken } = useAuth();
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readLoading, setReadLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const fetchAlerts = async () => {
    if (!userId || !userToken) {
      setJobAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(0);
      setHasMore(true);
      const alerts = await fetchJobAlerts(userId, userToken, 0, 15);
      console.log("Fetched alerts from server:", alerts);
      setJobAlerts(alerts);
      setHasMore(alerts.length === 15); // If we got exactly 15, there might be more
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setJobAlerts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (!userId || !userToken || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const alerts = await fetchJobAlerts(userId, userToken, nextPage, 15);
      console.log("Loaded more notifications, page:", nextPage, alerts);
      
      if (alerts.length === 0) {
        setHasMore(false);
      } else {
        setJobAlerts(prev => [...prev, ...alerts]);
        setCurrentPage(nextPage);
        setHasMore(alerts.length === 15); // If we got exactly 15, there might be more
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

    const [unseenCount, setUnseenCount] = useState(0);

const fetchUnseenCount = async () => {
  if (!userId || !userToken) return;

  try {
    const count = await countOfUnseenNotifications(userId, userToken);
    setUnseenCount(count);
  } catch {
    console.log("Error fetching notifications count");
  }
};

  useEffect(() => {
    fetchUnseenCount()
    let mounted = true;
    fetchAlerts().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [userId, userToken]);

  const handleMarkAsSeen = async (alertId: number) => {
    if (!userId || !userToken) return;
    try {
      await markAlertAsSeen(alertId, userId, userToken);
      await fetchUnseenCount();
      setJobAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                seenStatus: true,
                seenApplicantId: [...new Set([...(alert.seenApplicantId || []), userId])],
                applicantId: (alert.applicantId || []).filter((id) => id !== userId),
              }
            : alert
        )
      );
    } catch (error) {
      console.error('❌ ERROR marking notification as read:', error);
    }
  };

  const handleReadAll = async () => {
    if (!userId || !userToken) return;
    
    // Check if all notifications are already read
    const allAlreadyRead = jobAlerts.every(alert => 
      alert.seenStatus === true
    );
    
    if (allAlreadyRead) {
      showToast('success', 'All notifications are already marked as read');
      return;
    }
    
    setReadLoading(true);
    try {
      console.log("values in notification",userId,userToken)
      const response = await markAllAsRead(userId, userToken);
      await fetchUnseenCount();
      console.log("API response:" ,response);
      const uid = Number(userId);
      setJobAlerts((prevAlerts) =>
        prevAlerts.map((alert) => ({
          ...alert,
          seenStatus: true,
          seenApplicantId: [...new Set([...(alert.seenApplicantId || []), uid])],
          applicantId: (alert.applicantId || []).filter((id) => Number(id) !== uid),
        }))
      );
      showToast('success', 'All notifications marked as read');
    } catch (error) {
      console.error('❌ ERROR marking all as read:', error);
      showToast('error', 'Failed to mark all notifications as read. Please try again.');
    } finally {
      setReadLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (!userId || !userToken) return;
    try {
      // Add to deleting items and start animation
      setDeletingItems((prev) => new Set(prev).add(alertId));
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 400));
      await deleteJobAlert(alertId, userId, userToken);
      await fetchUnseenCount();
      // Update UI after successful deletion
      setJobAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
      showToast('success', 'Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Remove from deleting items if there was an error
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
      showToast('error', 'Failed to delete notification. Please try again.');
    }
  };

  const handleClearAll = async () => {
    if (!userId || !userToken) return;
    try {
      setClearLoading(true);
      // Mark all items as deleting
      const itemIds = new Set(jobAlerts.map((alert) => alert.id));
      setDeletingItems(itemIds);
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 400));
      await deleteAllNotifications(userId, userToken);
      await fetchUnseenCount();
      // Clear all notifications
      setJobAlerts([]);
      setDeletingItems(new Set());
      showToast('success', 'All notifications cleared successfully');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      setDeletingItems(new Set());
      showToast('error', 'Failed to clear all notifications. Please try again.');
    } finally {
      setClearLoading(false);
    }
  };

  // // Calculate unseen count
  // const unseenCount = async()=>{
  //   if(!userId || !userToken) return;
  //   try{
  //       console.log("count",await countOfUnseenNotifications(userId,userToken));
  //   }
  //   catch{
  //     console.log("Something Error in the fetching notifications count");
  //   }
  // };

  
  
  // jobAlerts.filter(
  //   (alert) => !alert.seenApplicantId?.includes(userId || 0)
  // ).length;

  return {
    jobAlerts,
    unseenCount,
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
    refreshJobAlerts: fetchAlerts,
    refreshUnseenCount: fetchUnseenCount,
    loadMoreNotifications,
  };
};
