import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Eye, 
  Archive, 
  Trash2, 
  User, 
  Home, 
  Clock,
  CheckCircle,
  X 
} from 'lucide-react';
import { notificationApi } from '../utils/api';

const NotificationCenter = ({ isAdmin = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, filterType = filter, append = false) => {
    try {
      setLoading(true);
      console.log('🔔 Fetching notifications...', { pageNum, filterType, isAdmin });
      
      const params = {
        page: pageNum,
        limit: 10,
        ...(filterType !== 'all' && { status: filterType })
      };

      console.log('📊 Request params:', params);

      const response = isAdmin 
        ? await notificationApi.getAllNotifications(params)
        : await notificationApi.getMyNotifications(params);

      console.log('📤 API Response:', response);

      if (response && response.success) {
        const newNotifications = response.data.notifications;
        console.log('✅ Got notifications:', newNotifications?.length || 0);
        console.log('Notifications:', newNotifications);
        
        if (append) {
          setNotifications(prev => [...prev, ...(newNotifications || [])]);
        } else {
          setNotifications(newNotifications || []);
        }
        
        setHasMore((newNotifications || []).length === 10);
        if (!isAdmin && response.data.unreadCount !== undefined) {
          setUnreadCount(response.data.unreadCount);
        }
      } else {
        console.log('❌ API response was not successful:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (isAdmin) return; // Admin sees all notifications, no need for personal unread count
    
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filter);
    if (!isAdmin) {
      fetchUnreadCount();
    }
  }, [filter, isAdmin]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, status: 'read', readAt: new Date() }
            : notif
        )
      );
      if (!isAdmin) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read', readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId) => {
    try {
      await notificationApi.archiveNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (!isAdmin) {
        fetchUnreadCount(); // Refresh unread count
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (!isAdmin) {
        fetchUnreadCount(); // Refresh unread count
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type, status) => {
    const isUnread = status === 'unread';
    const iconClass = `h-5 w-5 ${isUnread ? 'text-blue-600' : 'text-gray-500'}`;
    
    switch (type) {
      case 'contact_owner':
        return <User className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter, true);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAdmin ? 'All Notifications' : 'Notifications'}
            </h3>
            <div className="flex items-center space-x-2">
              {!isAdmin && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            {['all', 'unread', 'read'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => {
                  setFilter(filterType);
                  setPage(1);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium capitalize ${
                  filter === filterType
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loading && page === 1 ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                      notification.status === 'unread' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium truncate ${
                            notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.metadata && (
                          <div className="text-xs text-gray-500 mt-2">
                            {notification.metadata.propertyTitle && (
                              <span className="inline-flex items-center">
                                <Home className="h-3 w-3 mr-1" />
                                {notification.metadata.propertyTitle}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 mt-2">
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => archiveNotification(notification._id)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Archive
                          </button>
                          {(isAdmin || notification.status !== 'unread') && (
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 text-center border-t border-gray-200">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;