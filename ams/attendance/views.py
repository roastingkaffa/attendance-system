from django.contrib.auth import authenticate, get_user_model, login as django_login, logout
from django.core.mail import send_mail
from django.http import HttpResponse
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
from rest_framework.decorators import api_view, permission_classes, authentication_classes
import random, string


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([SessionAuthentication])
def login(request):
    userId = request.data.get("userId")
    password = request.data.get("password")
    user = authenticate(username=userId, password=password)
    if user is not None:
        django_login(request._request, user)
        return Response({"message": "登入成功", "userId": userId}, status=status.HTTP_200_OK)
    else:
        return Response({"message": "登入失敗，請檢查帳號密碼"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    user = request.user
    print(user)
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    if not user.check_password(old_password):
        return Response({'error': '舊密碼不正確'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new_password)
    user.save()
    return Response({'success': '密碼已更新'}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return Response({"message": "登出成功"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')

    if not email:
        return Response({'message': "請提供 Email"}, status=400)

    email = email.strip()

    user = Employees.objects.filter(email__iexact=email).first()
    if not user:
        print(f"⚠️ 找不到使用者：{email}")
        return Response({'message': "臨時密碼已寄出"}, status=200)

    print(f"✅ 找到使用者：{user.email}")

    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    user.set_password(temp_password)
    user.save()

    try:
        send_mail(
            subject='臨時密碼通知',
            message=f'您的臨時密碼為：{temp_password}\n請使用此密碼登入並盡快修改。',
            from_email='4104W008@gmail.com',
            recipient_list=[email],
            fail_silently=False
        )
        print("✅ 郵件成功寄出")
    except Exception as e:
        print("❌ 發信錯誤：", e)

    return Response({'message': "臨時密碼已寄出"}, status=200)


def test_send_email(request):
    try:
        send_mail(
            subject='測試信',
            message='這是一封測試郵件',
            from_email='sax0224@gmail.com',
            recipient_list=['sax0224@yahoo.com'],
            fail_silently=False
        )
        return HttpResponse("✅ 信件已成功寄出")
    except Exception as e:
        return HttpResponse(f"❌ 發送失敗：{str(e)}")

@permission_classes((IsAuthenticated,))
class EmployeesView(ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]
    queryset = Employees.objects.all()
    serializer_class = EmployeesSerializer

    def create(self, request, *args, **kwargs):
        # 判斷是不是傳 list，若是就啟用 many=True
        is_many = isinstance(request.data, list)

        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save()

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

