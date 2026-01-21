/**
 * RoleGuard - 角色權限檢查元件
 * Phase 3 新增
 *
 * 根據使用者角色或權限決定是否渲染子元件
 */
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGuard 元件
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子元件
 * @param {string[]} props.allowedRoles - 允許的角色列表
 * @param {string[]} props.requiredPermissions - 需要的權限列表（AND 邏輯）
 * @param {string[]} props.anyPermissions - 任一權限即可（OR 邏輯）
 * @param {React.ReactNode} props.fallback - 沒有權限時顯示的內容
 * @param {boolean} props.showFallback - 是否顯示 fallback（預設 false，不顯示任何內容）
 */
const RoleGuard = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  anyPermissions = [],
  fallback = null,
  showFallback = false,
}) => {
  const { role, hasPermission } = useAuth();

  // 1. 檢查角色
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return showFallback ? fallback : null;
    }
  }

  // 2. 檢查必要權限（AND 邏輯）
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((p) => hasPermission(p));
    if (!hasAllPermissions) {
      return showFallback ? fallback : null;
    }
  }

  // 3. 檢查任一權限（OR 邏輯）
  if (anyPermissions.length > 0) {
    const hasAnyPermission = anyPermissions.some((p) => hasPermission(p));
    if (!hasAnyPermission) {
      return showFallback ? fallback : null;
    }
  }

  // 通過所有檢查
  return <>{children}</>;
};

/**
 * ManagerOnly - 僅主管可見
 */
export const ManagerOnly = ({ children, fallback = null }) => {
  return (
    <RoleGuard
      allowedRoles={['manager', 'hr_admin', 'ceo', 'system_admin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * HROnly - 僅 HR 可見
 */
export const HROnly = ({ children, fallback = null }) => {
  return (
    <RoleGuard
      allowedRoles={['hr_admin', 'ceo', 'system_admin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * AdminOnly - 僅系統管理員可見
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['system_admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * CanExport - 有匯出權限
 */
export const CanExport = ({ children, fallback = null }) => {
  return (
    <RoleGuard
      requiredPermissions={['export_data']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * CanApprove - 有審批權限
 */
export const CanApprove = ({ children, fallback = null }) => {
  return (
    <RoleGuard
      requiredPermissions={['approve_subordinates']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

export default RoleGuard;
