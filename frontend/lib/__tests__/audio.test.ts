import { AudioEngine, AudioConfig } from '../audio'

describe('AudioEngine', () => {
  let audioEngine: AudioEngine

  beforeEach(() => {
    audioEngine = new AudioEngine()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('기본 설정으로 생성되어야 함', () => {
      const engine = new AudioEngine()
      expect(engine).toBeInstanceOf(AudioEngine)
    })

    it('커스텀 설정으로 생성되어야 함', () => {
      const config: AudioConfig = {
        sampleRate: 48000,
        maxVolume: 0.8,
        minFrequency: 100,
        maxFrequency: 5000,
      }
      const engine = new AudioEngine(config)
      expect(engine).toBeInstanceOf(AudioEngine)
    })
  })

  describe('initialize', () => {
    it('AudioContext를 초기화해야 함', async () => {
      await audioEngine.initialize()
      const audioContext = audioEngine.getAudioContext()
      expect(audioContext).not.toBeNull()
      if (audioContext) {
        expect(audioContext.state).toBe('running')
      }
    })

    it('브라우저 환경이 아니면 에러를 던져야 함', async () => {
      const originalWindow = global.window
      delete (global as any).window

      await expect(audioEngine.initialize()).rejects.toThrow(
        'AudioEngine는 브라우저 환경에서만 사용할 수 있습니다.'
      )

      global.window = originalWindow
    })
  })

  describe('playTone', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('오실레이터를 생성하고 재생해야 함', () => {
      audioEngine.playTone('test', 440, 0.5, 'sine')
      const mockAudioContext = (global as any).mockAudioContext
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('AudioContext가 초기화되지 않으면 에러를 로그해야 함', () => {
      const engine = new AudioEngine()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      engine.playTone('test', 440)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('stopTone', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('오실레이터를 중지해야 함', () => {
      const oscillator = {
        stop: jest.fn(),
      } as any
      audioEngine['oscillators'].set('test', oscillator)
      audioEngine.stopTone('test')
      expect(oscillator.stop).toHaveBeenCalled()
    })
  })

  describe('stopAll', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('모든 오실레이터를 중지해야 함', () => {
      const oscillator1 = { stop: jest.fn() } as any
      const oscillator2 = { stop: jest.fn() } as any
      audioEngine['oscillators'].set('test1', oscillator1)
      audioEngine['oscillators'].set('test2', oscillator2)
      audioEngine.stopAll()
      expect(oscillator1.stop).toHaveBeenCalled()
      expect(oscillator2.stop).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    beforeEach(async () => {
      await audioEngine.initialize()
    })

    it('모든 오실레이터를 중지하고 AudioContext를 닫아야 함', () => {
      audioEngine.dispose()
      const mockAudioContext = (global as any).mockAudioContext
      expect(mockAudioContext.close).toHaveBeenCalled()
    })
  })

  describe('getAudioContext', () => {
    it('초기화 전에는 null을 반환해야 함', () => {
      expect(audioEngine.getAudioContext()).toBeNull()
    })

    it('초기화 후에는 AudioContext를 반환해야 함', async () => {
      await audioEngine.initialize()
      const mockAudioContext = (global as any).mockAudioContext
      expect(audioEngine.getAudioContext()).toBe(mockAudioContext)
    })
  })
})