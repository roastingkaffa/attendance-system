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
]

urlpatterns += router.urls
