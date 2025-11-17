import { MotionPattern } from '../motionPattern';
import { MotionData } from '../../hooks/useMotionRecognition';
import { Note } from '../musicalNotes';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface MotionPatternResponse {
  _id: string;
  name: string;
  samples?: MotionData[];
  audioUrl?: string;
  baseNote?: Note;
  createdAt?: string;
  updatedAt?: string;
}

const mapMotionPattern = (data: MotionPatternResponse): MotionPattern => ({
  id: data._id,
  name: data.name,
  samples: data.samples ?? [],
  audioUrl: data.audioUrl,
  baseNote: data.baseNote,
  createdAt: data.createdAt ? Date.parse(data.createdAt) : Date.now(),
});

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`[API] ${options?.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const message = await response.text();
      console.error(`[API] 요청 실패: ${response.status} ${response.statusText}`, message);
      throw new Error(message || `Motion API 요청에 실패했습니다. (${response.status})`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    console.log(`[API] 응답 성공:`, data);
    return data as T;
  } catch (error) {
    console.error(`[API] 네트워크 오류:`, error);
    throw error;
  }
}

export interface CreateMotionPatternPayload {
  name: string;
  samples: MotionData[];
  audioUrl?: string;
  baseNote?: Note;
}

export async function fetchMotionPatterns(): Promise<MotionPattern[]> {
  const data = await request<MotionPatternResponse[]>('/patterns');
  return data.map(mapMotionPattern);
}

export async function createMotionPattern(
  payload: CreateMotionPatternPayload,
): Promise<MotionPattern> {
  const data = await request<MotionPatternResponse>('/patterns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapMotionPattern(data);
}

export async function deleteMotionPattern(id: string): Promise<void> {
  await request(`/patterns/${id}`, { method: 'DELETE' });
}

