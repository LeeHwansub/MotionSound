import { MotionPattern } from '../motionPattern';
import { MotionData } from '../../hooks/useMotionRecognition';
import { Note } from '../musicalNotes';

import { parseErrorResponse } from './error-handler';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface MotionPatternResponse {
  _id: string;
  name: string;
  samples?: MotionData[];
  audioUrl?: string;
  baseNote?: Note;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const mapMotionPattern = (data: MotionPatternResponse): MotionPattern => ({
  id: data._id,
  name: data.name,
  samples: data.samples ?? [],
  audioUrl: data.audioUrl,
  baseNote: data.baseNote,
  userId: data.userId,
  createdAt: data.createdAt ? Date.parse(data.createdAt) : Date.now(),
});

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

async function request<T>(
  path: string,
  options?: RequestInit,
  retries: number = 3,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getAuthToken();
  console.log(`[API] ${options?.method || 'GET'} ${url}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response);
        console.error(`[API] 요청 실패: ${response.status} ${response.statusText}`, errorMessage);
        throw new Error(errorMessage || `Motion API 요청에 실패했습니다. (${response.status})`);
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

export async function fetchMotionPatterns(userId?: string): Promise<MotionPattern[]> {
  // 백엔드에서 인증된 사용자의 패턴만 반환하므로 userId 파라미터는 무시됨
  // 인증 토큰이 필요함
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