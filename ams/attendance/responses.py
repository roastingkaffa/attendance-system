"""
統一的 API 回應格式
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(message=None, data=None, status_code=status.HTTP_200_OK):
    """
    成功回應格式

    Args:
        message: 成功訊息
        data: 回傳的資料
        status_code: HTTP 狀態碼（預設 200）

    Returns:
        Response 物件
    """
    response_data = {
        "success": True
    }

    if message:
        response_data["message"] = message

    if data is not None:
        response_data["data"] = data

    return Response(response_data, status=status_code)


def error_response(message, code=None, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    錯誤回應格式

    Args:
        message: 錯誤訊息
        code: 錯誤代碼（如：INVALID_CREDENTIALS）
        details: 詳細資訊（dict）
        status_code: HTTP 狀態碼（預設 400）

    Returns:
        Response 物件
    """
    response_data = {
        "success": False,
        "error": {
            "message": message
        }
    }

    if code:
        response_data["error"]["code"] = code

    if details:
        response_data["error"]["details"] = details

    return Response(response_data, status=status_code)


# 常用的錯誤回應快捷方式
def unauthorized_response(message="未授權", code="UNAUTHORIZED"):
    """未授權（401）"""
    return error_response(message, code, status_code=status.HTTP_401_UNAUTHORIZED)


def forbidden_response(message="禁止存取", code="FORBIDDEN"):
    """禁止存取（403）"""
    return error_response(message, code, status_code=status.HTTP_403_FORBIDDEN)


def not_found_response(message="資源不存在", code="NOT_FOUND"):
    """資源不存在（404）"""
    return error_response(message, code, status_code=status.HTTP_404_NOT_FOUND)


def validation_error_response(message="驗證失敗", details=None):
    """驗證錯誤（400）"""
    return error_response(message, "VALIDATION_ERROR", details, status.HTTP_400_BAD_REQUEST)


def server_error_response(message="伺服器錯誤", code="INTERNAL_ERROR"):
    """伺服器錯誤（500）"""
    return error_response(message, code, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
