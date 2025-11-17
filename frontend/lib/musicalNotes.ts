export interface Note {
  name: string;
  octave: number;
  frequency: number;
}

export function getNoteFrequency(noteName: string, octave: number): number {
  const A4_FREQUENCY = 440;
  const SEMITONES_FROM_A4: Record<string, number> = {
    C: -9,
    'C#': -8,
    D: -7,
    'D#': -6,
    E: -5,
    F: -4,
    'F#': -3,
    G: -2,
    'G#': -1,
    A: 0,
    'A#': 1,
    B: 2,
  };

  const semitones = SEMITONES_FROM_A4[noteName] + (octave - 4) * 12;
  return A4_FREQUENCY * Math.pow(2, semitones / 12);
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const OCTAVE_RANGE = [2, 3, 4, 5, 6, 7] as const;

export const DEFAULT_NOTE: Note = {
  name: 'C',
  octave: 4,
  frequency: getNoteFrequency('C', 4),
};

export function mapYToPitchOffset(y: number, range: [number, number] = [0, 1]): number {
  const normalizedY = Math.max(0, Math.min(1, (y - range[0]) / (range[1] - range[0])));
  const invertedY = 1 - normalizedY;
  const semitones = (invertedY - 0.5) * 24;
  return semitones;
}

export function calculateFrequency(baseNote: Note, pitchOffset: number): number {
  const semitones = pitchOffset;
  return baseNote.frequency * Math.pow(2, semitones / 12);
}

