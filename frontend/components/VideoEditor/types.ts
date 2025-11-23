export interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  videoBlob?: Blob | null;
  videoUrl: string;
  thumbnail?: string;
}

export interface AudioTrack {
  id: string;
  clips: AudioClip[];
  volume: number;
  muted: boolean;
}

export interface AudioClip {
  id: string;
  startTime: number;
  endTime: number;
  audioBlob: Blob;
  audioUrl: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TimelineState {
  videoClips: VideoClip[];
  audioTracks: AudioTrack[];
  duration: number;
  currentTime: number;
  zoom: number;
}

