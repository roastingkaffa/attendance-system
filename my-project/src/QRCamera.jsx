/**
 * QRCamera - 跨平台 QR Code 掃描元件
 *
 * 支援：
 * - 桌面瀏覽器（Chrome, Firefox, Safari, Edge）
 * - Android Chrome
 * - iOS Safari
 * - 備用模式：檔案上傳（適用於不支援相機的環境）
 */
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { Camera, CameraOff, Upload, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * 偵測設備類型和瀏覽器
 */
const detectDevice = () => {
  const ua = navigator.userAgent;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;

  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);

  // iOS 上只有 Safari 支援 getUserMedia
  const isIOSNonSafari = isIOS && !isSafari;

  // 檢查是否為 PWA 模式
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

  // 檢查是否支援 getUserMedia
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // 檢查是否為安全連線 (HTTPS)
  const isHttps = window.isSecureContext ||
                  window.location.protocol === 'https:' ||
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

  // 相機即時掃描需要: HTTPS + getUserMedia + 非 iOS PWA + 非 iOS 非 Safari
  const cameraSupported = isHttps && hasGetUserMedia && !(isIOS && isPWA) && !isIOSNonSafari;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isSafari,
    isChrome,
    isFirefox,
    isIOSNonSafari,
    isPWA,
    hasGetUserMedia,
    isHttps,
    cameraSupported,
  };
};

/**
 * 檢查是否為 HTTPS 連線
 */
const isSecureContext = () => {
  return window.isSecureContext ||
         window.location.protocol === 'https:' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

const QRCamera = ({ onScan, onError }) => {
  const [mode, setMode] = useState('loading'); // loading, camera, upload, error
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const info = detectDevice();
    setDeviceInfo(info);

    // 檢查環境 - HTTPS 是相機功能的必要條件
    if (!isSecureContext()) {
      // 在非安全連線下，改用上傳模式而非直接顯示錯誤
      setMode('upload');
      const message = info.isIOS
        ? 'iOS 裝置需要 HTTPS 連線才能使用即時掃描。請使用圖片上傳功能，或改用 https:// 網址存取。'
        : '需要 HTTPS 連線才能使用即時掃描功能。請使用圖片上傳或改用安全連線。';
      toast.warning(message, { duration: 6000 });
      return;
    }

    // iOS 非 Safari 瀏覽器 (Chrome, Firefox 等)
    if (info.isIOSNonSafari) {
      setMode('upload');
      toast.info('iOS 裝置的 Chrome/Firefox 不支援即時掃描，請使用圖片上傳功能，或改用 Safari 瀏覽器。', { duration: 5000 });
      return;
    }

    // iOS PWA 模式
    if (info.isIOS && info.isPWA) {
      setMode('upload');
      toast.info('iOS PWA 模式不支援即時掃描，請使用圖片上傳功能。', { duration: 5000 });
      return;
    }

    // 不支援 getUserMedia
    if (!info.hasGetUserMedia) {
      setMode('upload');
      toast.info('您的瀏覽器不支援相機功能，請使用圖片上傳', { duration: 5000 });
      return;
    }

    // 嘗試啟動相機
    setMode('camera');
  }, []);

  /**
   * 啟動相機掃描
   */
  const startCameraScanning = async () => {
    if (!scannerRef.current || isScanning) return;

    try {
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // 優先使用後置鏡頭
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // 掃描成功
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // 掃描中的錯誤（通常是找不到 QR Code，可忽略）
        }
      );
    } catch (err) {
      console.error('相機啟動失敗:', err);
      setIsScanning(false);

      // 嘗試前置鏡頭
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "user" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => handleScanSuccess(decodedText),
          () => {}
        );
        setIsScanning(true);
      } catch (fallbackErr) {
        console.error('前置鏡頭也失敗:', fallbackErr);
        handleCameraError(err);
      }
    }
  };

  /**
   * 停止相機掃描
   */
  const stopCameraScanning = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('停止相機失敗:', err);
      }
    }
  };

  /**
   * 處理相機錯誤
   */
  const handleCameraError = (error) => {
    console.error('相機錯誤:', error);

    let message = '無法存取相機';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      message = '相機存取被拒絕。請在瀏覽器設定中允許相機權限。';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      message = '找不到相機設備。';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      message = '相機被其他應用程式佔用，請關閉其他使用相機的應用程式。';
    } else if (error.name === 'OverconstrainedError') {
      message = '相機不支援所需的設定。';
    } else if (error.name === 'SecurityError') {
      message = '安全性錯誤。請確認使用 HTTPS 連線。';
    }

    setErrorMessage(message);
    setMode('error');

    if (onError) {
      onError(error);
    }
  };

  /**
   * 處理掃描成功
   */
  const handleScanSuccess = async (decodedText) => {
    // 停止掃描
    await stopCameraScanning();

    // 震動回饋（如果支援）
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    toast.success('QR Code 掃描成功！');

    if (onScan) {
      onScan(decodedText);
    }
  };

  /**
   * 處理檔案上傳
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片檔案');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-file-reader");

      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result);

      // 清理
      html5QrCode.clear();
    } catch (err) {
      console.error('圖片掃描失敗:', err);
      toast.error('無法從圖片中讀取 QR Code，請確認圖片包含有效的 QR Code');
    }

    // 清除 input 值以允許重複上傳相同檔案
    event.target.value = '';
  };

  /**
   * 切換到相機模式
   */
  const switchToCamera = () => {
    if (deviceInfo?.cameraSupported) {
      setMode('camera');
      setErrorMessage('');
    } else {
      toast.error('您的裝置不支援相機掃描功能');
    }
  };

  /**
   * 切換到上傳模式
   */
  const switchToUpload = () => {
    stopCameraScanning();
    setMode('upload');
    setErrorMessage('');
  };

  /**
   * 重試相機
   */
  const retryCamera = () => {
    setMode('camera');
    setErrorMessage('');
  };

  // 相機模式時啟動掃描
  useEffect(() => {
    if (mode === 'camera' && scannerRef.current) {
      const timer = setTimeout(() => {
        startCameraScanning();
      }, 100);

      return () => {
        clearTimeout(timer);
        stopCameraScanning();
      };
    }
  }, [mode]);

  // 元件卸載時清理
  useEffect(() => {
    return () => {
      stopCameraScanning();
    };
  }, []);

  // ========== 渲染 ==========

  // 載入中
  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
        <Camera className="h-12 w-12 text-blue-500 animate-pulse mb-4" />
        <p className="text-gray-600">正在檢查相機...</p>
      </div>
    );
  }

  // 錯誤狀態
  if (mode === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200">
        <CameraOff className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-700 text-center mb-4">{errorMessage}</p>

        <div className="flex gap-3">
          <button
            onClick={retryCamera}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重試
          </button>
          <button
            onClick={switchToUpload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Upload className="h-4 w-4" />
            改用圖片上傳
          </button>
        </div>
      </div>
    );
  }

  // 上傳模式
  if (mode === 'upload') {
    return (
      <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        {/* 隱藏的檔案輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
          id="qr-file-input"
        />

        {/* 隱藏的 QR 讀取器 */}
        <div id="qr-file-reader" style={{ display: 'none' }}></div>

        {/* HTTPS 警告 */}
        {!isSecureContext() && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg w-full">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              {deviceInfo?.isIOS
                ? '目前為非安全連線，無法使用即時掃描。請拍攝 QR Code 照片後上傳。'
                : '請使用 HTTPS 連線以啟用即時掃描功能。'}
            </p>
          </div>
        )}

        {/* iOS 非 Safari 提示 */}
        {deviceInfo?.isIOSNonSafari && isSecureContext() && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg w-full">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              iOS 裝置建議使用 Safari 瀏覽器以獲得即時掃描功能
            </p>
          </div>
        )}

        <Upload className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2 text-center">上傳 QR Code 圖片</p>
        <p className="text-sm text-gray-500 mb-6 text-center">
          拍攝或選擇包含 QR Code 的圖片
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* 拍照按鈕（手機會開啟相機） */}
          <label
            htmlFor="qr-file-input"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Camera className="h-5 w-5" />
            {deviceInfo?.isMobile ? '拍攝照片' : '選擇圖片'}
          </label>

          {/* 如果相機可用，顯示切換按鈕 */}
          {deviceInfo?.cameraSupported && (
            <button
              onClick={switchToCamera}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Camera className="h-5 w-5" />
              即時掃描
            </button>
          )}
        </div>
      </div>
    );
  }

  // 相機模式
  return (
    <div className="flex flex-col items-center">
      {/* 相機視窗 */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full h-full"
        />

        {/* 掃描框指示 */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                {/* 角落裝飾 */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              </div>
            </div>
            {/* 掃描線動畫 */}
            <div className="absolute inset-x-0 top-1/4 h-0.5 bg-green-400 animate-scan" />
          </div>
        )}

        {/* 載入指示 */}
        {!isScanning && mode === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
              <p>正在啟動相機...</p>
            </div>
          </div>
        )}
      </div>

      {/* 提示文字 */}
      <p className="mt-4 text-sm text-gray-600 text-center">
        將 QR Code 對準框內
      </p>

      {/* 切換按鈕 */}
      <button
        onClick={switchToUpload}
        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Upload className="h-4 w-4" />
        改用圖片上傳
      </button>

      {/* 隱藏的檔案輸入（用於圖片上傳模式） */}
      <div id="qr-file-reader" style={{ display: 'none' }}></div>
    </div>
  );
};

export default QRCamera;
