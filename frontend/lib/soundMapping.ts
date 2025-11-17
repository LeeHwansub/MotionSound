import { MotionData } from '../hooks/useMotionRecognition';
import { Note, mapYToPitchOffset, calculateFrequency } from './musicalNotes';

export interface SoundParams {
  frequency: number;
  volume: number;
  type: OscillatorType;
}

export interface MotionToSoundConfig {
  baseNote?: Note;
  minVolume?: number;
  maxVolume?: number;
  yAxisRange?: [number, number];
  pitchRange?: number;
}

export function mapVelocityToVolume(
  velocity: number,
  config: MotionToSoundConfig = {}
): number {
  const { minVolume = 0.1, maxVolume = 0.7 } = config;
  
  const normalizedVelocity = Math.max(0, Math.min(1, velocity));
  return minVolume + (maxVolume - minVolume) * normalizedVelocity;
}

function calculateDistance(
  point1: { x: number; y: number; z?: number },
  point2: { x: number; y: number; z?: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = (point2.z || 0) - (point1.z || 0);
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateVelocity(
  current: { x: number; y: number; z?: number },
  previous: { x: number; y: number; z?: number } | null,
  timeDelta: number
): number {
  if (!previous || timeDelta === 0) {
    return 0;
  }

  const distance = calculateDistance(current, previous);
  return distance / timeDelta;
}

function getWristPosition(poseLandmarks: MotionData['poseLandmarks']): {
  left: { x: number; y: number } | null;
  right: { x: number; y: number } | null;
} {
  if (!poseLandmarks || poseLandmarks.length < 16) {
    return { left: null, right: null };
  }

  return {
    left: {
      x: poseLandmarks[15]?.x || 0,
      y: poseLandmarks[15]?.y || 0,
    },
    right: {
      x: poseLandmarks[16]?.x || 0,
      y: poseLandmarks[16]?.y || 0,
    },
  };
}

export function mapMotionToSound(
  motionData: MotionData,
  previousMotionData: MotionData | null,
  config: MotionToSoundConfig = {}
): {
  leftHand: SoundParams | null;
  rightHand: SoundParams | null;
} {
  const {
    baseNote,
    minVolume = 0.1,
    maxVolume = 0.7,
    yAxisRange = [0, 1],
  } = config;

  if (!baseNote) {
    return { leftHand: null, rightHand: null };
  }

  const wristPos = getWristPosition(motionData.poseLandmarks);
  
  let leftHand: SoundParams | null = null;
  let rightHand: SoundParams | null = null;

  if (motionData.leftHandLandmarks && motionData.leftHandLandmarks.length > 0 && wristPos.left) {
    const handCenter = motionData.leftHandLandmarks[9];
    const timeDelta = previousMotionData
      ? (motionData.timestamp - previousMotionData.timestamp) / 1000
      : 0.033;

    const previousHand = previousMotionData?.leftHandLandmarks?.[9];
    const velocity = calculateVelocity(
      handCenter,
      previousHand || null,
      timeDelta
    );

    const pitchOffset = mapYToPitchOffset(handCenter.y, yAxisRange);
    const frequency = calculateFrequency(baseNote, pitchOffset);

    leftHand = {
      frequency,
      volume: mapVelocityToVolume(Math.min(velocity * 10, 1), { minVolume, maxVolume }),
      type: 'sine',
    };
  }

  if (motionData.rightHandLandmarks && motionData.rightHandLandmarks.length > 0 && wristPos.right) {
    const handCenter = motionData.rightHandLandmarks[9];
    const timeDelta = previousMotionData
      ? (motionData.timestamp - previousMotionData.timestamp) / 1000
      : 0.033;

    const previousHand = previousMotionData?.rightHandLandmarks?.[9];
    const velocity = calculateVelocity(
      handCenter,
      previousHand || null,
      timeDelta
    );

    const pitchOffset = mapYToPitchOffset(handCenter.y, yAxisRange);
    const frequency = calculateFrequency(baseNote, pitchOffset);

    rightHand = {
      frequency,
      volume: mapVelocityToVolume(Math.min(velocity * 10, 1), { minVolume, maxVolume }),
      type: 'sine',
    };
  }

  return { leftHand, rightHand };
}