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
]

urlpatterns += router.urls
