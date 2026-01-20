/**
 * NotificationDropdown 元件
 * 通知下拉選單
 * Phase 2
 */
import React, { useState, useEffect, useCallback } from 'react';
import notificationService from '../../services/notificationService';
import Button from '../common/Button';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 取得通知列表
  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError('');
      const response = await notificationService.getNotifications({ limit: 10 });
      console.log('通知列表 API 回應:', response);
      if (response.success) {
        setNotifications(response.data?.notifications || []);
      }
    } catch (err) {
      console.error('取得通知列表失敗:', err);
      setError('取得通知失敗');
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // 標記為已讀
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('標記已讀失敗:', err);
    }
  };

  // 全部標記為已讀
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
      }
    } catch (err) {
      console.error('全部標記已讀失敗:', err);
    }
  };

  // 通知類型圖示
  const getNotificationIcon = (type) => {
    const icons = {
      approval_pending: '📋',
      approval_result: '✅',
      leave_balance_warning: '⚠️',
      clock_reminder: '⏰',
      overtime_reminder: '🕐',
      system: '📢',
    };
    return icons[type] || '📌';
  };

  // 格式化時間
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // 小於 1 小時：顯示幾分鐘前
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes <= 0 ? '剛剛' : `${minutes} 分鐘前`;
    }

    // 小於 24 小時：顯示幾小時前
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} 小時前`;
    }

    // 其他：顯示日期
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">通知</h3>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            全部已讀
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500">載入中...</div>
        )}

        {error && (
          <div className="p-4 text-center text-red-500">{error}</div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl">
                    {getNotificationIcon(notification.notification_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''} text-gray-900`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-gray-500">目前沒有通知</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
        >
          關閉
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
