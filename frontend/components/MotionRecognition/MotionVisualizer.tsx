import React, { useEffect, useRef } from 'react';
import { MotionData } from '../../hooks/useMotionRecognition';

interface MotionVisualizerProps {
  motionData: MotionData | null;
  width?: number;
  height?: number;
}

const POSE_CONNECTIONS = [
  // 얼굴
  [0, 1], [1, 2], [2, 3], [3, 7], // 왼쪽 눈-귀
  [0, 4], [4, 5], [5, 6], [6, 8], // 오른쪽 눈-귀
  // 어깨
  [9, 10], // 어깨 연결
  [11, 12], // 어깨선
  // 왼쪽 팔
  [11, 13], [13, 15], // 왼쪽 어깨-팔꿈치-손목
  // 오른쪽 팔
  [12, 14], [14, 16], // 오른쪽 어깨-팔꿈치-손목
  // 몸통
  [11, 23], [12, 24], // 어깨-골반
  [23, 24], // 골반선
  // 왼쪽 다리
  [23, 25], [25, 27], // 왼쪽 골반-무릎-발목
  // 오른쪽 다리
  [24, 26], [26, 28], // 오른쪽 골반-무릎-발목
  // 발
  [27, 29], [29, 31], // 왼쪽 발목-발뒤꿈치-발가락
  [28, 30], [30, 32], // 오른쪽 발목-발뒤꿈치-발가락
];

const HAND_CONNECTIONS = [
  // 손목에서 각 손가락으로
  [0, 1], [0, 5], [0, 9], [0, 13], [0, 17], // 손목-엄지/검지/중지/약지/소지 시작점
  // 엄지
  [1, 2], [2, 3], [3, 4], // 엄지 관절
  // 검지
  [5, 6], [6, 7], [7, 8], // 검지 관절
  // 중지
  [9, 10], [10, 11], [11, 12], // 중지 관절
  // 약지
  [13, 14], [14, 15], [15, 16], // 약지 관절
  // 소지
  [17, 18], [18, 19], [19, 20], // 소지 관절
];

const FACE_CONNECTIONS = [
  // 얼굴 윤곽선
  [10, 151], [151, 9], [9, 10], [10, 338], [338, 337], [337, 299], [299, 333], [333, 298], [298, 301], [301, 368], [368, 264], [264, 447], [447, 366], [366, 401], [401, 435], [435, 410], [410, 454], [454, 356], [356, 389], [389, 251], [251, 284], [284, 332], [332, 297], [297, 338],
  // 왼쪽 눈썹
  [17, 18], [18, 19], [19, 20], [20, 21], [21, 17],
  // 오른쪽 눈썹
  [22, 23], [23, 24], [24, 25], [25, 26], [26, 22],
  // 왼쪽 눈
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133], [133, 173], [173, 157], [157, 158], [158, 159], [159, 160], [160, 161], [161, 246], [246, 33],
  // 오른쪽 눈
  [362, 382], [382, 381], [381, 380], [380, 374], [374, 373], [373, 390], [390, 249], [249, 263], [263, 466], [466, 388], [388, 387], [387, 386], [386, 385], [385, 384], [384, 398], [398, 362],
  // 코
  [27, 28], [28, 29], [29, 30], [30, 31], [31, 32], [32, 27], [27, 168], [168, 8], [8, 27],
  // 입술 외곽
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318], [318, 61],
  // 입술 내부
  [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [308, 78],
];

export const MotionVisualizer: React.FC<MotionVisualizerProps> = ({
  motionData,
  width = 640,
  height = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      if (!motionData) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const drawPoint = (
        x: number,
        y: number,
        color: string,
        size: number = 4,
        alpha: number = 1.0
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(x * width, y * height, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      };

      const drawLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        lineWidth: number = 2,
        alpha: number = 0.8
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 3;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(x1 * width, y1 * height);
        ctx.lineTo(x2 * width, y2 * height);
        ctx.stroke();
        ctx.restore();
      };

      if (motionData.poseLandmarks) {
        const pose = motionData.poseLandmarks;

        POSE_CONNECTIONS.forEach(([start, end]) => {
          if (
            pose[start] &&
            pose[end] &&
            pose[start].visibility > 0.5 &&
            pose[end].visibility > 0.5
          ) {
            const visibility = Math.min(pose[start].visibility, pose[end].visibility);
            drawLine(
              pose[start].x,
              pose[start].y,
              pose[end].x,
              pose[end].y,
              '#00ff88',
              3,
              visibility
            );
          }
        });

        pose.forEach((landmark, index) => {
          if (landmark.visibility > 0.5) {
            const isKeyPoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(index);
            const size = isKeyPoint ? 6 : 4;
            drawPoint(landmark.x, landmark.y, '#00ff88', size, landmark.visibility);
          }
        });
      }

      if (motionData.leftHandLandmarks) {
        const hand = motionData.leftHandLandmarks;

        HAND_CONNECTIONS.forEach(([start, end]) => {
          if (hand[start] && hand[end]) {
            drawLine(
              hand[start].x,
              hand[start].y,
              hand[end].x,
              hand[end].y,
              '#ff4444',
              2.5,
              0.9
            );
          }
        });

        hand.forEach((landmark, index) => {
          const isKeyPoint = [0, 4, 8, 12, 16, 20].includes(index);
          const size = isKeyPoint ? 5 : 3.5;
          drawPoint(landmark.x, landmark.y, '#ff4444', size, 0.95);
        });
      }

      if (motionData.rightHandLandmarks) {
        const hand = motionData.rightHandLandmarks;

        HAND_CONNECTIONS.forEach(([start, end]) => {
          if (hand[start] && hand[end]) {
            drawLine(
              hand[start].x,
              hand[start].y,
              hand[end].x,
              hand[end].y,
              '#4488ff',
              2.5,
              0.9
            );
          }
        });

        hand.forEach((landmark, index) => {
          const isKeyPoint = [0, 4, 8, 12, 16, 20].includes(index);
          const size = isKeyPoint ? 5 : 3.5;
          drawPoint(landmark.x, landmark.y, '#4488ff', size, 0.95);
        });
      }

      if (motionData.faceLandmarks) {
        const face = motionData.faceLandmarks;

        FACE_CONNECTIONS.forEach(([start, end]) => {
          if (face[start] && face[end]) {
            drawLine(
              face[start].x,
              face[start].y,
              face[end].x,
              face[end].y,
              '#ffaa00',
              1.5,
              0.7
            );
          }
        });

        face.forEach((landmark, index) => {
          const isKeyPoint = [10, 151, 9, 33, 7, 133, 362, 263, 27, 28, 61, 78, 17, 22].includes(index);
          if (isKeyPoint) {
            drawPoint(landmark.x, landmark.y, '#ffaa00', 3, 0.9);
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [motionData, width, height]);

  return (
    <div
      className="motion-visualizer"
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#000',
          display: 'block',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      />
      {!motionData && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#9ca3af',
            fontSize: '16px',
            fontWeight: 500,
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '8px',
          }}
        >
          모션 데이터 대기 중...
        </div>
      )}
    </div>
  );
};