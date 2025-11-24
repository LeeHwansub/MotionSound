import '@testing-library/jest-dom'
import { fetchPosts, fetchPost, createPost, updatePost, deletePost, likePost, incrementViewCount } from '../api/posts'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

global.fetch = jest.fn()

describe('Posts API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchPosts', () => {
    it('게시물 목록을 가져와야 함', async () => {
      const mockPosts = [
        {
          _id: '1',
          title: 'Post 1',
          content: 'Content 1',
          author: 'author1',
          isPublic: true,
          viewCount: 0,
          likeCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPosts,
      })

      const result = await fetchPosts()
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts`, {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockPosts)
    })

    it('요청 실패 시 에러를 발생시켜야 함', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn(() => 'text/plain'),
        },
        text: async () => 'Server Error',
      })

      await expect(fetchPosts()).rejects.toThrow()
    })
  })

  describe('fetchPost', () => {
    it('특정 게시물을 가져와야 함', async () => {
      const mockPost = {
        _id: '1',
        title: 'Post 1',
        content: 'Content 1',
        author: 'author1',
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await fetchPost('1')
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts/1`, {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockPost)
    })
  })

  describe('createPost', () => {
    it('게시물을 생성해야 함', async () => {
      const payload = {
        title: 'New Post',
        content: 'New Content',
        author: 'author1',
      }

      const mockPost = {
        _id: '1',
        ...payload,
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await createPost(payload)
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual(mockPost)
    })
  })

  describe('updatePost', () => {
    it('게시물을 수정해야 함', async () => {
      const payload = { title: 'Updated Title' }
      const mockPost = {
        _id: '1',
        title: 'Updated Title',
        content: 'Content',
        author: 'author1',
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await updatePost('1', payload)
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual(mockPost)
    })
  })

  describe('deletePost', () => {
    it('게시물을 삭제해야 함', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      })

      await deletePost('1')
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts/1`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
    })
  })

  describe('likePost', () => {
    it('게시물에 좋아요를 추가해야 함', async () => {
      const mockPost = {
        _id: '1',
        title: 'Post 1',
        content: 'Content 1',
        author: 'author1',
        isPublic: true,
        viewCount: 0,
        likeCount: 1,
        likedBy: ['user1'],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await likePost('1')
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts/1/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result.likeCount).toBe(1)
      expect(result.likedBy).toContain('user1')
    })

    it('이미 좋아요를 누른 게시물에서 좋아요를 취소해야 함', async () => {
      const mockPost = {
        _id: '1',
        title: 'Post 1',
        content: 'Content 1',
        author: 'author1',
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        likedBy: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await likePost('1')
      expect(result.likeCount).toBe(0)
      expect(result.likedBy).not.toContain('user1')
    })
  })

  describe('incrementViewCount', () => {
    it('게시물 조회수를 증가시켜야 함', async () => {
      const mockPost = {
        _id: '1',
        title: 'Post 1',
        content: 'Content 1',
        author: 'author1',
        isPublic: true,
        viewCount: 1,
        likeCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      })

      const result = await incrementViewCount('1')
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/posts/1/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result.viewCount).toBe(1)
    })
  })
})

