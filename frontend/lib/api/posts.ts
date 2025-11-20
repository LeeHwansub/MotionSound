const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string;
  performanceId?: string;
  motionPatternId?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  videoUrl?: string;
  videoKey?: string;
  videoSize?: number;
  videoDurationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  author: string;
  performanceId?: string;
  motionPatternId?: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
  videoUrl?: string;
  videoKey?: string;
  videoSize?: number;
  videoDurationMs?: number;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
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
      throw new Error(message || `Post API 요청에 실패했습니다. (${response.status})`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    throw error;
  }
}

export async function fetchPosts(): Promise<Post[]> {
  return request<Post[]>('/posts');
}

export async function fetchPost(id: string): Promise<Post> {
  return request<Post>(`/posts/${id}`);
}

export async function createPost(
  payload: CreatePostPayload,
): Promise<Post> {
  return request<Post>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePost(
  id: string,
  payload: Partial<CreatePostPayload>,
): Promise<Post> {
  return request<Post>(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePost(id: string): Promise<void> {
  await request(`/posts/${id}`, { method: 'DELETE' });
}

