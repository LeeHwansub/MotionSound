import { parseErrorResponse } from './error-handler';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function getProxiedMediaUrl(url: string): string {
  if (!url) return url;
  
  if (url.startsWith('blob:') || url.startsWith(API_BASE)) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    const audiosIndex = pathParts.findIndex(part => part === 'audios');
    const videosIndex = pathParts.findIndex(part => part === 'videos');
    const profileIndex = pathParts.findIndex(part => part === 'profile');
    const imagesIndex = pathParts.findIndex(part => part === 'images');
    
    let key: string | null = null;
    
    if (audiosIndex !== -1) {
      key = pathParts.slice(audiosIndex).join('/');
    } else if (videosIndex !== -1) {
      key = pathParts.slice(videosIndex).join('/');
    } else if (profileIndex !== -1) {
      key = pathParts.slice(profileIndex).join('/');
    } else if (imagesIndex !== -1) {
      key = pathParts.slice(imagesIndex).join('/');
    } else if (pathParts.length > 0) {
      const firstPart = pathParts[0];
      if (firstPart !== 'audios' && firstPart !== 'videos' && firstPart !== 'profile' && firstPart !== 'images') {
        key = pathParts.slice(1).join('/');
      } else {
        key = pathParts.join('/');
      }
    }
    
    if (key) {
      return `${API_BASE}/media/${key}`;
    }
  } catch (error) {
    console.warn('URL 파싱 실패:', url, error);
  }

  return url;
}

export interface UploadMediaResponse {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export async function uploadVideo(file: Blob): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append('file', file, `record-${Date.now()}.webm`);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/videos`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '영상 업로드에 실패했습니다.');
  }

  return response.json();
}

export async function uploadAudio(file: File | Blob): Promise<UploadMediaResponse> {
  const formData = new FormData();
  const fileName = file instanceof File 
    ? file.name 
    : `audio-${Date.now()}.mp3`;
  formData.append('file', file, fileName);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/audios`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '오디오 업로드에 실패했습니다.');
  }

  return response.json();
}
