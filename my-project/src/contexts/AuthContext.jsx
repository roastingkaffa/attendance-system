/**
 * AuthContext - 認證狀態管理
 * 提供全域的使用者認證狀態和相關操作
 * Phase 3 增強：新增角色、權限管理
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import authService from '../services/authService';
import attendanceService from '../services/attendanceService';
import userService from '../services/userService';

// 建立 Context
const AuthContext = createContext(null);

/**
 * AuthProvider 元件
 * 包裹整個應用程式，提供認證狀態
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('userId')
  );
  const [userId, setUserId] = useState(
    localStorage.getItem('userId') || ''
  );
  const [relationId, setRelationId] = useState(
    localStorage.getItem('relationId') || ''
  );
  const [loading, setLoading] = useState(false);

  // Phase 3 新增：使用者資訊、角色、權限
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('userRole') || 'employee');
  const [permissions, setPermissions] = useState({});

  /**
   * Phase 3 新增：取得使用者完整資訊
   */
  const fetchUserProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        setUserProfile(profile);
        setRole(profile.role || 'employee');
        setPermissions(profile.permissions || {});

        // 儲存到 localStorage
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userProfile', JSON.stringify(profile));

        return profile;
      }
    } catch (error) {
      console.error('取得使用者資訊失敗:', error);
    }
    return null;
  };

  /**
   * 登入函數
   */
  const login = async (userId, password) => {
    try {
      setLoading(true);

      // 呼叫登入 API
      const response = await authService.login(userId, password);

      // 儲存使用者 ID
      localStorage.setItem('userId', userId);
      setUserId(userId);
      setIsAuthenticated(true);

      // 取得員工-公司關聯 ID
      try {
        const relationResponse = await attendanceService.getRelation(userId);
        if (relationResponse && relationResponse.length > 0) {
          const relId = relationResponse[0].id;
          localStorage.setItem('relationId', relId);
          setRelationId(relId);
        }
      } catch (error) {
        console.error('獲取 relationId 時出錯:', error);
        toast.error('獲取員工資料失敗');
      }

      // Phase 3 新增：取得使用者完整資訊（角色、權限）
      await fetchUserProfile();

      toast.success(response.message || '登入成功');
      return { success: true };
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error(error.message || '登入失敗，請檢查帳號密碼');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 登出函數
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();

      // 清除本地儲存
      localStorage.removeItem('userId');
      localStorage.removeItem('relationId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      setUserId('');
      setRelationId('');
      setIsAuthenticated(false);

      // Phase 3 新增：清除角色與權限
      setUserProfile(null);
      setRole('employee');
      setPermissions({});

      toast.success('登出成功');
      return { success: true };
    } catch (error) {
      console.error('登出失敗:', error);
      toast.error(error.message || '登出失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Phase 3 新增：權限檢查方法
  // =====================================================

  /**
   * 檢查是否擁有指定權限
   * @param {string} permission - 權限名稱
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    return permissions[permission] === true;
  };

  /**
   * 檢查是否為主管（含 HR、CEO）
   * @returns {boolean}
   */
  const isManager = () => {
    return ['manager', 'hr_admin', 'ceo', 'system_admin'].includes(role);
  };

  /**
   * 檢查是否為 HR（含 CEO）
   * @returns {boolean}
   */
  const isHR = () => {
    return ['hr_admin', 'ceo', 'system_admin'].includes(role);
  };

  /**
   * 檢查是否為系統管理員
   * @returns {boolean}
   */
  const isAdmin = () => {
    return role === 'system_admin';
  };

  /**
   * 取得角色顯示名稱
   * @returns {string}
   */
  const getRoleDisplay = () => {
    const roleMap = {
      employee: '一般員工',
      manager: '部門主管',
      hr_admin: 'HR 管理員',
      ceo: '總經理',
      system_admin: '系統管理員',
    };
    return roleMap[role] || '一般員工';
  };

  /**
   * 修改密碼函數
   */
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await authService.changePassword(oldPassword, newPassword);
      toast.success(response.message || '密碼已更新');
      return { success: true };
    } catch (error) {
      console.error('修改密碼失敗:', error);
      toast.error(error.message || '修改密碼失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 忘記密碼函數
   */
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      toast.success(response.message || '臨時密碼已寄出');
      return { success: true };
    } catch (error) {
      console.error('忘記密碼失敗:', error);
      toast.error(error.message || '發送失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Phase 3 新增：頁面載入時取得使用者資訊
  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      // 嘗試從 localStorage 讀取
      const cachedProfile = localStorage.getItem('userProfile');
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          setUserProfile(profile);
          setRole(profile.role || 'employee');
          setPermissions(profile.permissions || {});
        } catch (e) {
          console.error('解析快取的使用者資訊失敗:', e);
        }
      }
      // 從後端取得最新資訊
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  // Context 值
  const value = {
    // 基本認證狀態
    isAuthenticated,
    userId,
    relationId,
    loading,

    // Phase 3 新增：使用者資訊與角色
    userProfile,
    role,
    permissions,

    // 基本方法
    login,
    logout,
    changePassword,
    forgotPassword,

    // Phase 3 新增：權限檢查方法
    fetchUserProfile,
    hasPermission,
    isManager,
    isHR,
    isAdmin,
    getRoleDisplay,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * 方便取得認證狀態和操作
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
};

export default AuthContext;
