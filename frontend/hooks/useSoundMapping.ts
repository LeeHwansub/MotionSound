import { useEffect, useRef, useCallback, useState } from 'react';
import { MotionData } from './useMotionRecognition';
import { AudioEngine, AudioConfig } from '../lib/audio';
import { mapMotionToSound, MotionToSoundConfig, SoundParams } from '../lib/soundMapping';
import { Note, DEFAULT_NOTE } from '../lib/musicalNotes';

export interface UseSoundMappingConfig extends AudioConfig, MotionToSoundConfig {
  enabled?: boolean;
  baseNote?: Note;
}

export interface UseSoundMappingReturn {
  isInitialized: boolean;
  initialize: () => Promise<void>;
  updateMotion: (motionData: MotionData) => void;
  stop: () => void;
}

export const useSoundMapping = (
  config: UseSoundMappingConfig = {}
): UseSoundMappingReturn => {
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const previousMotionDataRef = useRef<MotionData | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const enabledRef = useRef<boolean>(config.enabled !== false);

  const initialize = useCallback(async () => {
    if (isInitialized) {
      return;
    }

    try {
      const audioEngine = new AudioEngine({
        sampleRate: config.sampleRate,
        maxVolume: config.maxVolume,
        minFrequency: config.minFrequency,
        maxFrequency: config.maxFrequency,
      });

      await audioEngine.initialize();
      audioEngineRef.current = audioEngine;
      setIsInitialized(true);
    } catch (error) {
      console.error('사운드 매핑 초기화 실패:', error);
      throw error;
    }
  }, [
    isInitialized,
    config.sampleRate,
    config.maxVolume,
    config.minFrequency,
    config.maxFrequency,
  ]);

  const updateMotion = useCallback(
    (motionData: MotionData) => {
      if (!enabledRef.current || !audioEngineRef.current || !isInitialized) {
        return;
      }

      const soundParams = mapMotionToSound(
        motionData,
        previousMotionDataRef.current,
        {
          baseNote: config.baseNote || DEFAULT_NOTE,
          minVolume: config.minVolume,
          maxVolume: config.maxVolume,
          yAxisRange: config.yAxisRange,
        }
      );

      if (soundParams.leftHand) {
        audioEngineRef.current.playTone(
          'leftHand',
          soundParams.leftHand.frequency,
          soundParams.leftHand.volume,
          soundParams.leftHand.type
        );
      } else {
        audioEngineRef.current.stopTone('leftHand');
      }

      if (soundParams.rightHand) {
        audioEngineRef.current.playTone(
          'rightHand',
          soundParams.rightHand.frequency,
          soundParams.rightHand.volume,
          soundParams.rightHand.type
        );
      } else {
        audioEngineRef.current.stopTone('rightHand');
      }

      previousMotionDataRef.current = motionData;
    },
    [
      isInitialized,
      config.baseNote,
      config.minVolume,
      config.maxVolume,
      config.yAxisRange,
    ]
  );

  const stop = useCallback(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stopAll();
    }
    previousMotionDataRef.current = null;
  }, []);

  useEffect(() => {
    enabledRef.current = config.enabled !== false;
  }, [config.enabled]);

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
    };
  }, []);

  return {
    isInitialized,
    initialize,
    updateMotion,
    stop,
  };
};

