import '@testing-library/jest-dom'
import { renderHook, act } from '@testing-library/react'
import { useMotionPattern } from '../useMotionPattern'
import { MotionData } from '../useMotionRecognition'
import { AudioEngine } from '../../lib/audio'
import { Note } from '../../lib/musicalNotes'
import { MotionPattern } from '../../lib/motionPattern'

jest.mock('../../lib/audio')
jest.mock('../../lib/motionPattern', () => ({
  ...jest.requireActual('../../lib/motionPattern'),
  calculateSimilarity: jest.fn(),
}))
jest.mock('../../lib/api/motionPatterns', () => ({
  fetchMotionPatterns: jest.fn().mockResolvedValue([]),
  createMotionPattern: jest.fn().mockResolvedValue({
    id: 'server-id',
    name: 'test-pattern',
    samples: [],
    createdAt: Date.now(),
  }),
  deleteMotionPattern: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { _id: 'test-user-id' },
    loading: false,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('useMotionPattern', () => {
  let mockAudioEngine: jest.Mocked<AudioEngine>
  const baseNote: Note = {
    name: 'C',
    octave: 4,
    frequency: 261.63,
  }

  beforeEach(() => {
    localStorage.clear()
    mockAudioEngine = {
      getAudioContext: jest.fn(() => ({
        createOscillator: jest.fn(() => ({
          type: 'sine',
          frequency: { value: 440 },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        })),
        createGain: jest.fn(() => ({
          gain: { value: 0.5 },
          connect: jest.fn(),
        })),
        destination: {},
      })),
      playAudioFile: jest.fn().mockResolvedValue({}),
      stopAudioFile: jest.fn(),
    } as any

    ;(AudioEngine as jest.Mock).mockImplementation(() => mockAudioEngine)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태가 올바르게 설정되어야 함', async () => {
    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: [],
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    const { result } = renderHook(() =>
      useMotionPattern(motionData, mockAudioEngine)
    )
    await act(async () => {})

    expect(result.current.patterns).toEqual([])
    expect(result.current.isRecording).toBe(false)
    expect(result.current.matchedPattern).toBeNull()
  })

  it('패턴 기록을 시작할 수 있어야 함', async () => {
    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: [],
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    const { result } = renderHook(() =>
      useMotionPattern(motionData, mockAudioEngine)
    )
    await act(async () => {})

    act(() => {
      result.current.startRecording('test-pattern', baseNote)
    })

    expect(result.current.isRecording).toBe(true)
  })

  it('패턴 기록을 중지할 수 있어야 함', async () => {
    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: [],
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    const { result } = renderHook(() =>
      useMotionPattern(motionData, mockAudioEngine)
    )
    await act(async () => {})

    act(() => {
      result.current.startRecording('test-pattern', baseNote)
    })

    await act(async () => {
      await result.current.stopRecording()
    })

    expect(result.current.isRecording).toBe(false)
  })

  it('패턴을 삭제할 수 있어야 함', async () => {
    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: [],
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    const mockPattern = {
      id: 'test-id',
      name: 'test-pattern',
      samples: [],
      createdAt: Date.now(),
      userId: 'test-user-id',
    }
    
    const { fetchMotionPatterns, deleteMotionPattern } = require('../../lib/api/motionPatterns')
    fetchMotionPatterns.mockResolvedValue([mockPattern])

    const { result } = renderHook(() =>
      useMotionPattern(motionData, mockAudioEngine)
    )
    
    // 초기 로드 대기
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // 패턴이 로드되었는지 확인
    if (result.current.patterns.length > 0) {
      const patternId = result.current.patterns[0].id
      
      // 패턴 삭제
      await act(async () => {
        await result.current.deletePatternById(patternId)
      })

      // 삭제 API가 호출되었는지 확인
      expect(deleteMotionPattern).toHaveBeenCalledWith(patternId)
    } else {
      // 패턴이 없으면 삭제 시도 시 에러가 발생해야 함
      await expect(
        act(async () => {
          await result.current.deletePatternById('test-id')
        })
      ).rejects.toThrow()
    }
  })
})

