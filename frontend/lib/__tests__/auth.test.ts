import { getCurrentUser, getGoogleAuthUrl, saveToken, getToken, removeToken } from '../api/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

global.fetch = jest.fn()

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('getCurrentUser', () => {
    it('현재 사용자 정보를 가져와야 함', async () => {
      const mockUser = {
        _id: '1',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'google',
        providerId: 'google-id',
        isActive: true,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      })

      const result = await getCurrentUser('mock-token')
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('요청 실패 시 에러를 발생시켜야 함', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(getCurrentUser('invalid-token')).rejects.toThrow(
        '사용자 정보를 가져올 수 없습니다.',
      )
    })
  })

  describe('getGoogleAuthUrl', () => {
    it('Google OAuth URL을 반환해야 함', () => {
      const url = getGoogleAuthUrl()
      expect(url).toBe(`${API_BASE}/auth/google`)
    })
  })

  describe('Token 관리', () => {
    it('토큰을 저장해야 함', () => {
      if (typeof window !== 'undefined') {
        saveToken('test-token')
        expect(localStorage.getItem('auth_token')).toBe('test-token')
      }
    })

    it('토큰을 가져와야 함', () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', 'test-token')
        const token = getToken()
        expect(token).toBe('test-token')
      }
    })

    it('토큰이 없으면 null을 반환해야 함', () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        const token = getToken()
        expect(token).toBeNull()
      }
    })

    it('토큰을 제거해야 함', () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', 'test-token')
        removeToken()
        expect(localStorage.getItem('auth_token')).toBeNull()
      }
    })
  })
})

