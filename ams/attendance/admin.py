from django.contrib import admin
from .models import *
from django.http import HttpResponse
import openpyxl

@admin.register(Employees)  # 這樣 Django Admin 就能識別 Employees 模型
class EmployeesAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'username', 'phone', 'address')  # 顯示欄位

@admin.register(Companies)
class CompaniesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location', 'latitude', 'longitude', 'radius')


@admin.register(EmpCompanyRel)
class CEmpCompanyRelAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee_id_display', 'company_id_display', 'employment_status', 'hire_date', 'leave_date')

    def employee_id_display(self, obj):
        return obj.employee_id  # 不加 `.id`，因為它是數值欄位
    employee_id_display.short_description = '員工編號'

    def company_id_display(self, obj):
        return obj.company_id.id
    company_id_display.short_description = '公司編號'


@admin.register(LeaveRecords)
class LeaveRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id_display', 'start_time', 'end_time', 'leave_hours', 'leave_reason')
    def relation_id_display(self, obj):
        return obj.relation_id.id
    relation_id_display.short_description = '關聯編號'

@admin.register(AttendanceRecords)
class AttendanceRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id_display', 'employee_code_display', 'date', 'checkin_time', 'checkout_time', 'checkin_location', 'checkout_location', 'work_hours')

    def employee_code_display(self, obj):
        return obj.relation_id.employee_id.employee_id  # 這是 Employees 表的主鍵
    employee_code_display.short_description = '員工編號'

    def relation_id_display(self, obj):
        return obj.relation_id.id
    relation_id_display.short_description = '關聯編號'

    actions = ['export_attendance']
    search_fields = ['relation_id__employee_id__employee_id']

    @admin.action(description="匯出選取員工的出缺勤資料（Excel）")
    def export_attendance(self, request, queryset):
        # 建立 Excel 活頁簿與工作表
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Attendance"

        # 標題列
        headers = ['員工ID', '員工姓名', '日期', '上班時間', '下班時間', '上班時數', '上班打卡位置', '下班打卡位置']
        ws.append(headers)
        for record in queryset:
            employee = record.relation_id.employee_id  # 從 relation_id 取出員工
            ws.append([
                employee.employee_id,
                employee.username,
                record.date.strftime('%Y-%m-%d') if record.date else '',
                record.checkin_time.strftime('%H:%M:%S') if record.checkin_time else '',
                record.checkout_time.strftime('%H:%M:%S') if record.checkout_time else '',
                record.work_hours or '',
                record.checkin_location or '',
                record.checkout_location or '',
            ])

        # 回傳 Excel 檔案
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=attendance.xlsx'
        wb.save(response)
        return response