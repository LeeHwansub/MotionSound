import { useState, useEffect, useRef, useCallback } from 'react';
import { MotionData } from './useMotionRecognition';
import { MotionPattern, calculateSimilarity } from '../lib/motionPattern';
import {
  fetchMotionPatterns,
  createMotionPattern,
  deleteMotionPattern,
} from '../lib/api/motionPatterns';
import { AudioEngine } from '../lib/audio';
import { Note } from '../lib/musicalNotes';
import { mapMotionToSound } from '../lib/soundMapping';

export interface UseMotionPatternConfig {
  threshold?: number;
  checkInterval?: number;
  maxSamples?: number;
  sampleInterval?: number;
}

export interface UseMotionPatternReturn {
  patterns: MotionPattern[];
  isRecording: boolean;
  recordingSamples: MotionData[];
  matchedPattern: MotionPattern | null;
  startRecording: (name: string, baseNote?: Note) => void;
  stopRecording: (audioUrl?: string) => Promise<MotionPattern | null>;
  deletePatternById: (id: string) => Promise<void>;
  loadPatterns: () => Promise<void>;
}

export const useMotionPattern = (
  motionData: MotionData | null,
  audioEngine: AudioEngine | null,
  config: UseMotionPatternConfig = {}
): UseMotionPatternReturn => {
  const { 
    threshold = 0.3, 
    checkInterval = 100,
    maxSamples = 30,
    sampleInterval = 500
  } = config;

  const [patterns, setPatterns] = useState<MotionPattern[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSamples, setRecordingSamples] = useState<MotionData[]>([]);
  const [matchedPattern, setMatchedPattern] = useState<MotionPattern | null>(null);

  const recordingNameRef = useRef<string>('');
  const recordingBaseNoteRef = useRef<Note | undefined>(undefined);
  const lastCheckTimeRef = useRef<number>(0);
  const lastSampleTimeRef = useRef<number>(0);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previousMotionDataRef = useRef<MotionData | null>(null);
  const currentOscillatorsRef = useRef<Map<string, { oscillator: OscillatorNode; gainNode: GainNode }>>(new Map());
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  const loadPatterns = useCallback(async () => {
    try {
      const saved = await fetchMotionPatterns();
      setPatterns(saved);
    } catch (error) {
      console.error('모션 패턴 불러오기 실패:', error);
      setPatterns([]);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  useEffect(() => {
    const preloadAudioFiles = async () => {
      if (!audioEngine) return;

      const audioContext = audioEngine.getAudioContext();
      if (!audioContext) return;

      for (const pattern of patterns) {
        if (pattern.audioUrl && !audioBufferCacheRef.current.has(pattern.audioUrl)) {
          try {
            const response = await fetch(pattern.audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBufferCacheRef.current.set(pattern.audioUrl, audioBuffer);
          } catch (error) {
            console.error(`오디오 파일 프리로드 실패 (${pattern.name}):`, error);
          }
        }
      }
    };

    if (patterns.length > 0 && audioEngine) {
      preloadAudioFiles();
    }
  }, [patterns, audioEngine]);

  const startRecording = useCallback((name: string, baseNote?: Note) => {
    recordingNameRef.current = name;
    recordingBaseNoteRef.current = baseNote;
    setIsRecording(true);
    setRecordingSamples([]);
    lastSampleTimeRef.current = 0;
  }, []);

  const stopRecording = useCallback(
    async (audioUrl?: string): Promise<MotionPattern | null> => {
      if (recordingSamples.length === 0) {
        setIsRecording(false);
        return null;
      }

      try {
        const created = await createMotionPattern({
          name: recordingNameRef.current || `모션 ${Date.now()}`,
          samples: [...recordingSamples],
          audioUrl,
          baseNote: recordingBaseNoteRef.current,
        });

        await loadPatterns();
        return created;
      } catch (error) {
        console.error('모션 패턴 저장 실패:', error);
        return null;
      } finally {
        setIsRecording(false);
        setRecordingSamples([]);
        recordingNameRef.current = '';
        recordingBaseNoteRef.current = undefined;
      }
    },
    [recordingSamples, loadPatterns]
  );

  const deletePatternById = useCallback(
    async (id: string) => {
      try {
        await deleteMotionPattern(id);
        await loadPatterns();
      } catch (error) {
        console.error('모션 패턴 삭제 실패:', error);
      }
    },
    [loadPatterns]
  );

  useEffect(() => {
    if (isRecording && motionData) {
      const now = Date.now();
      // 샘플링 간격 체크 및 최대 샘플 수 제한
      if (now - lastSampleTimeRef.current >= sampleInterval) {
        setRecordingSamples((prev) => {
          // 최대 샘플 수에 도달하면 오래된 샘플 제거 (FIFO)
          if (prev.length >= maxSamples) {
            return [...prev.slice(1), motionData];
          }
          return [...prev, motionData];
        });
        lastSampleTimeRef.current = now;
      }
    }
  }, [isRecording, motionData, sampleInterval, maxSamples]);

  useEffect(() => {
    if (!motionData || patterns.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastCheckTimeRef.current < checkInterval) {
      return;
    }
    lastCheckTimeRef.current = now;

    let bestMatch: MotionPattern | null = null;
    let bestSimilarity = 0;

    for (const pattern of patterns) {
      const similarity = calculateSimilarity(pattern, motionData, threshold);
      if (similarity > 0 && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = pattern;
      }
    }

    if (bestMatch && bestMatch !== matchedPattern) {
      if (currentAudioSourceRef.current && audioEngine) {
        audioEngine.stopAudioFile(currentAudioSourceRef.current);
        currentAudioSourceRef.current = null;
      }
      
      currentOscillatorsRef.current.forEach(({ oscillator }) => {
        try {
          oscillator.stop();
        } catch (error) {
        }
      });
      currentOscillatorsRef.current.clear();
      previousMotionDataRef.current = null;

      setMatchedPattern(bestMatch);

      if (bestMatch.audioUrl && audioEngine) {
        const audioContext = audioEngine.getAudioContext();
        if (audioContext) {
          const cachedBuffer = audioBufferCacheRef.current.get(bestMatch.audioUrl);
          if (cachedBuffer) {
            try {
              const source = audioContext.createBufferSource();
              const gainNode = audioContext.createGain();

              source.buffer = cachedBuffer;
              gainNode.gain.value = 0.5;

              source.connect(gainNode);
              gainNode.connect(audioContext.destination);

              source.start(0);
              currentAudioSourceRef.current = source;
            } catch (error) {
              console.error('오디오 재생 실패:', error);
            }
          } else {
            audioEngine
              .playAudioFile(bestMatch.audioUrl, 0.5)
              .then((source) => {
                currentAudioSourceRef.current = source;
              })
              .catch((error) => {
                console.error('오디오 재생 실패:', error);
              });
          }
        }
      }
    }

    const activePattern = bestMatch || matchedPattern;
    if (activePattern && activePattern.baseNote && audioEngine && motionData) {
      const soundParams = mapMotionToSound(
        motionData,
        previousMotionDataRef.current,
        {
          baseNote: activePattern.baseNote,
          minVolume: 0.1,
          maxVolume: 0.5,
        }
      );

      if (soundParams.leftHand) {
        const existing = currentOscillatorsRef.current.get('leftHand');
        if (existing) {
          existing.oscillator.frequency.value = soundParams.leftHand.frequency;
          existing.gainNode.gain.value = soundParams.leftHand.volume;
        } else {
          const audioContext = audioEngine.getAudioContext();
          if (!audioContext) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = soundParams.leftHand.type;
          oscillator.frequency.value = soundParams.leftHand.frequency;
          gainNode.gain.value = soundParams.leftHand.volume;

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start();
          currentOscillatorsRef.current.set('leftHand', { oscillator, gainNode });
        }
      } else {
        const existing = currentOscillatorsRef.current.get('leftHand');
        if (existing) {
          try {
            existing.oscillator.stop();
          } catch (error) {
          }
          currentOscillatorsRef.current.delete('leftHand');
        }
      }

      if (soundParams.rightHand) {
        const existing = currentOscillatorsRef.current.get('rightHand');
        if (existing) {
          existing.oscillator.frequency.value = soundParams.rightHand.frequency;
          existing.gainNode.gain.value = soundParams.rightHand.volume;
        } else {
          const audioContext = audioEngine.getAudioContext();
          if (!audioContext) return;

          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = soundParams.rightHand.type;
          oscillator.frequency.value = soundParams.rightHand.frequency;
          gainNode.gain.value = soundParams.rightHand.volume;

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.start();
          currentOscillatorsRef.current.set('rightHand', { oscillator, gainNode });
        }
      } else {
        const existing = currentOscillatorsRef.current.get('rightHand');
        if (existing) {
          try {
            existing.oscillator.stop();
          } catch (error) {
          }
          currentOscillatorsRef.current.delete('rightHand');
        }
      }

      previousMotionDataRef.current = motionData;
    }
  }, [motionData, patterns, threshold, checkInterval, matchedPattern, audioEngine]);

  return {
    patterns,
    isRecording,
    recordingSamples,
    matchedPattern,
    startRecording,
    stopRecording,
    deletePatternById,
    loadPatterns,
  };
};

