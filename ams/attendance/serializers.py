from rest_framework import serializers
from .models import *


class EmployeesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employees
        fields = '__all__'
        
    def create(self, validated_data):
        user = Employees(
            employee_id=validated_data['employee_id'],
            username=validated_data['username'],
            phone=validated_data['phone'],
            address=validated_data['address']
        )
        user.set_password(validated_data['password'])  # 使用 Django 內建方法加密密碼
        user.save()
        return user

class CompaniesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Companies
        fields = '__all__'

class EmpCompanyRelSerializer(serializers.ModelSerializer):

    class Meta:
        model = EmpCompanyRel
        fields = '__all__'

class LeaveRecordsSerializer(serializers.ModelSerializer):
    """請假記錄序列化器 - Phase 2 Week 4 增強版"""

    # 顯示可讀的假別名稱
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    # 顯示可讀的狀態名稱
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # 顯示申請人資訊（從 relation_id 取得）
    employee_name = serializers.SerializerMethodField()
    # 顯示職務代理人姓名
    substitute_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRecords
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'status']

    def get_employee_name(self, obj):
        """取得申請人姓名"""
        try:
            return obj.relation_id.employee_id.username
        except:
            return None

    def get_substitute_name(self, obj):
        """取得職務代理人姓名"""
        if obj.substitute_employee_id:
            return obj.substitute_employee_id.username
        return None


class ApprovalRecordsSerializer(serializers.ModelSerializer):
    """審批記錄序列化器 - Phase 2 Week 4 新增"""

    # 顯示可讀的狀態名稱
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    # 顯示審批人姓名
    approver_name = serializers.CharField(source='approver_id.username', read_only=True)
    # 顯示請假申請資訊
    leave_info = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRecords
        fields = '__all__'
        read_only_fields = ['created_at', 'approved_at']

    def get_leave_info(self, obj):
        """取得請假申請資訊"""
        leave = obj.leave_id
        return {
            'id': leave.id,
            'leave_type': leave.get_leave_type_display(),
            'start_time': leave.start_time,
            'end_time': leave.end_time,
            'leave_hours': float(leave.leave_hours),
            'applicant': leave.relation_id.employee_id.username,
        }


class LeaveBalancesSerializer(serializers.ModelSerializer):
    """假別額度序列化器 - Phase 2 Week 4 新增"""

    # 顯示可讀的假別名稱
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    # 顯示員工姓名
    employee_name = serializers.CharField(source='employee_id.username', read_only=True)

    class Meta:
        model = LeaveBalances
        fields = '__all__'
        read_only_fields = ['remaining_hours', 'updated_at']


class AttendanceRecordsSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceRecords
        fields = '__all__'

