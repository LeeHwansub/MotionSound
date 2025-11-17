import {
  extractFeatures,
  calculateSimilarity,
  getSavedPatterns,
  savePattern,
  deletePattern,
  MotionPattern,
} from '../motionPattern'
import { MotionData } from '../../hooks/useMotionRecognition'

describe('motionPattern', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('extractFeatures', () => {
    it('포즈 랜드마크에서 특징을 추출해야 함', () => {
      const motionData: MotionData = {
        timestamp: Date.now(),
        poseLandmarks: Array(33).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        leftHandLandmarks: null,
        rightHandLandmarks: null,
        faceLandmarks: null,
      }

      const features = extractFeatures(motionData)
      expect(features.length).toBeGreaterThan(0)
      expect(Array.isArray(features)).toBe(true)
    })

    it('손 랜드마크가 없어도 특징을 추출해야 함', () => {
      const motionData: MotionData = {
        timestamp: Date.now(),
        poseLandmarks: Array(33).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        leftHandLandmarks: null,
        rightHandLandmarks: null,
        faceLandmarks: null,
      }

      const features = extractFeatures(motionData)
      expect(features.length).toBeGreaterThan(0)
    })
  })

  describe('calculateSimilarity', () => {
    const createMockMotionData = (x: number, y: number): MotionData => ({
      timestamp: Date.now(),
      poseLandmarks: Array(33).fill(null).map((_, i) => ({
        x: i === 11 ? x : i === 12 ? x + 0.1 : i * 0.1,
        y: i === 11 ? y : i === 12 ? y + 0.1 : i * 0.2,
        z: i * 0.3,
        visibility: 1,
      })),
      leftHandLandmarks: null,
      rightHandLandmarks: null,
      faceLandmarks: null,
    })

    it('동일한 모션 데이터는 높은 유사도를 반환해야 함', () => {
      const motionData = createMockMotionData(0.5, 0.5)
      const pattern: MotionPattern = {
        id: 'test',
        name: 'test',
        samples: [createMockMotionData(0.5, 0.5)],
        createdAt: Date.now(),
      }

      const similarity = calculateSimilarity(pattern, motionData, 0.3)
      expect(similarity).toBeGreaterThan(0.3)
    })

    it('다른 모션 데이터는 낮은 유사도를 반환해야 함', () => {
      const motionData = createMockMotionData(-1.0, -1.0)
      const pattern: MotionPattern = {
        id: 'test',
        name: 'test',
        samples: [createMockMotionData(2.0, 2.0)],
        createdAt: Date.now(),
      }

      const similarity = calculateSimilarity(pattern, motionData, 0.3)
      expect(similarity).toBeLessThanOrEqual(0.3)
    })

    it('빈 샘플 배열은 0을 반환해야 함', () => {
      const motionData = createMockMotionData(0.5, 0.5)
      const pattern: MotionPattern = {
        id: 'test',
        name: 'test',
        samples: [],
        createdAt: Date.now(),
      }

      const similarity = calculateSimilarity(pattern, motionData, 0.3)
      expect(similarity).toBe(0)
    })
  })

  describe('getSavedPatterns', () => {
    it('저장된 패턴이 없으면 빈 배열을 반환해야 함', () => {
      const patterns = getSavedPatterns()
      expect(patterns).toEqual([])
    })

    it('저장된 패턴을 반환해야 함', () => {
      const pattern: MotionPattern = {
        id: 'test1',
        name: 'test1',
        samples: [],
        createdAt: Date.now(),
      }
      savePattern(pattern)
      const patterns = getSavedPatterns()
      expect(patterns.length).toBe(1)
      expect(patterns[0].id).toBe('test1')
    })
  })

  describe('savePattern', () => {
    it('새 패턴을 저장해야 함', () => {
      const pattern: MotionPattern = {
        id: 'test1',
        name: 'test1',
        samples: [],
        createdAt: Date.now(),
      }
      savePattern(pattern)
      const patterns = getSavedPatterns()
      expect(patterns.length).toBe(1)
    })

    it('기존 패턴을 업데이트해야 함', () => {
      const pattern1: MotionPattern = {
        id: 'test1',
        name: 'test1',
        samples: [],
        createdAt: Date.now(),
      }
      savePattern(pattern1)

      const pattern2: MotionPattern = {
        id: 'test1',
        name: 'test1-updated',
        samples: [],
        createdAt: Date.now(),
      }
      savePattern(pattern2)

      const patterns = getSavedPatterns()
      expect(patterns.length).toBe(1)
      expect(patterns[0].name).toBe('test1-updated')
    })
  })

  describe('deletePattern', () => {
    it('패턴을 삭제해야 함', () => {
      const pattern: MotionPattern = {
        id: 'test1',
        name: 'test1',
        samples: [],
        createdAt: Date.now(),
      }
      savePattern(pattern)
      deletePattern('test1')
      const patterns = getSavedPatterns()
      expect(patterns.length).toBe(0)
    })

    it('존재하지 않는 패턴 삭제는 에러를 발생시키지 않아야 함', () => {
      expect(() => deletePattern('nonexistent')).not.toThrow()
    })
  })
})

