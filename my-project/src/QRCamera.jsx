
import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { toast } from 'sonner';
import { Camera, CameraOff } from 'lucide-react';

const QRCamera = ({ onScan }) => {
  const [hasPermission, setHasPermission] = useState(null);   
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('Camera permission error:', err);
        setHasPermission(false);
        setCameraError('Camera access denied. Please check your permissions.');
        toast.error('Camera access denied. Please check your permissions.');
      }
    };
    requestCameraPermission();
  }, []);

  const handleScan = (result) => {
    if (result) {
      onScan(result.text);
    }
  };

  // const handleError = (error) => {
  //   console.error('QR Scanner error:', error);
  //   setCameraError('Camera error: ' + (error.message || 'Unknown error'));
  //   toast.error('Camera error. Please try again.');
  // };

  if (hasPermission === false) {
    return (
      <div className="relative mb-6 border-2 border-dashed border-gray-300 rounded-lg h-64 w-full flex flex-col items-center justify-center p-4">
        <CameraOff className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-500 text-center">{cameraError || 'Camera access denied'}</p>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Please enable camera permissions in your browser/device settings
        </p>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="relative mb-6 border-2 border-dashed border-gray-300 rounded-lg h-64 w-full flex items-center justify-center">
        <Camera className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-2 text-muted-foreground">Requesting camera access...</p>
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24 border border-gray-300 rounded-lg mx-auto overflow-hidden">
      <QrReader
        onResult={handleScan}
        constraints={{ 
          facingMode: 'environment',
          aspectRatio: 1
        }}
        scanDelay={500}
        className="w-full h-full"
        containerStyle={{ width: '100%', height: '100%' }}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
       />
      {cameraError && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <p className="text-white text-center p-4">{cameraError}</p>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none border-4 border-red-900 rounded-lg" />
    </div>
  );
};

export default QRCamera;
