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

    class Meta:
        model = LeaveRecords
        fields = '__all__'

class AttendanceRecordsSerializer(serializers.ModelSerializer):

    class Meta:
        model = AttendanceRecords
        fields = '__all__'
        
