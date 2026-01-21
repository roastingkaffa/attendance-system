/**
 * EmployeeForm - 員工表單元件
 * Phase 3 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import hrService from '../../services/hrService';
import Button from '../common/Button';

const EmployeeForm = ({ employee, onSuccess, onCancel }) => {
  const isEdit = !!employee;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee',
    department: '',
    is_active: true,
  });

  // 初始化表單
  useEffect(() => {
    if (employee) {
      setFormData({
        employee_id: employee.employee_id || '',
        username: employee.username || '',
        email: employee.email || '',
        phone: employee.phone || '',
        password: '',
        role: employee.role || 'employee',
        department: employee.department || '',
        is_active: employee.is_active !== false,
      });
    }
  }, [employee]);

  // 取得部門列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await hrService.getDepartments();
        if (response.success) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error('取得部門失敗:', error);
      }
    };
    fetchDepartments();
  }, []);

  // 處理輸入變更
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (!formData.username) {
      toast.error('請輸入姓名');
      return;
    }

    if (!isEdit && !formData.employee_id) {
      toast.error('請輸入員工編號');
      return;
    }

    if (!isEdit && !formData.password) {
      toast.error('請輸入密碼');
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        // 更新員工
        const updateData = { ...formData };
        delete updateData.employee_id; // 員工編號不可修改
        if (!updateData.password) {
          delete updateData.password; // 如果密碼為空，不更新
        }

        await hrService.updateEmployee(employee.employee_id, updateData);
        toast.success('員工資料已更新');
      } else {
        // 新增員工
        await hrService.createEmployee(formData);
        toast.success('員工已建立');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('儲存員工失敗:', error);
      toast.error(error.message || '儲存失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 員工編號 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            員工編號 {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            placeholder="例如：EMP001"
          />
        </div>

        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="員工姓名"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="email@example.com"
          />
        </div>

        {/* 電話 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0912345678"
          />
        </div>

        {/* 密碼 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密碼 {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={isEdit ? '留空則不修改' : '請輸入密碼'}
          />
        </div>

        {/* 角色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            角色
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="employee">一般員工</option>
            <option value="manager">部門主管</option>
            <option value="hr_admin">HR 管理員</option>
            <option value="ceo">總經理</option>
            <option value="system_admin">系統管理員</option>
          </select>
        </div>

        {/* 部門 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            部門
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">無</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* 在職狀態 */}
        {isEdit && (
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">在職</span>
            </label>
          </div>
        )}
      </div>

      {/* 按鈕 */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? '儲存中...' : isEdit ? '更新' : '建立'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
