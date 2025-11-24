import { parseErrorResponse } from './error-handler';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  _id: string;
  email: string;
  name: string;
  provider: string;
  providerId: string;
  isActive: boolean;
  profileImage?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '사용자 정보를 가져올 수 없습니다.');
  }

  return response.json();
}

export function getGoogleAuthUrl(): string {
  return `${API_BASE}/auth/google`;
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export interface UpdateUserRequest {
  name?: string;
  isActive?: boolean;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthDate?: string;
}

export async function updateCurrentUser(
  token: string,
  updateData: UpdateUserRequest,
): Promise<User> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '사용자 정보를 업데이트할 수 없습니다.');
  }

  return response.json();
}

export async function uploadProfileImage(
  token: string,
  file: File,
): Promise<User> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/auth/me/profile-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '프로필 사진 업로드에 실패했습니다.');
  }

  return response.json();
}

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export async function sendOtp(
  token: string,
  request: SendOtpRequest,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/auth/phone/send-otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '인증번호 전송에 실패했습니다.');
  }

  return response.json();
}

export async function verifyOtp(
  token: string,
  request: VerifyOtpRequest,
): Promise<{ message: string; user?: User }> {
  const response = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorResponse(response);
    throw new Error(errorMessage || '인증번호 검증에 실패했습니다.');
  }

  return response.json();
}

