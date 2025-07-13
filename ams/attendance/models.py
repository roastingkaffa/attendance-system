from django.db import models
from django.contrib.auth.models import AbstractUser


class Employees(AbstractUser):
    employee_id = models.CharField(verbose_name="員工編號", max_length=20, unique=True, primary_key=True)
    phone = models.TextField(verbose_name="員工電話", blank=True, null=True)
    address = models.TextField(verbose_name="員工地址", blank=True, null=True)
    email = models.EmailField(verbose_name="員工電子郵件", blank=True, null=True)

    # 設定 employee_id 作為唯一識別
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'password']

    class Meta:
        verbose_name_plural = "員工"

    def __str__(self):
        return self.employee_id
        

class Companies(models.Model):
    name = models.CharField(verbose_name=("公司名稱"), max_length=50)
    location = models.TextField(verbose_name=("公司地址"))
    latitude = models.TextField(verbose_name=("公司位置緯度"))
    longitude = models.TextField(verbose_name=("公司位置經度"))
    radius = models.DecimalField(verbose_name=("GPS合法範圍半徑"), max_digits=5, decimal_places=2)

    class Meta:
        verbose_name_plural = "公司"

class EmpCompanyRel(models.Model):
    employee_id = models.ForeignKey(Employees, on_delete=models.CASCADE, verbose_name=("員工編號"), related_name="employee", to_field="employee_id") # 設定反向關聯名稱
    company_id = models.ForeignKey(Companies, on_delete=models.CASCADE, verbose_name=("公司編號"), related_name="company")
    employment_status = models.BooleanField(verbose_name=("在職狀態"))
    hire_date = models.DateField(verbose_name=("入職日期"))
    leave_date = models.DateField(verbose_name=("離職日期"), null=True, blank=True)

    class Meta:
        verbose_name_plural = "員工與公司關係"

class LeaveRecords(models.Model):
    relation_id = models.ForeignKey(EmpCompanyRel, on_delete=models.CASCADE, verbose_name=("關聯編號"), related_name="leave_records")
    start_time = models.DateTimeField(verbose_name=("請假開始時間"), null=True, blank=True)
    end_time = models.DateTimeField(verbose_name=("請假結束時間"), null=True, blank=True)
    leave_hours = models.DecimalField(verbose_name=("請假總時數"), max_digits=5, decimal_places=2, null=True, blank=True)
    leave_reason = models.TextField(verbose_name=("請假原因"), null=True, blank=True)

    class Meta:
        verbose_name_plural = "請假紀錄"


class AttendanceRecords(models.Model):
    relation_id = models.ForeignKey(EmpCompanyRel, on_delete=models.CASCADE, verbose_name=("關聯編號"), related_name="attendance_records")
    date = models.DateField(verbose_name=("考勤日期"))
    checkin_time = models.DateTimeField(verbose_name=("上班打卡時間"))
    checkout_time = models.DateTimeField(verbose_name=("下班打卡時間"))
    checkin_location = models.TextField(verbose_name=("上班打卡位置"))
    checkout_location = models.TextField(verbose_name=("下班打卡位置"))
    work_hours = models.DecimalField(verbose_name=("上班總時數"), max_digits=5, decimal_places=2)

    class Meta:
        verbose_name_plural = "出缺勤紀錄"

