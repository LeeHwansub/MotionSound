import {
  mapVelocityToVolume,
  calculateVelocity,
  mapMotionToSound,
  SoundParams,
} from '../soundMapping'
import { MotionData } from '../../hooks/useMotionRecognition'
import { Note } from '../musicalNotes'

describe('soundMapping', () => {
  describe('mapVelocityToVolume', () => {
    it('속도 0은 최소 볼륨을 반환해야 함', () => {
      const volume = mapVelocityToVolume(0, { minVolume: 0.1, maxVolume: 0.7 })
      expect(volume).toBeCloseTo(0.1, 2)
    })

    it('속도 1은 최대 볼륨을 반환해야 함', () => {
      const volume = mapVelocityToVolume(1, { minVolume: 0.1, maxVolume: 0.7 })
      expect(volume).toBeCloseTo(0.7, 2)
    })

    it('속도 0.5는 중간 볼륨을 반환해야 함', () => {
      const volume = mapVelocityToVolume(0.5, { minVolume: 0.1, maxVolume: 0.7 })
      expect(volume).toBeCloseTo(0.4, 2)
    })

    it('기본값을 사용해야 함', () => {
      const volume = mapVelocityToVolume(0.5)
      expect(volume).toBeGreaterThan(0)
      expect(volume).toBeLessThanOrEqual(1)
    })
  })

  describe('calculateVelocity', () => {
    it('이전 위치가 없으면 0을 반환해야 함', () => {
      const velocity = calculateVelocity(
        { x: 0.5, y: 0.5 },
        null,
        0.033
      )
      expect(velocity).toBe(0)
    })

    it('시간 델타가 0이면 0을 반환해야 함', () => {
      const velocity = calculateVelocity(
        { x: 0.5, y: 0.5 },
        { x: 0.4, y: 0.4 },
        0
      )
      expect(velocity).toBe(0)
    })

    it('거리와 시간으로 속도를 계산해야 함', () => {
      const velocity = calculateVelocity(
        { x: 0.6, y: 0.6 },
        { x: 0.5, y: 0.5 },
        0.033
      )
      expect(velocity).toBeGreaterThan(0)
    })

    it('Z 좌표도 고려해야 함', () => {
      const velocity = calculateVelocity(
        { x: 0.5, y: 0.5, z: 0.6 },
        { x: 0.5, y: 0.5, z: 0.5 },
        0.033
      )
      expect(velocity).toBeGreaterThan(0)
    })
  })

  describe('mapMotionToSound', () => {
    const baseNote: Note = {
      name: 'C',
      octave: 4,
      frequency: 261.63,
    }

    it('baseNote가 없으면 null을 반환해야 함', () => {
      const motionData: MotionData = {
        timestamp: Date.now(),
        poseLandmarks: Array(33).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        leftHandLandmarks: Array(21).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        rightHandLandmarks: null,
        faceLandmarks: null,
      }

      const result = mapMotionToSound(motionData, null, {})
      expect(result.leftHand).toBeNull()
      expect(result.rightHand).toBeNull()
    })

    it('왼손 랜드마크가 있으면 사운드 파라미터를 반환해야 함', () => {
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

      const result = mapMotionToSound(motionData, null, { baseNote })
      expect(result.leftHand).not.toBeNull()
      expect(result.leftHand?.frequency).toBeGreaterThan(0)
      expect(result.leftHand?.volume).toBeGreaterThan(0)
    })

    it('오른손 랜드마크가 있으면 사운드 파라미터를 반환해야 함', () => {
      const motionData: MotionData = {
        timestamp: Date.now(),
        poseLandmarks: Array(33).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i === 16 ? 0.5 : i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        leftHandLandmarks: null,
        rightHandLandmarks: Array(21).fill(null).map((_, i) => ({
          x: i * 0.1,
          y: i === 9 ? 0.5 : i * 0.2,
          z: i * 0.3,
          visibility: 1,
        })),
        faceLandmarks: null,
      }

      const result = mapMotionToSound(motionData, null, { baseNote })
      expect(result.rightHand).not.toBeNull()
      expect(result.rightHand?.frequency).toBeGreaterThan(0)
      expect(result.rightHand?.volume).toBeGreaterThan(0)
    })
  })
})
