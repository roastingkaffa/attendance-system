from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('employees', views.EmployeesView, basename='employees')
router.register('companies', views.CompaniesView, basename='companies')
router.register('attendance', views.AttendanceRecordsView, basename='attendance')
router.register('leave', views.leaveRecordsView, basename='leave_records')
router.register('relation', views.EmpCompanyRelView, basename='emp_company_rel')

app_name = 'attendance'

urlpatterns = [
    path('login/', views.login, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('change_password/', views.change_password, name='change_password'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('send-test-email/', views.test_send_email),
    # 新增：後端打卡驗證 API
    path('clock-in/', views.clock_in, name='clock_in'),
    path('clock-out/<int:record_id>/', views.clock_out, name='clock_out'),

    # Phase 2 Week 4：請假與審批 API
    path('leave/apply/', views.apply_leave, name='apply_leave'),
    path('leave/my-records/', views.my_leave_records, name='my_leave_records'),
    path('leave/balances/', views.leave_balances, name='leave_balances'),
    path('approval/approve/<int:approval_id>/', views.approve_leave, name='approve_leave'),
    path('approval/reject/<int:approval_id>/', views.reject_leave, name='reject_leave'),
    path('approval/pending/', views.pending_approvals, name='pending_approvals'),

    # Phase 1：補打卡 API
    path('makeup-clock/apply/', views.apply_makeup_clock, name='apply_makeup_clock'),
    path('makeup-clock/my-requests/', views.my_makeup_requests, name='my_makeup_requests'),
    path('makeup-clock/quota/', views.makeup_clock_quota, name='makeup_clock_quota'),
    path('makeup-clock/approve/<int:approval_id>/', views.approve_makeup_clock, name='approve_makeup_clock'),
    path('makeup-clock/reject/<int:approval_id>/', views.reject_makeup_clock, name='reject_makeup_clock'),
    path('makeup-clock/pending/', views.pending_makeup_approvals, name='pending_makeup_approvals'),

    # Phase 1：班表 API
    path('schedule/my-schedule/', views.my_work_schedule, name='my_work_schedule'),

    # Phase 2：加班管理 API
    path('overtime/apply/', views.apply_overtime, name='apply_overtime'),
    path('overtime/my-records/', views.my_overtime_records, name='my_overtime_records'),
    path('overtime/approve/<int:approval_id>/', views.approve_overtime, name='approve_overtime'),
    path('overtime/reject/<int:approval_id>/', views.reject_overtime, name='reject_overtime'),
    path('overtime/pending/', views.pending_overtime_approvals, name='pending_overtime_approvals'),
    path('overtime/cancel/<int:overtime_id>/', views.cancel_overtime, name='cancel_overtime'),

    # Phase 2：特休計算 API
    path('leave/annual-entitlement/', views.annual_leave_entitlement, name='annual_leave_entitlement'),
    path('leave/calculate-annual/', views.calculate_annual_leave, name='calculate_annual_leave'),

    # Phase 2：出勤報表 API
    path('reports/attendance-summary/', views.attendance_summary, name='attendance_summary'),
    path('reports/anomaly-list/', views.anomaly_list, name='anomaly_list'),

    # Phase 2：通知系統 API
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/unread-count/', views.unread_notification_count, name='unread_notification_count'),
    path('notifications/mark-read/<int:notification_id>/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),

    # Phase 3：使用者資訊與角色權限 API
    path('user/profile/', views.user_profile, name='user_profile'),

    # Phase 3：主管儀表板 API
    path('manager/dashboard/', views.manager_dashboard, name='manager_dashboard'),
    path('manager/reports/department/', views.department_report, name='department_report'),
    path('approval/batch/', views.batch_approve, name='batch_approve'),

    # Phase 3：HR 管理 API
    path('hr/employees/', views.hr_employee_list, name='hr_employee_list'),
    path('hr/employees/create/', views.hr_create_employee, name='hr_create_employee'),
    path('hr/employees/<str:employee_id>/', views.hr_update_employee, name='hr_update_employee'),
    path('hr/employees/<str:employee_id>/assign-manager/', views.hr_assign_manager, name='hr_assign_manager'),
    path('hr/leave-balances/batch-set/', views.hr_batch_set_leave_balances, name='hr_batch_set_leave_balances'),

    # Phase 3：部門管理 API
    path('hr/departments/', views.department_list, name='department_list'),
    path('hr/departments/create/', views.department_create, name='department_create'),
    path('hr/departments/<int:department_id>/', views.department_update, name='department_update'),
    path('hr/departments/<int:department_id>/delete/', views.department_delete, name='department_delete'),

    # Phase 3：資料匯出 API
    path('export/attendance/', views.export_attendance, name='export_attendance'),
    path('export/leave/', views.export_leave, name='export_leave'),
]

urlpatterns += router.urls
