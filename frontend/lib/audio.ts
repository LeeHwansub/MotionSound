export interface AudioConfig {
  sampleRate?: number;
  maxVolume?: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private oscillators: Map<string, OscillatorNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private masterGainNode: GainNode | null = null;
  private config: Required<AudioConfig>;

  constructor(config: AudioConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate || 44100,
      maxVolume: config.maxVolume || 0.5,
      minFrequency: config.minFrequency || 200,
      maxFrequency: config.maxFrequency || 2000,
    };
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('AudioEngine는 브라우저 환경에서만 사용할 수 있습니다.');
    }

    if (this.audioContext) {
      return;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.audioDestination = this.audioContext.createMediaStreamDestination();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioDestination);
      this.masterGainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('AudioContext 초기화 실패:', error);
      throw new Error('오디오 컨텍스트를 초기화할 수 없습니다.');
    }
  }

  playTone(
    id: string,
    frequency: number,
    volume: number = 0.3,
    type: OscillatorType = 'sine'
  ): void {
    if (!this.audioContext) {
      console.error('AudioContext가 초기화되지 않았습니다.');
      return;
    }

    this.stopTone(id);

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = Math.max(
      this.config.minFrequency,
      Math.min(this.config.maxFrequency, frequency)
    );

    gainNode.gain.value = Math.max(0, Math.min(this.config.maxVolume, volume));

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode || this.audioContext.destination);

    oscillator.start();

    this.oscillators.set(id, oscillator);
    this.gainNodes.set(id, gainNode);
  }

  updateFrequency(id: string, frequency: number): void {
    const oscillator = this.oscillators.get(id);
    if (oscillator) {
      oscillator.frequency.value = Math.max(
        this.config.minFrequency,
        Math.min(this.config.maxFrequency, frequency)
      );
    }
  }

  updateVolume(id: string, volume: number): void {
    const gainNode = this.gainNodes.get(id);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(this.config.maxVolume, volume));
    }
  }

  stopTone(id: string): void {
    const oscillator = this.oscillators.get(id);
    if (oscillator) {
      try {
        oscillator.stop();
      } catch (error) {
      }
      this.oscillators.delete(id);
    }

    const gainNode = this.gainNodes.get(id);
    if (gainNode) {
      this.gainNodes.delete(id);
    }
  }

  stopAll(): void {
    this.oscillators.forEach((_, id) => {
      this.stopTone(id);
    });
  }

  dispose(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  async playAudioFile(url: string, volume: number = 0.5): Promise<AudioBufferSourceNode> {
    if (!this.audioContext) {
      throw new Error('AudioContext가 초기화되지 않았습니다.');
    }

    try {
      const { getProxiedMediaUrl } = await import('./api/videos');
      const proxiedUrl = getProxiedMediaUrl(url);
      
      console.log('오디오 파일 재생 시도:', { originalUrl: url, proxiedUrl });
      
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = Math.max(0, Math.min(this.config.maxVolume, volume));

      source.connect(gainNode);
      gainNode.connect(this.masterGainNode || this.audioContext.destination);

      source.start(0);

      return source;
    } catch (error) {
      console.error('오디오 파일 재생 실패:', error);
      if (error instanceof Error) {
        throw new Error(`오디오 파일을 재생할 수 없습니다: ${error.message}`);
      }
      throw new Error('오디오 파일을 재생할 수 없습니다.');
    }
  }

  stopAudioFile(source: AudioBufferSourceNode): void {
    try {
      source.stop();
    } catch (error) {
    }
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getAudioStream(): MediaStream | null {
    return this.audioDestination?.stream || null;
  }

  getMasterGainNode(): GainNode | null {
    return this.masterGainNode;
  }
}