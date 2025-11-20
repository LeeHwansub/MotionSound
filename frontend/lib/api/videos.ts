const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface UploadMediaResponse {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export async function uploadVideo(file: Blob): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append('file', file, `record-${Date.now()}.webm`);

  const response = await fetch(`${API_BASE}/videos`, {
    method: 'POST',
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

  const response = await fetch(`${API_BASE}/audios`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '오디오 업로드에 실패했습니다.');
  }

  return response.json();
}
