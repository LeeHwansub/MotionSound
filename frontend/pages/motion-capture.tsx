import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MotionCapture as MotionCaptureComponent } from '../components/MotionRecognition/MotionCapture';
import { MotionVisualizer } from '../components/MotionRecognition/MotionVisualizer';
import { MotionData } from '../hooks/useMotionRecognition';
import { useSoundMapping } from '../hooks/useSoundMapping';
import { useMotionPattern } from '../hooks/useMotionPattern';
import { Note, NOTE_NAMES, OCTAVE_RANGE, getNoteFrequency, DEFAULT_NOTE } from '../lib/musicalNotes';
import { AudioEngine } from '../lib/audio';
import { MotionPattern } from '../lib/motionPattern';
import { uploadAudio } from '../lib/api/videos';
import { Header } from '../components/Header/Header';
import { useToast } from '../contexts/ToastContext';

export default function MotionCapturePage() {
  const router = useRouter();
  const { showError, showSuccess, showWarning, showInfo, showConfirm } = useToast();
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [isMotionRecognitionActive, setIsMotionRecognitionActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note>(DEFAULT_NOTE);
  const [recordingName, setRecordingName] = useState('');
  const [recordingNote, setRecordingNote] = useState<Note | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [isSavingPattern, setIsSavingPattern] = useState(false);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [audioEngineInitialized, setAudioEngineInitialized] = useState(false);

  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoDuration, setRecordedVideoDuration] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoName, setVideoName] = useState('');
  const [isPreparingPost, setIsPreparingPost] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recordStartTimeRef = useRef<number | null>(null);
  
  const { isInitialized, initialize, updateMotion, stop } = useSoundMapping({
    enabled: soundEnabled,
    baseNote: selectedNote,
    minVolume: 0.1,
    maxVolume: 0.5,
        audioEngine: audioEngineRef.current,
  });

  const {
    patterns,
    isRecording,
    recordingSamples,
    matchedPattern,
    startRecording,
    stopRecording,
    deletePatternById,
    loadPatterns,
  } = useMotionPattern(motionData, audioEngineRef.current, {
    threshold: 0.3,
    checkInterval: 100,
    maxSamples: 30,
    sampleInterval: 500,
  });

  useEffect(() => {
    const initAudioEngine = async () => {
      try {
        const engine = new AudioEngine();
        await engine.initialize();
        audioEngineRef.current = engine;
        setAudioEngineInitialized(true);
        
        if (!isInitialized) {
          await initialize();
        }
      } catch (error) {
        console.error('AudioEngine 초기화 실패:', error);
      }
    };
    initAudioEngine();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (motionData && soundEnabled && isInitialized) {
      updateMotion(motionData);
    }
  }, [motionData, soundEnabled, isInitialized, updateMotion]);

  const [shouldStopMotion, setShouldStopMotion] = useState(false);
  
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url.startsWith('/community') && isMotionRecognitionActive) {
        setShouldStopMotion(true);
        setIsMotionRecognitionActive(false);
      } else if (!url.startsWith('/community')) {
        setShouldStopMotion(false);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, isMotionRecognitionActive]);

  const handleInitializeSound = async () => {
    try {
      await initialize();
      setSoundEnabled(true);
    } catch (error) {
      console.error('사운드 초기화 실패:', error);
      showError('사운드를 초기화할 수 없습니다. 브라우저가 오디오를 지원하는지 확인해주세요.');
    }
  };

  const handleStopSound = () => {
    stop();
    setSoundEnabled(false);
  };

  const handleStartRecording = () => {
    if (!recordingName.trim()) {
      showWarning('모션 패턴 이름을 입력해주세요.');
      return;
    }
    startRecording(recordingName, recordingNote || undefined);
  };

  const handleStopRecording = async () => {
    if (isSavingPattern) return; // 이미 저장 중이면 중복 실행 방지
    
    let finalAudioUrl: string | undefined;
    
    try {
      setIsSavingPattern(true);
      
      if (audioFile) {
        try {
          setIsAudioUploading(true);
          const result = await uploadAudio(audioFile);
          finalAudioUrl = result.url;
        } catch (error) {
          console.error('오디오 업로드 실패:', error);
          showError('오디오 업로드에 실패했습니다. 모션 패턴은 저장되지만 오디오는 포함되지 않습니다.');
        } finally {
          setIsAudioUploading(false);
        }
      }
      
      const pattern = await stopRecording(finalAudioUrl);
      if (pattern) {
        setRecordingName('');
        setRecordingNote(null);
        setAudioFileUrl('');
        setAudioFile(null);
        if (audioFileUrl && audioFileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioFileUrl);
        }
        showSuccess(`모션 패턴 "${pattern.name}"이 저장되었습니다.`);
      }
    } finally {
      setIsSavingPattern(false);
    }
  };

  const handleDeletePattern = async (id: string) => {
    const pattern = patterns.find((p) => p.id === id);
    const patternName = pattern?.name || '이 패턴';
    
    const confirmed = await showConfirm(
      `정말로 "${patternName}" 모션 패턴을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      () => {},
      () => {}
    );
    if (!confirmed) {
      return;
    }
    
    try {
      await deletePatternById(id);
    } catch (error) {
      console.error('모션 패턴 삭제 실패:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioFileUrl(localUrl);
      showInfo('오디오 파일이 선택되었습니다. 모션 캡처 후 저장 시 R2에 업로드됩니다.');
    }
  };

  const handleStartVideoRecording = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      const audioStream = audioEngineRef.current?.getAudioStream();
      
      if (!audioStream) {
        showError('오디오 엔진이 초기화되지 않았습니다. 사운드를 먼저 활성화해주세요.');
        videoStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const combinedStream = new MediaStream();
      videoStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });
      audioStream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      videoStreamRef.current = combinedStream;
      recordedChunksRef.current = [];
      recordStartTimeRef.current = Date.now();

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const duration = recordStartTimeRef.current
          ? Date.now() - recordStartTimeRef.current
          : null;

        setRecordedVideoBlob(blob);
        setRecordedVideoUrl(url);
        setRecordedVideoDuration(duration);
        setIsVideoRecording(false);
        setShowVideoModal(true);

        combinedStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        videoStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        videoStreamRef.current = null;
      };

      recorder.start(1000);
      setIsVideoRecording(true);
    } catch (error) {
      console.error('영상 녹화 시작 실패:', error);
      showError('영상 녹화를 시작할 수 없습니다. 카메라와 마이크 권한을 확인해주세요.');
    }
  };

  const handleStopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownloadVideo = () => {
    if (recordedVideoBlob) {
      const url = URL.createObjectURL(recordedVideoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoName || 'motion-sound'}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleRegisterToCommunity = async () => {
    if (!recordedVideoBlob || !videoName.trim()) {
      showWarning('영상 이름을 입력해주세요.');
      return;
    }

    try {
      setIsPreparingPost(true);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingCommunityPost',
          JSON.stringify({
            title: videoName,
            content: '모션 인식과 사운드 매핑이 포함된 영상입니다.',
          }),
        );

        const globalWindow = window as typeof window & {
          motionVideoDraft?: Blob;
          motionVideoDraftUrl?: string | null;
          motionVideoDraftDuration?: number | null;
        };

        globalWindow.motionVideoDraft = recordedVideoBlob;
        globalWindow.motionVideoDraftUrl = recordedVideoUrl;
        globalWindow.motionVideoDraftDuration = recordedVideoDuration ?? null;
      }

      showInfo('커뮤니티 작성 페이지로 이동합니다. 영상 내용을 확인하고 수정할 수 있습니다.');
      setShowVideoModal(false);
      router.push('/community/new');
    } catch (error) {
      console.error('커뮤니티 이동 준비 실패:', error);
      showError('커뮤니티 이동에 실패했습니다.');
    } finally {
      setIsPreparingPost(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedVideoUrl]);

  return (
    <>
      <Head>
        <title>Motion Sound - 모션 인식 프로토타입</title>
        <meta name="description" content="움직임이 곧 음악이 되는 시스템" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main
        style={{
          minHeight: 'calc(100vh - 80px)',
          padding: '24px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            }}
          >
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>
              Motion Sound
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              움직임이 곧 음악이 되는 시스템 - 모션 인식 프로토타입
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  gap: '12px',
                }}
              >
                <h2 style={{ fontSize: '20px', color: '#111827' }}>모션 캡처</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isVideoRecording && (
                    <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 500 }}>
                      녹화 중
                    </span>
                  )}
                  <button
                    onClick={
                      isVideoRecording ? handleStopVideoRecording : handleStartVideoRecording
                    }
                    aria-label={isVideoRecording ? '녹화 중지' : '녹화 시작'}
                    title={isVideoRecording ? '녹화 중지' : '녹화 시작'}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: '#f3f4f6',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s ease, background-color 0.2s ease',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: isVideoRecording ? '18px' : '22px',
                        height: isVideoRecording ? '18px' : '22px',
                        borderRadius: isVideoRecording ? '4px' : '9999px',
                        backgroundColor: '#ef4444',
                        margin: '0 auto',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>
              <MotionCaptureComponent
                autoStart={false}
                showVideo={true}
                onMotionData={setMotionData}
                onActiveChange={setIsMotionRecognitionActive}
                shouldStop={shouldStopMotion}
              />
            </div>

            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
                모션 시각화
              </h2>
              <MotionVisualizer motionData={motionData} width={640} height={480} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
              모션 패턴 캡처
            </h2>
            
            {!isRecording ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    모션 패턴 이름
                  </label>
                  <input
                    type="text"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="예: 손 흔들기, 팔 올리기"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    기준 음표 (선택사항 - 실시간 피치 제어용)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={recordingNote?.name || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const octave = recordingNote?.octave || 4;
                          setRecordingNote({
                            name: e.target.value,
                            octave,
                            frequency: getNoteFrequency(e.target.value, octave),
                          });
                        } else {
                          setRecordingNote(null);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">음표 없음</option>
                      {NOTE_NAMES.map((note) => (
                        <option key={note} value={note}>
                          {note}
                        </option>
                      ))}
                    </select>
                    
                    {recordingNote && (
                      <>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>옥타브</span>
                        <select
                          value={recordingNote.octave}
                          onChange={(e) => {
                            const octave = parseInt(e.target.value);
                            setRecordingNote({
                              ...recordingNote,
                              octave,
                              frequency: getNoteFrequency(recordingNote.name, octave),
                            });
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          {OCTAVE_RANGE.map((octave) => (
                            <option key={octave} value={octave}>
                              {octave}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          ({recordingNote.name}{recordingNote.octave} = {Math.round(recordingNote.frequency)}Hz)
                        </span>
                      </>
                    )}
                  </div>
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    음표를 선택하면 모션이 매칭되었을 때 실시간으로 피치가 조절됩니다
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    음/음악 파일 (선택사항)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                    }}
                  />
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    오디오 파일과 음표를 함께 사용할 수 있습니다
                  </p>
                </div>
                
                <button
                  onClick={handleStartRecording}
                  disabled={!recordingName.trim() || !isMotionRecognitionActive}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: recordingName.trim() && isMotionRecognitionActive ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: recordingName.trim() && isMotionRecognitionActive ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                  }}
                >
                  {!isMotionRecognitionActive 
                    ? '모션인식을 먼저 켜주세요.' 
                    : '모션 캡처 시작'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#ef4444' }}>
                    캡처 중... ({recordingSamples.length}개 샘플)
                  </span>
                </div>
                <button
                  onClick={handleStopRecording}
                  disabled={isSavingPattern}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: isSavingPattern ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSavingPattern ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  {isSavingPattern ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      저장 중...
                    </>
                  ) : (
                    '캡처 중지'
                  )}
                </button>
              </div>
            )}

            {matchedPattern && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                  매칭된 모션: {matchedPattern.name}
                </div>
                {matchedPattern.audioUrl && (
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                    오디오 재생 중...
                  </div>
                )}
              </div>
            )}

            {patterns.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#111827' }}>
                  저장된 모션 패턴 ({patterns.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {pattern.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {pattern.samples.length}개 샘플
                          {pattern.audioUrl && ' · 오디오 파일 있음'}
                          {pattern.baseNote && ` · 음표: ${pattern.baseNote.name}${pattern.baseNote.octave}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePattern(pattern.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
              사운드 제어
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                기준 음표 선택
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedNote.name}
                  onChange={(e) => {
                    const newNote = {
                      ...selectedNote,
                      name: e.target.value,
                      frequency: getNoteFrequency(e.target.value, selectedNote.octave),
                    };
                    setSelectedNote(newNote);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {NOTE_NAMES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
                
                <span style={{ fontSize: '14px', color: '#6b7280' }}>옥타브</span>
                
                <select
                  value={selectedNote.octave}
                  onChange={(e) => {
                    const octave = parseInt(e.target.value);
                    const newNote = {
                      ...selectedNote,
                      octave,
                      frequency: getNoteFrequency(selectedNote.name, octave),
                    };
                    setSelectedNote(newNote);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {OCTAVE_RANGE.map((octave) => (
                    <option key={octave} value={octave}>
                      {octave}
                    </option>
                  ))}
                </select>
                
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  ({selectedNote.name}{selectedNote.octave} = {Math.round(selectedNote.frequency)}Hz)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {!isInitialized ? (
                <button
                  onClick={handleInitializeSound}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  사운드 활성화
                </button>
              ) : (
                <>
                  <button
                    onClick={soundEnabled ? handleStopSound : () => setSoundEnabled(true)}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: soundEnabled ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    {soundEnabled ? '사운드 중지' : '사운드 재개'}
                  </button>
                  <span style={{ color: soundEnabled ? '#10b981' : '#6b7280', fontSize: '14px' }}>
                    상태: {soundEnabled ? '활성' : '비활성'}
                  </span>
                </>
              )}
            </div>
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
              기준 음표를 선택하면, 손의 Y축 위치에 따라 그 음표를 기준으로 -1 옥타브 ~ +1 옥타브 범위로 피치가 조절됩니다.
              <br />
              손을 위로 올리면 높은 음정, 아래로 내리면 낮은 음정이 재생됩니다.
            </p>
          </div>

          {motionData && (
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
                모션 데이터 (디버그)
              </h2>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                <pre>{JSON.stringify(motionData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </main>

      {showVideoModal && recordedVideoUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVideoModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#111827' }}>
              녹화된 영상
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                영상 이름
              </label>
              <input
                type="text"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="예: 손 흔들기 모션"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <video
                src={recordedVideoUrl}
                controls
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
              {recordedVideoDuration && (
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                  길이: {Math.round(recordedVideoDuration / 1000)}초
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadVideo}
                disabled={!recordedVideoBlob}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: recordedVideoBlob ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: recordedVideoBlob ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                }}
              >
                다운로드
              </button>
              <button
                onClick={handleRegisterToCommunity}
                disabled={!videoName.trim() || isPreparingPost || !recordedVideoBlob}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: videoName.trim() && !isPreparingPost && recordedVideoBlob ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: videoName.trim() && !isPreparingPost && recordedVideoBlob ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                }}
              >
                {isPreparingPost ? '이동 준비 중...' : '커뮤니티로 이동'}
              </button>
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}