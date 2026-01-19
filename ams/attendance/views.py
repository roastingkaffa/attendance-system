from django.contrib.auth import authenticate, get_user_model, login as django_login, logout
from django.core.mail import send_mail
from django.http import HttpResponse
from django.db.models import Q
from .models import *
from .serializers import *
from .responses import success_response, error_response, unauthorized_response, validation_error_response, server_error_response
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

    if not userId or not password:
        return validation_error_response("請提供帳號和密碼")

    user = authenticate(username=userId, password=password)
    if user is not None:
        django_login(request._request, user)
        return success_response(
            message="登入成功",
            data={"userId": userId}
        )
    else:
        return unauthorized_response("登入失敗，請檢查帳號密碼", code="INVALID_CREDENTIALS")


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # 🔒 修正：改為 IsAuthenticated
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return validation_error_response("請提供舊密碼和新密碼")

    if not user.check_password(old_password):
        return error_response("舊密碼不正確", code="INVALID_OLD_PASSWORD")

    user.set_password(new_password)
    user.save()
    return success_response(message="密碼已更新")


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return success_response(message="登出成功")


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')

    if not email:
        return validation_error_response("請提供 Email")

    email = email.strip()

    user = Employees.objects.filter(email__iexact=email).first()
    if not user:
        # 安全考量：即使找不到使用者也回傳成功訊息，避免洩露使用者是否存在
        print(f"⚠️ 找不到使用者：{email}")
        return success_response(message="如果該 Email 存在，臨時密碼已寄出")

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
        return success_response(message="臨時密碼已寄出")
    except Exception as e:
        print(f"❌ 發信錯誤：{e}")
        return server_error_response("發送郵件失敗，請稍後再試", code="EMAIL_SEND_FAILED")


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


# ========== 新增：後端打卡驗證 API ==========
from .utils import calculate_distance, calculate_work_hours
from django.utils import timezone
from decimal import Decimal


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clock_in(request):
    """
    上班打卡 API（後端驗證版本）

    請求參數：
    - qr_latitude: QR Code 緯度
    - qr_longitude: QR Code 經度
    - user_latitude: 使用者緯度
    - user_longitude: 使用者經度
    - relation_id: 員工-公司關聯 ID
    """
    try:
        # 1. 取得請求參數
        qr_lat = request.data.get('qr_latitude')
        qr_lng = request.data.get('qr_longitude')
        user_lat = request.data.get('user_latitude')
        user_lng = request.data.get('user_longitude')
        relation_id = request.data.get('relation_id')

        # 2. 參數驗證
        if not all([qr_lat, qr_lng, user_lat, user_lng, relation_id]):
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETERS',
                    'message': '缺少必要參數'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. 轉換參數類型
        try:
            qr_lat = Decimal(str(qr_lat))
            qr_lng = Decimal(str(qr_lng))
            user_lat = Decimal(str(user_lat))
            user_lng = Decimal(str(user_lng))
        except Exception:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_COORDINATES',
                    'message': 'GPS 座標格式錯誤'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. 驗證 QR Code 座標是否為有效公司
        company = Companies.objects.filter(
            latitude=str(qr_lat),
            longitude=str(qr_lng)
        ).first()

        if not company:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_QR_CODE',
                    'message': '無效的 QR Code'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 5. 計算 GPS 距離（後端計算）
        distance = calculate_distance(user_lat, user_lng, qr_lat, qr_lng)

        # 6. 驗證距離是否在範圍內（預設 2000 公尺）
        max_distance = float(company.radius) if company.radius else 2000.0
        if distance > max_distance:
            return Response({
                'success': False,
                'error': {
                    'code': 'LOCATION_OUT_OF_RANGE',
                    'message': f'打卡位置超出範圍（{max_distance} 公尺）',
                    'details': {
                        'distance': round(distance, 2),
                        'max_distance': max_distance
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 7. 檢查今天是否已經打卡
        today = timezone.now().date()
        existing_record = AttendanceRecords.objects.filter(
            relation_id=relation_id,
            date=today
        ).first()

        if existing_record:
            return Response({
                'success': False,
                'error': {
                    'code': 'ALREADY_CLOCKED_IN',
                    'message': '今天已經打過卡'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 8. 產生當前時間（後端產生）
        now = timezone.now()
        location = f"{user_lat}, {user_lng}"

        # 9. 建立打卡記錄
        record = AttendanceRecords.objects.create(
            relation_id_id=relation_id,
            date=today,
            checkin_time=now,
            checkout_time=now,  # 初始設定為相同時間
            checkin_location=location,
            checkout_location=location,
            work_hours=Decimal('0.00')
        )

        # 10. 返回成功回應
        return Response({
            'success': True,
            'message': '打卡成功',
            'data': {
                'id': record.id,
                'date': str(record.date),
                'checkin_time': record.checkin_time.isoformat(),
                'checkin_location': record.checkin_location,
                'distance': round(distance, 2)
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"打卡錯誤: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': '打卡失敗，請稍後再試'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def clock_out(request, record_id):
    """
    下班打卡 API（後端驗證版本）

    請求參數：
    - qr_latitude: QR Code 緯度
    - qr_longitude: QR Code 經度
    - user_latitude: 使用者緯度
    - user_longitude: 使用者經度
    """
    try:
        # 1. 取得打卡記錄
        try:
            record = AttendanceRecords.objects.get(id=record_id)
        except AttendanceRecords.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'RECORD_NOT_FOUND',
                    'message': '找不到打卡記錄'
                }
            }, status=status.HTTP_404_NOT_FOUND)

        # 2. 取得請求參數
        qr_lat = request.data.get('qr_latitude')
        qr_lng = request.data.get('qr_longitude')
        user_lat = request.data.get('user_latitude')
        user_lng = request.data.get('user_longitude')

        # 3. 參數驗證
        if not all([qr_lat, qr_lng, user_lat, user_lng]):
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PARAMETERS',
                    'message': '缺少必要參數'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. 轉換參數類型
        try:
            qr_lat = Decimal(str(qr_lat))
            qr_lng = Decimal(str(qr_lng))
            user_lat = Decimal(str(user_lat))
            user_lng = Decimal(str(user_lng))
        except Exception:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_COORDINATES',
                    'message': 'GPS 座標格式錯誤'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 5. 驗證 QR Code
        company = Companies.objects.filter(
            latitude=str(qr_lat),
            longitude=str(qr_lng)
        ).first()

        if not company:
            return Response({
                'success': False,
                'error': {
                    'code': 'INVALID_QR_CODE',
                    'message': '無效的 QR Code'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 6. 計算距離
        distance = calculate_distance(user_lat, user_lng, qr_lat, qr_lng)
        max_distance = float(company.radius) if company.radius else 2000.0

        if distance > max_distance:
            return Response({
                'success': False,
                'error': {
                    'code': 'LOCATION_OUT_OF_RANGE',
                    'message': f'打卡位置超出範圍（{max_distance} 公尺）',
                    'details': {
                        'distance': round(distance, 2),
                        'max_distance': max_distance
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 7. 產生當前時間（後端產生）
        now = timezone.now()
        location = f"{user_lat}, {user_lng}"

        # 8. 計算工時（後端計算）
        work_hours = calculate_work_hours(record.checkin_time, now)

        # 9. 更新記錄
        record.checkout_time = now
        record.checkout_location = location
        record.work_hours = work_hours
        record.save()

        # 10. 返回成功回應
        return Response({
            'success': True,
            'message': '打卡成功',
            'data': {
                'id': record.id,
                'date': str(record.date),
                'checkin_time': record.checkin_time.isoformat(),
                'checkout_time': record.checkout_time.isoformat(),
                'work_hours': float(record.work_hours),
                'distance': round(distance, 2)
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"下班打卡錯誤: {str(e)}")
        return Response({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': '打卡失敗，請稍後再試'
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== Phase 2 Week 4: 請假與審批 API ==========
from .models import ApprovalRecords, LeaveBalances
from .serializers import LeaveRecordsSerializer, ApprovalRecordsSerializer, LeaveBalancesSerializer
from decimal import Decimal as D


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_leave(request):
    """
    請假申請 API（Phase 2 Week 4）

    請求參數：
    - relation_id: 員工-公司關聯 ID
    - leave_type: 假別（annual, sick, personal, etc.）
    - start_time: 請假開始時間（YYYY-MM-DD HH:MM:SS）
    - end_time: 請假結束時間（YYYY-MM-DD HH:MM:SS）
    - leave_hours: 請假時數
    - leave_reason: 請假原因
    - substitute_employee_id: 職務代理人（選填）
    """
    try:
        # 1. 取得請求參數
        relation_id = request.data.get('relation_id')
        leave_type = request.data.get('leave_type')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        leave_hours = request.data.get('leave_hours')
        leave_reason = request.data.get('leave_reason', '')
        substitute_employee_id = request.data.get('substitute_employee_id')

        # 2. 參數驗證
        if not all([relation_id, leave_type, start_time, end_time, leave_hours]):
            return error_response(
                "缺少必要參數",
                code="MISSING_PARAMETERS",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 3. 驗證 relation_id
        try:
            relation = EmpCompanyRel.objects.get(id=relation_id)
            employee = relation.employee_id
        except EmpCompanyRel.DoesNotExist:
            return error_response(
                "無效的員工-公司關聯",
                code="INVALID_RELATION",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # 4. 檢查假別額度
        current_year = datetime.now().year
        leave_balance = LeaveBalances.objects.filter(
            employee_id=employee,
            year=current_year,
            leave_type=leave_type
        ).first()

        if leave_balance:
            if leave_balance.remaining_hours < D(str(leave_hours)):
                return error_response(
                    f"假別額度不足。剩餘 {leave_balance.remaining_hours} 小時，申請 {leave_hours} 小時",
                    code="INSUFFICIENT_BALANCE",
                    details={
                        'remaining_hours': float(leave_balance.remaining_hours),
                        'requested_hours': float(leave_hours)
                    },
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        else:
            # 如果沒有額度記錄，建立一個預設的
            # 特休 80h, 病假 240h, 事假 112h
            default_hours = {
                'annual': 80.00,
                'sick': 240.00,
                'personal': 112.00,
            }
            total = default_hours.get(leave_type, 0.00)
            leave_balance = LeaveBalances.objects.create(
                employee_id=employee,
                year=current_year,
                leave_type=leave_type,
                total_hours=D(str(total)),
                used_hours=D('0.00'),
                remaining_hours=D(str(total))
            )

        # 5. 建立請假記錄
        leave_data = {
            'relation_id': relation_id,
            'leave_type': leave_type,
            'start_time': start_time,
            'end_time': end_time,
            'leave_hours': leave_hours,
            'leave_reason': leave_reason,
            'status': 'pending'
        }

        if substitute_employee_id:
            leave_data['substitute_employee_id'] = substitute_employee_id

        serializer = LeaveRecordsSerializer(data=leave_data)
        if not serializer.is_valid():
            return validation_error_response(
                "請假資料驗證失敗",
                details=serializer.errors
            )

        leave_record = serializer.save()

        # 6. 根據審批政策自動建立審批記錄
        from .models import ApprovalPolicy, ManagerialRelationship
        import json

        # 計算請假天數
        leave_days = (leave_record.end_time - leave_record.start_time).total_seconds() / (24 * 3600)

        # 查找適用的審批政策
        company_id = relation.company_id
        policy = ApprovalPolicy.objects.filter(
            is_active=True,
            min_days__lte=leave_days
        ).filter(
            models.Q(max_days__gte=leave_days) | models.Q(max_days__isnull=True)
        ).filter(
            models.Q(company_id=company_id) | models.Q(company_id__isnull=True)
        ).order_by('company_id', 'min_days').first()

        if not policy:
            # 預設政策：只需主管審批
            policy_levels = [{"level": 1, "role": "manager", "description": "直屬主管"}]
        else:
            policy_levels = policy.approval_levels if isinstance(policy.approval_levels, list) else json.loads(policy.approval_levels)

        # 根據政策建立審批記錄
        approvals_created = []
        for level_config in policy_levels:
            level = level_config['level']
            role = level_config['role']

            # 根據角色找到審批人
            approver = None
            if role == 'manager':
                # 從直屬主管欄位取得
                approver = relation.direct_manager
                if not approver:
                    # 嘗試從 ManagerialRelationship 取得
                    mgr_rel = ManagerialRelationship.objects.filter(
                        employee_id=employee,
                        effective_date__lte=datetime.now().date(),
                        end_date__isnull=True
                    ).first()
                    if mgr_rel:
                        approver = mgr_rel.manager_id
                    else:
                        # 最後備援：找第一個 MGR 開頭的員工
                        approver = Employees.objects.filter(employee_id__startswith='MGR').first()
            elif role == 'hr':
                approver = Employees.objects.filter(employee_id__startswith='HR').first()
            elif role == 'ceo':
                approver = Employees.objects.filter(employee_id__startswith='CEO').first()

            if approver:
                approval = ApprovalRecords.objects.create(
                    leave_id=leave_record,
                    approver_id=approver,
                    approval_level=level,
                    status='pending'
                )
                approvals_created.append({
                    'id': approval.id,
                    'level': level,
                    'approver': approver.username,
                    'approver_id': approver.employee_id
                })

        if not approvals_created:
            # 如果沒有建立任何審批記錄，使用預設審批人
            default_approver = request.user
            approval = ApprovalRecords.objects.create(
                leave_id=leave_record,
                approver_id=default_approver,
                approval_level=1,
                status='pending'
            )
            approvals_created.append({
                'id': approval.id,
                'level': 1,
                'approver': default_approver.username,
                'approver_id': default_approver.employee_id
            })

        # 7. TODO: 發送通知給審批人（Phase 2 後續實作）

        # 8. 返回成功回應
        return success_response(
            message=f"請假申請已提交，需要 {len(approvals_created)} 層審批",
            data={
                'leave_id': leave_record.id,
                'leave_type': leave_record.get_leave_type_display(),
                'start_time': leave_record.start_time,
                'end_time': leave_record.end_time,
                'leave_hours': float(leave_record.leave_hours),
                'leave_days': round(leave_days, 2),
                'status': leave_record.get_status_display(),
                'approvals': approvals_created,
                'policy_name': policy.policy_name if policy else '預設政策'
            },
            status_code=status.HTTP_201_CREATED
        )

    except Exception as e:
        print(f"請假申請錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return server_error_response(
            "請假申請失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_leave(request, approval_id):
    """
    批准請假 API（Phase 2 Week 4）

    URL: POST /approval/approve/<approval_id>/
    請求參數：
    - comment: 審批意見（選填）
    """
    try:
        # 1. 取得審批記錄
        try:
            approval = ApprovalRecords.objects.get(id=approval_id)
        except ApprovalRecords.DoesNotExist:
            return not_found_response("審批記錄不存在", code="APPROVAL_NOT_FOUND")

        # 2. 驗證權限：只有審批人可以審批
        if approval.approver_id.employee_id != request.user.employee_id:
            return forbidden_response(
                "您沒有權限審批此申請",
                code="PERMISSION_DENIED"
            )

        # 3. 檢查審批狀態
        if approval.status != 'pending':
            return error_response(
                f"此審批已{approval.get_status_display()}，無法再次審批",
                code="INVALID_STATUS",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 4. 更新審批記錄
        approval.status = 'approved'
        approval.comment = request.data.get('comment', '')
        approval.approved_at = timezone.now()
        approval.save()

        # 5. 檢查是否需要下一層級審批
        leave = approval.leave_id
        leave_days = (leave.end_time - leave.start_time).days + 1

        next_level = None
        if leave_days >= 4 and approval.approval_level == 1:
            # 4+ 天，需要 HR 審批
            next_level = 2
        elif leave_days >= 4 and approval.approval_level == 2:
            # 4+ 天，需要總經理審批
            next_level = 3
        elif leave_days >= 2 and approval.approval_level == 1:
            # 2-3 天，需要 HR 審批
            next_level = 2

        if next_level:
            # 建立下一層級審批記錄
            next_approver = Employees.objects.filter(
                employee_id__startswith='HR' if next_level == 2 else 'CEO'
            ).first()

            if next_approver:
                ApprovalRecords.objects.create(
                    leave_id=leave,
                    approver_id=next_approver,
                    approval_level=next_level,
                    status='pending'
                )
                message = f"審批成功，已轉至 Level {next_level} 審批"
            else:
                # 如果找不到下一層級審批人，直接批准請假
                leave.status = 'approved'
                leave.save()
                # 扣除假別額度
                _deduct_leave_balance(leave)
                message = "審批成功，請假已批准"
        else:
            # 最後一層級審批，直接批准請假
            leave.status = 'approved'
            leave.save()

            # 6. 扣除假別額度
            _deduct_leave_balance(leave)

            message = "審批成功，請假已批准"

        # 7. TODO: 發送通知給申請人（Phase 2 後續實作）

        # 8. 返回成功回應
        return success_response(
            message=message,
            data={
                'approval_id': approval.id,
                'leave_id': leave.id,
                'leave_status': leave.get_status_display(),
                'approved_at': approval.approved_at,
                'comment': approval.comment
            }
        )

    except Exception as e:
        print(f"審批錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return server_error_response(
            "審批失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_leave(request, approval_id):
    """
    拒絕請假 API（Phase 2 Week 4）

    URL: POST /approval/reject/<approval_id>/
    請求參數：
    - comment: 拒絕原因（必填）
    """
    try:
        # 1. 取得審批記錄
        try:
            approval = ApprovalRecords.objects.get(id=approval_id)
        except ApprovalRecords.DoesNotExist:
            return not_found_response("審批記錄不存在", code="APPROVAL_NOT_FOUND")

        # 2. 驗證權限
        if approval.approver_id.employee_id != request.user.employee_id:
            return forbidden_response(
                "您沒有權限審批此申請",
                code="PERMISSION_DENIED"
            )

        # 3. 檢查審批狀態
        if approval.status != 'pending':
            return error_response(
                f"此審批已{approval.get_status_display()}，無法再次審批",
                code="INVALID_STATUS",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 4. 驗證拒絕原因
        comment = request.data.get('comment', '').strip()
        if not comment:
            return validation_error_response("請提供拒絕原因")

        # 5. 更新審批記錄
        approval.status = 'rejected'
        approval.comment = comment
        approval.approved_at = timezone.now()
        approval.save()

        # 6. 更新請假記錄狀態
        leave = approval.leave_id
        leave.status = 'rejected'
        leave.save()

        # 7. TODO: 發送通知給申請人（Phase 2 後續實作）

        # 8. 返回成功回應
        return success_response(
            message="已拒絕請假申請",
            data={
                'approval_id': approval.id,
                'leave_id': leave.id,
                'leave_status': leave.get_status_display(),
                'rejected_at': approval.approved_at,
                'comment': approval.comment
            }
        )

    except Exception as e:
        print(f"拒絕審批錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return server_error_response(
            "拒絕審批失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )


def _deduct_leave_balance(leave_record):
    """扣除假別額度（內部函數）"""
    try:
        employee = leave_record.relation_id.employee_id
        year = leave_record.start_time.year

        balance = LeaveBalances.objects.filter(
            employee_id=employee,
            year=year,
            leave_type=leave_record.leave_type
        ).first()

        if balance:
            balance.used_hours += leave_record.leave_hours
            balance.save()  # save() 會自動計算 remaining_hours
            print(f"已扣除 {leave_record.leave_hours} 小時 {leave_record.get_leave_type_display()}")
    except Exception as e:
        print(f"扣除假別額度失敗: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_leave_records(request):
    """
    查詢我的請假記錄 API（Phase 2 Week 4）

    URL: GET /leave/my-records/
    查詢參數：
    - days: 查詢最近 N 天的記錄（預設 30 天）
    - status: 過濾狀態（pending, approved, rejected, cancelled）
    """
    try:
        user = request.user

        # 取得使用者的所有關聯
        relations = EmpCompanyRel.objects.filter(employee_id=user)

        # 查詢請假記錄
        queryset = LeaveRecords.objects.filter(relation_id__in=relations)

        # 過濾天數
        days = request.query_params.get('days', '30')
        if days:
            days = int(days)
            start_date = datetime.now() - timedelta(days=days)
            queryset = queryset.filter(created_at__gte=start_date)

        # 過濾狀態
        leave_status = request.query_params.get('status')
        if leave_status:
            queryset = queryset.filter(status=leave_status)

        # 排序
        queryset = queryset.order_by('-created_at')

        # 序列化
        serializer = LeaveRecordsSerializer(queryset, many=True)

        return success_response(
            message="查詢成功",
            data={
                'count': queryset.count(),
                'records': serializer.data
            }
        )

    except Exception as e:
        print(f"查詢請假記錄錯誤: {str(e)}")
        return server_error_response(
            "查詢失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_balances(request):
    """
    查詢我的假別額度 API（Phase 2 Week 4）

    URL: GET /leave/balances/
    查詢參數：
    - year: 年度（預設當前年度）
    """
    try:
        user = request.user
        year = request.query_params.get('year', datetime.now().year)

        # 查詢假別額度
        balances = LeaveBalances.objects.filter(
            employee_id=user,
            year=year
        ).order_by('leave_type')

        # 序列化
        serializer = LeaveBalancesSerializer(balances, many=True)

        # 計算總額度
        total_hours = sum(b.total_hours for b in balances)
        used_hours = sum(b.used_hours for b in balances)
        remaining_hours = sum(b.remaining_hours for b in balances)

        return success_response(
            message="查詢成功",
            data={
                'year': int(year),
                'summary': {
                    'total_hours': float(total_hours),
                    'used_hours': float(used_hours),
                    'remaining_hours': float(remaining_hours)
                },
                'balances': serializer.data
            }
        )

    except Exception as e:
        print(f"查詢假別額度錯誤: {str(e)}")
        return server_error_response(
            "查詢失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_approvals(request):
    """
    查詢待我審批的申請 API（Phase 2 Week 4）

    URL: GET /approval/pending/
    """
    try:
        user = request.user

        # 查詢待審批的記錄
        approvals = ApprovalRecords.objects.filter(
            approver_id=user,
            status='pending'
        ).order_by('created_at')

        # 序列化
        serializer = ApprovalRecordsSerializer(approvals, many=True)

        return success_response(
            message="查詢成功",
            data={
                'count': approvals.count(),
                'approvals': serializer.data
            }
        )

    except Exception as e:
        print(f"查詢待審批申請錯誤: {str(e)}")
        return server_error_response(
            "查詢失敗，請稍後再試",
            code="INTERNAL_ERROR"
        )

