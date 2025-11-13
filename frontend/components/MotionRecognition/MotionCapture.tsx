import React, { useEffect } from 'react';
import { useMotionRecognition } from '../../hooks/useMotionRecognition';

interface MotionCaptureProps {
  onMotionData?: (motionData: any) => void;
  autoStart?: boolean;
  showVideo?: boolean;
}
export const MotionCapture: React.FC<MotionCaptureProps> = ({
  onMotionData,
  autoStart = false,
  showVideo = true,
}) => {
  const { motionData, isActive, isCameraActive, isLoading, error, startCamera, start, stop, stopCamera, videoRef } = useMotionRecognition();

  useEffect(() => {
    if (motionData && onMotionData) {
      onMotionData(motionData);
    }
  }, [motionData, onMotionData]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (autoStart && isCameraActive) {
      start();
    }

    return () => {
      if (autoStart && isActive) {
        stop();
      }
    };
  }, [autoStart, isCameraActive, isActive, start, stop]);

  return (
    <div className="motion-capture">
      {showVideo && (
        <div className="video-container">
          <video
            ref={videoRef}
            className="video-element"
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxWidth: '640px',
              height: 'auto',
              borderRadius: '8px',
              transform: 'scaleX(-1)',
            }}
          />
        </div>
      )}

      <div className="status-container" style={{ marginTop: '16px' }}>
        {!autoStart && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={isActive ? stop : start}
              disabled={isLoading || !isCameraActive}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: isActive ? '#ef4444' : isLoading || !isCameraActive ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !isCameraActive ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                opacity: isLoading || !isCameraActive ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && isCameraActive) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              {isLoading ? '초기화 중...' : !isCameraActive ? '웹캠 준비 중...' : isActive ? '모션 캡처 중지' : '모션 캡처 시작'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div>
            <strong>웹캠:</strong>{' '}
            <span style={{ color: isCameraActive ? 'green' : 'gray' }}>
              {isCameraActive ? '활성' : '비활성'}
            </span>
          </div>
          <div>
            <strong>모션 인식:</strong>{' '}
            <span style={{ color: isActive ? 'green' : isLoading ? 'orange' : 'gray' }}>
              {isLoading ? '초기화 중...' : isActive ? '활성' : '비활성'}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <strong>오류:</strong> {error}
          </div>
        )}

        {motionData && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
            <div>
              포즈: {motionData.poseLandmarks ? `${motionData.poseLandmarks.length}개 포인트` : '없음'}
            </div>
            <div>
              왼손: {motionData.leftHandLandmarks ? `${motionData.leftHandLandmarks.length}개 포인트` : '없음'}
            </div>
            <div>
              오른손: {motionData.rightHandLandmarks ? `${motionData.rightHandLandmarks.length}개 포인트` : '없음'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};