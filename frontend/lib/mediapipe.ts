export interface MediaPipeConfig {
  locateFile: (file: string) => string;
  onPoseResults: (results: any) => void;
  onHandsResults?: (results: any) => void;
  onFaceResults?: (results: any) => void;
}

export interface MediaPipeInstances {
  pose: any;
  hands?: any;
  faceMesh?: any;
}
export const createMediaPipeInstances = async (config: MediaPipeConfig): Promise<MediaPipeInstances> => {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe는 브라우저 환경에서만 사용할 수 있습니다.');
  }
  
  const { Pose } = await import('@mediapipe/pose');
  
  const poseLocateFile = (file: string) => {
    if (file.startsWith('http://') || file.startsWith('https://')) {
      return file;
    }
    const version = '0.5.1675469404';
    return `https://unpkg.com/@mediapipe/pose@${version}/${file}`;
  };
  
  const pose = new Pose({
    locateFile: poseLocateFile,
  } as any);
  
  pose.onResults(config.onPoseResults);
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  let hands: any = null;
  
  if (config.onHandsResults) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { Hands } = await import('@mediapipe/hands');
    
    const handsLocateFile = (file: string) => {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return file;
      }
      const version = '0.4.1675469240';
      return `https://unpkg.com/@mediapipe/hands@${version}/${file}`;
    };
    
    hands = new Hands({
      locateFile: handsLocateFile,
    } as any);
    
    hands.onResults(config.onHandsResults);
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  let faceMesh: any = null;
  
  if (config.onFaceResults) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { FaceMesh } = await import('@mediapipe/face_mesh');
    
    const faceMeshLocateFile = (file: string) => {
      if (file.startsWith('http://') || file.startsWith('https://')) {
        return file;
      }
      const version = '0.4.1633559619';
      return `https://unpkg.com/@mediapipe/face_mesh@${version}/${file}`;
    };
    
    faceMesh = new FaceMesh({
      locateFile: faceMeshLocateFile,
    } as any);
    
    faceMesh.onResults(config.onFaceResults);
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return { pose, hands, faceMesh };
};

export const getCameraStream = async (
  videoElement: HTMLVideoElement
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });

    videoElement.srcObject = stream;
    
    try {
      await videoElement.play();
    } catch (playError) {
      if (playError instanceof Error && playError.name !== 'AbortError') {
        console.warn('비디오 재생 오류 (무시됨):', playError);
      }
    }

    return stream;
  } catch (error) {
    console.error('웹캠 접근 실패:', error);
    throw new Error('웹캠에 접근할 수 없습니다. 권한을 확인해주세요.');
  }
};