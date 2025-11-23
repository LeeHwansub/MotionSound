const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
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
    const message = await response.text();
    throw new Error(message || '영상 업로드에 실패했습니다.');
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
    const message = await response.text();
    throw new Error(message || '오디오 업로드에 실패했습니다.');
  }

  return response.json();
}
