/**
 * NotificationBell 元件
 * 通知鈴鐺圖示（顯示未讀數量）
 * Phase 2
 */
import React, { useState, useEffect, useCallback } from 'react';
import notificationService from '../../services/notificationService';

const NotificationBell = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // 取得未讀數量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data?.count || 0);
      }
    } catch (err) {
      console.error('取得未讀通知數量失敗:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // 每 30 秒更新一次
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      title="通知"
    >
      {/* 鈴鐺圖示 */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* 未讀數量徽章 */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
