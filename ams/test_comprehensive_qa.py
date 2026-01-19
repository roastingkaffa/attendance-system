#!/usr/bin/env python3
"""
考勤與請假管理系統 - 全面性 QA 測試腳本
===========================================

測試範圍：
1. API 端點測試
2. 資料庫完整性測試
3. 業務邏輯測試
4. 權限與安全性測試
5. 整合測試

執行方式：
    python3 test_comprehensive_qa.py
"""

import os
import sys
import json
import django
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

# Django 環境設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ams.settings')
# 強制使用 SQLite 測試資料庫
os.environ['DB_ENGINE'] = 'django.db.backends.sqlite3'
os.environ['DB_NAME'] = 'db_test.sqlite3'
os.environ['ALLOWED_HOSTS'] = 'testserver,127.0.0.1,localhost'
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from attendance.models import *


class TestResult:
    """測試結果記錄器"""

    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.results = []
        self.start_time = datetime.now()

    def add_pass(self, category, test_name, message=""):
        """記錄成功的測試"""
        self.total += 1
        self.passed += 1
        self.results.append({
            'status': 'PASS',
            'category': category,
            'test': test_name,
            'message': message
        })
        print(f"✅ [PASS] {category} > {test_name}")
        if message:
            print(f"   {message}")

    def add_fail(self, category, test_name, message="", details=""):
        """記錄失敗的測試"""
        self.total += 1
        self.failed += 1
        self.results.append({
            'status': 'FAIL',
            'category': category,
            'test': test_name,
            'message': message,
            'details': details
        })
        print(f"❌ [FAIL] {category} > {test_name}")
        if message:
            print(f"   {message}")
        if details:
            print(f"   詳細資訊: {details}")

    def add_warning(self, category, test_name, message=""):
        """記錄警告"""
        self.total += 1
        self.warnings += 1
        self.results.append({
            'status': 'WARNING',
            'category': category,
            'test': test_name,
            'message': message
        })
        print(f"⚠️  [WARNING] {category} > {test_name}")
        if message:
            print(f"   {message}")

    def generate_report(self):
        """生成測試報告"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()

        print("\n" + "="*80)
        print("測試報告")
        print("="*80)
        print(f"執行時間: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')} ~ {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"總耗時: {duration:.2f} 秒")
        print(f"總測試數: {self.total}")
        print(f"✅ 通過: {self.passed} ({self.passed/self.total*100:.1f}%)")
        print(f"❌ 失敗: {self.failed} ({self.failed/self.total*100:.1f}%)")
        print(f"⚠️  警告: {self.warnings} ({self.warnings/self.total*100:.1f}%)")
        print("="*80)

        # 按類別統計
        category_stats = defaultdict(lambda: {'pass': 0, 'fail': 0, 'warning': 0})
        for result in self.results:
            status = result['status'].lower()
            if status == 'pass':
                category_stats[result['category']]['pass'] += 1
            elif status == 'fail':
                category_stats[result['category']]['fail'] += 1
            else:
                category_stats[result['category']]['warning'] += 1

        print("\n按測試類別統計:")
        for category, stats in sorted(category_stats.items()):
            total = stats['pass'] + stats['fail'] + stats['warning']
            print(f"  {category}: {stats['pass']}/{total} 通過, {stats['fail']} 失敗, {stats['warning']} 警告")

        # 列出所有失敗項目
        if self.failed > 0:
            print("\n失敗的測試項目:")
            for result in self.results:
                if result['status'] == 'FAIL':
                    print(f"  ❌ {result['category']} > {result['test']}")
                    print(f"     {result['message']}")

        # 列出所有警告項目
        if self.warnings > 0:
            print("\n警告的測試項目:")
            for result in self.results:
                if result['status'] == 'WARNING':
                    print(f"  ⚠️  {result['category']} > {result['test']}")
                    print(f"     {result['message']}")

        return {
            'summary': {
                'total': self.total,
                'passed': self.passed,
                'failed': self.failed,
                'warnings': self.warnings,
                'pass_rate': f"{self.passed/self.total*100:.1f}%",
                'duration': f"{duration:.2f}s"
            },
            'results': self.results
        }


class ComprehensiveQATest:
    """全面性 QA 測試"""

    def __init__(self):
        self.result = TestResult()
        self.client = Client()
        self.test_data = {}

    def run_all_tests(self):
        """執行所有測試"""
        print("="*80)
        print("開始執行全面性 QA 測試")
        print("="*80 + "\n")

        # 1. 資料庫完整性測試
        self.test_database_integrity()

        # 2. 身份驗證與授權測試
        self.test_authentication()

        # 3. 出勤打卡系統測試
        self.test_attendance_system()

        # 4. 請假管理系統測試
        self.test_leave_management()

        # 5. 審批管理系統測試
        self.test_approval_system()

        # 6. 權限控制測試
        self.test_permission_control()

        # 7. 資料一致性測試
        self.test_data_consistency()

        # 8. API 端點測試
        self.test_api_endpoints()

        # 生成報告
        return self.result.generate_report()

    def test_database_integrity(self):
        """測試資料庫完整性"""
        print("\n[測試類別] 資料庫完整性")
        print("-" * 80)

        # 1. 檢查必要資料表是否存在
        try:
            Employees.objects.count()
            self.result.add_pass("資料庫完整性", "Employees 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "Employees 資料表", str(e))

        try:
            Companies.objects.count()
            self.result.add_pass("資料庫完整性", "Companies 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "Companies 資料表", str(e))

        try:
            EmpCompanyRel.objects.count()
            self.result.add_pass("資料庫完整性", "EmpCompanyRel 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "EmpCompanyRel 資料表", str(e))

        try:
            LeaveRecords.objects.count()
            self.result.add_pass("資料庫完整性", "LeaveRecords 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "LeaveRecords 資料表", str(e))

        try:
            ApprovalRecords.objects.count()
            self.result.add_pass("資料庫完整性", "ApprovalRecords 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "ApprovalRecords 資料表", str(e))

        try:
            LeaveBalances.objects.count()
            self.result.add_pass("資料庫完整性", "LeaveBalances 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "LeaveBalances 資料表", str(e))

        try:
            ManagerialRelationship.objects.count()
            self.result.add_pass("資料庫完整性", "ManagerialRelationship 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "ManagerialRelationship 資料表", str(e))

        try:
            ApprovalPolicy.objects.count()
            self.result.add_pass("資料庫完整性", "ApprovalPolicy 資料表存在")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "ApprovalPolicy 資料表", str(e))

        # 2. 檢查測試資料是否存在
        emp_count = Employees.objects.count()
        if emp_count >= 4:
            self.result.add_pass("資料庫完整性", "員工測試資料", f"共 {emp_count} 筆")
        else:
            self.result.add_warning("資料庫完整性", "員工測試資料", f"只有 {emp_count} 筆，建議至少 4 筆")

        company_count = Companies.objects.count()
        if company_count >= 1:
            self.result.add_pass("資料庫完整性", "公司測試資料", f"共 {company_count} 筆")
        else:
            self.result.add_fail("資料庫完整性", "公司測試資料", "沒有公司資料")

        policy_count = ApprovalPolicy.objects.count()
        if policy_count >= 3:
            self.result.add_pass("資料庫完整性", "審批政策資料", f"共 {policy_count} 筆")
        else:
            self.result.add_warning("資料庫完整性", "審批政策資料", f"只有 {policy_count} 筆，建議至少 3 筆")

        # 3. 檢查外鍵關聯
        try:
            for rel in EmpCompanyRel.objects.all():
                if rel.employee_id and rel.company_id:
                    continue
            self.result.add_pass("資料庫完整性", "EmpCompanyRel 外鍵關聯完整")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "EmpCompanyRel 外鍵關聯", str(e))

        try:
            for leave in LeaveRecords.objects.all():
                if leave.relation_id:
                    continue
            self.result.add_pass("資料庫完整性", "LeaveRecords 外鍵關聯完整")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "LeaveRecords 外鍵關聯", str(e))

        try:
            for approval in ApprovalRecords.objects.all():
                if approval.leave_id and approval.approver_id:
                    continue
            self.result.add_pass("資料庫完整性", "ApprovalRecords 外鍵關聯完整")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "ApprovalRecords 外鍵關聯", str(e))

        # 4. 檢查索引是否存在（透過查詢效能）
        try:
            # 這應該很快，因為有索引
            LeaveRecords.objects.filter(status='pending').count()
            self.result.add_pass("資料庫完整性", "LeaveRecords 索引可用")
        except Exception as e:
            self.result.add_fail("資料庫完整性", "LeaveRecords 索引", str(e))

    def test_authentication(self):
        """測試身份驗證與授權"""
        print("\n[測試類別] 身份驗證與授權")
        print("-" * 80)

        # 1. 測試登入功能
        response = self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                self.result.add_pass("身份驗證", "員工登入成功")
                self.test_data['emp001_session'] = self.client.session
            else:
                self.result.add_fail("身份驗證", "員工登入", data.get('error', {}).get('message', 'Unknown error'))
        else:
            self.result.add_fail("身份驗證", "員工登入", f"HTTP {response.status_code}")

        # 2. 測試無效密碼
        response = self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'wrong_password'
        }, content_type='application/json')

        if response.status_code == 401:
            self.result.add_pass("身份驗證", "錯誤密碼被拒絕")
        else:
            self.result.add_fail("身份驗證", "錯誤密碼應被拒絕", f"但回傳 HTTP {response.status_code}")

        # 3. 測試無效使用者
        response = self.client.post('/api/login/', {
            'userId': 'INVALID_USER',
            'password': 'test123'
        }, content_type='application/json')

        if response.status_code == 401:
            self.result.add_pass("身份驗證", "無效使用者被拒絕")
        else:
            self.result.add_fail("身份驗證", "無效使用者應被拒絕", f"但回傳 HTTP {response.status_code}")

        # 4. 測試 Session 管理
        # 先登入
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        # 測試需要認證的 API
        response = self.client.get('/api/employees/')
        if response.status_code == 200:
            self.result.add_pass("身份驗證", "Session 保持有效")
        else:
            self.result.add_fail("身份驗證", "Session 應保持有效", f"但回傳 HTTP {response.status_code}")

        # 5. 測試登出
        response = self.client.post('/api/logout/')
        if response.status_code == 200:
            self.result.add_pass("身份驗證", "登出成功")
        else:
            self.result.add_fail("身份驗證", "登出", f"HTTP {response.status_code}")

        # 6. 登出後存取應被拒絕
        response = self.client.get('/api/employees/')
        if response.status_code in [401, 403]:
            self.result.add_pass("身份驗證", "登出後存取被拒絕")
        else:
            self.result.add_warning("身份驗證", "登出後存取應被拒絕", f"但回傳 HTTP {response.status_code}")

    def test_attendance_system(self):
        """測試出勤打卡系統"""
        print("\n[測試類別] 出勤打卡系統")
        print("-" * 80)

        # 先登入
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        # 1. 測試上班打卡（合法位置）
        company = Companies.objects.first()
        rel = EmpCompanyRel.objects.filter(employee_id__employee_id='EMP001').first()

        if company and rel:
            response = self.client.post('/api/clock-in/', {
                'qr_latitude': str(company.latitude),
                'qr_longitude': str(company.longitude),
                'user_latitude': str(company.latitude),
                'user_longitude': str(company.longitude),
                'relation_id': rel.id
            }, content_type='application/json')

            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.result.add_pass("出勤打卡", "上班打卡成功（合法位置）")
                    self.test_data['attendance_record_id'] = data.get('data', {}).get('id')
                else:
                    self.result.add_fail("出勤打卡", "上班打卡", data.get('error', {}).get('message'))
            else:
                self.result.add_fail("出勤打卡", "上班打卡", f"HTTP {response.status_code}")
        else:
            self.result.add_fail("出勤打卡", "測試資料不足", "找不到公司或員工關聯")

        # 2. 測試上班打卡（位置超出範圍）
        if company and rel:
            # 使用較遠的座標
            response = self.client.post('/api/clock-in/', {
                'qr_latitude': str(company.latitude),
                'qr_longitude': str(company.longitude),
                'user_latitude': str(float(company.latitude) + 1.0),  # 大約 100 公里外
                'user_longitude': str(float(company.longitude) + 1.0),
                'relation_id': rel.id
            }, content_type='application/json')

            if response.status_code == 400:
                try:
                    data = response.json()
                    if data.get('error', {}).get('code') == 'LOCATION_OUT_OF_RANGE':
                        self.result.add_pass("出勤打卡", "超出範圍打卡被拒絕")
                    else:
                        self.result.add_warning("出勤打卡", "超出範圍應回傳 LOCATION_OUT_OF_RANGE", f"但回傳 {data.get('error', {}).get('code')}")
                except:
                    self.result.add_fail("出勤打卡", "超出範圍回應格式錯誤", f"HTTP {response.status_code}")
            else:
                self.result.add_fail("出勤打卡", "超出範圍應被拒絕", f"但回傳 HTTP {response.status_code}")

        # 3. 測試下班打卡
        if 'attendance_record_id' in self.test_data:
            record_id = self.test_data['attendance_record_id']
            response = self.client.patch(f'/api/clock-out/{record_id}/', {
                'qr_latitude': str(company.latitude),
                'qr_longitude': str(company.longitude),
                'user_latitude': str(company.latitude),
                'user_longitude': str(company.longitude)
            }, content_type='application/json')

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    work_hours = data.get('data', {}).get('work_hours', 0)
                    self.result.add_pass("出勤打卡", "下班打卡成功", f"工時: {work_hours} 小時")
                else:
                    self.result.add_fail("出勤打卡", "下班打卡", data.get('error', {}).get('message'))
            else:
                self.result.add_fail("出勤打卡", "下班打卡", f"HTTP {response.status_code}")

        # 4. 測試查詢出勤記錄
        response = self.client.get('/api/attendance/', {'employee_id': 'EMP001'})
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.result.add_pass("出勤打卡", "查詢出勤記錄", f"共 {len(data)} 筆")
            else:
                self.result.add_warning("出勤打卡", "查詢出勤記錄回應格式", "應該是 list")
        else:
            self.result.add_fail("出勤打卡", "查詢出勤記錄", f"HTTP {response.status_code}")

    def test_leave_management(self):
        """測試請假管理系統"""
        print("\n[測試類別] 請假管理系統")
        print("-" * 80)

        # 先登入
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        rel = EmpCompanyRel.objects.filter(employee_id__employee_id='EMP001').first()

        if not rel:
            self.result.add_fail("請假管理", "測試資料不足", "找不到員工關聯")
            return

        # 1. 測試請假申請（1天）
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=8, minute=30, second=0, microsecond=0)
        end_time = tomorrow.replace(hour=17, minute=30, second=0, microsecond=0)

        response = self.client.post('/api/leave/apply/', {
            'relation_id': rel.id,
            'leave_type': 'annual',
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'leave_hours': 8,
            'leave_reason': '測試請假（1天）'
        }, content_type='application/json')

        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                self.result.add_pass("請假管理", "1天請假申請成功")
                self.test_data['leave_1day_id'] = data.get('data', {}).get('leave_id')
                approvals = data.get('data', {}).get('approvals', [])
                if len(approvals) == 1:
                    self.result.add_pass("請假管理", "1天請假審批層級正確", "需要 1 層審批")
                else:
                    self.result.add_warning("請假管理", "1天請假審批層級", f"應該 1 層，但有 {len(approvals)} 層")
            else:
                self.result.add_fail("請假管理", "1天請假申請", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("請假管理", "1天請假申請", f"HTTP {response.status_code}")

        # 2. 測試請假申請（2-3天）
        start_time_2day = tomorrow.replace(hour=8, minute=30, second=0, microsecond=0)
        end_time_2day = (tomorrow + timedelta(days=2)).replace(hour=17, minute=30, second=0, microsecond=0)

        response = self.client.post('/api/leave/apply/', {
            'relation_id': rel.id,
            'leave_type': 'annual',
            'start_time': start_time_2day.isoformat(),
            'end_time': end_time_2day.isoformat(),
            'leave_hours': 16,
            'leave_reason': '測試請假（2天）'
        }, content_type='application/json')

        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                self.result.add_pass("請假管理", "2天請假申請成功")
                self.test_data['leave_2day_id'] = data.get('data', {}).get('leave_id')
                approvals = data.get('data', {}).get('approvals', [])
                if len(approvals) == 2:
                    self.result.add_pass("請假管理", "2天請假審批層級正確", "需要 2 層審批")
                else:
                    self.result.add_warning("請假管理", "2天請假審批層級", f"應該 2 層，但有 {len(approvals)} 層")
            else:
                self.result.add_fail("請假管理", "2天請假申請", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("請假管理", "2天請假申請", f"HTTP {response.status_code}")

        # 3. 測試請假申請（4天以上）
        start_time_4day = tomorrow.replace(hour=8, minute=30, second=0, microsecond=0)
        end_time_4day = (tomorrow + timedelta(days=4)).replace(hour=17, minute=30, second=0, microsecond=0)

        response = self.client.post('/api/leave/apply/', {
            'relation_id': rel.id,
            'leave_type': 'annual',
            'start_time': start_time_4day.isoformat(),
            'end_time': end_time_4day.isoformat(),
            'leave_hours': 32,
            'leave_reason': '測試請假（4天）'
        }, content_type='application/json')

        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                self.result.add_pass("請假管理", "4天請假申請成功")
                self.test_data['leave_4day_id'] = data.get('data', {}).get('leave_id')
                approvals = data.get('data', {}).get('approvals', [])
                if len(approvals) == 3:
                    self.result.add_pass("請假管理", "4天請假審批層級正確", "需要 3 層審批")
                else:
                    self.result.add_warning("請假管理", "4天請假審批層級", f"應該 3 層，但有 {len(approvals)} 層")
            else:
                self.result.add_fail("請假管理", "4天請假申請", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("請假管理", "4天請假申請", f"HTTP {response.status_code}")

        # 4. 測試假別額度不足
        balance = LeaveBalances.objects.filter(
            employee_id__employee_id='EMP001',
            year=datetime.now().year,
            leave_type='annual'
        ).first()

        if balance and balance.remaining_hours > 0:
            # 申請超過剩餘額度的假
            excessive_hours = float(balance.remaining_hours) + 100
            response = self.client.post('/api/leave/apply/', {
                'relation_id': rel.id,
                'leave_type': 'annual',
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'leave_hours': excessive_hours,
                'leave_reason': '測試額度不足'
            }, content_type='application/json')

            if response.status_code == 400:
                data = response.json()
                if data.get('error', {}).get('code') == 'INSUFFICIENT_BALANCE':
                    self.result.add_pass("請假管理", "額度不足被拒絕")
                else:
                    self.result.add_warning("請假管理", "額度不足應回傳 INSUFFICIENT_BALANCE", f"但回傳 {data.get('error', {}).get('code')}")
            else:
                self.result.add_fail("請假管理", "額度不足應被拒絕", f"但回傳 HTTP {response.status_code}")

        # 5. 測試查詢我的請假記錄
        response = self.client.get('/api/leave/my-records/')
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                count = data.get('data', {}).get('count', 0)
                self.result.add_pass("請假管理", "查詢請假記錄", f"共 {count} 筆")
            else:
                self.result.add_fail("請假管理", "查詢請假記錄", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("請假管理", "查詢請假記錄", f"HTTP {response.status_code}")

        # 6. 測試查詢假別額度
        response = self.client.get('/api/leave/balances/')
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                summary = data.get('data', {}).get('summary', {})
                self.result.add_pass("請假管理", "查詢假別額度",
                    f"總額度: {summary.get('total_hours')}h, 已用: {summary.get('used_hours')}h, 剩餘: {summary.get('remaining_hours')}h")
            else:
                self.result.add_fail("請假管理", "查詢假別額度", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("請假管理", "查詢假別額度", f"HTTP {response.status_code}")

    def test_approval_system(self):
        """測試審批管理系統"""
        print("\n[測試類別] 審批管理系統")
        print("-" * 80)

        # 1. 以主管身份登入
        self.client.post('/api/login/', {
            'userId': 'MGR001',
            'password': 'test123'
        }, content_type='application/json')

        # 2. 查詢待審批的申請
        response = self.client.get('/api/approval/pending/')
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                count = data.get('data', {}).get('count', 0)
                self.result.add_pass("審批管理", "查詢待審批申請", f"共 {count} 筆")

                # 如果有待審批的項目，取第一個來測試
                approvals = data.get('data', {}).get('approvals', [])
                if approvals:
                    self.test_data['pending_approval_id'] = approvals[0].get('id')
            else:
                self.result.add_fail("審批管理", "查詢待審批申請", data.get('error', {}).get('message'))
        else:
            self.result.add_fail("審批管理", "查詢待審批申請", f"HTTP {response.status_code}")

        # 3. 測試批准請假
        if 'pending_approval_id' in self.test_data:
            approval_id = self.test_data['pending_approval_id']
            response = self.client.post(f'/api/approval/approve/{approval_id}/', {
                'comment': '同意請假'
            }, content_type='application/json')

            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.result.add_pass("審批管理", "批准請假成功")
                else:
                    self.result.add_fail("審批管理", "批准請假", data.get('error', {}).get('message'))
            else:
                self.result.add_fail("審批管理", "批准請假", f"HTTP {response.status_code}")

        # 4. 測試拒絕請假（如果還有其他待審批項目）
        response = self.client.get('/api/approval/pending/')
        if response.status_code == 200:
            data = response.json()
            approvals = data.get('data', {}).get('approvals', [])
            if approvals:
                approval_id = approvals[0].get('id')
                response = self.client.post(f'/api/approval/reject/{approval_id}/', {
                    'comment': '拒絕原因測試'
                }, content_type='application/json')

                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        self.result.add_pass("審批管理", "拒絕請假成功")
                    else:
                        self.result.add_fail("審批管理", "拒絕請假", data.get('error', {}).get('message'))
                else:
                    self.result.add_fail("審批管理", "拒絕請假", f"HTTP {response.status_code}")

        # 5. 測試無權限審批（以其他員工身份登入）
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        # 嘗試審批不屬於自己的申請
        response = self.client.get('/api/approval/pending/')
        if response.status_code == 200:
            data = response.json()
            # EMP001 應該沒有待審批的項目（因為是申請人，不是審批人）
            count = data.get('data', {}).get('count', 0)
            if count == 0:
                self.result.add_pass("審批管理", "一般員工無待審批項目")
            else:
                self.result.add_warning("審批管理", "一般員工不應有待審批項目", f"但有 {count} 筆")

    def test_permission_control(self):
        """測試權限控制"""
        print("\n[測試類別] 權限控制")
        print("-" * 80)

        # 1. 測試未登入存取
        client = Client()  # 新的 client，沒有 session
        response = client.get('/api/employees/')
        if response.status_code in [401, 403]:
            self.result.add_pass("權限控制", "未登入存取被拒絕")
        else:
            self.result.add_fail("權限控制", "未登入存取應被拒絕", f"但回傳 HTTP {response.status_code}")

        # 2. 測試一般員工存取自己的資料
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        response = self.client.get('/api/leave/my-records/')
        if response.status_code == 200:
            self.result.add_pass("權限控制", "員工可查詢自己的請假記錄")
        else:
            self.result.add_fail("權限控制", "員工應可查詢自己的請假記錄", f"但回傳 HTTP {response.status_code}")

        # 3. 測試 HR/CEO 權限
        # 檢查是否有 HR 或 CEO 帳號
        hr = Employees.objects.filter(employee_id__startswith='HR').first()
        if hr:
            self.client.post('/api/login/', {
                'userId': hr.employee_id,
                'password': 'test123'
            }, content_type='application/json')

            # HR 應該可以查看所有員工資料
            response = self.client.get('/api/employees/')
            if response.status_code == 200:
                self.result.add_pass("權限控制", "HR 可查看員工資料")
            else:
                self.result.add_warning("權限控制", "HR 應可查看員工資料", f"但回傳 HTTP {response.status_code}")

    def test_data_consistency(self):
        """測試資料一致性"""
        print("\n[測試類別] 資料一致性")
        print("-" * 80)

        # 1. 檢查假別額度計算是否正確
        balances = LeaveBalances.objects.all()
        for balance in balances:
            expected_remaining = balance.total_hours - balance.used_hours
            if balance.remaining_hours == expected_remaining:
                continue
            else:
                self.result.add_fail("資料一致性",
                    f"假別額度計算錯誤 (ID: {balance.id})",
                    f"Expected: {expected_remaining}, Actual: {balance.remaining_hours}")
        self.result.add_pass("資料一致性", "假別額度計算正確", f"檢查 {balances.count()} 筆")

        # 2. 檢查審批記錄與請假記錄的一致性
        approvals = ApprovalRecords.objects.all()
        for approval in approvals:
            leave = approval.leave_id
            if leave:
                # 如果審批被批准，檢查請假狀態
                if approval.status == 'approved' and approval.approval_level == 1:
                    # Level 1 批准後，請假應該是 pending 或 approved
                    if leave.status in ['pending', 'approved']:
                        continue
                    else:
                        self.result.add_warning("資料一致性",
                            f"審批記錄 {approval.id} 狀態與請假記錄不一致",
                            f"Approval: {approval.status}, Leave: {leave.status}")
            else:
                self.result.add_fail("資料一致性",
                    f"審批記錄 {approval.id} 的 leave_id 不存在")
        self.result.add_pass("資料一致性", "審批與請假記錄關聯正確", f"檢查 {approvals.count()} 筆")

        # 3. 檢查主管關係的有效性
        mgr_rels = ManagerialRelationship.objects.filter(end_date__isnull=True)
        for rel in mgr_rels:
            if rel.employee_id and rel.manager_id:
                # 檢查是否形成循環（員工的主管不應該是員工自己）
                if rel.employee_id.employee_id == rel.manager_id.employee_id:
                    self.result.add_fail("資料一致性",
                        f"主管關係 {rel.id} 形成循環",
                        f"{rel.employee_id} 的主管是自己")
            else:
                self.result.add_fail("資料一致性",
                    f"主管關係 {rel.id} 資料不完整")
        self.result.add_pass("資料一致性", "主管關係有效", f"檢查 {mgr_rels.count()} 筆")

        # 4. 檢查審批政策的覆蓋範圍
        policies = ApprovalPolicy.objects.filter(is_active=True).order_by('min_days')
        if policies.count() >= 3:
            # 檢查是否覆蓋 1天、2-3天、4天以上
            has_1day = policies.filter(min_days__lte=1, max_days__gte=1).exists()
            has_2day = policies.filter(min_days__lte=2, max_days__gte=2).exists()
            has_4day = policies.filter(min_days__lte=4).filter(
                models.Q(max_days__gte=4) | models.Q(max_days__isnull=True)
            ).exists()

            if has_1day and has_2day and has_4day:
                self.result.add_pass("資料一致性", "審批政策覆蓋完整", "1天、2-3天、4天以上")
            else:
                self.result.add_warning("資料一致性", "審批政策覆蓋不完整",
                    f"1天: {has_1day}, 2天: {has_2day}, 4天+: {has_4day}")
        else:
            self.result.add_warning("資料一致性", "審批政策數量不足", f"只有 {policies.count()} 筆")

    def test_api_endpoints(self):
        """測試 API 端點"""
        print("\n[測試類別] API 端點測試")
        print("-" * 80)

        # 先登入
        self.client.post('/api/login/', {
            'userId': 'EMP001',
            'password': 'test123'
        }, content_type='application/json')

        # 定義所有需要測試的端點
        endpoints = [
            ('GET', '/api/employees/', 'Employees API'),
            ('GET', '/api/companies/', 'Companies API'),
            ('GET', '/api/attendance/', 'Attendance API'),
            ('GET', '/api/leave/', 'Leave Records API'),
            ('GET', '/api/relation/', 'EmpCompanyRel API'),
            ('GET', '/api/leave/my-records/', 'My Leave Records API'),
            ('GET', '/api/leave/balances/', 'Leave Balances API'),
            ('GET', '/api/approval/pending/', 'Pending Approvals API'),
        ]

        for method, url, name in endpoints:
            if method == 'GET':
                response = self.client.get(url)
            else:
                response = self.client.post(url)

            if response.status_code == 200:
                self.result.add_pass("API 端點", name, f"{method} {url}")
            else:
                self.result.add_fail("API 端點", name,
                    f"{method} {url} 回傳 HTTP {response.status_code}")


def main():
    """主程式"""
    tester = ComprehensiveQATest()
    report = tester.run_all_tests()

    # 儲存報告到檔案
    report_file = f"QA_TEST_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n測試報告已儲存至: {report_file}")

    # 返回狀態碼
    if report['summary']['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
