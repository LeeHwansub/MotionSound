import { MotionData } from '../hooks/useMotionRecognition';

import { Note } from './musicalNotes';

export interface MotionPattern {
  id: string;
  name: string;
  samples: MotionData[];
  audioUrl?: string;
  baseNote?: Note;
  createdAt: number;
  userId?: string;
}

export function extractFeatures(motionData: MotionData): number[] {
  const features: number[] = [];

  if (motionData.poseLandmarks) {
    const keyPoints = [11, 12, 13, 14, 15, 16];
    keyPoints.forEach((index) => {
      const point = motionData.poseLandmarks![index];
      if (point) {
        features.push(point.x, point.y, point.z || 0);
      } else {
        features.push(0, 0, 0);
      }
    });
  } else {
    features.push(...new Array(18).fill(0));
  }

  if (motionData.leftHandLandmarks && motionData.leftHandLandmarks.length > 0) {
    const handCenter = motionData.leftHandLandmarks[9];
    features.push(handCenter.x, handCenter.y, handCenter.z || 0);
  } else {
    features.push(0, 0, 0);
  }

  if (motionData.rightHandLandmarks && motionData.rightHandLandmarks.length > 0) {
    const handCenter = motionData.rightHandLandmarks[9];
    features.push(handCenter.x, handCenter.y, handCenter.z || 0);
  } else {
    features.push(0, 0, 0);
  }

  return features;
}

function euclideanDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function calculateSimilarity(
  pattern: MotionPattern,
  currentMotion: MotionData,
  threshold: number = 0.3
): number {
  if (pattern.samples.length === 0) {
    return 0;
  }

  const currentFeatures = extractFeatures(currentMotion);
  let minDistance = Infinity;

  for (const sample of pattern.samples) {
    const sampleFeatures = extractFeatures(sample);
    const distance = euclideanDistance(currentFeatures, sampleFeatures);
    minDistance = Math.min(minDistance, distance);
  }

  const similarity = 1 / (1 + minDistance);
  return similarity >= threshold ? similarity : 0;
}

export function getSavedPatterns(): MotionPattern[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('motionPatterns');
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('모션 패턴 로드 실패:', error);
    return [];
  }
}

export function savePattern(pattern: MotionPattern): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const patterns = getSavedPatterns();
    const existingIndex = patterns.findIndex((p) => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      patterns[existingIndex] = pattern;
    } else {
      patterns.push(pattern);
    }

    localStorage.setItem('motionPatterns', JSON.stringify(patterns));
  } catch (error) {
    console.error('모션 패턴 저장 실패:', error);
  }
}

export function deletePattern(patternId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const patterns = getSavedPatterns();
    const filtered = patterns.filter((p) => p.id !== patternId);
    localStorage.setItem('motionPatterns', JSON.stringify(filtered));
  } catch (error) {
    console.error('모션 패턴 삭제 실패:', error);
  }
}