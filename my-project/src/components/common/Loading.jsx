/**
 * Loading 元件
 * 載入中的動畫元件
 */
import React from 'react';

const Loading = ({ size = 'md', text = '載入中...', fullScreen = false }) => {
  // 尺寸樣式
  const sizeStyles = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  const loadingComponent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeStyles[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <p className="text-gray-600 text-center">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {loadingComponent}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{loadingComponent}</div>;
};

export default Loading;
