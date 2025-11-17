import {
  getNoteFrequency,
  NOTE_NAMES,
  OCTAVE_RANGE,
  DEFAULT_NOTE,
  mapYToPitchOffset,
  calculateFrequency,
  Note,
} from '../musicalNotes'

describe('musicalNotes', () => {
  describe('getNoteFrequency', () => {
    it('A4는 440Hz여야 함', () => {
      expect(getNoteFrequency('A', 4)).toBeCloseTo(440, 1)
    })

    it('C4의 주파수를 계산해야 함', () => {
      const frequency = getNoteFrequency('C', 4)
      expect(frequency).toBeGreaterThan(0)
      expect(frequency).toBeLessThan(1000)
    })

    it('옥타브가 높아지면 주파수가 2배가 되어야 함', () => {
      const freq4 = getNoteFrequency('A', 4)
      const freq5 = getNoteFrequency('A', 5)
      expect(freq5).toBeCloseTo(freq4 * 2, 1)
    })

    it('모든 음표 이름에 대해 주파수를 계산할 수 있어야 함', () => {
      NOTE_NAMES.forEach((noteName) => {
        const frequency = getNoteFrequency(noteName, 4)
        expect(frequency).toBeGreaterThan(0)
        expect(typeof frequency).toBe('number')
      })
    })
  })

  describe('NOTE_NAMES', () => {
    it('12개의 음표가 있어야 함', () => {
      expect(NOTE_NAMES.length).toBe(12)
    })

    it('C부터 시작해야 함', () => {
      expect(NOTE_NAMES[0]).toBe('C')
    })
  })

  describe('OCTAVE_RANGE', () => {
    it('옥타브 범위가 올바르게 설정되어야 함', () => {
      expect(OCTAVE_RANGE).toEqual([2, 3, 4, 5, 6, 7])
    })
  })

  describe('DEFAULT_NOTE', () => {
    it('기본 음표가 C4여야 함', () => {
      expect(DEFAULT_NOTE.name).toBe('C')
      expect(DEFAULT_NOTE.octave).toBe(4)
      expect(DEFAULT_NOTE.frequency).toBeGreaterThan(0)
    })
  })

  describe('mapYToPitchOffset', () => {
    it('Y값 0.5는 0 옥타브 오프셋을 반환해야 함', () => {
      const offset = mapYToPitchOffset(0.5, [0, 1])
      expect(offset).toBeCloseTo(0, 1)
    })

    it('Y값 0은 +1 옥타브 오프셋을 반환해야 함', () => {
      const offset = mapYToPitchOffset(0, [0, 1])
      expect(offset).toBeCloseTo(12, 1)
    })

    it('Y값 1은 -1 옥타브 오프셋을 반환해야 함', () => {
      const offset = mapYToPitchOffset(1, [0, 1])
      expect(offset).toBeCloseTo(-12, 1)
    })

    it('범위를 벗어난 값도 처리해야 함', () => {
      const offset1 = mapYToPitchOffset(-0.5, [0, 1])
      const offset2 = mapYToPitchOffset(1.5, [0, 1])
      expect(typeof offset1).toBe('number')
      expect(typeof offset2).toBe('number')
    })
  })

  describe('calculateFrequency', () => {
    it('기준 음표와 오프셋으로 주파수를 계산해야 함', () => {
      const baseNote: Note = {
        name: 'A',
        octave: 4,
        frequency: 440,
      }
      const frequency = calculateFrequency(baseNote, 0)
      expect(frequency).toBeCloseTo(440, 1)
    })

    it('+12 반음 오프셋은 주파수를 2배로 만들어야 함', () => {
      const baseNote: Note = {
        name: 'A',
        octave: 4,
        frequency: 440,
      }
      const frequency = calculateFrequency(baseNote, 12)
      expect(frequency).toBeCloseTo(880, 1)
    })

    it('-12 반음 오프셋은 주파수를 절반으로 만들어야 함', () => {
      const baseNote: Note = {
        name: 'A',
        octave: 4,
        frequency: 440,
      }
      const frequency = calculateFrequency(baseNote, -12)
      expect(frequency).toBeCloseTo(220, 1)
    })
  })
})

