import Head from 'next/head';
import { useEffect, useState, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/router';
import { createPost } from '../../lib/api/posts';
import { uploadVideo } from '../../lib/api/videos';
import { useAuth } from '../../contexts/AuthContext';

interface PendingPostData {
  title?: string;
  content?: string;
  videoUrl?: string;
  videoKey?: string;
  videoSize?: number;
  videoDurationMs?: number;
}

type MotionVideoWindow = typeof window & {
  motionVideoDraft?: Blob;
  motionVideoDraftUrl?: string | null;
  motionVideoDraftDuration?: number | null;
};

export default function CommunityNewPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoKey, setVideoKey] = useState('');
  const [videoSize, setVideoSize] = useState<number | null>(null);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [prefillAvailable, setPrefillAvailable] = useState(false);
  const ownedPreviewUrlRef = useRef<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const originalVideoBlobRef = useRef<Blob | null>(null);

  const releaseGlobalDraft = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const globalWindow = window as MotionVideoWindow;
    if (globalWindow.motionVideoDraftUrl && globalWindow.motionVideoDraftUrl.startsWith('blob:')) {
      URL.revokeObjectURL(globalWindow.motionVideoDraftUrl);
    }
    delete globalWindow.motionVideoDraft;
    delete globalWindow.motionVideoDraftUrl;
    delete globalWindow.motionVideoDraftDuration;
  };

  const clearOwnedPreviewUrl = () => {
    if (ownedPreviewUrlRef.current) {
      URL.revokeObjectURL(ownedPreviewUrlRef.current);
      ownedPreviewUrlRef.current = null;
    }
  };

  const updatePreviewUrl = (url: string, owned: boolean) => {
    if (owned) {
      clearOwnedPreviewUrl();
      ownedPreviewUrlRef.current = url;
    } else {
      clearOwnedPreviewUrl();
    }
    setVideoPreviewUrl(url);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = sessionStorage.getItem('pendingCommunityPost');
    if (!saved) {
      return;
    }
    try {
      const data: PendingPostData = JSON.parse(saved);
      setTitle(data.title || '');
      setContent(data.content || '');
      const sessionVideoUrl = data.videoUrl || '';
      setVideoUrl(sessionVideoUrl);
      setVideoKey(data.videoKey || '');
      setVideoSize(
        typeof data.videoSize === 'number' ? data.videoSize : null,
      );
      setVideoDurationMs(
        typeof data.videoDurationMs === 'number' ? data.videoDurationMs : null,
      );
      if (sessionVideoUrl) {
        updatePreviewUrl(sessionVideoUrl, false);
      }
      setPrefillAvailable(true);
    } catch (error) {
      console.error('임시 데이터 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const globalWindow = window as MotionVideoWindow;
    if (globalWindow.motionVideoDraft) {
      const blob = globalWindow.motionVideoDraft;
      setVideoBlob(blob);
      setVideoSize(blob.size);

      const existingUrl = globalWindow.motionVideoDraftUrl;
      if (existingUrl) {
        updatePreviewUrl(existingUrl, false);
      } else {
        const generatedUrl = URL.createObjectURL(blob);
        updatePreviewUrl(generatedUrl, true);
      }

      if (typeof globalWindow.motionVideoDraftDuration === 'number') {
        setVideoDurationMs(globalWindow.motionVideoDraftDuration);
        setTrimEnd(globalWindow.motionVideoDraftDuration);
      }

      setPrefillAvailable(true);
    }

    return () => {
      clearOwnedPreviewUrl();
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !videoPreviewUrl) {
      return;
    }

    const video = videoRef.current;
    let isDurationLoaded = false;

    const checkDuration = () => {
      const duration = video.duration;
      if (isFinite(duration) && !isNaN(duration) && duration > 0 && !isDurationLoaded) {
        isDurationLoaded = true;
        const durationMs = Math.round(duration * 1000);
        setVideoDurationMs(durationMs);
        setTrimEnd(durationMs);
      }
    };

    const handleLoadedMetadata = () => {
      checkDuration();
    };

    const handleLoadedData = () => {
      checkDuration();
    };

    const handleDurationChange = () => {
      checkDuration();
    };

    const handleCanPlay = () => {
      if (video.readyState >= 2) {
        checkDuration();
      }
    };

    video.load();
    video.currentTime = 0.1;
    
    const timeoutIds = [
      setTimeout(() => {
        if (video.readyState >= 1) {
          checkDuration();
        }
      }, 100),
      setTimeout(() => {
        if (video.readyState >= 1 && !isDurationLoaded) {
          checkDuration();
        }
      }, 500),
      setTimeout(() => {
        if (video.readyState >= 1 && !isDurationLoaded) {
          const wasPlaying = !video.paused;
          if (!wasPlaying) {
            video.play().then(() => {
              video.pause();
              checkDuration();
            }).catch(() => {
              checkDuration();
            });
          } else {
            checkDuration();
          }
        }
      }, 1000),
    ];

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoPreviewUrl]);

  const clearPrefill = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingCommunityPost');
    }
    releaseGlobalDraft();
    setTitle('');
    setContent('');
    setVideoBlob(null);
    setVideoUrl('');
    setVideoKey('');
    setVideoSize(null);
    setVideoDurationMs(null);
    updatePreviewUrl('', false);
    setPrefillAvailable(false);
  };

  const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setVideoBlob(file);
    originalVideoBlobRef.current = file;
    setVideoSize(file.size);
    setVideoDurationMs(null);
    setVideoUrl('');
    setVideoKey('');
    setIsEditing(false);
    setTrimStart(0);
    setTrimEnd(0);

    const objectUrl = URL.createObjectURL(file);
    updatePreviewUrl(objectUrl, true);
      };

  const handleClearVideo = () => {
    setVideoBlob(null);
    originalVideoBlobRef.current = null;
    setVideoUrl('');
    setVideoKey('');
    setVideoSize(null);
    setVideoDurationMs(null);
    updatePreviewUrl('', false);
    setIsEditing(false);
    setTrimStart(0);
    setTrimEnd(0);

    releaseGlobalDraft();
  };

  const handleStartEditing = () => {
    if (!videoBlob || !videoDurationMs) return;
    setIsEditing(true);
    setTrimStart(0);
    setTrimEnd(videoDurationMs);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setTrimStart(0);
    if (videoDurationMs) {
      setTrimEnd(videoDurationMs);
    }
  };

  const handleTrimVideo = async () => {
    if (!videoBlob || !videoDurationMs || !videoRef.current) {
      return;
    }

    if (trimStart >= trimEnd) {
      alert('시작 시간은 끝 시간보다 작아야 합니다.');
      return;
    }

    try {
      setIsTrimming(true);
      const video = videoRef.current;
      const startTime = trimStart / 1000;
      const endTime = trimEnd / 1000;
      const duration = endTime - startTime;

      video.currentTime = startTime;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      const stream = (video as any).captureStream?.() || new MediaStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
          setVideoBlob(trimmedBlob);
          setVideoSize(trimmedBlob.size);
          setVideoDurationMs(Math.round(duration * 1000));
          
          const newUrl = URL.createObjectURL(trimmedBlob);
          updatePreviewUrl(newUrl, true);
          
          setIsEditing(false);
          setIsTrimming(false);
          resolve();
        };

        mediaRecorder.onerror = (error) => {
          console.error('영상 자르기 실패:', error);
          alert('영상 자르기에 실패했습니다.');
          setIsTrimming(false);
          reject(error);
        };

        video.play();
        mediaRecorder.start();

        setTimeout(() => {
          video.pause();
          mediaRecorder.stop();
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }, duration * 1000);
      });
    } catch (error) {
      console.error('영상 자르기 실패:', error);
      alert('영상 자르기에 실패했습니다.');
      setIsTrimming(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      if (confirm('로그인이 필요합니다. 로그인하시겠습니까?')) {
        login();
      } else {
        router.push('/community');
      }
    }
  }, [authLoading, isAuthenticated, login, router]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      if (confirm('로그인이 필요합니다. 로그인하시겠습니까?')) {
        login();
      }
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      let finalVideoUrl = videoUrl.trim();
      let finalVideoKey = videoKey.trim();
      let finalVideoSize = videoSize ?? undefined;
      let finalVideoDuration = videoDurationMs ?? undefined;

      if (videoBlob) {
        const uploadResult = await uploadVideo(videoBlob);
        finalVideoUrl = uploadResult.url;
        finalVideoKey = uploadResult.key;
        finalVideoSize = uploadResult.size;
      }

      await createPost({
        title: title.trim(),
        content: content.trim(),
        isPublic,
        videoUrl: finalVideoUrl || undefined,
        videoKey: finalVideoKey || undefined,
        videoSize: finalVideoSize,
        videoDurationMs: finalVideoDuration,
      });
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingCommunityPost');
      }
      releaseGlobalDraft();
      clearOwnedPreviewUrl();
      alert('커뮤니티에 게시물이 등록되었습니다.');
      router.push('/community');
    } catch (error) {
      console.error('게시물 등록 실패:', error);
      alert('게시물 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>커뮤니티 게시물 작성 - Motion Sound</title>
      </Head>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>커뮤니티 게시물 작성</h1>
            <p style={{ color: '#6b7280' }}>
              녹화 모달에서 넘어온 데이터로 미리 채워지며, 직접 작성도 가능합니다.
            </p>
          </div>
          <button
            onClick={() => router.push('/community')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            목록 보기
          </button>
        </div>

        {prefillAvailable && (
          <div
            style={{
              backgroundColor: '#ecfccb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <span style={{ color: '#3f6212' }}>
              녹화 모달에서 전달된 임시 데이터와 영상이 적용되었습니다.
            </span>
            <button
              onClick={clearPrefill}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#3f6212',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              초기화
            </button>
          </div>
        )}

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="게시물 제목을 입력하세요"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              내용
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="커뮤니티에 공유할 내용을 작성하세요"
              rows={6}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                작성자
              </label>
              <div
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#374151',
                  fontWeight: 500,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{user?.name || user?.email || '익명'}</span>
              </div>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                공개 설정
              </label>
              <select
                value={isPublic ? 'public' : 'private'}
                onChange={(event) => setIsPublic(event.target.value === 'public')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                }}
              >
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              영상 파일 업로드
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
            />
            {videoPreviewUrl ? (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                }}
              >
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  controls
                  preload="metadata"
                  muted
                  playsInline
                  style={{ width: '100%', borderRadius: '8px', backgroundColor: '#000' }}
                />
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  {videoSize && <span>용량: {(videoSize / (1024 * 1024)).toFixed(2)} MB</span>}
                  {videoDurationMs && <span>길이: {Math.round(videoDurationMs / 1000)}초</span>}
                  {videoBlob && <span>출처: 로컬 업로드</span>}
                </div>
                
                {!isEditing ? (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {videoDurationMs ? (
                      <button
                        onClick={handleStartEditing}
                        type="button"
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#10b981',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        간단 편집 (자르기)
                      </button>
                    ) : (
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        영상 정보를 불러오는 중...
                      </div>
                    )}
                    <button
                      onClick={handleClearVideo}
                      type="button"
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      영상 초기화
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
                          시작: {Math.round(trimStart / 1000)}초
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
                          끝: {Math.round(trimEnd / 1000)}초
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
                          길이: {Math.round((trimEnd - trimStart) / 1000)}초
                        </div>
                      </div>
                      
                      <div style={{ position: 'relative', width: '100%', height: '60px', marginBottom: '0.5rem' }}>
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '6px',
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                            transform: 'translateY(-50%)',
                          }}
                        />
                        
                        {videoDurationMs && videoDurationMs > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: `${(trimStart / videoDurationMs) * 100}%`,
                              width: `${((trimEnd - trimStart) / videoDurationMs) * 100}%`,
                              height: '6px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '3px',
                              transform: 'translateY(-50%)',
                            }}
                          />
                        )}
                        
                        <input
                          type="range"
                          min={0}
                          max={videoDurationMs || 0}
                          value={trimStart}
                          step={100}
                          onChange={(e) => {
                            const start = Number(e.target.value);
                            if (start < trimEnd && videoDurationMs) {
                              setTrimStart(start);
                              if (videoRef.current) {
                                videoRef.current.currentTime = start / 1000;
                              }
                            }
                          }}
                          onInput={(e) => {
                            const start = Number((e.target as HTMLInputElement).value);
                            if (start < trimEnd && videoDurationMs) {
                              setTrimStart(start);
                              if (videoRef.current) {
                                videoRef.current.currentTime = start / 1000;
                              }
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            width: videoDurationMs ? `${((trimStart + (trimEnd - trimStart) / 2) / videoDurationMs) * 100}%` : '50%',
                            height: '40px',
                            margin: 0,
                            padding: 0,
                            opacity: 0,
                            cursor: 'pointer',
                            transform: 'translateY(-50%)',
                            zIndex: 3,
                          }}
                        />
                        
                        <input
                          type="range"
                          min={0}
                          max={videoDurationMs || 0}
                          value={trimEnd}
                          step={100}
                          onChange={(e) => {
                            const end = Number(e.target.value);
                            if (end > trimStart && videoDurationMs) {
                              setTrimEnd(end);
                              if (videoRef.current) {
                                videoRef.current.currentTime = end / 1000;
                              }
                            }
                          }}
                          onInput={(e) => {
                            const end = Number((e.target as HTMLInputElement).value);
                            if (end > trimStart && videoDurationMs) {
                              setTrimEnd(end);
                              if (videoRef.current) {
                                videoRef.current.currentTime = end / 1000;
                              }
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: videoDurationMs ? `${((trimStart + (trimEnd - trimStart) / 2) / videoDurationMs) * 100}%` : '50%',
                            width: videoDurationMs ? `${((videoDurationMs - (trimStart + (trimEnd - trimStart) / 2)) / videoDurationMs) * 100}%` : '50%',
                            height: '40px',
                            margin: 0,
                            padding: 0,
                            opacity: 0,
                            cursor: 'pointer',
                            transform: 'translateY(-50%)',
                            zIndex: 3,
                          }}
                        />
                        
                        {videoDurationMs && videoDurationMs > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: `${(trimStart / videoDurationMs) * 100}%`,
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#3b82f6',
                              border: '2px solid white',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 4,
                            }}
                          />
                        )}
                        
                        {videoDurationMs && videoDurationMs > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: `${(trimEnd / videoDurationMs) * 100}%`,
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#3b82f6',
                              border: '2px solid white',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 4,
                            }}
                          />
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        <span>0초</span>
                        <span>{videoDurationMs ? `${Math.round(videoDurationMs / 1000)}초` : '0초'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleTrimVideo}
                        disabled={isTrimming || trimStart >= trimEnd}
                        type="button"
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isTrimming || trimStart >= trimEnd ? '#9ca3af' : '#10b981',
                          color: 'white',
                          cursor: isTrimming || trimStart >= trimEnd ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isTrimming ? '자르는 중...' : '적용'}
                      </button>
                      <button
                        onClick={handleCancelEditing}
                        disabled={isTrimming}
                        type="button"
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          cursor: isTrimming ? 'not-allowed' : 'pointer',
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                현재 연결된 영상이 없습니다. 녹화 모달에서 넘어온 영상이나 새 파일을 선택하면 미리보기로 확인할 수 있습니다.
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
            }}
          >
            <button
              onClick={() => router.push('/community')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              disabled={submitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: submitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '등록 중...' : '커뮤니티 등록'}
            </button>
          </div>
        </div>
      </div>

    </>
  );
}

