import { useState, useRef, useEffect } from 'react';
import { VideoClip, AudioTrack, TimelineState, AudioClip } from './types';

interface VideoEditorProps {
  initialVideoBlob?: Blob;
  initialVideoUrl?: string;
  onExport: (blob: Blob) => void;
  onCancel: () => void;
}

export default function VideoEditor({
  initialVideoBlob,
  initialVideoUrl,
  onExport,
  onCancel,
}: VideoEditorProps) {
  const [timeline, setTimeline] = useState<TimelineState>({
    videoClips: [],
    audioTracks: [],
    duration: 0,
    currentTime: 0,
    zoom: 1,
  });

  const [isRendering, setIsRendering] = useState(false);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [videoSourceUrl, setVideoSourceUrl] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const createdBlobUrlRef = useRef<string | null>(null);
  
  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (createdBlobUrlRef.current) {
        URL.revokeObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // 이전 blob URL 정리
    if (createdBlobUrlRef.current) {
      URL.revokeObjectURL(createdBlobUrlRef.current);
      createdBlobUrlRef.current = null;
    }

    if (initialVideoBlob) {
      const createdUrl = URL.createObjectURL(initialVideoBlob);
      createdBlobUrlRef.current = createdUrl;
      setVideoSourceUrl(createdUrl);
    } else if (initialVideoUrl) {
      setVideoSourceUrl(initialVideoUrl);
    } else {
      setVideoSourceUrl(null);
    }
  }, [initialVideoBlob, initialVideoUrl]);

  useEffect(() => {
    if (!videoSourceUrl) {
      return;
    }

    if (previewVideoRef.current) {
      previewVideoRef.current.src = videoSourceUrl;
      previewVideoRef.current.load();
    }

    const video = document.createElement('video');
    video.src = videoSourceUrl;
    const handleLoadedMetadata = () => {
      const duration = video.duration * 1000;
      const clip: VideoClip = {
        id: `clip-${Date.now()}`,
        startTime: 0,
        endTime: duration,
        sourceStart: 0,
        sourceEnd: duration,
        videoBlob: initialVideoBlob || null,
        videoUrl: videoSourceUrl,
      };
      setTimeline((prev) => ({
        ...prev,
        videoClips: [clip],
        duration,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', () => {
      console.error('영상 로드 실패:', videoSourceUrl);
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoSourceUrl, initialVideoBlob]);

  const handleSplitClip = (clipId: string, splitTime: number) => {
    setTimeline((prev) => {
      const clipIndex = prev.videoClips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return prev;

      const clip = prev.videoClips[clipIndex];
      const relativeTime = splitTime - clip.startTime;

      const firstClip: VideoClip = {
        ...clip,
        endTime: splitTime,
        sourceEnd: clip.sourceStart + relativeTime,
      };

      const secondClip: VideoClip = {
        ...clip,
        id: `clip-${Date.now()}`,
        startTime: splitTime,
        sourceStart: clip.sourceStart + relativeTime,
      };

      const newClips = [...prev.videoClips];
      newClips.splice(clipIndex, 1, firstClip, secondClip);

      return {
        ...prev,
        videoClips: newClips,
      };
    });
  };

  const handleDeleteClip = (clipId: string) => {
    setTimeline((prev) => ({
      ...prev,
      videoClips: prev.videoClips.filter((c) => c.id !== clipId),
    }));
  };

  const handleAddAudioTrack = () => {
    setShowAddAudio(true);
    audioFileInputRef.current?.click();
  };

  const handleAudioFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    const audio = new Audio(audioUrl);
    
    await new Promise((resolve) => {
      audio.onloadedmetadata = () => {
        const duration = audio.duration * 1000;
        const audioClip: AudioClip = {
          id: `audio-${Date.now()}`,
          startTime: 0,
          endTime: duration,
          audioBlob: file,
          audioUrl,
          volume: 1,
        };

        const newTrack: AudioTrack = {
          id: `track-${Date.now()}`,
          clips: [audioClip],
          volume: 1,
          muted: false,
        };

        setTimeline((prev) => ({
          ...prev,
          audioTracks: [...prev.audioTracks, newTrack],
          duration: Math.max(prev.duration, duration),
        }));

        setShowAddAudio(false);
        resolve(null);
      };
    });
  };

  const handleUpdateAudioVolume = (trackId: string, volume: number) => {
    setTimeline((prev) => ({
      ...prev,
      audioTracks: prev.audioTracks.map((track) =>
        track.id === trackId ? { ...track, volume } : track
      ),
    }));
  };

  const handleDeleteAudioTrack = (trackId: string) => {
    setTimeline((prev) => ({
      ...prev,
      audioTracks: prev.audioTracks.filter((t) => t.id !== trackId),
    }));
  };

  const handleRender = async () => {
    if (timeline.videoClips.length === 0) {
      alert('편집할 영상이 없습니다.');
      return;
    }

    setIsRendering(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsRendering(false);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsRendering(false);
        return;
      }

      canvas.width = 1920;
      canvas.height = 1080;
      const stream = (canvas as any).captureStream?.(30) || new MediaStream();
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      const videoChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunks.push(e.data);
      };

      return new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(videoChunks, { type: 'video/webm' });
          onExport(blob);
          setIsRendering(false);
          resolve();
        };

        recorder.onerror = (error) => {
          console.error('렌더링 실패:', error);
          setIsRendering(false);
          reject(error);
        };

        (async () => {
          try {
            recorder.start();
            await renderTimeline(canvas, ctx, timeline);
            // 렌더링이 완료될 때까지 기다린 후 recorder 중지
            await new Promise((resolve) => setTimeout(resolve, 100));
            recorder.stop();
          } catch (error) {
            console.error('렌더링 중 오류:', error);
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            reject(error);
          } finally {
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            // 렌더링 완료 후 blob URL 정리 (필요한 경우)
            setIsRendering(false);
          }
        })();
      });
    } catch (error) {
      console.error('렌더링 실패:', error);
      alert('영상 렌더링에 실패했습니다.');
      setIsRendering(false);
    }
  };

  const renderTimeline = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    state: TimelineState,
  ) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const clip of state.videoClips) {
      await renderClip(canvas, ctx, clip);
    }
  };

  const renderClip = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    clip: VideoClip,
  ) => {
    // clip.videoUrl이 유효한지 확인
    if (!clip.videoUrl || clip.videoUrl === '') {
      console.error('클립에 유효한 videoUrl이 없습니다:', clip);
      return;
    }

    const video = document.createElement('video');
    video.src = clip.videoUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    try {
      await waitForVideoEvent(video, 'loadedmetadata');
    } catch (error) {
      console.error('비디오 메타데이터 로드 실패:', error, clip.videoUrl);
      throw error;
    }

    const fps = 30;
    const frameDuration = 1000 / fps;
    const totalFrames = Math.floor(((clip.endTime - clip.startTime) / 1000) * fps);
    const startTimeSec = clip.sourceStart / 1000;
    const endTimeSec = clip.sourceEnd / 1000;

    for (let frame = 0; frame < totalFrames; frame++) {
      const targetTime = startTimeSec + (frame / fps);
      if (targetTime >= endTimeSec || targetTime >= video.duration) {
        break;
      }

      await seekVideo(video, targetTime);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      await sleep(frameDuration);
    }
  };

  const waitForVideoEvent = (video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked') => {
    return new Promise<void>((resolve, reject) => {
      const onEvent = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('비디오 로드 중 오류가 발생했습니다.'));
      };
      const cleanup = () => {
        video.removeEventListener(event, onEvent);
        video.removeEventListener('error', onError);
      };

      video.addEventListener(event, onEvent, { once: true });
      video.addEventListener('error', onError, { once: true });
    });
  };

  const seekVideo = async (video: HTMLVideoElement, time: number) => {
    if (Number.isNaN(time) || time < 0) {
      return;
    }
    if (video.duration && time > video.duration) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('비디오 탐색 중 오류가 발생했습니다.'));
      };
      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });

      const safeTime =
        video.duration && time > video.duration
          ? Math.max(video.duration - 0.05, 0)
          : time;
      video.currentTime = safeTime;
    });
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1f2937',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'white', margin: 0 }}>영상 편집기</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                backgroundColor: '#374151',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={handleRender}
              disabled={isRendering || timeline.videoClips.length === 0}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isRendering ? '#6b7280' : '#3b82f6',
                color: 'white',
                cursor: isRendering ? 'not-allowed' : 'pointer',
              }}
            >
              {isRendering ? '렌더링 중...' : '내보내기'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', backgroundColor: '#111827' }}>
          {timeline.videoClips.length > 0 ? (
            <video
              ref={previewVideoRef}
              controls
              style={{
                width: '100%',
                maxHeight: '400px',
                backgroundColor: '#000',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
              }}
            >
              영상을 불러오는 중...
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <TimelineView
            timeline={timeline}
            onSplitClip={handleSplitClip}
            onDeleteClip={handleDeleteClip}
            onAddAudio={handleAddAudioTrack}
            onUpdateAudioVolume={handleUpdateAudioVolume}
            onDeleteAudioTrack={handleDeleteAudioTrack}
            onTimeUpdate={(time) => {
              setTimeline((prev) => ({ ...prev, currentTime: time }));
              if (previewVideoRef.current) {
                previewVideoRef.current.currentTime = time / 1000;
              }
            }}
          />
        </div>

        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleAudioFileSelect}
        />
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

interface TimelineViewProps {
  timeline: TimelineState;
  onSplitClip: (clipId: string, time: number) => void;
  onDeleteClip: (clipId: string) => void;
  onAddAudio: () => void;
  onUpdateAudioVolume: (trackId: string, volume: number) => void;
  onDeleteAudioTrack: (trackId: string) => void;
  onTimeUpdate: (time: number) => void;
}

function TimelineView({
  timeline,
  onSplitClip,
  onDeleteClip,
  onAddAudio,
  onUpdateAudioVolume,
  onDeleteAudioTrack,
  onTimeUpdate,
}: TimelineViewProps) {
  return (
    <div style={{ color: 'white' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>비디오 트랙</h3>
        </div>
        <div
          style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '1rem',
            minHeight: '100px',
            position: 'relative',
          }}
        >
          {timeline.videoClips.map((clip) => (
            <VideoClipView
              key={clip.id}
              clip={clip}
              duration={timeline.duration}
              onSplit={(time) => onSplitClip(clip.id, time)}
              onDelete={() => onDeleteClip(clip.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>오디오 트랙</h3>
          <button
            onClick={onAddAudio}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            오디오 추가
          </button>
        </div>
        {timeline.audioTracks.map((track) => (
          <AudioTrackView
            key={track.id}
            track={track}
            duration={timeline.duration}
            onVolumeChange={(volume) => onUpdateAudioVolume(track.id, volume)}
            onDelete={() => onDeleteAudioTrack(track.id)}
          />
        ))}
        {timeline.audioTracks.length === 0 && (
          <div
            style={{
              backgroundColor: '#374151',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              color: '#9ca3af',
            }}
          >
            오디오 트랙이 없습니다. "오디오 추가" 버튼을 클릭하여 추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoClipViewProps {
  clip: VideoClip;
  duration: number;
  onSplit: (time: number) => void;
  onDelete: () => void;
}

function VideoClipView({ clip, duration, onSplit, onDelete }: VideoClipViewProps) {
  const widthPercent = ((clip.endTime - clip.startTime) / duration) * 100;
  const leftPercent = (clip.startTime / duration) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: '80px',
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        border: '2px solid #60a5fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'move',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSplit(clip.startTime + (clip.endTime - clip.startTime) / 2);
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          분할
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

interface AudioTrackViewProps {
  track: AudioTrack;
  duration: number;
  onVolumeChange: (volume: number) => void;
  onDelete: () => void;
}

function AudioTrackView({ track, duration, onVolumeChange, onDelete }: AudioTrackViewProps) {
  return (
    <div
      style={{
        backgroundColor: '#374151',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        minHeight: '80px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
            볼륨: {Math.round(track.volume * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            style={{ width: '150px' }}
          />
        </div>
        <button
          onClick={onDelete}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          삭제
        </button>
      </div>
      {track.clips.map((clip) => {
        const widthPercent = ((clip.endTime - clip.startTime) / duration) * 100;
        const leftPercent = (clip.startTime / duration) * 100;
        return (
          <div
            key={clip.id}
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: '40px',
              backgroundColor: '#10b981',
              borderRadius: '4px',
              border: '1px solid #34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
            }}
          >
            오디오
          </div>
        );
      })}
    </div>
  );
}

