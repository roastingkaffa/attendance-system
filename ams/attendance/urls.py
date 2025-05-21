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
]

urlpatterns += router.urls
