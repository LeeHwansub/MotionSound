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
  retries: number = 3,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`[API] ${options?.method || 'GET'} ${url}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
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
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ERR_CONNECTION_RESET') ||
         error.message.includes('NetworkError'));
      
      if (isNetworkError && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`[API] 네트워크 오류 (시도 ${attempt}/${retries}), ${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error(`[API] 네트워크 오류:`, error);
      throw error;
    }
  }
  
  throw new Error('요청 실패: 최대 재시도 횟수 초과');
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

