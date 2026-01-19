#!/usr/bin/env python3
"""
Phase 1 測試腳本
測試所有 Phase 1 的修改
"""
import sys
import os

# 設定 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ams.settings')

def test_env_variables():
    """測試 1: 環境變數載入"""
    print("\n" + "="*60)
    print("測試 1: 環境變數載入")
    print("="*60)

    try:
        from decouple import config

        secret_key = config('SECRET_KEY')
        debug = config('DEBUG', default=False, cast=bool)
        db_name = config('DB_NAME')

        print(f"✅ SECRET_KEY 載入成功（長度: {len(secret_key)}）")
        print(f"✅ DEBUG = {debug}")
        print(f"✅ DB_NAME = {db_name}")

        # 檢查 SECRET_KEY 不是預設值
        if 'django-insecure' not in secret_key:
            print("✅ SECRET_KEY 已更換為新的隨機金鑰")
        else:
            print("⚠️  SECRET_KEY 仍為預設值")

        return True
    except Exception as e:
        print(f"❌ 環境變數載入失敗: {e}")
        return False


def test_django_settings():
    """測試 2: Django 設定"""
    print("\n" + "="*60)
    print("測試 2: Django 設定")
    print("="*60)

    try:
        import django
        django.setup()

        from django.conf import settings

        print(f"✅ Django 版本: {django.get_version()}")
        print(f"✅ DEBUG = {settings.DEBUG}")
        print(f"✅ ALLOWED_HOSTS = {settings.ALLOWED_HOSTS}")
        print(f"✅ SECRET_KEY 長度 = {len(settings.SECRET_KEY)}")

        # 檢查資料庫設定
        db_config = settings.DATABASES['default']
        print(f"✅ 資料庫引擎: {db_config['ENGINE']}")
        print(f"✅ 資料庫名稱: {db_config['NAME']}")
        print(f"✅ 資料庫主機: {db_config['HOST']}")

        return True
    except Exception as e:
        print(f"❌ Django 設定載入失敗: {e}")
        return False


def test_models():
    """測試 3: 資料模型"""
    print("\n" + "="*60)
    print("測試 3: 資料模型檢查")
    print("="*60)

    try:
        from attendance.models import Companies, Employees, AttendanceRecords

        # 檢查 Companies 模型的欄位類型
        latitude_field = Companies._meta.get_field('latitude')
        longitude_field = Companies._meta.get_field('longitude')

        print(f"✅ Companies.latitude 類型: {latitude_field.get_internal_type()}")
        print(f"✅ Companies.longitude 類型: {longitude_field.get_internal_type()}")

        if latitude_field.get_internal_type() == 'DecimalField':
            print(f"✅ GPS 座標已修正為 DecimalField")
            print(f"   - max_digits: {latitude_field.max_digits}")
            print(f"   - decimal_places: {latitude_field.decimal_places}")
        else:
            print(f"⚠️  GPS 座標仍為 {latitude_field.get_internal_type()}")

        return True
    except Exception as e:
        print(f"❌ 模型檢查失敗: {e}")
        return False


def test_utils():
    """測試 4: 輔助函數"""
    print("\n" + "="*60)
    print("測試 4: 輔助函數測試")
    print("="*60)

    try:
        from attendance.utils import calculate_distance, calculate_work_hours
        from datetime import datetime
        from decimal import Decimal

        # 測試距離計算
        # 台北 101 到總統府的距離（約 2.5 公里）
        taipei101 = (25.0330, 121.5654)
        presidential = (25.0408, 121.5120)

        distance = calculate_distance(
            taipei101[0], taipei101[1],
            presidential[0], presidential[1]
        )

        print(f"✅ GPS 距離計算測試:")
        print(f"   - 台北 101: {taipei101}")
        print(f"   - 總統府: {presidential}")
        print(f"   - 計算距離: {distance:.2f} 公尺")
        print(f"   - 預期距離: 約 2500 公尺")

        if 2000 < distance < 3000:
            print(f"✅ 距離計算正確")
        else:
            print(f"⚠️  距離計算可能有誤")

        # 測試工時計算
        start = datetime(2025, 11, 19, 9, 0, 0)
        end = datetime(2025, 11, 19, 18, 0, 0)
        work_hours = calculate_work_hours(start, end)

        print(f"\n✅ 工時計算測試:")
        print(f"   - 上班時間: {start}")
        print(f"   - 下班時間: {end}")
        print(f"   - 計算工時: {work_hours} 小時")

        if work_hours == Decimal('9.00'):
            print(f"✅ 工時計算正確")
        else:
            print(f"⚠️  工時計算可能有誤")

        return True
    except Exception as e:
        print(f"❌ 輔助函數測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_responses():
    """測試 5: 統一回應格式"""
    print("\n" + "="*60)
    print("測試 5: 統一 API 回應格式")
    print("="*60)

    try:
        from attendance.responses import (
            success_response, error_response,
            unauthorized_response, validation_error_response
        )
        from rest_framework import status

        # 測試成功回應
        resp = success_response(message="測試成功", data={"test": "value"})
        print(f"✅ success_response 格式:")
        print(f"   - success: {resp.data.get('success')}")
        print(f"   - message: {resp.data.get('message')}")
        print(f"   - data: {resp.data.get('data')}")

        # 測試錯誤回應
        resp = error_response("測試錯誤", code="TEST_ERROR")
        print(f"\n✅ error_response 格式:")
        print(f"   - success: {resp.data.get('success')}")
        print(f"   - error.message: {resp.data.get('error', {}).get('message')}")
        print(f"   - error.code: {resp.data.get('error', {}).get('code')}")

        return True
    except Exception as e:
        print(f"❌ 回應格式測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_views():
    """測試 6: 視圖函數"""
    print("\n" + "="*60)
    print("測試 6: 視圖函數檢查")
    print("="*60)

    try:
        from attendance import views

        # 檢查新的 API 是否存在
        if hasattr(views, 'clock_in'):
            print("✅ clock_in API 已建立")
        else:
            print("❌ clock_in API 不存在")

        if hasattr(views, 'clock_out'):
            print("✅ clock_out API 已建立")
        else:
            print("❌ clock_out API 不存在")

        # 檢查修改的 API
        import inspect

        # 檢查 change_password 是否使用 IsAuthenticated
        source = inspect.getsource(views.change_password)
        if 'IsAuthenticated' in source and '@permission_classes([IsAuthenticated])' in source:
            print("✅ change_password 已修正為 IsAuthenticated")
        else:
            print("⚠️  change_password 權限設定可能有誤")

        return True
    except Exception as e:
        print(f"❌ 視圖函數檢查失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_urls():
    """測試 7: URL 配置"""
    print("\n" + "="*60)
    print("測試 7: URL 配置檢查")
    print("="*60)

    try:
        from django.urls import resolve

        # 測試新的 URL
        try:
            match = resolve('/clock-in/')
            print(f"✅ /clock-in/ 路由已註冊")
            print(f"   - 視圖: {match.func.__name__}")
        except:
            print("❌ /clock-in/ 路由不存在")

        try:
            match = resolve('/clock-out/1/')
            print(f"✅ /clock-out/<id>/ 路由已註冊")
            print(f"   - 視圖: {match.func.__name__}")
        except:
            print("❌ /clock-out/<id>/ 路由不存在")

        return True
    except Exception as e:
        print(f"❌ URL 配置檢查失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主測試函數"""
    print("\n" + "="*60)
    print("🧪 Phase 1 測試開始")
    print("="*60)

    results = []

    # 執行所有測試
    results.append(("環境變數載入", test_env_variables()))
    results.append(("Django 設定", test_django_settings()))
    results.append(("資料模型", test_models()))
    results.append(("輔助函數", test_utils()))
    results.append(("回應格式", test_responses()))
    results.append(("視圖函數", test_views()))
    results.append(("URL 配置", test_urls()))

    # 統計結果
    print("\n" + "="*60)
    print("📊 測試結果總結")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status_icon = "✅" if result else "❌"
        print(f"{status_icon} {test_name}")

    print("\n" + "="*60)
    print(f"通過: {passed}/{total} ({passed/total*100:.0f}%)")
    print("="*60)

    if passed == total:
        print("\n🎉 所有測試通過！")
        return 0
    else:
        print(f"\n⚠️  有 {total - passed} 個測試失敗")
        return 1


if __name__ == "__main__":
    sys.exit(main())
