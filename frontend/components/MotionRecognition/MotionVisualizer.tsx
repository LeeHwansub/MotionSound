import React, { useEffect, useRef } from 'react';
import { MotionData } from '../../hooks/useMotionRecognition';

interface MotionVisualizerProps {
  motionData: MotionData | null;
  width?: number;
  height?: number;
}

const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24],
  [23, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
  [27, 29], [29, 31],
  [28, 30], [30, 32],
];

const HAND_CONNECTIONS = [
  [0, 1], [0, 5], [0, 9], [0, 13], [0, 17],
  [1, 2], [2, 3], [3, 4],
  [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [17, 18], [18, 19], [19, 20],
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