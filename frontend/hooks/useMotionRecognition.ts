import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createMediaPipeInstances, getCameraStream, MediaPipeInstances } from '../lib/mediapipe';

export interface MotionData {
  poseLandmarks: Array<{
    x: number;
    y: number;
    z: number;
    visibility: number;
  }> | null;
  leftHandLandmarks: Array<{
    x: number;
    y: number;
    z: number;
  }> | null;
  rightHandLandmarks: Array<{
    x: number;
    y: number;
    z: number;
  }> | null;
  faceLandmarks: Array<{
    x: number;
    y: number;
    z: number;
  }> | null;
  timestamp: number;
}

export interface UseMotionRecognitionReturn {
  motionData: MotionData | null;
  isActive: boolean;
  isCameraActive: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => void;
  stopCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const useMotionRecognition = (): UseMotionRecognitionReturn => {
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaPipeRef = useRef<MediaPipeInstances | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const frameSkipCountRef = useRef<number>(0);
  
  const poseResultsRef = useRef<any>(null);
  const handsResultsRef = useRef<any>(null);
  const faceResultsRef = useRef<any>(null);

  const combineResults = useCallback(() => {
    const poseResults = poseResultsRef.current;
    const handsResults = handsResultsRef.current;
    const faceResults = faceResultsRef.current;

    let leftHandLandmarks: any = null;
    let rightHandLandmarks: any = null;

    if (handsResults?.multiHandLandmarks && handsResults.multiHandLandmarks.length > 0) {
      const handedness = handsResults.multiHandedness || [];
      
      handsResults.multiHandLandmarks.forEach((hand: any, index: number) => {
        const handInfo = handedness[index];
        const categoryName = handInfo?.categoryName || handInfo?.displayName;
        const isLeft = categoryName === 'Left' || categoryName === 'LEFT';
        const isRight = categoryName === 'Right' || categoryName === 'RIGHT';
        
        if (isLeft) {
          leftHandLandmarks = hand;
        } else if (isRight) {
          rightHandLandmarks = hand;
        } else {
          if (index === 0 && !leftHandLandmarks && !rightHandLandmarks) {
            const avgX = hand.reduce((sum: number, p: any) => sum + p.x, 0) / hand.length;
            if (avgX < 0.5) {
              leftHandLandmarks = hand;
            } else {
              rightHandLandmarks = hand;
            }
          } else if (index === 1) {
            if (leftHandLandmarks) {
              rightHandLandmarks = hand;
            } else {
              leftHandLandmarks = hand;
            }
          }
        }
      });
    }

    const newMotionData: MotionData = {
      poseLandmarks: poseResults?.poseLandmarks || null,
      leftHandLandmarks: leftHandLandmarks,
      rightHandLandmarks: rightHandLandmarks,
      faceLandmarks: faceResults?.multiFaceLandmarks?.[0] || null,
      timestamp: Date.now(),
    };

    setMotionData(newMotionData);
  }, []);

  const handlePoseResults = useCallback((results: any) => {
    poseResultsRef.current = results;
    combineResults();
    isProcessingRef.current = false;
  }, [combineResults]);

  const handleHandsResults = useCallback((results: any) => {
    handsResultsRef.current = results;
    combineResults();
    isProcessingRef.current = false;
  }, [combineResults]);

  const handleFaceResults = useCallback((results: any) => {
    faceResultsRef.current = results;
    combineResults();
    isProcessingRef.current = false;
  }, [combineResults]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !mediaPipeRef.current || !isActiveRef.current) {
      if (!videoRef.current) {
        return;
      }
      if (!mediaPipeRef.current) {
        return;
      }
      if (!isActiveRef.current) {
        return;
      }
      return;
    }
    
    if (frameSkipCountRef.current > 100) {
      console.error('프레임 처리 실패: 조건을 만족하지 못해 중단합니다');
      frameSkipCountRef.current = 0;
      return;
    }

    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      frameSkipCountRef.current++;
      setTimeout(() => {
        if (isActiveRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      }, 33);
      return;
    }

    if (isProcessingRef.current) {
      frameSkipCountRef.current++;
      setTimeout(() => {
        if (isActiveRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      }, 33);
      return;
    }

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      frameSkipCountRef.current++;
      setTimeout(() => {
        if (isActiveRef.current) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
      }, 33);
      return;
    }

    frameSkipCountRef.current = 0;
    isProcessingRef.current = true;

    try {
      let canvas: HTMLCanvasElement;
      if (!canvasRef.current) {
        canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvasRef.current = canvas;
      } else {
        canvas = canvasRef.current;
        if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
        }
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        
        const { pose, hands, faceMesh } = mediaPipeRef.current;
        
        if (!pose) {
          console.error('Pose 인스턴스가 없습니다!');
          isProcessingRef.current = false;
          return;
        }
        
        try {
          await pose.send({ image: canvas });
          
          if (hands) {
            await hands.send({ image: canvas });
          }
          
          if (faceMesh) {
            await faceMesh.send({ image: canvas });
          }
          
          setTimeout(() => {
            if (isProcessingRef.current) {
              isProcessingRef.current = false;
            }
          }, 3000);
        } catch (sendError) {
          console.error('프레임 전송 오류:', sendError);
          isProcessingRef.current = false;
        }
      } else {
        console.error('Canvas context를 가져올 수 없습니다');
        isProcessingRef.current = false;
      }
    } catch (sendError) {
      console.error('send() 호출 오류:', sendError);
      isProcessingRef.current = false;
    }

    setTimeout(() => {
      if (isActiveRef.current && videoRef.current && mediaPipeRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    }, 33);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!videoRef.current) {
        throw new Error('비디오 요소가 없습니다.');
      }

      if (streamRef.current) {
        setIsCameraActive(true);
        setIsLoading(false);
        return;
      }

      const stream = await getCameraStream(videoRef.current);
      streamRef.current = stream;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) {
          resolve();
          return;
        }

        const checkVideoReady = () => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA &&
            videoRef.current.videoWidth > 0 &&
            videoRef.current.videoHeight > 0
          ) {
            resolve();
          } else {
            setTimeout(checkVideoReady, 100);
          }
        };

        const onLoadedMetadata = () => {
          videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
          checkVideoReady();
        };

        const onCanPlay = () => {
          videoRef.current?.removeEventListener('canplay', onCanPlay);
          checkVideoReady();
        };

        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current.addEventListener('canplay', onCanPlay);

        if (videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
          checkVideoReady();
        }
      });

      setIsCameraActive(true);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setIsCameraActive(false);
      setIsLoading(false);
    }
  }, []); // 의존성 배열: 빈 배열 (한 번만 생성)

  const start = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!videoRef.current) {
        throw new Error('비디오 요소가 없습니다.');
      }

      if (!mediaPipeRef.current) {
        if (typeof window === 'undefined') {
          throw new Error('MediaPipe는 브라우저 환경에서만 사용할 수 있습니다.');
        }
        
        mediaPipeRef.current = await createMediaPipeInstances({
          locateFile: () => '',
          onPoseResults: handlePoseResults,
          onHandsResults: handleHandsResults,
          onFaceResults: handleFaceResults,
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (!streamRef.current || !videoRef.current) {
        throw new Error('웹캠이 활성화되지 않았습니다. 먼저 웹캠을 시작해주세요.');
      }

      if (
        videoRef.current.readyState < videoRef.current.HAVE_CURRENT_DATA ||
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      ) {
        throw new Error('웹캠이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      }

      isActiveRef.current = true;
      setIsActive(true);
      setIsLoading(false);
      
      if (isActiveRef.current && mediaPipeRef.current && videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setTimeout(() => {
          processFrame();
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      isActiveRef.current = false;
      setIsActive(false);
      setIsLoading(false);
    }
  }, [handlePoseResults, processFrame]);

  const stop = useCallback(() => {
    isActiveRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsActive(false);
    setMotionData(null);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        stop();
      }
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    motionData,
    isActive,
    isCameraActive,
    isLoading,
    error,
    startCamera,
    start,
    stop,
    stopCamera,
    videoRef,
  };
};