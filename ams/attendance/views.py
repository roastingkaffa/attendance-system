from django.shortcuts import render, redirect, reverse
from django.contrib.auth import authenticate, get_user_model, login, logout
from .models import *
from .serializers import *
from datetime import time, date, timedelta, datetime
from rest_framework.viewsets import ModelViewSet
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    userId = request.data.get("userId")
    password = request.data.get("password")
    user = authenticate(username=userId, password=password)
    if user is not None:
        return Response({"message": "登入成功", "userId": userId}, status=status.HTTP_200_OK)
    else:
        return Response({"message": "登入失敗，請檢查帳號密碼"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return Response({"message": "登出成功"}, status=status.HTTP_200_OK)


@permission_classes([AllowAny])
class EmployeesView(ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = Employees.objects.all()
    serializer_class = EmployeesSerializer

@permission_classes((IsAuthenticated,))
class CompaniesView(ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = Companies.objects.all()
    serializer_class = CompaniesSerializer


@permission_classes((IsAuthenticated,))
class leaveRecordsView(viewsets.ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = LeaveRecords.objects.all()
    serializer_class = LeaveRecordsSerializer

    def get_queryset(self):
        queryset = LeaveRecords.objects.all()

        employee_id = self.request.query_params.get("employee_id")
        days = self.request.query_params.get("days")

        if employee_id:
            queryset = queryset.filter(relation_id__employee_id__employee_id=employee_id)

        if days:
            days = int(days)
            start_date = date.today() - timedelta(days=days)
            end_date = date.today()
            end_date = datetime.combine(end_date, time.max)
            queryset = queryset.filter(start_time__range=[start_date, end_date])

        return queryset

@permission_classes((IsAuthenticated,))
class AttendanceRecordsView(viewsets.ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = AttendanceRecords.objects.all()
    serializer_class = AttendanceRecordsSerializer

    def get_queryset(self):
        queryset = AttendanceRecords.objects.all()

        employee_id = self.request.query_params.get("employee_id")
        days = self.request.query_params.get("days")
        date_parm = self.request.query_params.get("date")

        if employee_id:
            queryset = queryset.filter(relation_id__employee_id__employee_id=employee_id)

        if days:
            days = int(days)
            start_date = date.today() - timedelta(days=days)
            end_date = date.today()
            queryset = queryset.filter(date__range=[start_date, end_date])

        if date_parm == "today":
            today = date.today()
            queryset = queryset.filter(date=today)

        return queryset

@permission_classes((IsAuthenticated,))
class EmpCompanyRelView(viewsets.ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = EmpCompanyRel.objects.all()
    serializer_class = EmpCompanyRelSerializer

    def get_queryset(self):
        queryset = EmpCompanyRel.objects.all()
        employee_id = self.request.query_params.get("employee_id")
        if employee_id:
            queryset = queryset.filter(employee_id__employee_id=employee_id)
        return queryset

