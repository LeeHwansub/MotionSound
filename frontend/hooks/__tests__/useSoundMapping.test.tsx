import { renderHook, act } from '@testing-library/react'
import { useSoundMapping } from '../useSoundMapping'
import { MotionData } from '../useMotionRecognition'
import { AudioEngine } from '../../lib/audio'
import { Note } from '../../lib/musicalNotes'

jest.mock('../../lib/audio')

describe('useSoundMapping', () => {
  let mockAudioEngine: jest.Mocked<AudioEngine>
  const baseNote: Note = {
    name: 'C',
    octave: 4,
    frequency: 261.63,
  }

  beforeEach(() => {
    mockAudioEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      playTone: jest.fn(),
      stopTone: jest.fn(),
      stopAll: jest.fn(),
      dispose: jest.fn(),
    } as any

    ;(AudioEngine as jest.Mock).mockImplementation(() => mockAudioEngine)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('초기화되어야 함', async () => {
    const { result } = renderHook(() => useSoundMapping({ baseNote }))

    expect(result.current.isInitialized).toBe(false)

    await act(async () => {
      await result.current.initialize()
    })

    expect(result.current.isInitialized).toBe(true)
    expect(mockAudioEngine.initialize).toHaveBeenCalled()
  })

  it('모션 데이터를 업데이트하면 오실레이터를 재생해야 함', async () => {
    const { result } = renderHook(() => useSoundMapping({ baseNote }))

    await act(async () => {
      await result.current.initialize()
    })

    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: Array(33).fill(null).map((_, i) => ({
        x: i * 0.1,
        y: i === 15 ? 0.5 : i * 0.2,
        z: i * 0.3,
        visibility: 1,
      })),
      leftHandLandmarks: Array(21).fill(null).map((_, i) => ({
        x: i * 0.1,
        y: i === 9 ? 0.5 : i * 0.2,
        z: i * 0.3,
        visibility: 1,
      })),
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    act(() => {
      result.current.updateMotion(motionData)
    })

    expect(mockAudioEngine.playTone).toHaveBeenCalled()
  })

  it('모든 오실레이터를 중지해야 함', async () => {
    const { result } = renderHook(() => useSoundMapping({ baseNote }))

    await act(async () => {
      await result.current.initialize()
    })

    act(() => {
      result.current.stop()
    })

    expect(mockAudioEngine.stopAll).toHaveBeenCalled()
  })

  it('enabled가 false이면 업데이트하지 않아야 함', async () => {
    const { result } = renderHook(() =>
      useSoundMapping({ baseNote, enabled: false })
    )

    await act(async () => {
      await result.current.initialize()
    })

    const motionData: MotionData = {
      timestamp: Date.now(),
      poseLandmarks: [],
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    }

    act(() => {
      result.current.updateMotion(motionData)
    })

    expect(mockAudioEngine.playTone).not.toHaveBeenCalled()
  })
})

