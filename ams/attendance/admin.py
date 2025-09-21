import openpyxl
import qrcode
from django.contrib import admin
from django.http import HttpResponse
from django import forms
from django.shortcuts import render
from .models import *

class DateRangeForm(forms.Form):
    start_date = forms.DateField(label="起始日期", widget=forms.DateInput(attrs={'type': 'date'}))
    end_date = forms.DateField(label="結束日期", widget=forms.DateInput(attrs={'type': 'date'}))


@admin.register(Employees)  # 這樣 Django Admin 就能識別 Employees 模型
class EmployeesAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'username', 'phone', 'address')  # 顯示欄位

    search_fields = ['employee_id', 'username']


@admin.register(Companies)
class CompaniesAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'location', 'latitude', 'longitude', 'radius')
    actions = ['export_latlong_qrcode']

    @admin.action(description='匯出經緯度 QR Code')
    def export_latlong_qrcode(self, request, queryset):
        # 確保只選取一筆
        if queryset.count() != 1:
            self.message_user(request, "請一次只選擇一間公司來匯出 QR Code", level="error")
            return

        company = queryset.first()

        if company.latitude and company.longitude:
            coords = f"{company.latitude}, {company.longitude}"

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(coords)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            response = HttpResponse(content_type="image/png")
            response['Content-Disposition'] = f'attachment; filename=company_{company.id}_qrcode.png'
            img.save(response, "PNG")
            return response

        self.message_user(request, f"公司「{company.name}」沒有經緯度資料", level="error")

@admin.register(EmpCompanyRel)
class CEmpCompanyRelAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee_id_display', 'employee_name_display',
        'company_id_display', 'company_name_display', 'employment_status', 'hire_date', 'leave_date'
    )

    def employee_id_display(self, obj):
        return obj.employee_id  # 不加 `.id`，因為它是數值欄位
    employee_id_display.short_description = '員工編號'

    def employee_name_display(self, obj):
        return obj.employee_id.username
    employee_name_display.short_description = '員工姓名'

    def company_id_display(self, obj):
        return obj.company_id.id
    company_id_display.short_description = '公司編號'

    def company_name_display(self, obj):
        return obj.company_id.name
    company_name_display.short_description = '公司名稱'

    search_fields = ['employee_id__employee_id',
                    'employee_id__username']


@admin.register(LeaveRecords)
class LeaveRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id_display', 'employee_id_display', 'employee_name_display',
        'company_name_display', 'start_time', 'end_time', 'leave_hours', 'leave_reason'
    )
    def relation_id_display(self, obj):
        return obj.relation_id.id
    relation_id_display.short_description = '關聯編號'

    def employee_id_display(self, obj):
        return obj.relation_id.employee_id
    employee_id_display.short_description = '員工編號'

    def employee_name_display(self, obj):
        return obj.relation_id.employee_id.username
    employee_name_display.short_description = '員工姓名'

    def company_name_display(self, obj):
        return obj.relation_id.company_id.name
    company_name_display.short_description = '公司名稱'


    actions = ['export_by_date_range']
    search_fields = ['relation_id__employee_id__employee_id',
                    'relation_id__employee_id__username']


    @admin.action(description='匯出指定日期範圍的資料')
    def export_by_date_range(self, request, queryset):
        if 'apply' in request.POST:
            form = DateRangeForm(request.POST)
            if form.is_valid():
                start_date = form.cleaned_data['start_date']
                end_date = form.cleaned_data['end_date']

                filtered = queryset.filter(start_time__date__range=(start_date, end_date)).order_by(
                    'relation_id__employee_id__employee_id',
                    'start_time'
                )

                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "請假紀錄"

                headers = ['員工編號', '員工姓名', '關聯編號', '日期', '請假開始時間', '請假結束時間', '請假總時數', '請假原因']
                ws.append(headers)

                for record in filtered:
                    emp = record.relation_id.employee_id
                    ws.append([
                        emp.employee_id,
                        emp.username,
                        record.relation_id.id,
                        record.start_time.strftime('%H:%M:%S') if record.start_time else '',
                        record.end_time.strftime('%H:%M:%S') if record.end_time else '',
                        record.leave_hours or '',
                        record.leave_reason or '',
                    ])

                response = HttpResponse(
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                )
                response['Content-Disposition'] = 'attachment; filename=attendance_filtered.xlsx'
                wb.save(response)
                return response
        else:
            form = DateRangeForm()

        return render(request, 'admin/date_range_form.html', {
            'form': form,
            'queryset': queryset,
            'action': 'export_by_date_range'
        })

@admin.register(AttendanceRecords)
class AttendanceRecordsAdmin(admin.ModelAdmin):
    list_display = ('relation_id_display', 'employee_code_display', 'user_name',
        'company_name', 'date', 'checkin_time', 'checkout_time', 'checkin_location', 'checkout_location', 'work_hours'
    )

    def user_name(self, obj):
        return obj.relation_id.employee_id.username
    user_name.short_description = '員工姓名'
    
    def employee_code_display(self, obj):
        return obj.relation_id.employee_id.employee_id  # 這是 Employees 表的主鍵
    employee_code_display.short_description = '員工編號'

    def relation_id_display(self, obj):
        return obj.relation_id.id
    relation_id_display.short_description = '關聯編號'

    def company_name(self, obj):
        return obj.relation_id.company_id.name
    company_name.short_description = '公司名稱'



    actions = ['export_attendance_and_leave']
    search_fields = ['relation_id__employee_id__employee_id',
                    'relation_id__employee_id__username']


    @admin.action(description="匯出出缺勤與請假紀錄")
    def export_attendance_and_leave(self, request, queryset):
        if 'apply' in request.POST:
            form = DateRangeForm(request.POST)
            if form.is_valid():
                start_date = form.cleaned_data['start_date']
                end_date = form.cleaned_data['end_date']

                # === 匯出 Excel 初始化 ===
                wb = openpyxl.Workbook()

                # === 出缺勤紀錄 Sheet ===
                ws1 = wb.active
                ws1.title = "出缺勤紀錄"

                headers1 = ['員工編號', '員工姓名', '關聯編號', '日期', '簽到時間', '簽退時間', '簽到地點', '簽退地點', '工作時數']
                ws1.append(headers1)

                attendance_records = AttendanceRecords.objects.filter(
                    date__range=(start_date, end_date)
                ).order_by('relation_id__employee_id__employee_id', 'date')

                for record in attendance_records:
                    emp = record.relation_id.employee_id
                    ws1.append([
                        emp.employee_id,
                        emp.username,
                        record.relation_id.id,
                        record.date.strftime('%Y-%m-%d') if record.date else '',
                        record.checkin_time.strftime('%H:%M:%S') if record.checkin_time else '',
                        record.checkout_time.strftime('%H:%M:%S') if record.checkout_time else '',
                        record.checkin_location or '',
                        record.checkout_location or '',
                        record.work_hours or '',
                    ])

                # === 請假紀錄 Sheet ===
                ws2 = wb.create_sheet(title="請假紀錄")

                headers2 = ['員工編號', '員工姓名', '關聯編號', '請假日期', '開始時間', '結束時間', '請假時數', '請假原因']
                ws2.append(headers2)

                leave_records = LeaveRecords.objects.filter(
                    start_time__date__range=(start_date, end_date)
                ).order_by('relation_id__employee_id__employee_id', 'start_time')

                for record in leave_records:
                    emp = record.relation_id.employee_id
                    leave_date = record.start_time.date() if record.start_time else ''
                    ws2.append([
                        emp.employee_id,
                        emp.username,
                        record.relation_id.id,
                        leave_date.strftime('%Y-%m-%d') if leave_date else '',
                        record.start_time.strftime('%H:%M:%S') if record.start_time else '',
                        record.end_time.strftime('%H:%M:%S') if record.end_time else '',
                        record.leave_hours or '',
                        record.leave_reason or '',
                    ])

                # === 回傳 Excel 檔案 ===
                response = HttpResponse(
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                )
                response['Content-Disposition'] = 'attachment; filename=attendance_leave_summary.xlsx'
                wb.save(response)
                return response
        else:
            form = DateRangeForm()

        return render(request, 'admin/date_range_form.html', {
            'form': form,
            'queryset': queryset,
            'action': 'export_attendance_and_leave'
        })


