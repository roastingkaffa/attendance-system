/**
 * EmployeeManagement - 員工管理元件
 * Phase 3 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import hrService from '../../services/hrService';
import Button from '../common/Button';
import EmployeeForm from './EmployeeForm';

const EmployeeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // 篩選狀態
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');

  // 表單狀態
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // 取得員工列表
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await hrService.getEmployees({
        page,
        page_size: pageSize,
        search,
        role: roleFilter,
        is_active: isActiveFilter,
      });
      if (response.success) {
        setEmployees(response.data.employees);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('取得員工列表失敗:', error);
      toast.error('取得員工列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search, roleFilter, isActiveFilter]);

  // 搜尋
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  // 編輯員工
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  // 新增員工
  const handleAdd = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  // 表單成功
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  // 角色 Badge
  const getRoleBadge = (role, roleDisplay) => {
    const colors = {
      employee: 'bg-gray-100 text-gray-700',
      manager: 'bg-blue-100 text-blue-700',
      hr_admin: 'bg-purple-100 text-purple-700',
      ceo: 'bg-red-100 text-red-700',
      system_admin: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[role] || colors.employee}`}>
        {roleDisplay}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 工具列 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋員工編號或姓名..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-60"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">全部角色</option>
            <option value="employee">一般員工</option>
            <option value="manager">部門主管</option>
            <option value="hr_admin">HR 管理員</option>
            <option value="ceo">總經理</option>
            <option value="system_admin">系統管理員</option>
          </select>
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="true">在職</option>
            <option value="false">離職</option>
            <option value="">全部</option>
          </select>
          <Button type="submit" variant="secondary" size="sm">
            搜尋
          </Button>
        </form>
        <Button variant="primary" onClick={handleAdd}>
          + 新增員工
        </Button>
      </div>

      {/* 員工列表 */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    員工
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    部門
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    入職日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    主管
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{emp.username}</p>
                        <p className="text-xs text-gray-500">{emp.employee_id}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getRoleBadge(emp.role, emp.role_display)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {emp.department_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {emp.hire_date || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {emp.direct_manager_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {emp.is_active ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          在職
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          離職
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(emp)}
                      >
                        編輯
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分頁 */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              共 {total} 筆，第 {page} 頁
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一頁
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={employees.length < pageSize}
              >
                下一頁
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 員工表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingEmployee ? '編輯員工' : '新增員工'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm
                employee={editingEmployee}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
