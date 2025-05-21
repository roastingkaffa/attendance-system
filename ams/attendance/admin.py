from django.contrib import admin

from .models import *

@admin.register(Employees)  # 這樣 Django Admin 就能識別 Employees 模型
class EmployeesAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'username', 'phone', 'address')  # 顯示欄位

@admin.register(Companies)
class CompaniesAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'latitude', 'longitude', 'radius')

@admin.register(EmpCompanyRel)
class CEmpCompanyRelAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'company_id', 'employment_status', 'hire_date', 'leave_date')

@admin.register(LeaveRecords)
class LeaveRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id', 'start_time', 'end_time', 'leave_hours', 'leave_reason')

@admin.register(AttendanceRecords)
class AttendanceRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id', 'date', 'checkin_time', 'checkout_time', 'checkin_location', 'checkout_location', 'work_hours')
    